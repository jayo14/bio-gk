import hashlib, hmac, json, os
import requests
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from apps.creators.models import Creator
from apps.interactions.models import PaidInteraction
from .models import WebhookEvent

@api_view(['POST'])
@permission_classes([AllowAny])
def initialize_payment(request):
    """Initialize a Paystack transaction. The amount is derived from server-side rules, never trusted from client."""
    if not settings.PAYSTACK_SECRET_KEY:
        return Response({'detail':'Payments are not configured on this server.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    username = str(request.data.get('username', '')).strip().lower()
    sender_name = str(request.data.get('sender_name', '')).strip()[:80]
    sender_contact = str(request.data.get('sender_contact', '')).strip()[:254]
    message_body = str(request.data.get('message_body', '')).strip()
    interaction_type = str(request.data.get('interaction_type', 'priority_dm'))
    if len(message_body) > 2000 or not sender_name:
        return Response({'detail':'Provide a sender name and a message no longer than 2,000 characters.'}, status=400)
    try: creator = Creator.objects.get(username=username)
    except Creator.DoesNotExist: return Response({'detail':'Creator not found.'}, status=404)
    if interaction_type not in PaidInteraction.Type.values:
        return Response({'detail':'Invalid interaction type.'}, status=400)
    amount_kobo = creator.min_message_fee_kobo if interaction_type != 'public_tip' else int(request.data.get('amount_kobo', 0))
    if interaction_type == 'public_tip' and amount_kobo not in [200000, 500000, 1000000]:
        return Response({'detail':'Choose one of the available tip amounts.'}, status=400)
    if amount_kobo < 10000:
        return Response({'detail':'Amount is below the minimum allowed.'}, status=400)
    reference = f'bg_{uuid4hex()}'
    interaction = PaidInteraction.objects.create(creator=creator, sender_name=sender_name, sender_contact=sender_contact, amount_kobo=amount_kobo, interaction_type=interaction_type, message_body=message_body, payment_reference=reference, is_public_on_wall=bool(request.data.get('public_attribution', False)))
    payload = {'email': sender_contact if '@' in sender_contact else f'{reference}@payments.invalid', 'amount': amount_kobo, 'reference': reference, 'callback_url': f"{os.getenv('FRONTEND_URL','http://localhost:3000')}/payment/return", 'metadata': {'interaction_id': str(interaction.id), 'creator_username': creator.username}}
    try:
        r = requests.post('https://api.paystack.co/transaction/initialize', json=payload, headers={'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}', 'Content-Type':'application/json'}, timeout=12)
        data = r.json()
    except requests.RequestException:
        interaction.delete()
        return Response({'detail':'Payment provider could not be reached. Try again.'}, status=502)
    if not r.ok or not data.get('status'):
        interaction.delete()
        return Response({'detail':'Payment initialization failed.'}, status=502)
    return Response({'authorization_url':data['data']['authorization_url'], 'reference':reference})

def uuid4hex():
    import uuid
    return uuid.uuid4().hex

@csrf_exempt
def paystack_webhook(request):
    if request.method != 'POST': return HttpResponse(status=405)
    secret = settings.PAYSTACK_SECRET_KEY
    if not secret: return HttpResponse(status=503)
    signature = request.headers.get('x-paystack-signature', '')
    expected = hmac.new(secret.encode(), request.body, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(signature, expected): return HttpResponse(status=400)
    try: event = json.loads(request.body)
    except json.JSONDecodeError: return HttpResponse(status=400)
    if event.get('event') != 'charge.success': return HttpResponse(status=200)
    data = event.get('data') or {}
    reference = data.get('reference')
    if not reference: return HttpResponse(status=400)
    # Verify independently with Paystack before fulfilling; webhook signature alone is not a substitute.
    try:
        verify = requests.get(f'https://api.paystack.co/transaction/verify/{reference}', headers={'Authorization': f'Bearer {secret}'}, timeout=12)
        verified = verify.json()
    except requests.RequestException: return HttpResponse(status=503)
    if not verify.ok or not verified.get('status'): return HttpResponse(status=400)
    tx = verified.get('data') or {}
    if tx.get('status') != 'success' or tx.get('reference') != reference or not isinstance(tx.get('amount'), int): return HttpResponse(status=400)
    with transaction.atomic():
        if WebhookEvent.objects.filter(event_id=reference).exists(): return HttpResponse(status=200)
        try: interaction = PaidInteraction.objects.select_for_update().get(payment_reference=reference)
        except PaidInteraction.DoesNotExist: return HttpResponse(status=200)
        if tx['amount'] != interaction.amount_kobo: return HttpResponse(status=400)
        interaction.payment_status = PaidInteraction.Status.VERIFIED
        interaction.save(update_fields=['payment_status'])
        WebhookEvent.objects.create(event_id=reference, event_type='charge.success')
    # TODO: enqueue private creator notification after commit; do not send message body in WhatsApp alert.
    return HttpResponse(status=200)
