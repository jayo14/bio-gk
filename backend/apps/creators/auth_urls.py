from django.urls import path
from .auth_views import signup, login, logout, me, forgot_password, reset_password

urlpatterns = [
    path('signup/', signup, name='auth-signup'),
    path('login/', login, name='auth-login'),
    path('logout/', logout, name='auth-logout'),
    path('me/', me, name='auth-me'),
    path('forgot-password/', forgot_password, name='auth-forgot-password'),
    path('reset-password/', reset_password, name='auth-reset-password'),
]
