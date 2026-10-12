import uuid
from django.db import models
from django.conf import settings
class Creator(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.SlugField(max_length=24, unique=True)
    display_name = models.CharField(max_length=80)
    avatar_url = models.URLField(blank=True)
    bio_text = models.CharField(max_length=300, blank=True)
    min_message_fee_kobo = models.PositiveIntegerField(default=250000)
    is_verified = models.BooleanField(default=False)
    public_supporter_wall_enabled = models.BooleanField(default=True)
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="creator_profile", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f'@{self.username}'
