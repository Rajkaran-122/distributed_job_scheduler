# Job Scheduler Platform

A production-grade distributed job scheduling backend built with Spring Boot 3 / Java 21,
PostgreSQL, and Redis. Implements atomic job claiming via `SELECT ... FOR UPDATE SKIP LOCKED`,
lease-based worker crash recovery, exponential-jitter retries, a dead letter queue,
multi-tenant RBAC, API keys, notifications, and cache-backed AI insights.

## What's actually included vs. stubbed

**Fully implemented and runnable:**
- Backend: entities, repositories, security (JWT + API keys + RBAC), scheduler (leader
  election, SKIP LOCKED claiming, cron), worker runtime (BLPOP consumer, lease renewal,
  graceful shutdown), retry engine, dead letter queue, notification module
  (Email/Slack/Webhook), AI insights module, REST API (jobs, queues, DLQ, API keys,
  analytics, workers, audit logs, organization), WebSocket live updates, unit +
  Testcontainers integration tests.
- Frontend: React 18 + TypeScript + Vite + Tailwind, hand-built Radix-based component
  primitives (shadcn/ui-style), dark/light theme, JWT auth with silent refresh,
  React Query data layer, STOMP/SockJS live job feed, Recharts throughput chart.
  Pages: login/register, dashboard overview, jobs (list/create/detail with AI insight
  actions), queues (create/pause/resume), worker fleet monitoring, dead letter queue
  (requeue/discard), AI insights explorer, audit log viewer, API key management,
  organization profile.
- Database: 11 Flyway migrations (multi-tenant schema, partitioned `job_executions` and
  `audit_logs`, full indexing strategy).
- Infra: `docker-compose.yml` (Postgres, Redis, backend, frontend, Nginx gateway,
  Prometheus, Grafana) -- `docker compose up` builds and starts everything, no profile flag needed.

**Not built out yet:**
- `.github/` -- no CI workflow yet.
- `docs/` -- architecture diagrams/decision docs discussed earlier in this project were
  not yet written to disk.
- Dashboard throughput chart uses illustrative data (no `/analytics/throughput` time-series
  endpoint exists yet on the backend) -- everything else on the dashboard is live data.

## Running it

```bash
cp .env.example .env
# edit .env: set DB_PASSWORD and JWT_SECRET (32+ chars -- openssl rand -base64 48 works well)

docker compose up -d --build
docker compose logs -f backend   # wait for "Started JobSchedulerPlatformApplication"
```

Then open **http://localhost** — the React dashboard, served through the Nginx gateway.

- Dashboard: http://localhost
- Swagger UI: http://localhost/swagger-ui.html
- API directly: http://localhost:8080/api/v1
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (`admin` / your `GRAFANA_ADMIN_PASSWORD`)

Sign in with the seeded demo admin (`admin@demo.local` / `ChangeMe123!`) or register a
new organization from the login screen.

A demo organization and admin user are seeded by `V11__seed_dev_data.sql`
(`admin@demo.local` / `ChangeMe123!` -- rotate immediately outside local dev).

### Try it

```bash
# Log in as the seeded admin
curl -X POST localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{
  "email":"admin@demo.local","password":"ChangeMe123!"}'

# Create a job on the seeded "default" queue (use the accessToken from above)
curl -X POST localhost:8080/api/v1/jobs -H "Authorization: Bearer <accessToken>" \
  -H 'Content-Type: application/json' -d '{
  "name":"demo-job","queueId":"00000000-0000-0000-0000-000000000010",
  "handlerType":"noop","jobType":"ONE_OFF","runAt":"2026-01-01T00:00:00Z"}'
```

## Architecture notes worth reading

- `JobRepository.findClaimableJobs` -- the SKIP LOCKED claim query and why it beats
  optimistic locking / plain FOR UPDATE / a Redis-only claim queue.
- `Job` entity -- every status transition lives in one place (`markRunning`,
  `markRetrying`, `markDeadLettered`, `reclaimExpiredLease`) so invariants can't drift.
- `RetryPolicyCalculator` -- pure, framework-free; explains why EXPONENTIAL_JITTER is
  the default over FIXED/LINEAR/EXPONENTIAL (thundering-herd avoidance).
- `JobDispatchService` -- claims inside a transaction but only pushes to Redis
  `afterCommit`, so Postgres and Redis can never disagree about what's been dispatched.
- `DispatcherLeaderElector` / `LeaseReaperService` -- how multi-replica deployments avoid
  double-dispatch and how crashed workers' jobs get reclaimed.

## Running tests

```bash
cd backend
mvn test                 # unit tests (no Docker needed)
mvn verify                # includes Testcontainers integration tests (needs Docker running)
```

`JobClaimingConcurrencyTest` is the one worth reading first -- it proves SKIP LOCKED
actually prevents double-claiming under concurrent load against a real Postgres instance.
