import hmac
import hashlib

SECRET_KEY = "cortex_copilot_secret_key_98765!"

def generate_token(tenant_id: str) -> str:
    """Generates a cryptographically signed token containing the tenant ID."""
    signature = hmac.new(SECRET_KEY.encode(), tenant_id.encode(), hashlib.sha256).hexdigest()
    return f"{tenant_id}.{signature}"

def verify_token(token: str) -> str:
    """Verifies the cryptographically signed token and returns the tenant ID if valid, else None."""
    if not token:
        return None
    try:
        # Strip Bearer prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        tenant_id, signature = token.split(".")
        expected = hmac.new(SECRET_KEY.encode(), tenant_id.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(signature, expected):
            return tenant_id
    except Exception:
        pass
    return None
