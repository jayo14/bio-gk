from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from apps.creators.models import Creator
from apps.interactions.models import PaidInteraction
from apps.notifications.models import Notification
from apps.notifications.services import dispatch_interaction_notification

User = get_user_model()


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    WHATSAPP_CLOUD_API_TOKEN='test_token',
    WHATSAPP_PHONE_NUMBER_ID='test_phone_id',
)
class NotificationServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='burna@example.com',
            email='burna@example.com',
            password='pass',
        )
        self.creator = Creator.objects.create(
            owner=self.user,
            username='burnaboy',
            display_name='Burna Boy',
            notify_email=True,
            notify_whatsapp=True,
            whatsapp_phone_number='+2348011223344',
        )
        self.interaction = PaidInteraction.objects.create(
            creator=self.creator,
            sender_name='Fan in Port Harcourt',
            amount_kobo=1000000,  # ₦10,000
            interaction_type=PaidInteraction.Type.PRIORITY_DM,
            message_body='Private confidential message body that must not leak to WhatsApp!',
            payment_status=PaidInteraction.Status.VERIFIED,
            payment_reference='bg_notif_ref_01',
        )

    @patch('requests.post')
    def test_dispatch_notifications_email_and_whatsapp(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {'messages': [{'id': 'wamid.HBg...'}]}
        mock_post.return_value = mock_resp

        result = dispatch_interaction_notification(self.interaction)
        self.assertTrue(result)

        # 1. Verify email sent
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn('burna@example.com', sent_email.to)
        self.assertIn('₦10,000.00', sent_email.subject)
        self.assertIn('Fan in Port Harcourt', sent_email.body)

        # 2. Verify WhatsApp API request
        mock_post.assert_called_once()
        whatsapp_payload = mock_post.call_args[1]['json']
        self.assertEqual(whatsapp_payload['to'], '2348011223344')
        whatsapp_text = whatsapp_payload['text']['body']

        # Ensure confidential message body was NOT included in WhatsApp alert
        self.assertNotIn('Private confidential message body', whatsapp_text)
        self.assertIn('Fan in Port Harcourt', whatsapp_text)

        # 3. Verify notifications stored in DB
        notifs = Notification.objects.filter(interaction=self.interaction)
        self.assertEqual(notifs.count(), 2)

        # 4. Duplicate notification call must do nothing (idempotent)
        dup_result = dispatch_interaction_notification(self.interaction)
        self.assertIsNone(dup_result)
        self.assertEqual(Notification.objects.filter(interaction=self.interaction).count(), 2)
