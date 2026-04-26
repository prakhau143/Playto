"""
KYC state machine (Playto core).

Rule: ALL status changes must pass can_transition().
"""

from __future__ import annotations


ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["submitted"],
    # Admin should be able to take final actions even if they skip "start_review" in UI.
    "submitted": ["under_review", "on_hold", "approved", "rejected", "more_info_requested"],
    "under_review": ["approved", "rejected", "more_info_requested", "on_hold"],
    "on_hold": ["under_review", "rejected", "more_info_requested"],
    "more_info_requested": ["submitted"],
    "approved": [],
    "rejected": [],
}


def can_transition(from_status: str, to_status: str) -> bool:
    return to_status in ALLOWED_TRANSITIONS.get(from_status, [])

