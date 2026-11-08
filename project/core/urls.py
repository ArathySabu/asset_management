from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import ai_chat
from .views import my_profile
from .views import (
    AssetViewSet, InventoryItemViewSet, AssignmentViewSet, RepairTicketViewSet,
    LoginView, LogoutView, DashboardView, UserViewSet,
)

router = DefaultRouter()
router.register("assets", AssetViewSet)
router.register("inventory", InventoryItemViewSet)
router.register("assignments", AssignmentViewSet)
router.register("tickets", RepairTicketViewSet)
router.register("users", UserViewSet)

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("dashboard/", DashboardView.as_view()),
    path("", include(router.urls)),
    path("profile/", my_profile),
    path("chat/", ai_chat),
   
]