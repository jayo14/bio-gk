from urllib.parse import urlparse, parse_qs
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from apps.creators.models import Creator

User = get_user_model()


@override_settings(DEBUG=True, FRONTEND_URL='http://localhost:3000')
class AuthenticationFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_creates_active_user_and_creator_without_email_verification(self):
        response = self.client.post('/api/auth/signup/', {
            'email': 'creator@example.com',
            'password': 'safe-pass-123',
            'display_name': 'Creator One',
            'username': 'creator_one',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        user = User.objects.get(email='creator@example.com')
        self.assertTrue(user.is_active)
        self.assertTrue(user.check_password('safe-pass-123'))
        self.assertEqual(Creator.objects.get(username='creator_one').owner_id, user.id)
        self.assertTrue(response.data.get('token'))
        # Ensure HttpOnly cookie is set
        self.assertIn('bg_token', response.cookies)
        self.assertTrue(response.cookies['bg_token']['httponly'])

    def test_login_and_me_with_cookie_auth(self):
        user = User.objects.create_user(username='creator@example.com', email='creator@example.com', password='safe-pass-123')
        Creator.objects.create(owner=user, username='creator_one', display_name='Creator One')
        response = self.client.post('/api/auth/login/', {'email': 'creator@example.com', 'password': 'safe-pass-123'}, format='json')
        self.assertEqual(response.status_code, 200)

        token = response.data['token']
        # Clear header credentials, test cookie auth
        self.client.cookies['bg_token'] = token
        me_resp = self.client.get('/api/auth/me/')
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.data['user']['username'], 'creator_one')

        # Test logout clears token and cookie
        logout_resp = self.client.post('/api/auth/logout/', {}, format='json')
        self.assertEqual(logout_resp.status_code, 200)
        self.assertFalse(Token.objects.filter(key=token).exists())

    def test_password_reset_link_resets_password_and_revokes_tokens(self):
        user = User.objects.create_user(username='creator@example.com', email='creator@example.com', password='old-pass-123')
        token = Token.objects.create(user=user)
        response = self.client.post('/api/auth/forgot-password/', {'email': user.email}, format='json')
        self.assertEqual(response.status_code, 200)

        query = parse_qs(urlparse(response.data['development_reset_url']).query)
        reset = self.client.post('/api/auth/reset-password/', {
            'uid': query['uid'][0],
            'token': query['token'][0],
            'password': 'new-pass-456',
        }, format='json')
        self.assertEqual(reset.status_code, 200, reset.data)
        user.refresh_from_db()
        self.assertTrue(user.check_password('new-pass-456'))
        # Past token must be revoked
        self.assertFalse(Token.objects.filter(key=token.key).exists())

    def test_change_password(self):
        user = User.objects.create_user(username='creator@example.com', email='creator@example.com', password='old-pass-123')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        # Wrong old password
        res_fail = self.client.post('/api/auth/change-password/', {
            'current_password': 'wrong-pass',
            'new_password': 'brand-new-pass',
        }, format='json')
        self.assertEqual(res_fail.status_code, 400)

        # Successful change
        res_ok = self.client.post('/api/auth/change-password/', {
            'current_password': 'old-pass-123',
            'new_password': 'brand-new-pass',
        }, format='json')
        self.assertEqual(res_ok.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password('brand-new-pass'))

    def test_signup_rejects_duplicate_handle_and_reserved_handles(self):
        Creator.objects.create(username='creator_one', display_name='First Creator')
        response = self.client.post('/api/auth/signup/', {
            'email': 'second@example.com',
            'password': 'safe-pass-123',
            'display_name': 'Second Creator',
            'username': 'creator_one',
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('username', response.data)

        # Reserved handle
        res_reserved = self.client.post('/api/auth/signup/', {
            'email': 'admin_user@example.com',
            'password': 'safe-pass-123',
            'display_name': 'Admin',
            'username': 'admin',
        }, format='json')
        self.assertEqual(res_reserved.status_code, 400)
