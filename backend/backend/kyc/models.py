from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        MERCHANT = "merchant", "Merchant"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MERCHANT)
    phone = models.CharField(max_length=32, blank=True, default="")


class KYCSubmission(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        ON_HOLD = "on_hold", "On Hold"
        MORE_INFO_REQUESTED = "more_info_requested", "More Info Requested"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions"
    )

    # Merchant + business details (minimum viable fields; extend freely)
    full_name = models.CharField(max_length=255, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    business_name = models.CharField(max_length=255, blank=True, default="")
    business_type = models.CharField(max_length=100, blank=True, default="")
    expected_volume_usd = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.DRAFT
    )
    reviewer_remarks = models.TextField(blank=True, default="")
    assigned_reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_reviews",
    )

    submitted_at = models.DateTimeField(null=True, blank=True)
    status_updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def sla_deadline(self):
        # SLA: 24 hours from first submit
        if not self.submitted_at:
            return None
        return self.submitted_at + timezone.timedelta(hours=24)

    @property
    def sla_hours_left(self):
        deadline = self.sla_deadline()
        if not deadline:
            return None
        delta = deadline - timezone.now()
        return round(delta.total_seconds() / 3600, 2)

    @property
    def is_at_risk(self):
        # At-risk only when pending admin action
        if self.status in {
            self.Status.SUBMITTED,
            self.Status.UNDER_REVIEW,
            self.Status.ON_HOLD,
        } and self.submitted_at:
            return timezone.now() > self.sla_deadline()
        return False


class Document(models.Model):
    class DocType(models.TextChoices):
        PAN = "pan", "PAN"
        AADHAAR = "aadhaar", "Aadhaar"
        BANK_STATEMENT = "bank_statement", "Bank Statement"
        GST = "gst", "GST"

    submission = models.ForeignKey(
        KYCSubmission, on_delete=models.CASCADE, related_name="documents"
    )
    doc_type = models.CharField(max_length=32, choices=DocType.choices)
    file = models.FileField(upload_to="kyc_docs/")
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ReviewEvent(models.Model):
    submission = models.ForeignKey(
        KYCSubmission, on_delete=models.CASCADE, related_name="events"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    from_status = models.CharField(max_length=32)
    to_status = models.CharField(max_length=32)
    remarks = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    event_type = models.CharField(max_length=64)
    payload = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
