from rest_framework import serializers
from .models import PaidInteraction


class InteractionInboxSerializer(serializers.ModelSerializer):
    amount_naira = serializers.SerializerMethodField()
    type_display = serializers.SerializerMethodField()

    class Meta:
        model = PaidInteraction
        fields = [
            'id',
            'sender_name',
            'sender_contact',
            'amount_kobo',
            'amount_naira',
            'currency',
            'interaction_type',
            'type_display',
            'message_body',
            'payment_status',
            'is_public_on_wall',
            'payment_reference',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_amount_naira(self, obj) -> float:
        return obj.amount_kobo / 100.0

    def get_type_display(self, obj) -> str:
        return obj.get_interaction_type_display()
