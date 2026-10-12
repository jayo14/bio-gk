import uuid
from django.db import models
from apps.creators.models import Creator


class PaidInteraction(models.Model):
    class Type(models.TextChoices):
        PRIORITY_DM = 'priority_dm', 'Priority message'
        PUBLIC_TIP = 'public_tip', 'Public tip'
        WHATSAPP_PASS = 'whatsapp_pass', 'Chat pass'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        VERIFIED = 'verified', 'Verified'
        READ = 'read', 'Read'
        ARCHIVED = 'archived', 'Archived'
        REFUNDED = 'refunded', 'Refunded'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(Creator, on_delete=models.PROTECT, related_name='interactions')
    sender_name = models.CharField(max_length=80)
    sender_contact = models.CharField(max_length=254, blank=True)
    amount_kobo = models.PositiveIntegerField()
    currency = models.CharField(max_length=6, default='NGN')
    interaction_type = models.CharField(max_length=20, choices=Type.choices)
    message_body = models.TextField(blank=True, max_length=2000)
    payment_status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    is_public_on_wall = models.BooleanField(default=False)
    payment_reference = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.interaction_type} from {self.sender_name} to @{self.creator.username} ({self.amount_kobo} kobo)"
