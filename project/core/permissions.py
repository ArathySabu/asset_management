from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_admin(user):
    return user.is_authenticated and (user.is_superuser or user.role == "Admin")


class IsAdminOrReadOnly(BasePermission):
    """Everyone logged in can read. Only Admins can create/edit/delete."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return is_admin(request.user)