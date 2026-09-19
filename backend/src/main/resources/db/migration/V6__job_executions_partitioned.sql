-- V6: job_executions -- one row per execution ATTEMPT (not per job). This is the
-- highest-write-volume table in the system, so it is RANGE partitioned by created_at
-- (monthly). Why range-by-time over hash-by-tenant: the dominant query pattern here is
-- time-bounded (dashboards, analytics, retention), so partition pruning on created_at
-- benefits nearly every query. It also makes retention trivial: dropping a 13-month-old
-- partition is an instant metadata operation vs a slow row-by-row DELETE.
--
-- Partitioned tables require the partition key to be part of the primary key, hence the
-- composite PK (id, created_at) rather than a bare id PK.

CREATE TABLE job_executions (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY,
    job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,  -- denormalized for query/index convenience
    attempt_number      INT NOT NULL,
    worker_id           UUID REFERENCES workers(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'CLAIMED'
                          CHECK (status IN ('CLAIMED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT', 'LEASE_EXPIRED')),

    -- Idempotency key for this specific attempt (default: job_id + attempt_number).
    -- Checked-and-inserted in the SAME transaction as the claim, so two workers can never
    -- both believe they own attempt N of a given job.
    idempotency_key     VARCHAR(255) NOT NULL,

    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    duration_ms         INT,
    error_message       TEXT,
    error_stacktrace    TEXT,
    output              JSONB,
    correlation_id      VARCHAR(64),                 -- ties this execution back to distributed traces/logs

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE job_executions IS 'One row per execution attempt. Partitioned monthly by created_at; retention is enforced by dropping old partitions, not deleting rows.';
COMMENT ON COLUMN job_executions.idempotency_key IS 'Unique per (job_id, attempt_number). Enforced via uq_job_executions_idempotency below.';

-- Indexes defined on the parent propagate automatically to all existing AND future
-- partitions (PostgreSQL 11+), so new monthly partitions never need index maintenance.
CREATE INDEX idx_job_executions_job ON job_executions (job_id, attempt_number);
CREATE INDEX idx_job_executions_org_status ON job_executions (organization_id, status, created_at DESC);
CREATE INDEX idx_job_executions_worker ON job_executions (worker_id) WHERE worker_id IS NOT NULL;
CREATE UNIQUE INDEX uq_job_executions_idempotency ON job_executions (job_id, idempotency_key, created_at);

-- === Partition management ===
-- Create partitions for the trailing month, current month, and 3 months ahead.
-- In production this range is maintained by a scheduled maintenance job (or pg_partman)
-- that runs monthly to create the next partition and drop/archive ones past the
-- retention window (see docs/deployment-guide.md -> "Partition maintenance").
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
        partition_name := 'job_executions_' || to_char(partition_start, 'YYYY_MM');

        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF job_executions FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_start, partition_end
        );
    END LOOP;
END $$;

-- Catch-all default partition so an unexpected out-of-range created_at (e.g. clock skew,
-- or the maintenance job falling behind) never causes an INSERT to fail outright.
-- It should always be empty in steady state -- monitor row count as an alert signal.
CREATE TABLE job_executions_default PARTITION OF job_executions DEFAULT;
