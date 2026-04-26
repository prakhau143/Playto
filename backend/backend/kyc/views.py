from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document, KYCSubmission, Notification, ReviewEvent
from .permissions import IsAdmin, IsOwnerOrAdmin
from .serializers import (
    DocumentSerializer,
    KYCSubmissionSerializer,
    NotificationSerializer,
    RegisterSerializer,
    UserPublicSerializer,
)
from .state_machine import can_transition

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserPublicSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)


class UserAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserPublicSerializer
    queryset = User.objects.all().order_by("-date_joined")

    def create(self, request, *args, **kwargs):
        # Admin adds user: username/email/password (+ optional role)
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""
        role = (request.data.get("role") or "merchant").strip()

        if not username:
            return Response({"username": ["This field is required."]}, status=400)
        if len(password) < 6:
            return Response({"password": ["Minimum 6 characters."]}, status=400)
        if role not in {"merchant", "admin"}:
            return Response({"role": ["Invalid role."]}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"username": ["Username already exists."]}, status=400)

        user = User(username=username, email=email, role=role)
        user.set_password(password)
        if role == "admin":
            user.is_staff = True
        user.save()

        return Response(UserPublicSerializer(user).data, status=201)


class KYCSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = (
            KYCSubmission.objects.all()
            if getattr(user, "role", None) == "admin"
            else KYCSubmission.objects.filter(user=user)
        )

        # Optional filtering (useful for queue/search UI)
        status_param = self.request.query_params.get("status")
        q = self.request.query_params.get("q")
        if status_param:
            qs = qs.filter(status=status_param)
        if q:
            qs = qs.filter(
                Q(business_name__icontains=q)
                | Q(full_name__icontains=q)
                | Q(email__icontains=q)
                | Q(user__username__icontains=q)
            )

        ordering = self.request.query_params.get("ordering") or "-created_at"
        return qs.select_related("user", "assigned_reviewer").order_by(ordering)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        submission: KYCSubmission = self.get_object()
        if not can_transition(submission.status, KYCSubmission.Status.SUBMITTED):
            return Response(
                {"error": f"Cannot transition from {submission.status} to submitted"},
                status=400,
            )

        from_status = submission.status
        submission.status = KYCSubmission.Status.SUBMITTED
        if not submission.submitted_at:
            submission.submitted_at = timezone.now()
        submission.save()

        ReviewEvent.objects.create(
            submission=submission,
            actor=request.user,
            from_status=from_status,
            to_status=submission.status,
            remarks="Merchant submitted KYC",
        )

        for admin in User.objects.filter(role="admin"):
            Notification.objects.create(
                user=admin,
                event_type="submission_submitted",
                payload={
                    "submission_id": submission.id,
                    "merchant": submission.user.username,
                },
            )

        return Response({"status": "submitted"})

    @action(detail=True, methods=["post"])
    def upload_document(self, request, pk=None):
        submission: KYCSubmission = self.get_object()
        serializer = DocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Document.objects.create(
            submission=submission,
            doc_type=serializer.validated_data["doc_type"],
            file=serializer.validated_data["file"],
        )
        return Response({"status": "uploaded"}, status=201)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsAdmin],
    )
    def review(self, request, pk=None):
        """
        Admin review actions:
        - start_review -> under_review
        - hold -> on_hold
        - request_info -> more_info_requested
        - approve -> approved
        - reject -> rejected
        """
        submission: KYCSubmission = self.get_object()
        action_name = request.data.get("action")
        remarks = request.data.get("remarks", "") or ""

        mapping = {
            "start_review": KYCSubmission.Status.UNDER_REVIEW,
            "hold": KYCSubmission.Status.ON_HOLD,
            "request_info": KYCSubmission.Status.MORE_INFO_REQUESTED,
            "approve": KYCSubmission.Status.APPROVED,
            "reject": KYCSubmission.Status.REJECTED,
        }
        to_status = mapping.get(action_name)
        if not to_status:
            return Response({"error": "Invalid action"}, status=400)

        if not can_transition(submission.status, to_status):
            return Response({"error": "Illegal state transition"}, status=400)

        from_status = submission.status
        submission.status = to_status
        submission.reviewer_remarks = remarks
        submission.assigned_reviewer = request.user
        submission.save()

        ReviewEvent.objects.create(
            submission=submission,
            actor=request.user,
            from_status=from_status,
            to_status=to_status,
            remarks=remarks,
        )

        # Notify merchant
        Notification.objects.create(
            user=submission.user,
            event_type=f"kyc_{to_status}",
            payload={"submission_id": submission.id, "remarks": remarks},
        )

        return Response({"status": to_status})


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        since = timezone.now() - timezone.timedelta(days=7)
        users_by_day = (
            User.objects.filter(date_joined__gte=since)
            .annotate(day=TruncDate("date_joined"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        merchants_total = User.objects.filter(role="merchant").count()
        submissions_total = KYCSubmission.objects.exclude(status=KYCSubmission.Status.DRAFT).count()
        pending_total = KYCSubmission.objects.filter(
            status__in=[
                KYCSubmission.Status.SUBMITTED,
                KYCSubmission.Status.UNDER_REVIEW,
                KYCSubmission.Status.ON_HOLD,
                KYCSubmission.Status.MORE_INFO_REQUESTED,
            ]
        ).count()
        at_risk_total = sum(1 for s in KYCSubmission.objects.all() if s.is_at_risk)

        by_status = (
            KYCSubmission.objects.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        return Response(
            {
                "users_by_day": list(users_by_day),
                "submissions_vs_users": {
                    "total_users": merchants_total,
                    "total_submissions": submissions_total,
                },
                "pending_total": pending_total,
                "at_risk_total": at_risk_total,
                "submissions_by_status": list(by_status),
            }
        )


class AdminSearchView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response([])

        users = (
            User.objects.filter(
                Q(username__icontains=q) | Q(email__icontains=q) | Q(phone__icontains=q)
            )
            .values("id", "username", "email", "role")
            .order_by("username")[:10]
        )
        submissions = (
            KYCSubmission.objects.filter(
                Q(business_name__icontains=q)
                | Q(full_name__icontains=q)
                | Q(email__icontains=q)
            )
            .values("id", "business_name", "status", "user_id")
            .order_by("-created_at")[:10]
        )

        return Response({"users": list(users), "submissions": list(submissions)})


class MyNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user).order_by("-created_at")[:50]
        return Response(NotificationSerializer(qs, many=True).data)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        notif = Notification.objects.get(pk=pk, user=request.user)
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response({"status": "read"})
