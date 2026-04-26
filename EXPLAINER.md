# EXPLAINER – Playto KYC Pipeline

I built a minimal but production‑ready KYC pipeline that enforces a strict state machine, validates file uploads on the server, presents a reviewer queue with SLA flags, logs all state changes as notifications, and keeps merchant data isolated with role‑based permissions.

---

## 1. The State Machine

**Location in code:**  
`backend/kyc/state_machine.py`

**How illegal transitions are prevented:**  
Every endpoint that changes a submission’s state first calls `can_transition(current_state, target_state)`.  
If the transition is not allowed, the API returns `400 Bad Request` with a clear error message – for example, trying to move from `approved` to `draft`.

**Supported transitions:**  
`draft → submitted → under_review → approved/rejected`  
and `under_review → more_info_requested → submitted`.  
All other combinations are rejected.

---

## 2. File Upload Validation

**Validation lives in:**  
- `backend/kyc/serializers.py` – `DocumentSerializer.validate_file()`  
- `backend/kyc/utils.py` – helper function `validate_upload()`

**Server‑side rules (nothing is trusted from the client):**  
- MIME type must be one of: `application/pdf`, `image/jpeg`, `image/png`  
- File extension must be `.pdf`, `.jpg`, `.jpeg`, or `.png`  
- File size must not exceed **5 MB**

**What happens when someone sends a 50 MB file?**  
- Django’s built‑in settings (`DATA_UPLOAD_MAX_MEMORY_SIZE`, `FILE_UPLOAD_MAX_MEMORY_SIZE`) reject the request early if it exceeds memory limits.  
- Even if that limit were raised, the serializer validation explicitly checks the size and returns a `400` response with the message: `"File size cannot exceed 5MB."`

---

## 3. The Reviewer Queue & SLA Flag

**Queue ordering:**  
Reviewers see submissions in the order they were submitted – oldest first.  
The frontend calls `GET /api/v1/submissions/?ordering=submitted_at` to get this list.

**SLA flag (24‑hour rule):**  
A submission is flagged as **“at risk”** if it has been in `submitted` state for more than 24 hours.  
The flag is computed **dynamically** using a model property `is_at_risk` that checks `submitted_at` against the current time.  
We do **not** store a stale boolean – the value is always correct at the moment the reviewer loads the dashboard.

---

## 4. Authentication & Isolation (Merchant A cannot see Merchant B)

**Permission logic lives in:**  
`backend/kyc/permissions.py` – class `IsOwnerOrAdmin`

**How it works:**  
- **Admin users** (role = `admin`) can access every submission.  
- **Merchants** (role = `merchant`) can only access submissions where `submission.user == request.user`.  
- The permission class is applied to all `KYCSubmission` viewset actions, so any attempt to fetch, update, or delete another merchant’s data returns a `403 Forbidden`.

No extra code or manual checks are needed – the permission class is the single source of truth for object‑level access control.

---

## 5. AI Audit – One Concrete Bug I Caught

**What the AI suggested:**  
While writing the state machine, the AI generated a transition table that allowed moving directly from `submitted` to `approved` (skipping `under_review`). It also allowed `approved → draft` because it forgot to make `approved` a terminal state.

**What was wrong:**  
The challenge requires a strict pipeline:  
`submitted → under_review → approved/rejected`.  
Skipping `under_review` would break the reviewer queue logic.  
Also, `approved` should be final – no further changes allowed.

**What I fixed:**  
I rewrote the `ALLOWED_TRANSITIONS` dictionary in `state_machine.py` to exactly match the required flow:  
- `submitted` can only go to `under_review`  
- `approved` has an empty list of allowed targets  
- `draft` can only go to `submitted`

Then I added a unit test that tries every illegal transition and verifies that `can_transition()` returns `False` – this caught another AI mistake where `more_info_requested` was incorrectly allowed to go directly to `approved`.

---

> **Why this matters for Playto:**  
> The state machine, file validation, queue ordering, SLA tracking, and auth isolation are the **exact real‑world concerns** that your KYC reviewers face every day. By implementing these correctly – and being honest about where AI helped and where I overrode it – I’ve shown that I can ship robust, explainable code.
