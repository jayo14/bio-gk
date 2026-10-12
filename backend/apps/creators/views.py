import datetime
from django.utils import timezone
from django.db.models import Sum, Count, Max, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.interactions.models import PaidInteraction
from apps.payments.models import Payment
from apps.payments import paystack
from .models import Creator
from .serializers import (
    CreatorPublicSerializer,
    CreatorPrivateSerializer,
    CreatorProfileUpdateSerializer,
)


class CreatorPublicDetail(RetrieveAPIView):
    """Public creator profile view accessible by visitors."""
    queryset = Creator.objects.all()
    serializer_class = CreatorPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = 'username'


@api_view(['GET'])
@permission_classes([AllowAny])
def creator_leaderboard(request, username: str):
    """
    Public supporter leaderboard (Odogwu wall) for a creator.
    Aggregates only verified contributions where the sender opted into public attribution (is_public_on_wall=True).
    Never exposes contact information, emails, or private messages.
    """
    try:
        creator = Creator.objects.get(username=username)
    except Creator.DoesNotExist:
        return Response({'detail': 'Creator not found.'}, status=404)

    if not creator.public_supporter_wall_enabled:
        return Response({
            'period': creator.leaderboard_period,
            'enabled': False,
            'leaderboard': [],
        })

    requested_period = request.query_params.get('period', creator.leaderboard_period).strip().lower()
    if requested_period not in ['weekly', 'monthly', 'all_time']:
        requested_period = 'weekly'

    now = timezone.now()
    qs = PaidInteraction.objects.filter(
        creator=creator,
        payment_status__in=[
            PaidInteraction.Status.VERIFIED,
            PaidInteraction.Status.READ,
            PaidInteraction.Status.ARCHIVED,
        ],
        is_public_on_wall=True,
    )

    if requested_period == 'weekly':
        qs = qs.filter(created_at__gte=now - datetime.timedelta(days=7))
    elif requested_period == 'monthly':
        qs = qs.filter(created_at__gte=now - datetime.timedelta(days=30))

    aggregated = (
        qs.values('sender_name')
        .annotate(
            total_amount_kobo=Sum('amount_kobo'),
            interaction_count=Count('id'),
            last_supported_at=Max('created_at'),
        )
        .order_by('-total_amount_kobo', '-interaction_count', 'last_supported_at')[:20]
    )

    leaderboard = []
    for rank, item in enumerate(aggregated, start=1):
        leaderboard.append({
            'rank': rank,
            'supporter_name': item['sender_name'],
            'total_amount_kobo': item['total_amount_kobo'],
            'total_amount_naira': item['total_amount_kobo'] / 100.0,
            'interaction_count': item['interaction_count'],
            'last_supported_at': item['last_supported_at'],
        })

    return Response({
        'period': requested_period,
        'enabled': True,
        'leaderboard': leaderboard,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def list_banks(request):
    """List supported Nigerian banks for creator payout setup."""
    banks = paystack.list_banks(country='nigeria')
    return Response({'banks': banks})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_bank(request):
    """Verify Nigerian account number with Paystack and return account name."""
    account_number = str(request.data.get('account_number', '')).strip()
    bank_code = str(request.data.get('bank_code', '')).strip()

    try:
        resolved = paystack.resolve_bank_account(account_number=account_number, bank_code=bank_code)
        return Response(resolved)
    except paystack.PaystackError as exc:
        return Response({'detail': exc.message}, status=exc.status_code)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_bank(request):
    """
    Connect bank account and generate Paystack subaccount.
    Creator never has to expose full account number to visitors.
    """
    creator = getattr(request.user, 'creator_profile', None)
    if not creator:
        return Response({'detail': 'Creator profile not found.'}, status=404)

    bank_code = str(request.data.get('bank_code', '')).strip()
    bank_name = str(request.data.get('bank_name', '')).strip()
    account_number = str(request.data.get('account_number', '')).strip()

    if not bank_code or not account_number:
        return Response({'detail': 'Bank code and 10-digit account number are required.'}, status=400)

    try:
        # 1. Resolve account name first
        resolved = paystack.resolve_bank_account(account_number=account_number, bank_code=bank_code)
        account_name = resolved['account_name']

        # 2. Create subaccount with Paystack
        # Platform fee percentage is configured on server
        subaccount_data = paystack.create_subaccount(
            business_name=creator.display_name or creator.username,
            settlement_bank=bank_code,
            account_number=account_number,
            percentage_charge=float(getattr(paystack.settings, 'PLATFORM_FEE_PERCENT', 10)),
        )

        creator.paystack_subaccount_code = subaccount_data['subaccount_code']
        creator.bank_code = bank_code
        creator.bank_name = bank_name or bank_code
        creator.account_number_last4 = account_number[-4:]
        creator.account_name = account_name
        creator.subaccount_status = Creator.SubaccountStatus.ACTIVE
        creator.save(update_fields=[
            'paystack_subaccount_code',
            'bank_code',
            'bank_name',
            'account_number_last4',
            'account_name',
            'subaccount_status',
        ])

        return Response({
            'detail': 'Bank account connected successfully.',
            'creator': CreatorPrivateSerializer(creator).data,
        })
    except paystack.PaystackError as exc:
        creator.subaccount_status = Creator.SubaccountStatus.FAILED
        creator.save(update_fields=['subaccount_status'])
        return Response({'detail': exc.message}, status=exc.status_code)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def creator_dashboard(request):
    """Authenticated creator workspace overview and metrics."""
    creator = getattr(request.user, 'creator_profile', None)
    if not creator:
        return Response({'detail': 'Creator profile not found.'}, status=404)

    # Calculate verified payments & metrics
    successful_payments = Payment.objects.filter(
        creator=creator,
        status=Payment.Status.SUCCESS,
    )
    earnings_agg = successful_payments.aggregate(
        total_kobo=Sum('amount_kobo'),
        fee_kobo=Sum('platform_fee_kobo'),
        creator_kobo=Sum('creator_amount_kobo'),
        count=Count('id'),
    )

    verified_interactions = PaidInteraction.objects.filter(
        creator=creator,
        payment_status__in=[PaidInteraction.Status.VERIFIED, PaidInteraction.Status.READ, PaidInteraction.Status.ARCHIVED],
    )
    unread_messages = verified_interactions.filter(
        interaction_type=PaidInteraction.Type.PRIORITY_DM,
        payment_status=PaidInteraction.Status.VERIFIED,
    ).count()

    total_kobo = earnings_agg['total_kobo'] or 0
    fee_kobo = earnings_agg['fee_kobo'] or 0
    net_kobo = earnings_agg['creator_kobo'] or (total_kobo - fee_kobo)

    data = {
        'creator': CreatorPrivateSerializer(creator).data,
        'metrics': {
            'verified_earnings_kobo': total_kobo,
            'platform_fees_kobo': fee_kobo,
            'net_earnings_kobo': net_kobo,
            'total_interactions_count': earnings_agg['count'] or 0,
            'unread_messages_count': unread_messages,
            'subaccount_active': creator.subaccount_status == Creator.SubaccountStatus.ACTIVE,
        },
    }
    return Response(data)


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update creator display name, bio, pricing, preferences."""
    creator = getattr(request.user, 'creator_profile', None)
    if not creator:
        return Response({'detail': 'Creator profile not found.'}, status=404)

    serializer = CreatorProfileUpdateSerializer(creator, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    serializer.save()
    return Response({
        'detail': 'Profile updated successfully.',
        'creator': CreatorPrivateSerializer(creator).data,
    })

