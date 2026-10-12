import logging
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from apps.creators.models import Creator
from apps.interactions.models import PaidInteraction
from .models import Notification

logger = logging.getLogger(__name__)


def dispatch_interaction_notification(interaction: PaidInteraction):
    """
    Dispatch notification to creator when a paid interaction is verified.
    Ensures payment fulfillment never fails if external notification provider is down.
    Never includes private message body in external alerts.
    """
    if not interaction:
        return None

    creator = interaction.creator
    if not creator:
        return None

    # Idempotency check: prevent duplicate notifications for the same interaction
    if Notification.objects.filter(interaction=interaction, creator=creator).exists():
        logger.info("Notification already recorded for interaction %s", interaction.id)
        return None

    amount_naira = interaction.amount_kobo / 100
    formatted_amount = f"₦{amount_naira:,.2f}"
    interaction_type_name = interaction.get_interaction_type_display()
    dashboard_url = f"{settings.FRONTEND_URL.rstrip('/')}/dashboard"
    summary_text = f"New {interaction_type_name} of {formatted_amount} from {interaction.sender_name}"

    delivered = False

    # 1. WhatsApp Cloud API (if configured and creator requested)
    if creator.notify_whatsapp and creator.whatsapp_phone_number and settings.WHATSAPP_CLOUD_API_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID:
        phone_id = settings.WHATSAPP_PHONE_NUMBER_ID
        token = settings.WHATSAPP_CLOUD_API_TOKEN
        recipient_phone = creator.whatsapp_phone_number.replace('+', '').strip()

        url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
        headers = {
            'Authorization': f"Bearer {token}",
            'Content-Type': 'application/json',
        }
        body_text = (
            f"🎉 Bio Gatekeeper: {summary_text}!\n\n"
            f"Sign in to your private creator dashboard to read and reply:\n{dashboard_url}"
        )
        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': recipient_phone,
            'type': 'text',
            'text': {'body': body_text},
        }

        notif = Notification.objects.create(
            creator=creator,
            interaction=interaction,
            channel=Notification.Channel.WHATSAPP,
            status=Notification.Status.PENDING,
            recipient=recipient_phone,
            summary=summary_text,
        )

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.ok:
                data = resp.json()
                msg_id = (data.get('messages') or [{}])[0].get('id', '')
                notif.status = Notification.Status.SENT
                notif.provider_message_id = msg_id
                notif.sent_at = timezone.now()
                notif.save(update_fields=['status', 'provider_message_id', 'sent_at'])
                delivered = True
            else:
                notif.status = Notification.Status.FAILED
                notif.error_message = resp.text[:500]
                notif.save(update_fields=['status', 'error_message'])
                logger.warning("WhatsApp API error for creator @%s: %s", creator.username, resp.text)
        except Exception as exc:
            notif.status = Notification.Status.FAILED
            notif.error_message = str(exc)[:500]
            notif.save(update_fields=['status', 'error_message'])
            logger.warning("WhatsApp request exception for creator @%s: %s", creator.username, exc)

    # 2. Email Notification (default fallback or configured preference)
    if creator.notify_email and creator.owner and creator.owner.email:
        owner_email = creator.owner.email
        email_notif = Notification.objects.create(
            creator=creator,
            interaction=interaction,
            channel=Notification.Channel.EMAIL,
            status=Notification.Status.PENDING,
            recipient=owner_email,
            summary=summary_text,
        )

        email_body = (
            f"Hello {creator.display_name},\n\n"
            f"Good news! You just received a new {interaction_type_name} on Bio Gatekeeper.\n\n"
            f"Amount: {formatted_amount}\n"
            f"Supporter: {interaction.sender_name}\n"
            f"Date: {interaction.created_at.strftime('%Y-%m-%d %H:%M')}\n\n"
            f"Open your secure inbox to view the message:\n{dashboard_url}\n\n"
            f"— The Bio Gatekeeper Team\n"
        )

        try:
            send_mail(
                subject=f"New Paid Interaction on Gate: {formatted_amount} from {interaction.sender_name}",
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[owner_email],
                fail_silently=False,
            )
            email_notif.status = Notification.Status.SENT
            email_notif.sent_at = timezone.now()
            email_notif.save(update_fields=['status', 'sent_at'])
            delivered = True
        except Exception as exc:
            email_notif.status = Notification.Status.FAILED
            email_notif.error_message = str(exc)[:500]
            email_notif.save(update_fields=['status', 'error_message'])
            logger.warning("Email notification error for creator @%s: %s", creator.username, exc)

    return delivered
