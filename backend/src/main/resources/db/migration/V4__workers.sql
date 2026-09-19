-- V4: Workers
--
-- Created before `jobs` because jobs.locked_by references workers.id (the lease owner).
-- This table is observability-oriented (dashboard: worker health, last seen, uptime) --
-- it is NOT the correctness mechanism for job ownership. Correctness comes from the
-- lease columns on `jobs` itself (locked_by + locked_until), decided so ownership and
-- expiry always live in the same row/transaction as the job they protect.
CREATE TABLE workers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = shared/global worker pool
    hostname            VARCHAR(255) NOT NULL,
    pid                 INTEGER,
    version             VARCHAR(50),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                          CHECK (status IN ('ACTIVE', 'DRAINING', 'DEAD')),
    queues              TEXT[] NOT NULL DEFAULT '{}',   -- which queue names this worker consumes from
    max_concurrency     INT NOT NULL DEFAULT 10,
    current_load        INT NOT NULL DEFAULT 0,
    last_heartbeat_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    registered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deregistered_at     TIMESTAMPTZ
);
CREATE INDEX idx_workers_status ON workers (status);
CREATE INDEX idx_workers_heartbeat ON workers (last_heartbeat_at) WHERE status = 'ACTIVE';
COMMENT ON TABLE workers IS 'Worker fleet registry for dashboard/observability. Auto-registers on boot, auto-deregisters on graceful shutdown (SIGTERM) or is marked DEAD by the reaper after missed heartbeats.';
