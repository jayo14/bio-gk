import uuid
from django.db import models
from apps.creators.models import Creator
from apps.interactions.models import PaidInteraction


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'
        ABANDONED = 'abandoned', 'Abandoned'
        REVERSED = 'reversed', 'Reversed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=100, unique=True)
    creator = models.ForeignKey(Creator, on_delete=models.PROTECT, related_name='payments')
    interaction = models.OneToOneField(
        PaidInteraction,
        on_delete=models.CASCADE,
        related_name='payment',
        null=True,
        blank=True,
    )
    amount_kobo = models.PositiveIntegerField()
    currency = models.CharField(max_length=6, default='NGN')
    provider_reference = models.CharField(max_length=160, blank=True)
    provider_channel = models.CharField(max_length=40, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    platform_fee_kobo = models.PositiveIntegerField(default=0)
    creator_amount_kobo = models.PositiveIntegerField(default=0)
    subaccount_code = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.reference} ({self.status}) - {self.amount_kobo} kobo"


class WebhookEvent(models.Model):
    class Status(models.TextChoices):
        RECEIVED = 'received', 'Received'
        PROCESSED = 'processed', 'Processed'
        FAILED = 'failed', 'Failed'
        IGNORED = 'ignored', 'Ignored'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.CharField(max_length=160, unique=True)
    event_type = models.CharField(max_length=80)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PROCESSED)
    retry_count = models.PositiveIntegerField(default=0)
    payload_summary = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} - {self.event_id} ({self.status})"
