# EXPLAINER (Playto KYC)

Hindi/English mix: I shipped a minimal KYC pipeline with strict state machine + secure file validation + reviewer queue + SLA flagging + notifications logging.

## 1) The State Machine

**Where it lives:** `backend/backend/kyc/state_machine.py`

**How illegal transitions are blocked:** Every transition endpoint calls `can_transition(from, to)` and returns **400** when it is false.

## 2) The Upload (file validation)

**Where validation lives:**
- `backend/backend/kyc/utils.py` (`validate_upload`)
- `backend/backend/kyc/serializers.py` (`DocumentSerializer.validate_file`)

**Server-side rules (never trust client):**
- MIME type must be PDF/JPG/PNG
- Extension must be `.pdf/.jpg/.jpeg/.png`
- Max size: **5MB**

**What if someone sends 50MB file?**
- Django settings enforce request memory caps (`DATA_UPLOAD_MAX_MEMORY_SIZE`, `FILE_UPLOAD_MAX_MEMORY_SIZE`) so request is rejected early.
- Even if it passes, serializer validation rejects anything > 5MB with a clear error.

## 3) The Queue (reviewer dashboard query + SLA flag)

**Queue ordering:** oldest first by `submitted_at`

Example (used by frontend):
- `GET /api/v1/submissions/?ordering=submitted_at`

**SLA flag:** computed dynamically in model property `KYCSubmission.is_at_risk` (24h from `submitted_at`). We do **not** store a stale boolean.

## 4) The Auth (prevent merchant A seeing merchant B)

**Where:** `backend/backend/kyc/permissions.py`

Rule:
- Admin can access all
- Merchant can access only their own `KYCSubmission` objects (object-level permission check).

## 5) AI Audit (one concrete bug I caught)

Example issue: approving directly from `submitted` was failing with “Illegal state transition” because the state machine only allowed `submitted -> under_review`.

Fix: Updated `ALLOWED_TRANSITIONS` in `backend/backend/kyc/state_machine.py` so admin can take final actions from `submitted` too (common reviewer UX). Also kept illegal transitions like `approved -> draft` blocked.

