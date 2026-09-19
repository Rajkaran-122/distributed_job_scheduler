import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pause, Play, Loader2 } from 'lucide-react';
import { queuesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

function CreateQueueDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', maxConcurrency: 10, defaultPriority: 5 });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await queuesApi.create(form);
      toast.success('Queue created', form.name);
      setOpen(false);
      onCreated();
      setForm({ name: '', description: '', maxConcurrency: 10, defaultPriority: 5 });
    } catch (err: any) {
      toast.error('Could not create queue', err?.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> New queue</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a queue</DialogTitle>
          <DialogDescription>Queues group jobs by concurrency and priority policy.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="qname">Name</Label>
            <Input id="qname" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="qdesc">Description</Label>
            <Input id="qdesc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="qconc">Max concurrency</Label>
              <Input id="qconc" type="number" min={1} value={form.maxConcurrency} onChange={(e) => setForm((f) => ({ ...f, maxConcurrency: Number(e.target.value) }))} />
            </div>
            <div>
              <Label htmlFor="qprio">Default priority</Label>
              <Input id="qprio" type="number" min={1} max={10} value={form.defaultPriority} onChange={(e) => setForm((f) => ({ ...f, defaultPriority: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create queue'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function QueuesPage() {
  const queryClient = useQueryClient();
  const { data: queues, isLoading } = useQuery({ queryKey: ['queues'], queryFn: queuesApi.list, refetchInterval: 10000 });
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggle(id: string, paused: boolean) {
    setPendingId(id);
    try {
      await (paused ? queuesApi.resume(id) : queuesApi.pause(id));
      toast.success(paused ? 'Queue resumed' : 'Queue paused');
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    } catch (err: any) {
      toast.error('Action failed', err?.response?.data?.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Queues</h1>
          <p className="text-sm text-muted">Concurrency, priority, and pause/resume control.</p>
        </div>
        <CreateQueueDialog onCreated={() => queryClient.invalidateQueries({ queryKey: ['queues'] })} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Max concurrency</TableHead>
                <TableHead>Rate limit</TableHead>
                <TableHead>Default priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted">Loading…</TableCell></TableRow>}
              {queues?.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <p className="font-medium font-mono text-text">{q.name}</p>
                    {q.description && <p className="text-[11px] text-muted">{q.description}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge tone={q.state === 'ACTIVE' ? 'healthy' : 'retry'} dot>{q.state}</Badge>
                  </TableCell>
                  <TableCell className="mono-tabular">{q.maxConcurrency}</TableCell>
                  <TableCell className="mono-tabular">{q.rateLimitPerMinute ?? '—'}</TableCell>
                  <TableCell className="mono-tabular">{q.defaultPriority}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm" variant="secondary"
                      disabled={pendingId === q.id}
                      onClick={() => toggle(q.id, q.state === 'PAUSED')}
                    >
                      {q.state === 'ACTIVE' ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Resume</>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (queues?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted">No queues yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
