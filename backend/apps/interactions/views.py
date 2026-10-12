from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PaidInteraction
from .serializers import InteractionInboxSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inbox_list(request):
    """
    List private verified interactions for the authenticated creator.
    Supports filtering by status (?status=all|unread|read|archived)
    and by type (?type=all|priority_dm|public_tip).
    """
    creator = getattr(request.user, 'creator_profile', None)
    if not creator:
        return Response({'detail': 'Creator profile not found.'}, status=404)

    queryset = PaidInteraction.objects.filter(
        creator=creator,
        payment_status__in=[
            PaidInteraction.Status.VERIFIED,
            PaidInteraction.Status.READ,
            PaidInteraction.Status.ARCHIVED,
        ],
    )

    filter_status = request.query_params.get('status', 'all').strip().lower()
    if filter_status == 'unread':
        queryset = queryset.filter(payment_status=PaidInteraction.Status.VERIFIED)
    elif filter_status == 'read':
        queryset = queryset.filter(payment_status=PaidInteraction.Status.READ)
    elif filter_status == 'archived':
        queryset = queryset.filter(payment_status=PaidInteraction.Status.ARCHIVED)

    filter_type = request.query_params.get('type', 'all').strip().lower()
    if filter_type in [PaidInteraction.Type.PRIORITY_DM, PaidInteraction.Type.PUBLIC_TIP]:
        queryset = queryset.filter(interaction_type=filter_type)

    serializer = InteractionInboxSerializer(queryset, many=True)
    return Response({
        'count': queryset.count(),
        'results': serializer.data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, interaction_id):
    """Mark an interaction as read."""
    creator = getattr(request.user, 'creator_profile', None)
    if not creator:
        return Response({'detail': 'Creator profile not found.'}, status=404)

    try:
        interaction = PaidInteraction.objects.get(id=interaction_id, creator=creator)
    except PaidInteraction.DoesNotExist:
        return Response({'detail': 'Interaction not found.'}, status=404)

    if interaction.payment_status == PaidInteraction.Status.VERIFIED:
        interaction.payment_status = PaidInteraction.Status.READ
        interaction.save(update_fields=['payment_status', 'updated_at'])

    return Response({
        'detail': 'Interaction marked as read.',
        'interaction': InteractionInboxSerializer(interaction).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_archived(request, interaction_id):
    """Mark an interaction as archived."""
    creator = getattr(request.user, 'creator_profile', None)
    if not creator:
        return Response({'detail': 'Creator profile not found.'}, status=404)

    try:
        interaction = PaidInteraction.objects.get(id=interaction_id, creator=creator)
    except PaidInteraction.DoesNotExist:
        return Response({'detail': 'Interaction not found.'}, status=404)

    interaction.payment_status = PaidInteraction.Status.ARCHIVED
    interaction.save(update_fields=['payment_status', 'updated_at'])

    return Response({
        'detail': 'Interaction archived.',
        'interaction': InteractionInboxSerializer(interaction).data,
    })
