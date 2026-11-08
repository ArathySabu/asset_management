from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('Admin', 'Admin'),
        ('Employee', 'Employee'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')

    def __str__(self):
        return f"{self.username} ({self.role})"

# 1. Asset Model
class Asset(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    serial_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=50, default='Available')
    purchase_date = models.DateField()

    def __str__(self):
        return f"{self.name} ({self.serial_number})"

# 2. Inventory Item Model[cite: 1]
class InventoryItem(models.Model):
    item_type = models.CharField(max_length=100)
    category = models.CharField(max_length=100, blank=True, default='')
    quantity = models.IntegerField(default=0)
    threshold = models.IntegerField(default=5)

    def __str__(self):
        return f"{self.item_type} - Qty: {self.quantity}"

# 3. Assignment Model[cite: 1]
class Assignment(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    date_assigned = models.DateField()
    date_returned = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.asset} assigned to {self.employee.username}"

# 4. Repair Ticket Model[cite: 1]
class RepairTicket(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    issue = models.TextField()
    status = models.CharField(max_length=50, default='Pending')
    assigned_technician = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='technician_tickets')

    def __str__(self):
        return f"Repair: {self.asset.name} - Status: {self.status}"

from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    age = models.PositiveIntegerField(null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    department = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return str(self.user)