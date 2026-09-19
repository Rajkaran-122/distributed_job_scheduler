import { useQuery } from '@tanstack/react-query';
import { Building2, Shield } from 'lucide-react';
import { orgApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-text font-mono">{value}</span>
    </div>
  );
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  OWNER: 'Full control, including billing and organization deletion.',
  ADMIN: 'Manage queues, API keys, and members. Cannot delete the organization.',
  DEVELOPER: 'Create and manage jobs. Cannot manage queues or API keys.',
  VIEWER: 'Read-only access to jobs, queues, and dashboards.',
};

export default function OrganizationPage() {
  const user = useAuthStore((s) => s.user);
  const { data: org, isLoading } = useQuery({ queryKey: ['org-me'], queryFn: orgApi.me });

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-brand" />
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Organization</h1>
          <p className="text-sm text-muted">Tenant profile and your role.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{isLoading ? 'Loading…' : org?.name}</CardTitle>
            <CardDescription>Tenant boundary — every job, queue, and key belongs here.</CardDescription>
          </div>
          {org && <Badge tone="brand">{org.plan}</Badge>}
        </CardHeader>
        <CardContent>
          <InfoRow label="Organization ID" value={org?.id ?? '—'} />
          <InfoRow label="Slug" value={org?.slug ?? '—'} />
          <InfoRow label="Plan" value={org?.plan ?? '—'} />
          <InfoRow label="Created" value={org ? formatDateTime(org.createdAt) : '—'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-brand" />
            <CardTitle>Your access</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <InfoRow label="Name" value={user?.fullName ?? '—'} />
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Role" value={<Badge tone="brand">{user?.role}</Badge>} />
          {user?.role && (
            <p className="text-xs text-muted pt-3 leading-relaxed">{ROLE_DESCRIPTIONS[user.role]}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
