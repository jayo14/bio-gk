from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from .models import Creator
from .serializers import CreatorPublicSerializer
class CreatorPublicDetail(RetrieveAPIView):
    queryset = Creator.objects.all()
    serializer_class = CreatorPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = 'username'
