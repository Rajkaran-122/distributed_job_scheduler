export type JobStatus =
  | 'PENDING' | 'SCHEDULED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
  | 'RETRYING' | 'DEAD_LETTERED' | 'CANCELLED' | 'PAUSED';

export type JobType = 'ONE_OFF' | 'DELAYED' | 'CRON' | 'EVENT';
export type BackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL' | 'EXPONENTIAL_JITTER';
export type QueueStateType = 'ACTIVE' | 'PAUSED';
export type WorkerStatusType = 'ACTIVE' | 'DRAINING' | 'DEAD';

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: UserResponse;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface JobResponse {
  id: string;
  name: string;
  queueId: string;
  queueName: string;
  handlerType: string;
  jobType: JobType;
  payload: Record<string, unknown>;
  cronExpression: string | null;
  runAt: string | null;
  nextRunAt: string;
  priority: number;
  status: JobStatus;
  maxRetries: number;
  attemptCount: number;
  lastError: string | null;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface QueueResponse {
  id: string;
  name: string;
  description: string | null;
  state: QueueStateType;
  maxConcurrency: number;
  rateLimitPerMinute: number | null;
  defaultPriority: number;
}

export interface QueueStatsResponse {
  queueId: string;
  queueName: string;
  pending: number;
  running: number;
  succeededLast24h: number;
  failedLast24h: number;
  deadLetteredTotal: number;
}

export interface WorkerResponse {
  id: string;
  hostname: string;
  pid: number | null;
  version: string | null;
  status: WorkerStatusType;
  queues: string[];
  maxConcurrency: number;
  currentLoad: number;
  lastHeartbeatAt: string;
  registeredAt: string;
}

export interface DeadLetterJobResponse {
  id: string;
  job: { id: string; name: string; handlerType: string; queueName: string };
  finalAttemptNumber: number;
  payloadSnapshot: Record<string, unknown>;
  lastErrorMessage: string | null;
  lastErrorStacktrace: string | null;
  deadLetteredAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  plaintextKey: string | null;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AuditLogResponse {
  id: number;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
}

export interface JobEventMessage {
  jobId: string;
  eventType: string;
  timestamp: string;
}
