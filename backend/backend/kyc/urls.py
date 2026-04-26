from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AdminSearchView,
    AdminStatsView,
    KYCSubmissionViewSet,
    MarkNotificationReadView,
    MeView,
    MyNotificationsView,
    RegisterView,
    UserAdminViewSet,
)

router = DefaultRouter()
router.register(r"submissions", KYCSubmissionViewSet, basename="submissions")
router.register(r"admin/users", UserAdminViewSet, basename="admin-users")

urlpatterns = [
    path("", include(router.urls)),
    # Auth (unified login/register flow in UI)
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", MeView.as_view()),
    # Admin extras
    path("admin/stats/", AdminStatsView.as_view()),
    path("admin/search/", AdminSearchView.as_view()),
    # Notifications
    path("notifications/", MyNotificationsView.as_view()),
    path("notifications/<int:pk>/read/", MarkNotificationReadView.as_view()),
]

