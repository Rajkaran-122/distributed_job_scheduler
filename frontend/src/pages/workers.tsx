import { useQuery } from '@tanstack/react-query';
import { Cpu, Server } from 'lucide-react';
import { workersApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PulseRail } from '@/components/charts/pulse-rail';
import { formatRelativeTime, truncateId } from '@/lib/utils';
import type { WorkerStatusType } from '@/types/api';

const STATUS_TONE: Record<WorkerStatusType, 'healthy' | 'retry' | 'danger'> = {
  ACTIVE: 'healthy', DRAINING: 'retry', DEAD: 'danger',
};

export default function WorkersPage() {
  const { data: workers, isLoading } = useQuery({ queryKey: ['workers'], queryFn: workersApi.list, refetchInterval: 6000 });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-xl font-semibold text-text">Workers</h1>
        <p className="text-sm text-muted">Fleet registry — heartbeat, load, and lease ownership.</p>
      </div>

      {isLoading && <p className="text-sm text-muted py-10 text-center">Loading fleet…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {workers?.map((w) => {
          const loadPct = w.maxConcurrency > 0 ? Math.round((w.currentLoad / w.maxConcurrency) * 100) : 0;
          const tone = STATUS_TONE[w.status];
          return (
            <Card key={w.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10">
                    <Server className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <CardTitle className="font-mono">{w.hostname}</CardTitle>
                    <CardDescription>pid {w.pid ?? '—'} · {w.version ?? 'unknown'}</CardDescription>
                  </div>
                </div>
                <Badge tone={tone} dot>{w.status}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                  <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Load</span>
                  <span className="mono-tabular">{w.currentLoad}/{w.maxConcurrency}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-raised overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${loadPct}%` }}
                  />
                </div>

                <PulseRail tone={tone} count={20} />

                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted">Last heartbeat</span><span className="font-mono text-text">{formatRelativeTime(w.lastHeartbeatAt)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Registered</span><span className="font-mono text-text">{formatRelativeTime(w.registeredAt)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Worker ID</span><span className="font-mono text-text">{truncateId(w.id)}</span></div>
                </div>

                {w.queues.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {w.queues.map((q) => <Badge key={q} tone="neutral">{q}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isLoading && (workers?.length ?? 0) === 0 && (
        <p className="text-sm text-muted py-10 text-center">No workers have registered yet.</p>
      )}
    </div>
  );
}
