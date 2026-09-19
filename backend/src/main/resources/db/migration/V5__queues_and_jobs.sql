-- V5: Queues and jobs -- the core scheduling entities.

CREATE TABLE queues (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                    VARCHAR(100) NOT NULL,
    description             VARCHAR(500),
    state                   VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                              CHECK (state IN ('ACTIVE', 'PAUSED')),
    max_concurrency         INT NOT NULL DEFAULT 10 CHECK (max_concurrency > 0),
    rate_limit_per_minute   INT CHECK (rate_limit_per_minute IS NULL OR rate_limit_per_minute > 0),
    default_priority        SMALLINT NOT NULL DEFAULT 5 CHECK (default_priority BETWEEN 1 AND 10),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, name)
);
CREATE INDEX idx_queues_org ON queues (organization_id);
COMMENT ON TABLE queues IS 'A named lane for jobs. Pausing a queue stops the dispatcher from claiming new jobs from it without touching in-flight executions.';
COMMENT ON COLUMN queues.default_priority IS '1 = highest priority, 10 = lowest. Applied to jobs that do not specify their own priority.';

CREATE TRIGGER trg_queues_updated_at BEFORE UPDATE ON queues
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE jobs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_id            UUID NOT NULL REFERENCES queues(id) ON DELETE RESTRICT,
    team_id             UUID REFERENCES teams(id) ON DELETE SET NULL,

    name                VARCHAR(255) NOT NULL,
    handler_type        VARCHAR(255) NOT NULL,       -- maps to a registered JobHandler bean, e.g. "send-invoice-email"
    job_type            VARCHAR(20) NOT NULL
                          CHECK (job_type IN ('ONE_OFF', 'DELAYED', 'CRON', 'EVENT')),
    payload             JSONB NOT NULL DEFAULT '{}',

    -- Scheduling fields: interpretation depends on job_type
    cron_expression     VARCHAR(120),                 -- required when job_type = CRON
    timezone             VARCHAR(64) NOT NULL DEFAULT 'UTC',
    run_at              TIMESTAMPTZ,                  -- required when job_type IN (ONE_OFF, DELAYED)
    next_run_at         TIMESTAMPTZ NOT NULL,          -- the single field the dispatcher actually polls on

    priority            SMALLINT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING', 'SCHEDULED', 'RUNNING', 'SUCCEEDED', 'FAILED',
                                             'RETRYING', 'DEAD_LETTERED', 'CANCELLED', 'PAUSED')),

    -- Retry policy (per-job override of queue/system defaults)
    max_retries          INT NOT NULL DEFAULT 5 CHECK (max_retries >= 0),
    backoff_strategy     VARCHAR(20) NOT NULL DEFAULT 'EXPONENTIAL_JITTER'
                          CHECK (backoff_strategy IN ('FIXED', 'LINEAR', 'EXPONENTIAL', 'EXPONENTIAL_JITTER')),
    base_delay_seconds   INT NOT NULL DEFAULT 2 CHECK (base_delay_seconds > 0),
    max_delay_seconds    INT NOT NULL DEFAULT 3600 CHECK (max_delay_seconds >= base_delay_seconds),
    timeout_seconds       INT NOT NULL DEFAULT 300 CHECK (timeout_seconds > 0),
    attempt_count         INT NOT NULL DEFAULT 0,

    -- Idempotency / uniqueness at the job-definition level (distinct from the execution_ledger
    -- idempotency check in V7, which guards a single attempt from double-processing).
    -- unique_key lets a caller say "only one instance of this logical job may be
    -- pending/running at a time" -- e.g. "nightly-report-for-tenant-42".
    unique_key           VARCHAR(255),

    -- Lease-based ownership (see architecture decision: lease lives on the job row itself)
    locked_by            UUID REFERENCES workers(id) ON DELETE SET NULL,
    locked_until         TIMESTAMPTZ,

    last_error            TEXT,
    is_paused            BOOLEAN NOT NULL DEFAULT FALSE,   -- pause an individual job without pausing the whole queue

    created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
    version               INT NOT NULL DEFAULT 0,            -- optimistic lock: concurrent edits to job config (NOT used for claiming)

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,

    CONSTRAINT chk_cron_requires_expression
        CHECK (job_type != 'CRON' OR cron_expression IS NOT NULL),
    CONSTRAINT chk_oneoff_delayed_requires_run_at
        CHECK (job_type NOT IN ('ONE_OFF', 'DELAYED') OR run_at IS NOT NULL)
);

-- === Indexing strategy ===

-- The single most important index in the schema: this is what the dispatcher's
-- `SELECT ... FOR UPDATE SKIP LOCKED` query hits on every poll cycle. It is a PARTIAL
-- index (WHERE status='PENDING') so its size is proportional to the *ready-to-run*
-- backlog, not the entire jobs table -- at 10M jobs/day with millions of historical
-- rows, this keeps claim queries fast indefinitely since old completed jobs never
-- bloat this index.
CREATE INDEX idx_jobs_claimable ON jobs (queue_id, priority, next_run_at)
    WHERE status = 'PENDING' AND deleted_at IS NULL;

-- Reaper's lease-expiry scan: also partial, proportional only to currently RUNNING jobs.
CREATE INDEX idx_jobs_lease_expiry ON jobs (locked_until)
    WHERE status = 'RUNNING';

-- Dashboard / analytics: filter by org + status, sorted by recency.
CREATE INDEX idx_jobs_org_status_created ON jobs (organization_id, status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_jobs_queue ON jobs (queue_id) WHERE deleted_at IS NULL;

-- Global search (job name, fuzzy match) -- pg_trgm-backed for ILIKE '%term%' performance.
CREATE INDEX idx_jobs_name_trgm ON jobs USING gin (name gin_trgm_ops);

-- Job-level mutual exclusion: only one PENDING/SCHEDULED/RUNNING job with a given
-- unique_key may exist per organization at a time.
CREATE UNIQUE INDEX uq_jobs_unique_key_active ON jobs (organization_id, unique_key)
    WHERE unique_key IS NOT NULL AND status IN ('PENDING', 'SCHEDULED', 'RUNNING');

CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN jobs.next_run_at IS 'Denormalized dispatch target so the claim query never has to branch on job_type. For CRON jobs this is recomputed to the next fire time after each successful dispatch.';
COMMENT ON COLUMN jobs.locked_until IS 'Lease expiry. NULL unless status=RUNNING. The reaper reclaims any RUNNING job whose lease has lapsed.';
COMMENT ON COLUMN jobs.version IS 'Optimistic lock for human/API edits to job configuration (JPA @Version). Unrelated to the SKIP LOCKED claiming mechanism.';
