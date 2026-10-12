from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'bio-gatekeeper-api'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health, name='api-health'),
    path('api/auth/', include('apps.creators.auth_urls')),
    path('api/creators/', include('apps.creators.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/interactions/', include('apps.interactions.urls')),
]
