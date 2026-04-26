from django.contrib import admin

from .models import Document, KYCSubmission, Notification, ReviewEvent, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "role", "is_staff", "date_joined")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email", "phone")


@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "business_name", "status", "submitted_at", "is_at_risk")
    list_filter = ("status",)
    search_fields = ("business_name", "full_name", "email", "user__username")


admin.site.register(Document)
admin.site.register(ReviewEvent)
admin.site.register(Notification)
