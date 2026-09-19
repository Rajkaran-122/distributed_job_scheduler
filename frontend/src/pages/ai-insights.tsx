import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { jobsApi, aiApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JobStatusBadge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';

export default function AiInsightsPage() {
  const { data: failedJobs } = useQuery({
    queryKey: ['ai-candidate-jobs'],
    queryFn: () => jobsApi.list({ status: 'DEAD_LETTERED', size: 8 }),
  });
  const { data: retryingJobs } = useQuery({
    queryKey: ['ai-candidate-jobs-retrying'],
    queryFn: () => jobsApi.list({ status: 'RETRYING', size: 8 }),
  });

  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [loadingKind, setLoadingKind] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  async function run(kind: 'failure' | 'retry' | 'rootcause') {
    if (!selected) return;
    setLoadingKind(kind);
    try {
      const fn = kind === 'failure' ? aiApi.failureExplanation : kind === 'retry' ? aiApi.retryRecommendation : aiApi.rootCauseAnalysis;
      const text = await fn(selected.id);
      setResults((r) => ({ ...r, [kind]: text }));
    } catch {
      toast.error('AI features not configured', 'Set AI_PROVIDER and AI_API_KEY on the backend.');
    } finally {
      setLoadingKind(null);
    }
  }

  const candidates = [...(failedJobs?.content ?? []), ...(retryingJobs?.content ?? [])];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" />
        <div>
          <h1 className="font-display text-xl font-semibold text-text">AI Insights</h1>
          <p className="text-sm text-muted">Provider-agnostic, cached failure analysis and retry tuning.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>Dead-lettered and retrying jobs</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
            {candidates.length === 0 && <p className="text-xs text-muted py-8 text-center">No failing jobs right now — nice.</p>}
            {candidates.map((job) => (
              <button
                key={job.id}
                onClick={() => { setSelected({ id: job.id, name: job.name }); setResults({}); }}
                className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                  selected?.id === job.id ? 'border-brand bg-brand/5' : 'border-border hover:bg-surface-raised'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text truncate">{job.name}</span>
                  <JobStatusBadge status={job.status} />
                </div>
                <p className="text-[11px] text-muted font-mono mt-0.5 truncate">{job.handlerType}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{selected ? selected.name : 'Select a job'}</CardTitle>
              <CardDescription>{selected ? 'Generate an AI-backed insight' : 'Choose a job on the left to analyze'}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={loadingKind !== null} onClick={() => run('failure')}>
                  {loadingKind === 'failure' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Explain failure'}
                </Button>
                <Button size="sm" variant="secondary" disabled={loadingKind !== null} onClick={() => run('retry')}>
                  {loadingKind === 'retry' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Retry recommendation'}
                </Button>
                <Button size="sm" variant="secondary" disabled={loadingKind !== null} onClick={() => run('rootcause')}>
                  {loadingKind === 'rootcause' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Root cause analysis'}
                </Button>
              </div>
            )}

            {Object.entries(results).map(([kind, text]) => (
              <div key={kind} className="rounded-lg border border-brand/20 bg-brand/5 p-4">
                <p className="text-[11px] font-mono uppercase tracking-wide text-brand mb-1.5">{kind.replace('rootcause', 'root cause')}</p>
                <p className="text-sm text-text leading-relaxed">{text}</p>
              </div>
            ))}

            {selected && Object.keys(results).length === 0 && loadingKind === null && (
              <p className="text-xs text-muted py-10 text-center flex items-center justify-center gap-1">
                Run an insight above <ArrowRight className="h-3 w-3" />
              </p>
            )}
            {!selected && (
              <p className="text-xs text-muted py-16 text-center">Nothing selected yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
