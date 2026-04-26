from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Document, KYCSubmission, Notification, ReviewEvent
from .utils import validate_upload

User = get_user_model()


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "first_name", "last_name", "phone"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "phone"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "doc_type", "file", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]

    def validate_file(self, value):
        try:
            validate_upload(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value


class ReviewEventSerializer(serializers.ModelSerializer):
    actor = UserPublicSerializer(read_only=True)

    class Meta:
        model = ReviewEvent
        fields = ["id", "actor", "from_status", "to_status", "remarks", "created_at"]


class KYCSubmissionSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    events = ReviewEventSerializer(many=True, read_only=True)
    user_info = UserPublicSerializer(source="user", read_only=True)
    assigned_reviewer_info = UserPublicSerializer(source="assigned_reviewer", read_only=True)
    is_at_risk = serializers.BooleanField(read_only=True)
    sla_hours_left = serializers.FloatField(read_only=True)

    class Meta:
        model = KYCSubmission
        fields = [
            "id",
            "user",
            "user_info",
            "full_name",
            "email",
            "phone",
            "business_name",
            "business_type",
            "expected_volume_usd",
            "status",
            "reviewer_remarks",
            "assigned_reviewer",
            "assigned_reviewer_info",
            "submitted_at",
            "created_at",
            "status_updated_at",
            "documents",
            "events",
            "is_at_risk",
            "sla_hours_left",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "reviewer_remarks",
            "assigned_reviewer",
            "submitted_at",
            "created_at",
            "status_updated_at",
            "documents",
            "events",
            "is_at_risk",
            "sla_hours_left",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "event_type", "payload", "is_read", "created_at"]
