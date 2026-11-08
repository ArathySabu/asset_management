from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, Asset, InventoryItem, Assignment, RepairTicket


class CustomTokenSerializer(TokenObtainPairSerializer):
    """Adds username and role to the login response so React can show/hide things."""
    def validate(self, attrs):
        data = super().validate(attrs)
        data["username"] = self.user.username
        data["role"] = "Admin" if self.user.is_superuser else self.user.role
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "role"]


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = "__all__"


class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = "__all__"

    def get_is_low_stock(self, obj):
        return obj.quantity <= obj.threshold


class AssignmentSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    employee_name = serializers.CharField(source="employee.username", read_only=True)

    class Meta:
        model = Assignment
        fields = "__all__"

    def validate_asset(self, asset):
        if self.instance is None and asset.status != "Available":
            raise serializers.ValidationError("This asset is not available.")
        return asset


class RepairTicketSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    technician_name = serializers.CharField(source="assigned_technician.username", read_only=True)

    class Meta:
        model = RepairTicket
        fields = "__all__"