from django.urls import path
from .views import CreatorPublicDetail
urlpatterns = [path('<slug:username>/', CreatorPublicDetail.as_view(), name='creator-public-detail')]
