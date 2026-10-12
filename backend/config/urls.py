from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response
@api_view(['GET'])
def health(request): return Response({'status':'ok','service':'bio-gatekeeper-api'})
urlpatterns = [path('api/auth/', include('apps.creators.auth_urls')), path('admin/', admin.site.urls), path('api/health/', health), path('api/creators/', include('apps.creators.urls')), path('api/payments/', include('apps.payments.urls'))]
