import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';
import type {
  AuthResponse, JobResponse, QueueResponse, QueueStatsResponse, WorkerResponse,
  DeadLetterJobResponse, ApiKeyResponse, AuditLogResponse, OrganizationResponse,
  PagedResponse,
} from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api = axios.create({ baseURL: BASE_URL });

// Attach the bearer token to every outbound request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, attempt exactly one silent refresh-and-retry before giving up and
// dropping the session -- avoids bouncing the user to login on a merely-expired
// access token while a valid refresh token is still on hand.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, user, setSession, clearSession } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthResponse>(`${BASE_URL}/v1/auth/refresh`, { refreshToken });
    setSession(data.accessToken, data.refreshToken, data.user ?? user!);
    return data.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshInFlight = refreshInFlight ?? refreshAccessToken();
      const newToken = await refreshInFlight;
      refreshInFlight = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/v1/auth/login', { email, password }).then((r) => r.data),
  register: (payload: { email: string; password: string; fullName: string; organizationName: string }) =>
    api.post<AuthResponse>('/v1/auth/register', payload).then((r) => r.data),
};

// ---- Jobs ----
export const jobsApi = {
  list: (params: { status?: string; queueId?: string; page?: number; size?: number }) =>
    api.get<PagedResponse<JobResponse>>('/v1/jobs', { params }).then((r) => r.data),
  get: (id: string) => api.get<JobResponse>(`/v1/jobs/${id}`).then((r) => r.data),
  create: (payload: Record<string, unknown>) =>
    api.post<JobResponse>('/v1/jobs', payload).then((r) => r.data),
  update: (id: string, payload: Record<string, unknown>) =>
    api.patch<JobResponse>(`/v1/jobs/${id}`, payload).then((r) => r.data),
  cancel: (id: string) => api.delete(`/v1/jobs/${id}`),
};

// ---- Queues ----
export const queuesApi = {
  list: () => api.get<QueueResponse[]>('/v1/queues').then((r) => r.data),
  create: (payload: Record<string, unknown>) =>
    api.post<QueueResponse>('/v1/queues', payload).then((r) => r.data),
  pause: (id: string) => api.post<QueueResponse>(`/v1/queues/${id}/pause`).then((r) => r.data),
  resume: (id: string) => api.post<QueueResponse>(`/v1/queues/${id}/resume`).then((r) => r.data),
};

// ---- Analytics ----
export const analyticsApi = {
  queueStats: () => api.get<QueueStatsResponse[]>('/v1/analytics/queue-stats').then((r) => r.data),
};

// ---- Workers ----
export const workersApi = {
  list: () => api.get<WorkerResponse[]>('/v1/workers').then((r) => r.data),
};

// ---- Dead Letter Queue ----
export const dlqApi = {
  list: (params: { page?: number; size?: number }) =>
    api.get<PagedResponse<DeadLetterJobResponse>>('/v1/dead-letter-queue', { params }).then((r) => r.data),
  requeue: (id: string) => api.post(`/v1/dead-letter-queue/${id}/requeue`),
  discard: (id: string) => api.post(`/v1/dead-letter-queue/${id}/discard`),
};

// ---- API Keys ----
export const apiKeysApi = {
  create: (payload: { name: string; scopes?: string[] }) =>
    api.post<ApiKeyResponse>('/v1/api-keys', payload).then((r) => r.data),
  revoke: (id: string) => api.delete(`/v1/api-keys/${id}`),
};

// ---- AI Insights ----
export const aiApi = {
  failureExplanation: (jobId: string) =>
    api.get<{ explanation: string }>(`/v1/ai/jobs/${jobId}/failure-explanation`).then((r) => r.data.explanation),
  retryRecommendation: (jobId: string) =>
    api.get<{ recommendation: string }>(`/v1/ai/jobs/${jobId}/retry-recommendation`).then((r) => r.data.recommendation),
  rootCauseAnalysis: (jobId: string) =>
    api.get<{ analysis: string }>(`/v1/ai/jobs/${jobId}/root-cause-analysis`).then((r) => r.data.analysis),
};

// ---- Audit Logs ----
export const auditApi = {
  list: (params: { page?: number; size?: number }) =>
    api.get<PagedResponse<AuditLogResponse>>('/v1/audit-logs', { params }).then((r) => r.data),
};

// ---- Organization ----
export const orgApi = {
  me: () => api.get<OrganizationResponse>('/v1/organizations/me').then((r) => r.data),
};
