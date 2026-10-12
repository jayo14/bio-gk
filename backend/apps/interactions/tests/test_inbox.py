from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from apps.creators.models import Creator
from apps.interactions.models import PaidInteraction

User = get_user_model()


class CreatorInboxTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='creator1@example.com', email='creator1@example.com', password='pass')
        self.creator1 = Creator.objects.create(owner=self.user1, username='creator1', display_name='Creator One')
        self.token1 = Token.objects.create(user=self.user1)

        self.user2 = User.objects.create_user(username='creator2@example.com', email='creator2@example.com', password='pass')
        self.creator2 = Creator.objects.create(owner=self.user2, username='creator2', display_name='Creator Two')
        self.token2 = Token.objects.create(user=self.user2)

    def test_creator_can_only_view_their_own_inbox_messages(self):
        # Interaction for creator 1
        msg1 = PaidInteraction.objects.create(
            creator=self.creator1,
            sender_name='Fan of Creator 1',
            amount_kobo=250000,
            interaction_type=PaidInteraction.Type.PRIORITY_DM,
            message_body='Private message for Creator 1',
            payment_status=PaidInteraction.Status.VERIFIED,
            payment_reference='ref_1',
        )

        # Interaction for creator 2
        msg2 = PaidInteraction.objects.create(
            creator=self.creator2,
            sender_name='Fan of Creator 2',
            amount_kobo=500000,
            interaction_type=PaidInteraction.Type.PRIORITY_DM,
            message_body='Confidential message for Creator 2',
            payment_status=PaidInteraction.Status.VERIFIED,
            payment_reference='ref_2',
        )

        # Login as Creator 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token1.key}")
        response = self.client.get('/api/interactions/inbox/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(msg1.id))
        self.assertEqual(response.data['results'][0]['message_body'], 'Private message for Creator 1')

        # Creator 1 attempts to mark Creator 2's message as read -> 404 forbidden
        res_cross = self.client.post(f'/api/interactions/{msg2.id}/read/', {}, format='json')
        self.assertEqual(res_cross.status_code, 404)

        # Creator 1 marks their own message as read -> success
        res_read = self.client.post(f'/api/interactions/{msg1.id}/read/', {}, format='json')
        self.assertEqual(res_read.status_code, 200)
        msg1.refresh_from_db()
        self.assertEqual(msg1.payment_status, PaidInteraction.Status.READ)
