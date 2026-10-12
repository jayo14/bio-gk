from django.urls import path
from .views import initialize_payment, paystack_webhook
urlpatterns = [path('initialize/', initialize_payment, name='payment-initialize'), path('webhook/', paystack_webhook, name='paystack-webhook')]
