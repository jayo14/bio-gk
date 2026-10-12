import datetime
from django.utils import timezone
from django.test import TestCase
from rest_framework.test import APIClient
from apps.creators.models import Creator
from apps.interactions.models import PaidInteraction


class LeaderboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.creator = Creator.objects.create(
            username='davido_fan',
            display_name='Davido Fan Page',
            public_supporter_wall_enabled=True,
            leaderboard_period=Creator.LeaderboardPeriod.WEEKLY,
        )

    def test_leaderboard_includes_only_verified_public_interactions(self):
        # 1. Verified Public Supporter (Tunde)
        PaidInteraction.objects.create(
            creator=self.creator,
            sender_name='Tunde A.',
            amount_kobo=250000,
            interaction_type=PaidInteraction.Type.PRIORITY_DM,
            payment_status=PaidInteraction.Status.VERIFIED,
            is_public_on_wall=True,
            payment_reference='bg_ref_1',
        )

        # 2. Second contribution by Tunde (500,000 kobo)
        PaidInteraction.objects.create(
            creator=self.creator,
            sender_name='Tunde A.',
            amount_kobo=500000,
            interaction_type=PaidInteraction.Type.PUBLIC_TIP,
            payment_status=PaidInteraction.Status.VERIFIED,
            is_public_on_wall=True,
            payment_reference='bg_ref_2',
        )

        # 3. Verified PRIVATE Supporter (Bimbo - opt-out of wall)
        PaidInteraction.objects.create(
            creator=self.creator,
            sender_name='Bimbo Secret',
            amount_kobo=1000000,
            interaction_type=PaidInteraction.Type.PUBLIC_TIP,
            payment_status=PaidInteraction.Status.VERIFIED,
            is_public_on_wall=False,  # Private!
            payment_reference='bg_ref_3',
        )

        # 4. PENDING Supporter (must NOT appear)
        PaidInteraction.objects.create(
            creator=self.creator,
            sender_name='Pending User',
            amount_kobo=300000,
            interaction_type=PaidInteraction.Type.PRIORITY_DM,
            payment_status=PaidInteraction.Status.PENDING,
            is_public_on_wall=True,
            payment_reference='bg_ref_4',
        )

        # 5. Verified Public Supporter (Amaka)
        PaidInteraction.objects.create(
            creator=self.creator,
            sender_name='Amaka O.',
            amount_kobo=100000,
            interaction_type=PaidInteraction.Type.PUBLIC_TIP,
            payment_status=PaidInteraction.Status.VERIFIED,
            is_public_on_wall=True,
            payment_reference='bg_ref_5',
        )

        response = self.client.get('/api/creators/davido_fan/leaderboard/')
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertTrue(data['enabled'])
        leaderboard = data['leaderboard']

        # Only Tunde and Amaka should be on the wall!
        self.assertEqual(len(leaderboard), 2)

        # Rank 1: Tunde A. (total 750,000 kobo, 2 interactions)
        self.assertEqual(leaderboard[0]['rank'], 1)
        self.assertEqual(leaderboard[0]['supporter_name'], 'Tunde A.')
        self.assertEqual(leaderboard[0]['total_amount_kobo'], 750000)
        self.assertEqual(leaderboard[0]['interaction_count'], 2)

        # Rank 2: Amaka O. (total 100,000 kobo)
        self.assertEqual(leaderboard[1]['rank'], 2)
        self.assertEqual(leaderboard[1]['supporter_name'], 'Amaka O.')
        self.assertEqual(leaderboard[1]['total_amount_kobo'], 100000)

        # Private contributor Bimbo Secret must NEVER appear
        names = [entry['supporter_name'] for entry in leaderboard]
        self.assertNotIn('Bimbo Secret', names)
        self.assertNotIn('Pending User', names)

    def test_leaderboard_when_disabled(self):
        self.creator.public_supporter_wall_enabled = False
        self.creator.save()

        response = self.client.get('/api/creators/davido_fan/leaderboard/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['enabled'])
        self.assertEqual(len(response.data['leaderboard']), 0)
