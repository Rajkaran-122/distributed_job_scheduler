-- V2: Multi-tenancy core: organizations, users, memberships, teams
--
-- Design decision: organizations and users use UUID primary keys because they are
-- tenant-facing identifiers exposed in URLs and JWT claims. Sequential BIGINT ids here
-- would leak organization/user counts and enable trivial enumeration attacks.
-- High-volume child tables (job_executions, audit_logs) use BIGINT instead -- see V6/V9.

CREATE TABLE organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(100) NOT NULL UNIQUE,
    plan                VARCHAR(50) NOT NULL DEFAULT 'FREE',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,             -- soft delete: preserves FK history for audit/billing
    CONSTRAINT chk_org_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);
COMMENT ON TABLE organizations IS 'Tenant boundary. Every job, queue, and API key belongs to exactly one organization.';
COMMENT ON COLUMN organizations.deleted_at IS 'Soft delete only. Never hard-delete a tenant: audit logs and past executions must remain queryable for compliance.';

-- NOTE: email is a plain VARCHAR, not CITEXT. CITEXT's JDBC-reported type name doesn't
-- match Hibernate's expected varchar(255) for a plain String field (same class of
-- validation mismatch as an enum-backed DOMAIN column -- see V1 note). Case-insensitive
-- lookups are handled at the query layer instead (UserRepository.findByEmailIgnoreCase*,
-- which Spring Data renders as a LOWER()-based comparison), so no DB-level extension is
-- needed for that behavior.
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(255) NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_users_email ON users (LOWER(email)) WHERE deleted_at IS NULL;
COMMENT ON TABLE users IS 'A user can belong to multiple organizations via org_memberships (e.g. a contractor working with several client orgs).';
COMMENT ON INDEX uq_users_email IS 'Case-insensitive uniqueness via LOWER(email), replacing the CITEXT column type previously used for this.';

-- Many-to-many: users <-> organizations, with a role scoped to that membership.
-- A user''s role is NOT a global attribute of the user -- it is per-organization,
-- which is what makes multi-tenant RBAC actually work (Alice can be OWNER of org A
-- and VIEWER of org B simultaneously).
CREATE TABLE org_memberships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role                VARCHAR(20) NOT NULL DEFAULT 'VIEWER'
                          CHECK (role IN ('OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER')),
    invited_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, user_id)
);
CREATE INDEX idx_org_memberships_user ON org_memberships (user_id);
CREATE INDEX idx_org_memberships_org_role ON org_memberships (organization_id, role);
COMMENT ON TABLE org_memberships IS 'Join table driving RBAC. ON DELETE CASCADE: removing an org or user removes membership rows, never the other entity.';

CREATE TABLE teams (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, name)
);
CREATE INDEX idx_teams_org ON teams (organization_id);

CREATE TABLE team_members (
    team_id             UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (team_id, user_id)
);

-- Refresh tokens: stored server-side (not just signed and trusted) so a token can be
-- revoked immediately on logout/password-change -- a pure-JWT refresh flow with no
-- server-side record cannot be revoked before expiry.
CREATE TABLE refresh_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          VARCHAR(255) NOT NULL UNIQUE,   -- SHA-256 of the token; never store raw tokens
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    replaced_by_token_id UUID REFERENCES refresh_tokens(id)
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
