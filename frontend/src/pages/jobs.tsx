import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { jobsApi, queuesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { JobStatusBadge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRelativeTime, truncateId } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import type { JobStatus, JobType } from '@/types/api';

const STATUSES: JobStatus[] = ['PENDING', 'SCHEDULED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'RETRYING', 'DEAD_LETTERED', 'CANCELLED', 'PAUSED'];

function CreateJobDialog({ queues, onCreated }: { queues: { id: string; name: string }[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    name: string; queueId: string; handlerType: string; jobType: JobType;
    runAt: string; cronExpression: string; priority: number;
  }>({
    name: '', queueId: queues[0]?.id ?? '', handlerType: 'noop', jobType: 'ONE_OFF',
    runAt: '', cronExpression: '', priority: 5,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name, queueId: form.queueId, handlerType: form.handlerType,
        jobType: form.jobType, priority: form.priority, payload: {},
      };
      if (form.jobType === 'ONE_OFF' || form.jobType === 'DELAYED') {
        payload.runAt = form.runAt ? new Date(form.runAt).toISOString() : new Date().toISOString();
      }
      if (form.jobType === 'CRON') payload.cronExpression = form.cronExpression;

      await jobsApi.create(payload);
      toast.success('Job created', form.name);
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast.error('Could not create job', err?.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> New job</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a job</DialogTitle>
          <DialogDescription>Schedule a one-off, delayed, or recurring job.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Queue</Label>
              <Select value={form.queueId} onValueChange={(v) => setForm((f) => ({ ...f, queueId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a queue" /></SelectTrigger>
                <SelectContent>
                  {queues.map((q) => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Job type</Label>
              <Select value={form.jobType} onValueChange={(v: any) => setForm((f) => ({ ...f, jobType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_OFF">One-off</SelectItem>
                  <SelectItem value="DELAYED">Delayed</SelectItem>
                  <SelectItem value="CRON">Cron</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="handlerType">Handler type</Label>
            <Input id="handlerType" required value={form.handlerType} onChange={(e) => setForm((f) => ({ ...f, handlerType: e.target.value }))} />
          </div>
          {(form.jobType === 'ONE_OFF' || form.jobType === 'DELAYED') && (
            <div>
              <Label htmlFor="runAt">Run at</Label>
              <Input id="runAt" type="datetime-local" value={form.runAt} onChange={(e) => setForm((f) => ({ ...f, runAt: e.target.value }))} />
            </div>
          )}
          {form.jobType === 'CRON' && (
            <div>
              <Label htmlFor="cron">Cron expression</Label>
              <Input id="cron" placeholder="*/5 * * * *" value={form.cronExpression} onChange={(e) => setForm((f) => ({ ...f, cronExpression: e.target.value }))} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function JobsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const { data: queues } = useQuery({ queryKey: ['queues'], queryFn: queuesApi.list });
  const { data, isLoading } = useQuery({
    queryKey: ['jobs', status, page],
    queryFn: () => jobsApi.list({ status: status === 'ALL' ? undefined : status, page, size: 20 }),
    refetchInterval: 6000,
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Jobs</h1>
          <p className="text-sm text-muted">{data?.totalElements ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <CreateJobDialog
            queues={queues ?? []}
            onCreated={() => queryClient.invalidateQueries({ queryKey: ['jobs'] })}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Next run</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted">Loading…</TableCell></TableRow>
              )}
              {!isLoading && (data?.content.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted">No jobs match this filter.</TableCell></TableRow>
              )}
              {data?.content.map((job) => (
                <TableRow key={job.id} className="cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                  <TableCell>
                    <p className="font-medium text-text">{job.name}</p>
                    <p className="text-[11px] font-mono text-muted">{truncateId(job.id)} · {job.handlerType}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{job.queueName}</TableCell>
                  <TableCell><JobStatusBadge status={job.status} /></TableCell>
                  <TableCell className="mono-tabular text-xs">{job.attemptCount}/{job.maxRetries}</TableCell>
                  <TableCell className="text-xs text-muted">{formatRelativeTime(job.nextRunAt)}</TableCell>
                  <TableCell className="text-xs text-muted">{formatRelativeTime(job.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-xs text-muted mono-tabular">Page {page + 1} of {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
