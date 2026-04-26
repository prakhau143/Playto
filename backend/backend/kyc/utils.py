from __future__ import annotations

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}

MAX_FILE_BYTES = 5 * 1024 * 1024  # 5MB


def validate_upload(file_obj) -> None:
    content_type = getattr(file_obj, "content_type", None)
    size = getattr(file_obj, "size", None)
    name = (getattr(file_obj, "name", "") or "").lower()

    if content_type not in ALLOWED_MIME_TYPES:
        raise ValueError("Only PDF, JPG, PNG files are allowed.")
    if not (
        name.endswith(".pdf")
        or name.endswith(".png")
        or name.endswith(".jpg")
        or name.endswith(".jpeg")
    ):
        raise ValueError("Invalid file extension. Only .pdf/.jpg/.jpeg/.png allowed.")
    if size is not None and size > MAX_FILE_BYTES:
        raise ValueError("File size cannot exceed 5MB.")

