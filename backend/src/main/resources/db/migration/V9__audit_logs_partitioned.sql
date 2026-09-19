-- V9: Audit logs -- who did what, when. Same partitioning rationale as job_executions:
-- high write volume, dominant query pattern is time-bounded, retention via partition drop.
CREATE TABLE audit_logs (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_api_key_id     UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    action               VARCHAR(100) NOT NULL,       -- e.g. 'job.created', 'job.cancelled', 'api_key.revoked'
    resource_type        VARCHAR(50) NOT NULL,
    resource_id          UUID,
    changes              JSONB,                        -- before/after diff where applicable
    -- Plain VARCHAR rather than INET: Hibernate has no first-class inet JDBC type, so an
    -- inet column reports its JDBC type name as "inet" during schema validation, which
    -- never matches the varchar(n) a String-typed field expects (same class of mismatch
    -- as the CITEXT/DOMAIN issues fixed in V1/V2). 45 chars is enough for the longest
    -- possible textual IPv6 representation (including embedded IPv4 / zone id forms).
    ip_address            VARCHAR(45),
    correlation_id        VARCHAR(64),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_audit_logs_org_created ON audit_logs (organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
COMMENT ON TABLE audit_logs IS 'Populated via an application-event listener (AOP around service methods), not called directly by business logic -- keeps audit logging a cross-cutting concern per the module boundaries.';
COMMENT ON COLUMN audit_logs.actor_api_key_id IS 'Set instead of actor_user_id when the action was performed via API key rather than a logged-in user session.';

DO $$
DECLARE
    start_month date := date_trunc('month', now())::date - INTERVAL '1 month';
    i integer;
    partition_start date;
    partition_end date;
    partition_name text;
BEGIN
    FOR i IN 0..4 LOOP
        partition_start := start_month + (i || ' months')::interval;
        partition_end := start_month + ((i + 1) || ' months')::interval;
        partition_name := 'audit_logs_' || to_char(partition_start, 'YYYY_MM');

        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_start, partition_end
        );
    END LOOP;
END $$;

CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;
