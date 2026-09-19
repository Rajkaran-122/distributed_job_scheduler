-- V7: Dead letter queue
--
-- A job is dead-lettered when it exhausts max_retries (or is manually killed). We keep a
-- dedicated table rather than only relying on jobs.status = 'DEAD_LETTERED' because:
--  1. It snapshots the failing payload/error at the moment of dead-lettering, which
--     stays stable even if the parent job is later edited or soft-deleted.
--  2. It gives the dashboard's "Dead Letter Queue" view a purpose-built table to query
--     and paginate without a WHERE status = ... scan across the whole jobs table.
--  3. Requeue-from-DLQ is a first-class action (resolved_at / resolution) that shouldn't
--     be conflated with the job's own status history.
CREATE TABLE dead_letter_jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_id            UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    final_attempt_number INT NOT NULL,
    payload_snapshot    JSONB NOT NULL,
    last_error_message  TEXT,
    last_error_stacktrace TEXT,
    dead_lettered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ,
    resolution          VARCHAR(20) CHECK (resolution IN ('REQUEUED', 'DISCARDED', 'IGNORED')),
    resolved_by         UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_dlq_org_unresolved ON dead_letter_jobs (organization_id, dead_lettered_at DESC)
    WHERE resolved_at IS NULL;
CREATE INDEX idx_dlq_job ON dead_letter_jobs (job_id);
COMMENT ON TABLE dead_letter_jobs IS 'Terminal home for jobs that exhausted retries. Requeue creates a fresh job row (via the service layer) rather than mutating this snapshot, keeping the DLQ record immutable as an audit trail.';

-- Job-level unique-execution lock (Redis-first in the hot path, but also recorded here
-- for observability of "which jobs are configured with mutual exclusion" -- not consulted
-- for correctness).
CREATE TABLE job_locks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    lock_key            VARCHAR(255) NOT NULL,
    holder_worker_id    UUID REFERENCES workers(id) ON DELETE SET NULL,
    acquired_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX uq_job_locks_key ON job_locks (lock_key);
COMMENT ON TABLE job_locks IS 'Mirror of the Redis distributed lock used for job-level mutual exclusion (SET NX PX). Redis is authoritative for the live lock; this table is for dashboard visibility and post-incident debugging.';
