import logging
import re
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from .models import Creator

logger = logging.getLogger(__name__)
User = get_user_model()


def user_payload(user):
    creator = getattr(user, 'creator_profile', None)
    return {
        'id': user.pk,
        'email': user.email,
        'display_name': creator.display_name if creator else user.get_full_name() or user.email.split('@')[0],
        'username': creator.username if creator else None,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    email = str(request.data.get('email', '')).strip().lower()
    password = str(request.data.get('password', ''))
    display_name = str(request.data.get('display_name', '')).strip()
    username = str(request.data.get('username', '')).strip().lower()
    try:
        validate_email(email)
    except ValidationError:
        return Response({'email': 'Enter a valid email address.'}, status=400)
    if len(email) > 150:
        return Response({'email': 'Email address must be 150 characters or fewer.'}, status=400)
    if len(password) < 8:
        return Response({'password': 'Use at least 8 characters.'}, status=400)
    if not display_name or len(display_name) > 80:
        return Response({'display_name': 'Display name is required (maximum 80 characters).'}, status=400)
    if not re.fullmatch(r'[a-z0-9_]{3,24}', username):
        return Response({'username': 'Use 3–24 lowercase letters, numbers or underscores.'}, status=400)
    if User.objects.filter(email__iexact=email).exists():
        return Response({'email': 'An account with this email already exists.'}, status=400)
    if User.objects.filter(username__iexact=email).exists():
        return Response({'email': 'An account with this email already exists.'}, status=400)
    if Creator.objects.filter(username=username).exists():
        return Response({'username': 'This handle is already taken.'}, status=400)
    from django.db import transaction
    with transaction.atomic():
        user = User.objects.create_user(username=email, email=email, password=password, is_active=True, first_name=display_name[:150])
        creator = Creator.objects.create(username=username, display_name=display_name)
        user.creator_profile = creator
        # Keep creator ownership explicit without relying on an implicit username match.
        creator.owner = user
        creator.save(update_fields=['owner'])
        token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': user_payload(user)}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = str(request.data.get('email', '')).strip().lower()
    password = str(request.data.get('password', ''))
    user = authenticate(request, username=email, password=password)
    if not user or not user.is_active:
        return Response({'detail': 'Email or password is incorrect.'}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': user_payload(user)})


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    request.auth.delete()
    return Response({'detail': 'You have been logged out.'})


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({'user': user_payload(request.user)})


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = str(request.data.get('email', '')).strip().lower()
    # Always return the same message to avoid revealing which addresses have accounts.
    response_data = {'detail': 'If an account exists for that email, password reset instructions are ready.'}
    try:
        validate_email(email)
        user = User.objects.filter(email__iexact=email, is_active=True).first()
    except ValidationError:
        user = None
    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?{urlencode({'uid': uid, 'token': token})}"
        # Dummy email trigger for now. The reset URL is logged and exposed only in DEBUG.
        logger.info('DEV password reset link for %s: %s', email, reset_url)
        if settings.DEBUG:
            response_data['development_reset_url'] = reset_url
    return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uid = str(request.data.get('uid', ''))
    token = str(request.data.get('token', ''))
    password = str(request.data.get('password', ''))
    if len(password) < 8:
        return Response({'password': 'Use at least 8 characters.'}, status=400)
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id, is_active=True)
    except (ValueError, TypeError, OverflowError, User.DoesNotExist):
        return Response({'detail': 'This reset link is invalid or has expired. Request a new one.'}, status=400)
    if not default_token_generator.check_token(user, token):
        return Response({'detail': 'This reset link is invalid or has expired. Request a new one.'}, status=400)
    user.set_password(password)
    user.save(update_fields=['password'])
    # Revoke all existing sessions/tokens after a password reset.
    Token.objects.filter(user=user).delete()
    return Response({'detail': 'Password updated. You can now sign in with your new password.'})
