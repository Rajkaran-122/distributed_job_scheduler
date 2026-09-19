import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Clock3, PlayCircle, CheckCircle2, Skull, Activity } from 'lucide-react';
import { analyticsApi, workersApi, queuesApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PulseRail } from '@/components/charts/pulse-rail';
import { useJobEvents } from '@/hooks/useJobEvents';
import { formatRelativeTime, truncateId } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const FAKE_THROUGHPUT = Array.from({ length: 24 }).map((_, i) => ({
  hour: `${i}:00`,
  succeeded: Math.round(40 + Math.sin(i / 3) * 25 + Math.random() * 15),
  failed: Math.round(2 + Math.random() * 6),
}));

function StatCard({ label, value, icon: Icon, tone, hint }: {
  label: string; value: number | string; icon: React.ElementType;
  tone: 'brand' | 'healthy' | 'retry' | 'danger'; hint?: string;
}) {
  const toneText = { brand: 'text-brand', healthy: 'text-healthy', retry: 'text-retry', danger: 'text-danger' }[tone];
  const toneBg = { brand: 'bg-brand/10', healthy: 'bg-healthy/10', retry: 'bg-retry/10', danger: 'bg-danger/10' }[tone];
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className="font-display text-2xl font-semibold text-text mono-tabular">{value}</p>
            {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneBg}`}>
            <Icon className={`h-4 w-4 ${toneText}`} />
          </div>
        </div>
        <PulseRail tone={tone} count={20} className="mt-4" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ['queue-stats'], queryFn: analyticsApi.queueStats, refetchInterval: 8000 });
  const { data: workers } = useQuery({ queryKey: ['workers'], queryFn: workersApi.list, refetchInterval: 8000 });
  const { data: queues } = useQuery({ queryKey: ['queues'], queryFn: queuesApi.list, refetchInterval: 15000 });
  const { events } = useJobEvents(12);

  const totals = (stats ?? []).reduce(
    (acc, q) => ({
      pending: acc.pending + q.pending,
      running: acc.running + q.running,
      failed24h: acc.failed24h + q.failedLast24h,
      deadLettered: acc.deadLettered + q.deadLetteredTotal,
    }),
    { pending: 0, running: 0, failed24h: 0, deadLettered: 0 }
  );

  const activeWorkers = (workers ?? []).filter((w) => w.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Overview</h1>
          <p className="text-sm text-muted">Real-time health across every queue and worker.</p>
        </div>
        <Badge tone="healthy" dot>{activeWorkers} worker{activeWorkers === 1 ? '' : 's'} active</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Pending" value={totals.pending} icon={Clock3} tone="brand" hint="Waiting in queue" />
        <StatCard label="Running" value={totals.running} icon={PlayCircle} tone="healthy" hint="In flight now" />
        <StatCard label="Failed (24h)" value={totals.failed24h} icon={CheckCircle2} tone="retry" hint="Retrying or resolved" />
        <StatCard label="Dead-lettered" value={totals.deadLettered} icon={Skull} tone="danger" hint="Needs attention" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Throughput, last 24h</CardTitle>
              <CardDescription>Succeeded vs. failed executions per hour</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={FAKE_THROUGHPUT} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="succ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB4B4B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FB4B4B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#8992A8', fontSize: 11 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: '#8992A8', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background: '#171B26', border: '1px solid #232838', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="succeeded" stroke="#34D399" fill="url(#succ)" strokeWidth={2} />
                <Area type="monotone" dataKey="failed" stroke="#FB4B4B" fill="url(#fail)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Live activity</CardTitle>
              <CardDescription>Streaming job lifecycle events</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-healthy animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-2 max-h-[280px] overflow-y-auto">
            {events.length === 0 && (
              <p className="text-xs text-muted py-8 text-center">Waiting for job activity…</p>
            )}
            {events.map((e, i) => (
              <div key={`${e.jobId}-${i}`} className="flex items-center justify-between rounded-md border border-border bg-surface-raised px-3 py-2">
                <div>
                  <p className="text-xs font-mono text-text">{truncateId(e.jobId)}</p>
                  <p className="text-[11px] text-muted">{e.eventType.replace('job.', '')}</p>
                </div>
                <span className="text-[10px] text-muted font-mono">{formatRelativeTime(e.timestamp)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Queues at a glance</CardTitle>
            <CardDescription>{(queues ?? []).length} configured queue{(queues ?? []).length === 1 ? '' : 's'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(stats ?? []).map((q) => (
              <div key={q.queueId} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text font-mono">{q.queueName}</span>
                  <Badge tone={q.deadLetteredTotal > 0 ? 'danger' : 'healthy'} dot>
                    {q.deadLetteredTotal > 0 ? 'attention' : 'healthy'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-semibold text-brand mono-tabular">{q.pending}</p>
                    <p className="text-[10px] text-muted">pending</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-healthy mono-tabular">{q.running}</p>
                    <p className="text-[10px] text-muted">running</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-danger mono-tabular">{q.deadLetteredTotal}</p>
                    <p className="text-[10px] text-muted">dead</p>
                  </div>
                </div>
              </div>
            ))}
            {(stats ?? []).length === 0 && (
              <p className="text-xs text-muted py-6 col-span-full text-center">No queues yet — create one to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
