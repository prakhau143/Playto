from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import KYCSubmission


class IllegalTransitionTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            username="t_admin", password="pass1234", role="admin", is_staff=True
        )
        self.merchant = User.objects.create_user(
            username="t_merch", password="pass1234", role="merchant"
        )
        self.sub = KYCSubmission.objects.create(user=self.merchant, status="approved")
        self.client = APIClient()

    def test_cannot_request_info_after_approved(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            f"/api/v1/submissions/{self.sub.id}/review/",
            {"action": "request_info", "remarks": "need more"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("error", res.data)

from django.test import TestCase

# Create your tests here.
