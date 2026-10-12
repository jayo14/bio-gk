from rest_framework import serializers
from .models import Creator


class CreatorPublicSerializer(serializers.ModelSerializer):
    subaccount_connected = serializers.SerializerMethodField()

    class Meta:
        model = Creator
        fields = [
            'username',
            'display_name',
            'avatar_url',
            'bio_text',
            'min_message_fee_kobo',
            'tip_presets_kobo',
            'is_verified',
            'public_supporter_wall_enabled',
            'leaderboard_period',
            'subaccount_connected',
        ]

    def get_subaccount_connected(self, obj) -> bool:
        return obj.subaccount_status == Creator.SubaccountStatus.ACTIVE


class CreatorPrivateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creator
        fields = [
            'username',
            'display_name',
            'avatar_url',
            'bio_text',
            'min_message_fee_kobo',
            'tip_presets_kobo',
            'is_verified',
            'public_supporter_wall_enabled',
            'leaderboard_period',
            'bank_name',
            'account_number_last4',
            'account_name',
            'subaccount_status',
            'notify_email',
            'notify_whatsapp',
            'whatsapp_phone_number',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'username',
            'is_verified',
            'bank_name',
            'account_number_last4',
            'account_name',
            'subaccount_status',
            'created_at',
            'updated_at',
        ]


class CreatorProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creator
        fields = [
            'display_name',
            'bio_text',
            'avatar_url',
            'min_message_fee_kobo',
            'tip_presets_kobo',
            'public_supporter_wall_enabled',
            'leaderboard_period',
            'notify_email',
            'notify_whatsapp',
            'whatsapp_phone_number',
        ]

    def validate_min_message_fee_kobo(self, value):
        if value < 50000:  # Minimum ₦500
            raise serializers.ValidationError("Minimum message fee must be at least ₦500 (50,000 kobo).")
        if value > 10000000:  # Maximum ₦100,000
            raise serializers.ValidationError("Minimum message fee cannot exceed ₦100,000.")
        return value

    def validate_tip_presets_kobo(self, value):
        if not isinstance(value, list) or len(value) < 1 or len(value) > 5:
            raise serializers.ValidationError("Tip presets must be a list of 1 to 5 amounts.")
        for item in value:
            if not isinstance(item, int) or item < 10000:
                raise serializers.ValidationError("Each tip amount must be at least ₦100 (10,000 kobo).")
            if item > 10000000:
                raise serializers.ValidationError("Tip amount cannot exceed ₦100,000.")
        return sorted(list(set(value)))

    def validate_whatsapp_phone_number(self, value):
        val = str(value or '').strip()
        if val and not val.replace('+', '').isdigit():
            raise serializers.ValidationError("Enter a valid phone number (digits and optional leading +).")
        return val
