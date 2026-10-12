import logging
import re
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login as django_login, logout as django_logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import Creator

logger = logging.getLogger(__name__)
User = get_user_model()


def set_auth_cookie(response: Response, token_key: str):
    """Set secure HttpOnly cookie for browser sessions so frontend never stores tokens in localStorage."""
    secure = not settings.DEBUG
    response.set_cookie(
        key='bg_token',
        value=token_key,
        max_age=14 * 24 * 60 * 60,  # 14 days
        httponly=True,
        samesite='Lax',
        secure=secure,
        path='/',
    )


def delete_auth_cookie(response: Response):
    response.delete_cookie('bg_token', path='/')


def user_payload(user):
    creator = getattr(user, 'creator_profile', None)
    return {
        'id': user.pk,
        'email': user.email,
        'display_name': creator.display_name if creator else (user.get_full_name() or user.email.split('@')[0]),
        'username': creator.username if creator else None,
        'is_verified': creator.is_verified if creator else False,
        'subaccount_status': creator.subaccount_status if creator else 'unconnected',
    }


class AuthRateThrottle(ScopedRateThrottle):
    scope = 'auth'


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
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

    # Disallow reserved routing handles
    reserved_handles = {'admin', 'api', 'dashboard', 'login', 'signup', 'payment', 'forgot-password', 'reset-password', 'settings', 'static'}
    if username in reserved_handles:
        return Response({'username': 'This handle is reserved. Please choose another.'}, status=400)

    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
        return Response({'email': 'An account with this email already exists.'}, status=400)

    if Creator.objects.filter(username=username).exists():
        return Response({'username': 'This handle is already taken.'}, status=400)

    with transaction.atomic():
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            is_active=True,
            first_name=display_name[:150],
        )
        creator = Creator.objects.create(
            username=username,
            display_name=display_name,
            owner=user,
        )
        token, _ = Token.objects.get_or_create(user=user)

    response = Response({'token': token.key, 'user': user_payload(user)}, status=status.HTTP_201_CREATED)
    set_auth_cookie(response, token.key)
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def login(request):
    email = str(request.data.get('email', '')).strip().lower()
    password = str(request.data.get('password', ''))

    user = authenticate(request, username=email, password=password)
    if not user or not user.is_active:
        return Response({'detail': 'Email or password is incorrect.'}, status=400)

    django_login(request, user)
    token, _ = Token.objects.get_or_create(user=user)
    response = Response({'token': token.key, 'user': user_payload(user)})
    set_auth_cookie(response, token.key)
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    if hasattr(request, 'auth') and request.auth:
        Token.objects.filter(key=request.auth.key).delete()
    django_logout(request)
    response = Response({'detail': 'You have been logged out.'})
    delete_auth_cookie(response)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({'user': user_payload(request.user)})


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def forgot_password(request):
    email = str(request.data.get('email', '')).strip().lower()
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

        # Real email sending when configured
        try:
            send_mail(
                subject="Reset your Bio Gatekeeper password",
                message=(
                    f"Hello,\n\n"
                    f"You requested a password reset for your Bio Gatekeeper account.\n\n"
                    f"Click the link below to set a new password:\n{reset_url}\n\n"
                    f"This link expires in 1 hour and can only be used once.\n"
                    f"If you did not request this, you can safely ignore this email.\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.warning("Could not send password reset email to %s: %s", email, exc)

        logger.info('Password reset generated for %s', email)
        if settings.DEBUG:
            response_data['development_reset_url'] = reset_url

    return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
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
    # Invalidate all existing tokens so past sessions are immediately revoked
    Token.objects.filter(user=user).delete()

    return Response({'detail': 'Password updated. You can now sign in with your new password.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    current_password = str(request.data.get('current_password', ''))
    new_password = str(request.data.get('new_password', ''))

    if not request.user.check_password(current_password):
        return Response({'current_password': 'Your current password is incorrect.'}, status=400)

    if len(new_password) < 8:
        return Response({'new_password': 'Use at least 8 characters.'}, status=400)

    request.user.set_password(new_password)
    request.user.save(update_fields=['password'])

    # Regenerate token for current user session
    Token.objects.filter(user=request.user).delete()
    new_token = Token.objects.create(user=request.user)

    response = Response({'detail': 'Password changed successfully.', 'token': new_token.key})
    set_auth_cookie(response, new_token.key)
    return response
