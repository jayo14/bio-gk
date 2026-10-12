from django.urls import path
from .views import initialize_payment, verify_payment, paystack_webhook

urlpatterns = [
    path('initialize/', initialize_payment, name='payment-initialize'),
    path('verify/<str:reference>/', verify_payment, name='payment-verify'),
    path('webhook/', paystack_webhook, name='paystack-webhook'),
]
