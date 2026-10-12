from django.urls import path
from .views import (
    CreatorPublicDetail,
    list_banks,
    resolve_bank,
    connect_bank,
    creator_dashboard,
    update_profile,
)

urlpatterns = [
    path('banks/', list_banks, name='creator-banks-list'),
    path('bank/resolve/', resolve_bank, name='creator-bank-resolve'),
    path('bank/connect/', connect_bank, name='creator-bank-connect'),
    path('dashboard/', creator_dashboard, name='creator-dashboard-overview'),
    path('profile/', update_profile, name='creator-profile-update'),
    path('<slug:username>/', CreatorPublicDetail.as_view(), name='creator-public-detail'),
]
