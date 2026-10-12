from rest_framework import serializers
from .models import Creator
class CreatorPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creator
        fields = ['username','display_name','avatar_url','bio_text','min_message_fee_kobo','is_verified','public_supporter_wall_enabled']
