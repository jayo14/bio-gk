from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from apps.creators.models import Creator

User = get_user_model()


class CreatorProfileAndBankingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='chioma@example.com',
            email='chioma@example.com',
            password='safe-pass-123',
        )
        self.creator = Creator.objects.create(
            owner=self.user,
            username='chioma_x',
            display_name='Chioma X.',
            bio_text='Lifestyle creator',
            min_message_fee_kobo=250000,
            bank_name='Access Bank',
            bank_code='044',
            account_number_last4='5678',
            account_name='CHIOMA XAVIER',
            paystack_subaccount_code='ACCT_123456789',
            subaccount_status=Creator.SubaccountStatus.ACTIVE,
        )
        self.token = Token.objects.create(user=self.user)

    def test_public_serializer_does_not_leak_private_bank_data(self):
        response = self.client.get('/api/creators/chioma_x/')
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data['username'], 'chioma_x')
        self.assertEqual(data['display_name'], 'Chioma X.')
        self.assertTrue(data['subaccount_connected'])

        # Critical privacy checks: bank account, code, and subaccount code must never be exposed
        self.assertNotIn('bank_name', data)
        self.assertNotIn('bank_code', data)
        self.assertNotIn('account_number_last4', data)
        self.assertNotIn('account_name', data)
        self.assertNotIn('paystack_subaccount_code', data)
        self.assertNotIn('owner', data)

    def test_authenticated_dashboard_overview(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        response = self.client.get('/api/creators/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('creator', response.data)
        self.assertIn('metrics', response.data)
        self.assertEqual(response.data['creator']['username'], 'chioma_x')
        self.assertEqual(response.data['creator']['account_number_last4'], '5678')

    def test_update_profile_and_pricing_validation(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        # Invalid fee (too low)
        res_fail = self.client.patch('/api/creators/profile/', {
            'min_message_fee_kobo': 1000,
        }, format='json')
        self.assertEqual(res_fail.status_code, 400)

        # Valid update
        res_ok = self.client.patch('/api/creators/profile/', {
            'display_name': 'Chioma Updated',
            'min_message_fee_kobo': 300000,
            'tip_presets_kobo': [250000, 500000, 1500000],
        }, format='json')
        self.assertEqual(res_ok.status_code, 200)
        self.creator.refresh_from_db()
        self.assertEqual(self.creator.display_name, 'Chioma Updated')
        self.assertEqual(self.creator.min_message_fee_kobo, 300000)

    @patch('apps.payments.paystack.resolve_bank_account')
    @patch('apps.payments.paystack.create_subaccount')
    def test_connect_bank_subaccount_flow(self, mock_create, mock_resolve):
        mock_resolve.return_value = {
            'account_name': 'CHIOMA XAVIER',
            'account_number': '0123456789',
            'bank_code': '058',
        }
        mock_create.return_value = {
            'subaccount_code': 'ACCT_NEW_SUBACCOUNT',
            'business_name': 'Chioma X.',
        }

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        response = self.client.post('/api/creators/bank/connect/', {
            'bank_code': '058',
            'bank_name': 'GTBank',
            'account_number': '0123456789',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.creator.refresh_from_db()
        self.assertEqual(self.creator.paystack_subaccount_code, 'ACCT_NEW_SUBACCOUNT')
        self.assertEqual(self.creator.account_number_last4, '6789')
        self.assertEqual(self.creator.subaccount_status, Creator.SubaccountStatus.ACTIVE)
