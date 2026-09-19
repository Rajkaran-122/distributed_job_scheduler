import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { useAuthStore } from '@/store/auth';

import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import DashboardPage from '@/pages/dashboard';
import JobsPage from '@/pages/jobs';
import JobDetailPage from '@/pages/job-detail';
import QueuesPage from '@/pages/queues';
import WorkersPage from '@/pages/workers';
import DeadLetterQueuePage from '@/pages/dead-letter-queue';
import AiInsightsPage from '@/pages/ai-insights';
import AuditLogPage from '@/pages/audit-log';
import ApiKeysPage from '@/pages/api-keys';
import OrganizationPage from '@/pages/organization';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/queues" element={<QueuesPage />} />
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/dead-letter-queue" element={<DeadLetterQueuePage />} />
          <Route path="/ai-insights" element={<AiInsightsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/api-keys" element={<ApiKeysPage />} />
          <Route path="/organization" element={<OrganizationPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
