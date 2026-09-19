-- V11: Seed data for local development / docker-compose quick start only.
-- Password for the seeded admin is "ChangeMe123!" (BCrypt hash below) -- rotate immediately
-- in any environment beyond a laptop demo.
--
-- Idempotency note: every INSERT here uses `WHERE NOT EXISTS (...)` rather than
-- `ON CONFLICT (...) DO NOTHING`. That's a deliberate choice, not just a style
-- preference: uq_users_email (see V2) is a PARTIAL, expression-based unique index
-- (`UNIQUE (LOWER(email)) WHERE deleted_at IS NULL`), and Postgres will only let
-- ON CONFLICT target a constraint/index whose definition -- expression and predicate
-- included -- matches exactly. A plain `ON CONFLICT (email)` has no matching arbiter
-- and fails with "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification". WHERE NOT EXISTS has no such restriction: it works identically
-- against partial indexes, expression indexes, or plain multi-column UNIQUE
-- constraints, so every statement below uses the same pattern regardless of which
-- kind of constraint the target table actually has.

INSERT INTO organizations (id, name, slug, plan)
SELECT '00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo-org', 'PRO'
WHERE NOT EXISTS (
    SELECT 1 FROM organizations WHERE slug = 'demo-org'
);

-- BCrypt hash of "ChangeMe123!"
INSERT INTO users (id, email, password_hash, full_name, email_verified_at)
SELECT
    '00000000-0000-0000-0000-000000000002',
    'admin@demo.local',
    '$2a$12$8ZoU5aWJ0h1DkFhO6y0lWuU2fk1jvBb4Q0aiC3.qkQAKr9dCgH1Cu',
    'Demo Admin',
    now()
WHERE NOT EXISTS (
    -- Mirrors uq_users_email's own predicate (deleted_at IS NULL) so this stays
    -- correct if the demo user is ever soft-deleted and needs to be reseeded.
    SELECT 1 FROM users WHERE email = 'admin@demo.local' AND deleted_at IS NULL
);

INSERT INTO org_memberships (organization_id, user_id, role)
SELECT
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'OWNER'
WHERE NOT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE organization_id = '00000000-0000-0000-0000-000000000001'
      AND user_id = '00000000-0000-0000-0000-000000000002'
);

-- Multi-row insert: each row is checked independently against its own
-- (organization_id, name) pair, so a partial reseed (e.g. only "reports" missing)
-- inserts just the missing row instead of skipping or duplicating the others.
INSERT INTO queues (id, organization_id, name, description, max_concurrency, default_priority)
SELECT v.id, v.organization_id, v.name, v.description, v.max_concurrency, v.default_priority
FROM (
    VALUES
        ('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
         'default', 'Default queue for unclassified jobs', 20, 5),
        ('00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
         'critical', 'High-priority, low-latency jobs', 10, 1),
        ('00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
         'reports', 'Batch/analytics jobs, tolerant of delay', 5, 8)
) AS v(id, organization_id, name, description, max_concurrency, default_priority)
WHERE NOT EXISTS (
    SELECT 1 FROM queues q
    WHERE q.organization_id = v.organization_id
      AND q.name = v.name
);
