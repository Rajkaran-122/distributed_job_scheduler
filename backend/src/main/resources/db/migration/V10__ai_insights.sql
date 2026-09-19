-- V10: AI-generated insights, cached so repeated dashboard views don't re-call the LLM.
CREATE TABLE ai_insights (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_id              UUID REFERENCES jobs(id) ON DELETE CASCADE,
    insight_type        VARCHAR(50) NOT NULL
        CHECK (insight_type IN (
            'FAILURE_EXPLANATION', 'RETRY_RECOMMENDATION', 'ANOMALY_DETECTION',
            'ROOT_CAUSE_ANALYSIS', 'EXECUTION_SUMMARY', 'CONCURRENCY_SUGGESTION',
            'WORKER_OVERLOAD_PREDICTION', 'QUEUE_CONGESTION_PREDICTION'
        )),
    input_fingerprint   VARCHAR(64) NOT NULL,   -- hash of the input context, used as the cache key
    generated_text       TEXT NOT NULL,
    model_used            VARCHAR(100),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at             TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);
CREATE INDEX idx_ai_insights_job ON ai_insights (job_id, insight_type) WHERE job_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ai_insights_fingerprint ON ai_insights (insight_type, input_fingerprint);
CREATE INDEX idx_ai_insights_expiry ON ai_insights (expires_at);
COMMENT ON TABLE ai_insights IS 'LLM responses are cached by a fingerprint of their input (e.g. hash of error message + job config) so identical failures across many jobs do not each trigger a separate LLM call.';
