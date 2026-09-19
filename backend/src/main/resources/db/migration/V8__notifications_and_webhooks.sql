-- V8: Outbound notifications -- webhooks, email, Slack alerts.

CREATE TABLE webhook_endpoints (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    url                 TEXT NOT NULL,
    secret              VARCHAR(255) NOT NULL,      -- HMAC signing secret for payload verification (Stripe-style X-Signature header)
    subscribed_events   TEXT[] NOT NULL DEFAULT ARRAY['job.failed', 'job.dead_lettered'],
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_endpoints_org ON webhook_endpoints (organization_id) WHERE is_active;

CREATE TABLE webhook_deliveries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type          VARCHAR(100) NOT NULL,
    payload             JSONB NOT NULL,
    response_status     INT,
    attempt_count        INT NOT NULL DEFAULT 0,
    delivered_at         TIMESTAMPTZ,
    next_retry_at        TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_deliveries_pending ON webhook_deliveries (next_retry_at)
    WHERE delivered_at IS NULL;
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts get their own at-least-once retry loop, independent of the job retry engine -- a webhook failing to deliver must never affect the job it is reporting on.';

CREATE TABLE notification_channels (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_type        VARCHAR(20) NOT NULL
                          CHECK (channel_type IN ('EMAIL', 'SLACK', 'WEBHOOK')),
    config              JSONB NOT NULL,             -- {"email": "..."} or {"slack_webhook_url": "..."}
    subscribed_events   TEXT[] NOT NULL DEFAULT ARRAY['job.dead_lettered'],
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_channels_org ON notification_channels (organization_id) WHERE is_active;
COMMENT ON TABLE notification_channels IS 'Email/Slack alert destinations. Delivery uses the Strategy pattern in the notification module: one NotificationSender implementation per channel_type.';
