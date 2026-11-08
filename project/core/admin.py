from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Asset, InventoryItem, Assignment, RepairTicket

# Register Custom User with Admin
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'serial_number', 'status', 'purchase_date')
    list_filter = ('status', 'type')
    search_fields = ('name', 'serial_number')
    ordering = ('-purchase_date',)

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('item_type', 'quantity', 'threshold')
    search_fields = ('item_type',)

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('asset', 'employee', 'date_assigned', 'date_returned')
    list_filter = ('date_assigned',)
    search_fields = ('asset__name', 'employee__username')

@admin.register(RepairTicket)
class RepairTicketAdmin(admin.ModelAdmin):
    list_display = ('asset', 'status', 'assigned_technician')
    list_filter = ('status',)
    search_fields = ('asset__name', 'issue')
