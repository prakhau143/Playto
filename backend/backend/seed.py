from django.contrib.auth import get_user_model
from django.utils import timezone

from kyc.models import KYCSubmission

User = get_user_model()


def run():
    # Reviewer (admin)
    reviewer, _ = User.objects.get_or_create(
        username="reviewer",
        defaults={"email": "reviewer@example.com", "role": "admin", "is_staff": True},
    )
    reviewer.set_password("reviewer123")
    reviewer.is_staff = True
    reviewer.role = "admin"
    reviewer.save()

    # Also keep classic admin for convenience
    admin, _ = User.objects.get_or_create(
        username="admin",
        defaults={"email": "admin@example.com", "role": "admin", "is_staff": True},
    )
    admin.set_password("admin123")
    admin.is_superuser = True
    admin.is_staff = True
    admin.role = "admin"
    admin.save()

    # Merchant 1 (draft)
    m1, _ = User.objects.get_or_create(
        username="merchant_draft",
        defaults={"email": "draft@example.com", "role": "merchant"},
    )
    m1.set_password("merchant123")
    m1.role = "merchant"
    m1.save()

    sub1, _ = KYCSubmission.objects.get_or_create(
        user=m1,
        status=KYCSubmission.Status.DRAFT,
        defaults={
            "full_name": "Draft Merchant",
            "email": "draft@example.com",
            "phone": "9999999999",
            "business_name": "Draft Co",
            "business_type": "Agency",
            "expected_volume_usd": 1000,
        },
    )

    # Merchant 2 (under_review)
    m2, _ = User.objects.get_or_create(
        username="merchant_review",
        defaults={"email": "review@example.com", "role": "merchant"},
    )
    m2.set_password("merchant123")
    m2.role = "merchant"
    m2.save()

    sub2, _ = KYCSubmission.objects.get_or_create(
        user=m2,
        status=KYCSubmission.Status.UNDER_REVIEW,
        defaults={
            "full_name": "Review Merchant",
            "email": "review@example.com",
            "phone": "8888888888",
            "business_name": "Review Co",
            "business_type": "Freelancer",
            "expected_volume_usd": 2500,
            "submitted_at": timezone.now() - timezone.timedelta(hours=2),
            "assigned_reviewer": reviewer,
        },
    )
    if not sub2.submitted_at:
        sub2.submitted_at = timezone.now() - timezone.timedelta(hours=2)
        sub2.save(update_fields=["submitted_at"])

    print("Seed complete.")
    print("Reviewer login: reviewer / reviewer123")
    print("Admin login: admin / admin123")
    print("Merchant draft: merchant_draft / merchant123")
    print("Merchant review: merchant_review / merchant123")


run()

