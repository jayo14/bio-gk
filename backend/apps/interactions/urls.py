from django.urls import path
from .views import inbox_list, mark_as_read, mark_as_archived

urlpatterns = [
    path('inbox/', inbox_list, name='interaction-inbox-list'),
    path('<uuid:interaction_id>/read/', mark_as_read, name='interaction-mark-read'),
    path('<uuid:interaction_id>/archive/', mark_as_archived, name='interaction-mark-archive'),
]
