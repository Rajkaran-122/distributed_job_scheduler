# Distributed Job Scheduler

A production-grade distributed job scheduling platform built with Spring Boot 3, Java 21, PostgreSQL, Redis, React 18, TypeScript, Nginx, Prometheus, and Grafana.

The platform provides durable job scheduling, atomic distributed claiming, Redis-backed dispatch, worker lease recovery, retry policies with jitter, dead-letter handling, multi-tenant RBAC, API keys, notifications, AI insights, REST APIs, WebSockets, and operational monitoring.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [System Architecture](#system-architecture)
  - [Job Lifecycle](#job-lifecycle)
  - [Low-Level Backend Design](#low-level-backend-design)
  - [End-to-End Request Flow](#end-to-end-request-flow)
  - [Worker Crash Recovery](#worker-crash-recovery)
  - [Retry and Dead-Letter Flow](#retry-and-dead-letter-flow)
  - [Leader Election](#leader-election)
  - [Observability Flow](#observability-flow)
- [Core Design Decisions](#core-design-decisions)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [API Example](#api-example)
- [Testing](#testing)
- [Architecture Documentation](#architecture-documentation)

## Overview

The scheduler separates API traffic, durable persistence, job dispatch, queue delivery, and worker execution.

The primary execution path is:

`Client -> Nginx -> Spring Boot -> PostgreSQL -> Redis -> Worker -> PostgreSQL`

PostgreSQL is the durable source of truth. Redis is used for fast queue delivery, distributed coordination, leases, heartbeats, and Pub/Sub.

## Architecture

### System Architecture

The high-level architecture shows how the browser, gateway, frontend, backend, database, Redis, and observability stack interact.

```mermaid
graph TD
    Client[Web Browser Client] -->|HTTPS / WSS| Nginx[Nginx API Gateway]

    subgraph Application["Application Layer"]
        Nginx -->|REST / WebSocket| Backend[Spring Boot Backend]
        Frontend[React 18 + TypeScript] -.->|Static Assets| Nginx
    end

    subgraph Data["Data Layer"]
        Backend -->|JDBC / JPA| PostgreSQL[(PostgreSQL)]
        Backend -->|Lettuce / PubSub| Redis[(Redis)]
    end

    subgraph Monitoring["Infrastructure / Monitoring"]
        Prometheus[Prometheus]
        Grafana[Grafana]
        Prometheus -.->|Scrapes Metrics| Nginx
        Prometheus -.->|Scrapes Metrics| Backend
        Grafana -->|Queries| Prometheus
    end

    PostgreSQL -.->|Durable Jobs, Tenants, RBAC, Audit Data| Backend
    Redis -.->|Locks, Queues, Leases, Pub/Sub| Backend
```

### Architecture Components

| Component | Responsibility |
|---|---|
| React Frontend | Job creation, job monitoring, queue management, worker monitoring, analytics, AI insights and administration |
| Nginx | Reverse proxy, frontend serving, REST routing and WebSocket routing |
| Spring Boot Backend | Authentication, authorization, scheduling, dispatching, retries, worker coordination and APIs |
| PostgreSQL | Durable storage for jobs, executions, tenants, queues, workers, audit logs and RBAC |
| Redis | Queue delivery, leader election, distributed locks, leases, heartbeats and Pub/Sub |
| Worker Runtime | Consumes jobs, loads job data, executes handlers, renews leases and reports results |
| Prometheus | Metrics collection |
| Grafana | Operational dashboards and monitoring |

### Job Lifecycle

This is the complete lifecycle of a job from creation to completion, retry, dead-lettering, or crash recovery.

```mermaid
stateDiagram-v2
    [*] --> PENDING : POST /api/v1/jobs

    state "Job Dispatch Service (Leader)" as Dispatch
    PENDING --> Dispatch : Claim due job

    Dispatch --> QUEUED : DB commit then Redis enqueue

    state "Worker Runtime" as Worker
    QUEUED --> RUNNING : Worker BLPOP

    state RUNNING {
        [*] --> Executing
        Executing --> Heartbeat : Renew lease
        Heartbeat --> Executing
    }

    RUNNING --> COMPLETED : Handler success
    COMPLETED --> [*]

    RUNNING --> RETRY_EVALUATION : Handler failure

    state "Retry Policy Calculator" as RetryEval
    RETRY_EVALUATION --> RetryEval

    RetryEval --> PENDING : Attempts < max
    RetryEval --> DEAD_LETTER : Attempts >= max

    DEAD_LETTER --> [*] : Manual intervention

    state "Lease Reaper Service" as Reaper
    RUNNING --> Reaper : Worker crash / lease expires
    Reaper --> PENDING : Reclaim job
```

### End-to-End Request Flow

A normal job request moves through the system in the following order.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant N as Nginx
    participant API as Spring Boot API
    participant DB as PostgreSQL
    participant D as Dispatcher Leader
    participant R as Redis
    participant W as Worker

    C->>N: POST /api/v1/jobs
    N->>API: Forward authenticated request
    API->>DB: Persist job as PENDING
    DB-->>API: Job created
    API-->>N: Job response
    N-->>C: 201 Created

    D->>DB: Find due PENDING jobs
    DB-->>D: Claim using FOR UPDATE SKIP LOCKED
    D->>DB: Mark job QUEUED
    D->>DB: Commit transaction
    D->>R: Push job ID after commit

    W->>R: BLPOP queue
    R-->>W: Job ID
    W->>DB: Load job payload
    W->>DB: Mark RUNNING
    W->>R: Renew execution lease
    W->>DB: Mark COMPLETED
```

### Low-Level Backend Design

The low-level design shows the main Spring Boot services involved in scheduling, claiming, retries, leadership, and crash recovery.

```mermaid
classDiagram
    class JobController {
        +createJob(JobRequest) JobResponse
        +getJob(UUID) JobResponse
    }

    class JobDispatchService {
        +dispatchDueJobs()
        -claimJobs(int) List~Job~
        -pushToRedisQueue(List~Job~)
    }

    class JobRepository {
        +findClaimableJobs(int) List~Job~
        +markJobRunning(UUID)
        +markJobDeadLettered(UUID)
    }

    class DispatcherLeaderElector {
        +acquireLeadership() boolean
        +releaseLeadership()
    }

    class RetryPolicyCalculator {
        +calculateNextRunAt(Job, int attempts) Instant
    }

    class LeaseReaperService {
        +reclaimExpiredLeases()
    }

    JobController --> JobDispatchService : invokes
    JobDispatchService --> JobRepository : transactional access
    JobDispatchService --> DispatcherLeaderElector : Redis coordination
    JobDispatchService --> RetryPolicyCalculator : retry calculation
    LeaseReaperService --> JobRepository : stale job recovery

    note for JobRepository "SELECT ... FOR UPDATE SKIP LOCKED prevents competing claims from blocking or double-claiming jobs."
```

### Worker Crash Recovery

Workers maintain an execution lease while processing a job. If the worker stops renewing the lease, the reaper can make the job eligible again.

```mermaid
sequenceDiagram
    autonumber
    participant W as Worker
    participant R as Redis
    participant Reaper as Lease Reaper
    participant DB as PostgreSQL
    participant W2 as Replacement Worker

    W->>R: Acquire / renew job lease
    loop While executing
        W->>R: Heartbeat / lease renewal
    end

    Note over W,R: Worker crashes or loses connectivity
    R--xW: Heartbeats stop
    R-->>Reaper: Lease expires

    Reaper->>DB: Find stale RUNNING job
    DB-->>Reaper: Expired job
    Reaper->>DB: Reset job to PENDING

    W2->>DB: Claim due job
    W2->>R: Enqueue / consume job
    W2->>DB: Execute and update status
```

### Retry and Dead-Letter Flow

Failures are handled by the retry policy calculator. Exponential jitter is used to reduce synchronized retry storms.

```mermaid
flowchart TD
    A[Worker executes job] --> B{Handler result}
    B -->|Success| C[COMPLETED]
    B -->|Failure| D[Retry Policy Calculator]

    D --> E{Attempts remaining?}
    E -->|Yes| F[Calculate backoff + jitter]
    F --> G[Set PENDING]
    G --> H[Set future run_at]
    H --> I[Dispatcher claims job again]

    E -->|No| J[DEAD_LETTER]
    J --> K[Manual review / requeue / discard]
```

Supported retry policies include:

- FIXED
- LINEAR
- EXPONENTIAL
- EXPONENTIAL_JITTER

### Leader Election

Only the elected dispatcher leader aggressively polls PostgreSQL for due jobs. Leadership is coordinated through Redis.

```mermaid
sequenceDiagram
    autonumber
    participant D1 as Scheduler Replica A
    participant R as Redis
    participant D2 as Scheduler Replica B
    participant DB as PostgreSQL

    D1->>R: Acquire dispatcher leadership
    R-->>D1: Leadership granted

    D2->>R: Attempt leadership
    R-->>D2: Leadership unavailable

    D1->>DB: Poll and claim due jobs
    D2-->>D2: Wait

    Note over D1,R: Leader crashes or lease expires
    D2->>R: Acquire leadership
    R-->>D2: Leadership granted
    D2->>DB: Resume dispatching
```

### Observability Flow

Metrics are collected from the gateway and Spring Boot backend and exposed through Prometheus for Grafana dashboards.

```mermaid
flowchart LR
    N[Nginx] -->|Metrics| P[Prometheus]
    B[Spring Boot Backend] -->|Actuator Metrics| P
    P --> G[Grafana]
    G --> D[Operational Dashboards]
```

## Core Design Decisions

### PostgreSQL as the Durable Claiming Layer

Due jobs are claimed with:

```sql
SELECT id
FROM job_executions
WHERE status = 'PENDING'
  AND run_at <= NOW()
FOR UPDATE SKIP LOCKED
LIMIT :batchSize;
```

This allows concurrent database transactions to skip rows already locked by another transaction instead of waiting for those rows.

### Redis for Fast Dispatch

After the PostgreSQL transaction commits, the dispatcher pushes the job ID into a Redis queue.

The important ordering is:

```text
PostgreSQL claim
      |
      v
Update job state
      |
      v
Commit transaction
      |
      v
afterCommit()
      |
      v
Redis queue
```

This avoids publishing a job to Redis before its durable database state has committed.

### Redis-Backed Leadership

The dispatcher uses Redis-backed leadership so multiple application replicas can exist without all replicas aggressively polling and dispatching the same workload.

### Lease-Based Worker Recovery

A worker must continuously renew its lease. If it stops renewing because of a crash or network failure, the lease expires and the scheduler can reclaim the job.

### Retry with Jitter

Exponential jitter introduces randomized delay between retries so many failed jobs do not retry simultaneously against the same downstream dependency.

## Features

### Backend

- Spring Boot 3
- Java 21
- REST APIs
- JWT authentication
- API key authentication
- Multi-tenant RBAC
- PostgreSQL persistence
- Redis queues
- Redis-backed leader election
- Atomic `SKIP LOCKED` job claiming
- Cron scheduling
- Worker runtime
- Redis `BLPOP` consumption
- Worker lease renewal
- Graceful shutdown
- Crash recovery
- Retry engine
- Exponential jitter
- Dead-letter queue
- Email, Slack and Webhook notifications
- AI insights
- WebSocket live updates
- Audit logs
- Analytics
- Testcontainers integration tests

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- JWT silent refresh
- React Query
- STOMP/SockJS live job feed
- Recharts
- Dark/light theme
- Job management
- Queue management
- Worker fleet monitoring
- Dead-letter queue management
- AI insights explorer
- Audit log viewer
- API key management
- Organization management

### Database and Infrastructure

- 11 Flyway migrations
- Multi-tenant schema
- Partitioned `job_executions`
- Partitioned `audit_logs`
- Indexing strategy
- Docker Compose
- PostgreSQL
- Redis
- Nginx
- Prometheus
- Grafana

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query, STOMP/SockJS, Recharts |
| Backend | Java 21, Spring Boot 3, Spring Security |
| Persistence | PostgreSQL, JPA/Hibernate, Flyway |
| Queue / Coordination | Redis, Lettuce |
| Authentication | JWT, API Keys, RBAC |
| Real-Time | WebSocket, STOMP, SockJS, Redis Pub/Sub |
| Testing | JUnit, Testcontainers |
| Gateway | Nginx |
| Observability | Prometheus, Grafana |
| Deployment | Docker Compose |

## Project Structure

```text
distributed_job_scheduler/
├── backend/
│   ├── src/main/java/
│   │   └── com/scheduler/platform/
│   │       ├── api/
│   │       ├── domain/
│   │       ├── scheduler/
│   │       ├── worker/
│   │       ├── infrastructure/
│   │       └── security/
│   ├── src/main/resources/
│   │   └── db/migration/
│   └── pom.xml
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.*
├── docs/
│   └── architecture/
│       ├── HLD.md
│       ├── DFD.md
│       └── LLD.md
├── docker-compose.yml
├── .env.example
└── README.md
```

## Running Locally

### Prerequisites

- Docker
- Docker Compose
- Git

### Start the platform

```bash
cp .env.example .env
```

Set at least `DB_PASSWORD` and a secure `JWT_SECRET` in `.env`.

Then:

```bash
docker compose up -d --build
docker compose logs -f backend
```

Wait for:

```text
Started JobSchedulerPlatformApplication
```

### Services

| Service | URL |
|---|---|
| Dashboard | http://localhost |
| Swagger UI | http://localhost/swagger-ui.html |
| Backend API | http://localhost:8080/api/v1 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

For local development, the seeded demo account is:

```text
Email: admin@demo.local
Password: ChangeMe123!
```

Rotate the password immediately outside local development.

## API Example

### Login

```bash
curl -X POST localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"admin@demo.local",
    "password":"ChangeMe123!"
  }'
```

### Create a Job

Use the `accessToken` returned from login.

```bash
curl -X POST localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer <accessToken>" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"demo-job",
    "queueId":"00000000-0000-0000-0000-000000000010",
    "handlerType":"noop",
    "jobType":"ONE_OFF",
    "runAt":"2026-01-01T00:00:00Z"
  }'
```

## Testing

Unit tests:

```bash
cd backend
mvn test
```

Integration tests with Testcontainers:

```bash
mvn verify
```

Docker must be running for the Testcontainers integration suite.

The most important concurrency test is `JobClaimingConcurrencyTest`, which validates that concurrent schedulers do not double-claim the same jobs.

## Architecture Documentation

Detailed architecture documents are available in the repository:

- [High-Level Design](docs/architecture/HLD.md)
- [Data Flow Diagram](docs/architecture/DFD.md)
- [Low-Level Design](docs/architecture/LLD.md)

The README intentionally embeds the main architecture diagrams so the complete system can be understood directly from the repository landing page.

## Implementation Notes

The most important implementation areas to inspect are:

- `JobRepository.findClaimableJobs` for atomic `SKIP LOCKED` claiming.
- `Job` for centralized job state transitions.
- `RetryPolicyCalculator` for retry and jitter calculations.
- `JobDispatchService` for transactional claiming and post-commit Redis dispatch.
- `DispatcherLeaderElector` for distributed scheduler leadership.
- `LeaseReaperService` for worker crash recovery.
- Redis queue consumers for worker-side job delivery.
- Flyway migrations for the multi-tenant database model.

## Current Scope

Implemented and runnable:

- Backend job scheduling and dispatch
- Distributed claiming
- Worker execution
- Lease-based recovery
- Retry and DLQ handling
- Security and RBAC
- Notifications
- AI insights
- WebSocket updates
- React dashboard
- Docker Compose infrastructure
- Unit and Testcontainers integration tests

Not currently included:

- GitHub Actions CI workflows
- A production external secrets manager
- A production-grade Kubernetes deployment configuration

The dashboard throughput chart currently uses illustrative data because a dedicated `/analytics/throughput` time-series endpoint is not yet implemented.
