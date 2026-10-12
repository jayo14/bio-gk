import hashlib
import hmac
import json
from unittest.mock import patch, MagicMock
from django.conf import settings
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from apps.creators.models import Creator
from apps.interactions.models import PaidInteraction
from apps.payments.models import Payment, WebhookEvent


@override_settings(PAYSTACK_SECRET_KEY='sk_test_mock_secret_key_123', PLATFORM_FEE_PERCENT=10)
class PaymentFlowAndWebhookTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.creator = Creator.objects.create(
            username='falz',
            display_name='Falz The Bahd Guy',
            min_message_fee_kobo=250000,  # ₦2,500
            paystack_subaccount_code='ACCT_falz_subaccount',
            subaccount_status=Creator.SubaccountStatus.ACTIVE,
        )

    @patch('requests.post')
    def test_initialize_priority_message_payment(self, mock_post):
        mock_response = MagicMock()
        mock_response.ok = True
        mock_response.json.return_value = {
            'status': True,
            'data': {'authorization_url': 'https://checkout.paystack.com/access_code_123'},
        }
        mock_post.return_value = mock_response

        response = self.client.post('/api/payments/initialize/', {
            'username': 'falz',
            'sender_name': 'Segun A.',
            'sender_contact': 'segun@example.com',
            'message_body': 'Big fan of the music!',
            'interaction_type': 'priority_dm',
            'public_attribution': True,
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('authorization_url', response.data)
        ref = response.data['reference']
        self.assertTrue(ref.startswith('bg_'))

        # Verify Payment and PaidInteraction were atomically created in DB
        payment = Payment.objects.get(reference=ref)
        self.assertEqual(payment.status, Payment.Status.PENDING)
        self.assertEqual(payment.amount_kobo, 250000)
        self.assertEqual(payment.platform_fee_kobo, 25000)  # 10%
        self.assertEqual(payment.creator_amount_kobo, 225000)  # 90%
        self.assertEqual(payment.subaccount_code, 'ACCT_falz_subaccount')

        interaction = payment.interaction
        self.assertEqual(interaction.sender_name, 'Segun A.')
        self.assertEqual(interaction.payment_status, PaidInteraction.Status.PENDING)
        self.assertTrue(interaction.is_public_on_wall)

    def test_initialize_rejects_unavailable_chat_pass(self):
        response = self.client.post('/api/payments/initialize/', {
            'username': 'falz',
            'sender_name': 'Segun A.',
            'interaction_type': 'whatsapp_pass',
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('chat access is currently unavailable', response.data['detail'].lower())

    @patch('requests.get')
    def test_verify_payment_endpoint(self, mock_get):
        ref = 'bg_test_verify_ref_01'
        interaction = PaidInteraction.objects.create(
            creator=self.creator,
            sender_name='Adeola',
            amount_kobo=250000,
            interaction_type=PaidInteraction.Type.PRIORITY_DM,
            message_body='Hello Falz!',
            payment_reference=ref,
        )
        payment = Payment.objects.create(
            reference=ref,
            creator=self.creator,
            interaction=interaction,
            amount_kobo=250000,
            status=Payment.Status.PENDING,
        )

        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {
            'status': True,
            'data': {
                'status': 'success',
                'reference': ref,
                'amount': 250000,
                'currency': 'NGN',
                'id': 9876543,
                'channel': 'card',
            },
        }
        mock_get.return_value = mock_resp

        response = self.client.get(f'/api/payments/verify/{ref}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'success')

        payment.refresh_from_db()
        interaction.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.SUCCESS)
        self.assertEqual(interaction.payment_status, PaidInteraction.Status.VERIFIED)

    def test_webhook_rejects_invalid_signature(self):
        payload = json.dumps({'event': 'charge.success'}).encode('utf-8')
        response = self.client.post(
            '/api/payments/webhook/',
            data=payload,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE='invalid_hmac_signature',
        )
        self.assertEqual(response.status_code, 400)

    @patch('requests.get')
    def test_webhook_valid_signature_and_idempotency(self, mock_get):
        ref = 'bg_webhook_ref_01'
        secret = settings.PAYSTACK_SECRET_KEY
        interaction = PaidInteraction.objects.create(
            creator=self.creator,
            sender_name='Chidi',
            amount_kobo=500000,
            interaction_type=PaidInteraction.Type.PUBLIC_TIP,
            payment_reference=ref,
        )
        payment = Payment.objects.create(
            reference=ref,
            creator=self.creator,
            interaction=interaction,
            amount_kobo=500000,
            status=Payment.Status.PENDING,
        )

        # Mock Paystack verify API call made during webhook handling
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {
            'status': True,
            'data': {
                'status': 'success',
                'reference': ref,
                'amount': 500000,
                'currency': 'NGN',
                'id': 12345,
                'channel': 'bank_transfer',
            },
        }
        mock_get.return_value = mock_resp

        body = json.dumps({
            'event': 'charge.success',
            'id': 'evt_998877',
            'data': {
                'reference': ref,
                'amount': 500000,
            },
        }).encode('utf-8')

        valid_sig = hmac.new(secret.encode('utf-8'), body, hashlib.sha512).hexdigest()

        # First webhook call -> fulfilled
        resp1 = self.client.post(
            '/api/payments/webhook/',
            data=body,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=valid_sig,
        )
        self.assertEqual(resp1.status_code, 200)

        payment.refresh_from_db()
        interaction.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.SUCCESS)
        self.assertEqual(interaction.payment_status, PaidInteraction.Status.VERIFIED)
        self.assertTrue(WebhookEvent.objects.filter(event_id='evt_998877').exists())

        # Second duplicate webhook call with same event id -> idempotent return 200 without duplicate action
        resp2 = self.client.post(
            '/api/payments/webhook/',
            data=body,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=valid_sig,
        )
        self.assertEqual(resp2.status_code, 200)
