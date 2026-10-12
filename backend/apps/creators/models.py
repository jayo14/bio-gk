import uuid
from django.conf import settings
from django.db import models


def default_tip_presets():
    return [200000, 500000, 1000000]  # ₦2,000, ₦5,000, ₦10,000 in kobo


class Creator(models.Model):
    class SubaccountStatus(models.TextChoices):
        UNCONNECTED = 'unconnected', 'Unconnected'
        PENDING = 'pending', 'Pending'
        ACTIVE = 'active', 'Active'
        FAILED = 'failed', 'Failed'

    class LeaderboardPeriod(models.TextChoices):
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        ALL_TIME = 'all_time', 'All Time'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.SlugField(max_length=24, unique=True)
    display_name = models.CharField(max_length=80)
    avatar_url = models.URLField(blank=True, max_length=500)
    bio_text = models.CharField(max_length=300, blank=True)
    min_message_fee_kobo = models.PositiveIntegerField(default=250000)
    tip_presets_kobo = models.JSONField(default=default_tip_presets, blank=True)
    is_verified = models.BooleanField(default=False)
    public_supporter_wall_enabled = models.BooleanField(default=True)
    leaderboard_period = models.CharField(
        max_length=20,
        choices=LeaderboardPeriod.choices,
        default=LeaderboardPeriod.WEEKLY,
    )

    # Paystack Subaccount Details (stored securely on backend)
    paystack_subaccount_code = models.CharField(max_length=100, blank=True)
    bank_code = models.CharField(max_length=20, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    account_number_last4 = models.CharField(max_length=4, blank=True)
    account_name = models.CharField(max_length=120, blank=True)
    subaccount_status = models.CharField(
        max_length=20,
        choices=SubaccountStatus.choices,
        default=SubaccountStatus.UNCONNECTED,
    )

    # Notification Preferences
    notify_email = models.BooleanField(default=True)
    notify_whatsapp = models.BooleanField(default=False)
    whatsapp_phone_number = models.CharField(max_length=32, blank=True)

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="creator_profile",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'@{self.username}'
