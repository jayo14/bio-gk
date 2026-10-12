from rest_framework.authentication import TokenAuthentication


class CookieOrHeaderTokenAuthentication(TokenAuthentication):
    """
    Authenticate against DRF Token via standard 'Authorization: Token ...' header
    OR via HttpOnly 'bg_token' cookie.
    Prevents the frontend from having to store secret tokens in localStorage.
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header:
            return super().authenticate(request)

        token_cookie = request.COOKIES.get('bg_token')
        if not token_cookie:
            return None

        return self.authenticate_credentials(token_cookie)
