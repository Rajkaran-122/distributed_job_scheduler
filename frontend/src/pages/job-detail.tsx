import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Loader2, Ban } from 'lucide-react';
import { jobsApi, aiApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JobStatusBadge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-text font-mono">{value}</span>
    </div>
  );
}

function AiPanel({ jobId }: { jobId: string }) {
  const [kind, setKind] = useState<'failure' | 'retry' | 'rootcause' | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(k: 'failure' | 'retry' | 'rootcause') {
    setKind(k); setLoading(true); setText(null);
    try {
      const fn = k === 'failure' ? aiApi.failureExplanation : k === 'retry' ? aiApi.retryRecommendation : aiApi.rootCauseAnalysis;
      const result = await fn(jobId);
      setText(result);
    } catch {
      toast.error('AI insight unavailable', 'Configure AI_PROVIDER on the backend to enable this feature.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-brand" /> AI Insights</CardTitle>
          <CardDescription>Cached, provider-agnostic analysis</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => run('failure')} disabled={loading}>Explain failure</Button>
          <Button size="sm" variant="secondary" onClick={() => run('retry')} disabled={loading}>Retry recommendation</Button>
          <Button size="sm" variant="secondary" onClick={() => run('rootcause')} disabled={loading}>Root cause analysis</Button>
        </div>
        {loading && <div className="flex items-center gap-2 text-xs text-muted py-4"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…</div>}
        {!loading && text && (
          <div className="rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm text-text leading-relaxed">
            {text}
          </div>
        )}
        {!loading && !text && !kind && (
          <p className="text-xs text-muted py-4 text-center">Pick an insight to generate — cached for 24h once run.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: job, isLoading } = useQuery({ queryKey: ['job', jobId], queryFn: () => jobsApi.get(jobId!), enabled: !!jobId });

  async function onCancel() {
    if (!jobId) return;
    try {
      await jobsApi.cancel(jobId);
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (err: any) {
      toast.error('Could not cancel job', err?.response?.data?.message);
    }
  }

  if (isLoading || !job) {
    return <div className="flex justify-center py-20 text-muted text-sm">Loading job…</div>;
  }

  const cancellable = !['RUNNING', 'SUCCEEDED', 'CANCELLED', 'DEAD_LETTERED'].includes(job.status);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-text">{job.name}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-xs font-mono text-muted">{job.id}</p>
        </div>
        {cancellable && (
          <Button variant="danger" size="sm" onClick={onCancel}><Ban className="h-3.5 w-3.5" /> Cancel</Button>
        )}
      </div>

      {job.lastError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4">
          <p className="text-xs font-medium text-danger mb-1">Last error</p>
          <p className="text-sm text-text font-mono whitespace-pre-wrap break-words">{job.lastError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Queue" value={job.queueName} />
            <InfoRow label="Handler type" value={job.handlerType} />
            <InfoRow label="Job type" value={job.jobType} />
            <InfoRow label="Priority" value={job.priority} />
            <InfoRow label="Cron expression" value={job.cronExpression ?? '—'} />
            <InfoRow label="Attempts" value={`${job.attemptCount} / ${job.maxRetries}`} />
            <InfoRow label="Next run" value={formatDateTime(job.nextRunAt)} />
            <InfoRow label="Created" value={formatDateTime(job.createdAt)} />
            <InfoRow label="Updated" value={formatDateTime(job.updatedAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payload</CardTitle></CardHeader>
          <CardContent>
            <pre className="rounded-md bg-surface-raised border border-border p-3 text-xs font-mono text-text overflow-x-auto max-h-64">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <AiPanel jobId={job.id} />
    </div>
  );
}
