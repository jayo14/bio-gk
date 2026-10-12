import hashlib
import hmac
import json
import logging
import uuid
import requests
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.creators.models import Creator
from apps.interactions.models import PaidInteraction
from .models import Payment, WebhookEvent
from .paystack import calculate_split_allocation, PAYSTACK_API_BASE

logger = logging.getLogger(__name__)


class PaymentRateThrottle(ScopedRateThrottle):
    scope = 'payments'


def generate_payment_reference() -> str:
    return f"bg_{uuid.uuid4().hex}"


def fulfill_payment_atomically(payment: Payment, provider_data: dict) -> bool:
    """
    Atomically verify and fulfill a payment and its associated interaction.
    Guarantees idempotency and prevents double fulfillment.
    """
    with transaction.atomic():
        locked_payment = Payment.objects.select_for_update().get(id=payment.id)
        if locked_payment.status == Payment.Status.SUCCESS:
            return True  # Already fulfilled

        locked_payment.status = Payment.Status.SUCCESS
        locked_payment.verified_at = timezone.now()
        locked_payment.provider_reference = str(provider_data.get('id', ''))
        locked_payment.provider_channel = str(provider_data.get('channel', 'card'))
        locked_payment.metadata = {
            'gateway_response': provider_data.get('gateway_response'),
            'paid_at': provider_data.get('paid_at'),
            'ip_address': provider_data.get('ip_address'),
        }
        locked_payment.save(update_fields=[
            'status',
            'verified_at',
            'provider_reference',
            'provider_channel',
            'metadata',
            'updated_at',
        ])

        interaction = locked_payment.interaction
        if interaction:
            interaction.payment_status = PaidInteraction.Status.VERIFIED
            interaction.save(update_fields=['payment_status', 'updated_at'])

    # Safely trigger notification asynchronously / post-commit
    try:
        from apps.notifications.services import dispatch_interaction_notification
        dispatch_interaction_notification(locked_payment.interaction)
    except Exception as exc:
        logger.warning("Could not dispatch notification for payment %s: %s", payment.reference, exc)

    return True


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PaymentRateThrottle])
def initialize_payment(request):
    """
    Initialize a Paystack checkout session for priority messages or tips.
    Server strictly controls amount, currency, recipient and platform split.
    """
    if not settings.PAYSTACK_SECRET_KEY:
        return Response(
            {'detail': 'Payments are not configured on this server.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    username = str(request.data.get('username', '')).strip().lower()
    sender_name = str(request.data.get('sender_name', '')).strip()[:80]
    sender_contact = str(request.data.get('sender_contact', '')).strip()[:254]
    message_body = str(request.data.get('message_body', '')).strip()
    interaction_type = str(request.data.get('interaction_type', 'priority_dm')).strip()
    is_public = bool(request.data.get('public_attribution', False))

    if not sender_name:
        return Response({'detail': 'Please provide your name or a pseudonym.'}, status=400)

    try:
        creator = Creator.objects.get(username=username)
    except Creator.DoesNotExist:
        return Response({'detail': 'Creator not found.'}, status=404)

    if interaction_type == PaidInteraction.Type.WHATSAPP_PASS:
        return Response(
            {'detail': 'Direct chat access is currently unavailable. You can send a priority message or leave a tip.'},
            status=400,
        )

    if interaction_type not in PaidInteraction.Type.values:
        return Response({'detail': 'Invalid interaction type.'}, status=400)

    # Server-enforced pricing
    if interaction_type == PaidInteraction.Type.PRIORITY_DM:
        if not message_body:
            return Response({'detail': 'Please enter a message.'}, status=400)
        if len(message_body) > 2000:
            return Response({'detail': 'Messages cannot exceed 2,000 characters.'}, status=400)
        # Client may offer to pay more than min fee, but never less than creator's min fee
        client_amount = int(request.data.get('amount_kobo', 0) or 0)
        amount_kobo = max(creator.min_message_fee_kobo, client_amount) if client_amount > 0 else creator.min_message_fee_kobo
    elif interaction_type == PaidInteraction.Type.PUBLIC_TIP:
        # Tip does not require a message
        client_amount = int(request.data.get('amount_kobo', 0) or 0)
        if client_amount < 10000:  # Minimum ₦100
            return Response({'detail': 'Minimum tip amount is ₦100 (10,000 kobo).'}, status=400)
        amount_kobo = client_amount
    else:
        amount_kobo = creator.min_message_fee_kobo

    reference = generate_payment_reference()
    split = calculate_split_allocation(amount_kobo, settings.PLATFORM_FEE_PERCENT)

    # Atomic creation of pending interaction & pending payment record
    with transaction.atomic():
        interaction = PaidInteraction.objects.create(
            creator=creator,
            sender_name=sender_name,
            sender_contact=sender_contact,
            amount_kobo=amount_kobo,
            currency='NGN',
            interaction_type=interaction_type,
            message_body=message_body,
            payment_status=PaidInteraction.Status.PENDING,
            is_public_on_wall=is_public,
            payment_reference=reference,
        )

        subaccount_code = creator.paystack_subaccount_code if creator.subaccount_status == Creator.SubaccountStatus.ACTIVE else ''
        payment = Payment.objects.create(
            reference=reference,
            creator=creator,
            interaction=interaction,
            amount_kobo=amount_kobo,
            currency='NGN',
            status=Payment.Status.PENDING,
            platform_fee_kobo=split['platform_fee_kobo'],
            creator_amount_kobo=split['creator_amount_kobo'],
            subaccount_code=subaccount_code,
        )

    # Prepare Paystack transaction initialization payload
    payer_email = sender_contact if ('@' in sender_contact and '.' in sender_contact) else f"{reference}@biogatekeeper.com"
    callback_url = f"{settings.FRONTEND_URL.rstrip('/')}/payment/return"

    paystack_payload = {
        'email': payer_email,
        'amount': amount_kobo,
        'reference': reference,
        'callback_url': callback_url,
        'metadata': {
            'interaction_id': str(interaction.id),
            'creator_username': creator.username,
            'interaction_type': interaction_type,
            'sender_name': sender_name,
        },
    }

    if subaccount_code:
        paystack_payload['subaccount'] = subaccount_code
        paystack_payload['bearer'] = 'subaccount'

    headers = {
        'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
        'Content-Type': 'application/json',
    }

    try:
        resp = requests.post(
            f"{PAYSTACK_API_BASE}/transaction/initialize",
            json=paystack_payload,
            headers=headers,
            timeout=12,
        )
        data = resp.json()
    except requests.RequestException as exc:
        logger.error("Paystack initialization network error for %s: %s", reference, exc)
        payment.status = Payment.Status.FAILED
        payment.save(update_fields=['status'])
        return Response({'detail': 'Payment provider could not be reached. Please try again.'}, status=502)

    if not resp.ok or not data.get('status'):
        msg = data.get('message', 'Payment initialization failed.')
        logger.error("Paystack initialization rejected for %s: %s", reference, msg)
        payment.status = Payment.Status.FAILED
        payment.save(update_fields=['status'])
        return Response({'detail': f"Payment setup failed: {msg}"}, status=502)

    auth_url = data['data']['authorization_url']
    return Response({
        'authorization_url': auth_url,
        'reference': reference,
        'amount_kobo': amount_kobo,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_payment(request, reference: str):
    """
    Check and verify payment status from Paystack.
    Called by the return page /payment/return?reference=... to confirm real settlement.
    """
    reference = str(reference).strip()
    try:
        payment = Payment.objects.select_related('creator', 'interaction').get(reference=reference)
    except Payment.DoesNotExist:
        return Response({'detail': 'Transaction reference not found.'}, status=404)

    # If already verified
    if payment.status == Payment.Status.SUCCESS:
        interaction = payment.interaction
        return Response({
            'status': 'success',
            'reference': payment.reference,
            'amount_kobo': payment.amount_kobo,
            'creator_username': payment.creator.username,
            'creator_name': payment.creator.display_name,
            'interaction_type': interaction.interaction_type if interaction else 'priority_dm',
            'verified_at': payment.verified_at,
        })

    if not settings.PAYSTACK_SECRET_KEY:
        return Response({'status': 'pending', 'reference': payment.reference})

    # Query Paystack verification API
    try:
        verify_resp = requests.get(
            f"{PAYSTACK_API_BASE}/transaction/verify/{reference}",
            headers={'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'},
            timeout=12,
        )
        verify_data = verify_resp.json()
    except requests.RequestException:
        return Response({'status': 'pending', 'reference': payment.reference, 'detail': 'Checking with payment provider…'})

    if not verify_resp.ok or not verify_data.get('status'):
        return Response({'status': payment.status, 'reference': payment.reference})

    tx = verify_data.get('data') or {}
    tx_status = tx.get('status')
    tx_amount = tx.get('amount')
    tx_currency = tx.get('currency', 'NGN')

    if tx_status == 'success':
        # Reconcile amount, currency, and reference
        if tx_amount == payment.amount_kobo and tx_currency == 'NGN':
            fulfill_payment_atomically(payment, tx)
            payment.refresh_from_db()
            interaction = payment.interaction
            return Response({
                'status': 'success',
                'reference': payment.reference,
                'amount_kobo': payment.amount_kobo,
                'creator_username': payment.creator.username,
                'creator_name': payment.creator.display_name,
                'interaction_type': interaction.interaction_type if interaction else 'priority_dm',
                'verified_at': payment.verified_at,
            })
        else:
            logger.error("Payment reconciliation mismatch for %s: expected %d NGN, got %s %s", reference, payment.amount_kobo, tx_amount, tx_currency)
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=['status'])
            return Response({'status': 'failed', 'detail': 'Payment amount mismatch detected.'}, status=400)
    elif tx_status in ['failed', 'abandoned']:
        payment.status = Payment.Status.FAILED if tx_status == 'failed' else Payment.Status.ABANDONED
        payment.save(update_fields=['status'])
        return Response({'status': payment.status, 'reference': payment.reference})

    return Response({'status': 'pending', 'reference': payment.reference})


@csrf_exempt
def paystack_webhook(request):
    """
    Receive, validate, and process Paystack webhook events with strict idempotency.
    """
    if request.method != 'POST':
        return HttpResponse('Method Not Allowed', status=405)

    secret = settings.PAYSTACK_SECRET_KEY
    if not secret:
        return HttpResponse('Webhook not configured', status=503)

    signature = request.headers.get('x-paystack-signature', '')
    if not signature:
        return HttpResponse('Missing signature', status=400)

    # Compute expected signature against raw request body
    expected = hmac.new(secret.encode('utf-8'), request.body, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(signature, expected):
        logger.warning("Rejected webhook with invalid signature")
        return HttpResponse('Invalid signature', status=400)

    try:
        event = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return HttpResponse('Invalid JSON body', status=400)

    event_type = event.get('event')
    data = event.get('data') or {}
    reference = data.get('reference')
    event_id = str(event.get('id') or reference or uuid.uuid4().hex)

    # Check webhook idempotency
    if WebhookEvent.objects.filter(event_id=event_id).exists():
        logger.info("Ignoring duplicate webhook event %s", event_id)
        return HttpResponse('Event already processed', status=200)

    if event_type == 'charge.success':
        if not reference:
            return HttpResponse('Missing reference in event data', status=400)

        try:
            payment = Payment.objects.select_related('creator', 'interaction').get(reference=reference)
        except Payment.DoesNotExist:
            logger.warning("Webhook received for unknown reference: %s", reference)
            # Record webhook event so we don't repeatedly retry unknown refs
            WebhookEvent.objects.create(
                event_id=event_id,
                event_type=event_type,
                status=WebhookEvent.Status.IGNORED,
                payload_summary={'reference': reference, 'reason': 'Payment not found'},
            )
            return HttpResponse('Payment not found', status=200)

        # Independent verification check with Paystack before fulfillment
        try:
            verify_resp = requests.get(
                f"{PAYSTACK_API_BASE}/transaction/verify/{reference}",
                headers={'Authorization': f'Bearer {secret}'},
                timeout=12,
            )
            verified_json = verify_resp.json()
        except requests.RequestException as exc:
            logger.error("Webhook independent verification network failure: %s", exc)
            return HttpResponse('Provider verification temporarily unavailable', status=503)

        if not verify_resp.ok or not verified_json.get('status'):
            logger.error("Paystack verification API failed during webhook processing for %s", reference)
            return HttpResponse('Verification failed', status=400)

        tx = verified_json.get('data') or {}
        if (
            tx.get('status') == 'success'
            and tx.get('reference') == reference
            and tx.get('amount') == payment.amount_kobo
            and tx.get('currency') == 'NGN'
        ):
            fulfill_payment_atomically(payment, tx)
            WebhookEvent.objects.create(
                event_id=event_id,
                event_type=event_type,
                status=WebhookEvent.Status.PROCESSED,
                payload_summary={
                    'reference': reference,
                    'amount_kobo': payment.amount_kobo,
                    'status': 'fulfilled',
                },
            )
            return HttpResponse('Webhook fulfilled', status=200)
        else:
            logger.warning("Transaction verification mismatch during webhook for %s", reference)
            WebhookEvent.objects.create(
                event_id=event_id,
                event_type=event_type,
                status=WebhookEvent.Status.FAILED,
                payload_summary={'reference': reference, 'reason': 'Verification mismatch'},
            )
            return HttpResponse('Transaction verification mismatch', status=400)

    elif event_type in ['refund.processed', 'charge.reversed']:
        if reference:
            try:
                with transaction.atomic():
                    payment = Payment.objects.select_for_update().get(reference=reference)
                    payment.status = Payment.Status.REVERSED
                    payment.save(update_fields=['status', 'updated_at'])
                    if payment.interaction:
                        payment.interaction.payment_status = PaidInteraction.Status.REFUNDED
                        payment.interaction.save(update_fields=['payment_status', 'updated_at'])
            except Payment.DoesNotExist:
                pass

        WebhookEvent.objects.create(
            event_id=event_id,
            event_type=event_type,
            status=WebhookEvent.Status.PROCESSED,
            payload_summary={'reference': reference, 'event': event_type},
        )
        return HttpResponse('Processed reversal/refund', status=200)

    # For other unhandled events, acknowledge receipt safely
    WebhookEvent.objects.create(
        event_id=event_id,
        event_type=event_type or 'unknown',
        status=WebhookEvent.Status.IGNORED,
        payload_summary={'event': event_type},
    )
    return HttpResponse('Event acknowledged', status=200)
