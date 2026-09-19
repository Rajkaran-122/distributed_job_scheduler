-- V3: API keys
--
-- Only the SHA-256 hash of the key is stored (never the plaintext) -- identical to how
-- Stripe and GitHub store personal access tokens. The plaintext is shown to the user
-- exactly once at creation time. `key_prefix` (first 8 chars) is stored separately,
-- unhashed, purely so the UI can display "sk_live_a1b2c3d4...." for identification
-- without ever re-exposing the secret.
CREATE TABLE api_keys (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    name                VARCHAR(255) NOT NULL,
    key_prefix          VARCHAR(16) NOT NULL,
    key_hash            VARCHAR(255) NOT NULL UNIQUE,
    scopes              TEXT[] NOT NULL DEFAULT ARRAY['jobs:read', 'jobs:write'],
    last_used_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_keys_org ON api_keys (organization_id) WHERE revoked_at IS NULL;
-- Lookup path on every authenticated API request: hash the incoming key, look up by hash.
CREATE INDEX idx_api_keys_hash_active ON api_keys (key_hash) WHERE revoked_at IS NULL;
COMMENT ON TABLE api_keys IS 'Programmatic access credentials. Revocation is immediate: application-layer cache on key_hash must be invalidated synchronously on revoke, never left to TTL expiry.';
COMMENT ON COLUMN api_keys.scopes IS 'Coarse-grained scopes, e.g. jobs:read, jobs:write, jobs:admin, webhooks:manage.';
