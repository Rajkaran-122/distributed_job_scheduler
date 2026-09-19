import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Trash2, Skull } from 'lucide-react';
import { dlqApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatRelativeTime, truncateId } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export default function DeadLetterQueuePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dlq', page],
    queryFn: () => dlqApi.list({ page, size: 20 }),
    refetchInterval: 10000,
  });

  async function requeue(id: string) {
    setPendingId(id);
    try {
      await dlqApi.requeue(id);
      toast.success('Job requeued', 'It will be picked up on the next dispatch cycle.');
      queryClient.invalidateQueries({ queryKey: ['dlq'] });
    } catch (err: any) {
      toast.error('Requeue failed', err?.response?.data?.message);
    } finally {
      setPendingId(null);
    }
  }

  async function discard(id: string) {
    setPendingId(id);
    try {
      await dlqApi.discard(id);
      toast.info('Job discarded');
      queryClient.invalidateQueries({ queryKey: ['dlq'] });
    } catch (err: any) {
      toast.error('Discard failed', err?.response?.data?.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Skull className="h-5 w-5 text-danger" />
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Dead Letter Queue</h1>
          <p className="text-sm text-muted">{data?.totalElements ?? 0} job{data?.totalElements === 1 ? '' : 's'} exhausted their retries</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Final attempt</TableHead>
                <TableHead>Last error</TableHead>
                <TableHead>Dead-lettered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted">Loading…</TableCell></TableRow>}
              {data?.content.map((dlq) => (
                <TableRow key={dlq.id}>
                  <TableCell>
                    <p className="font-medium text-text">{dlq.job?.name ?? truncateId(dlq.id)}</p>
                    <p className="text-[11px] font-mono text-muted">{truncateId(dlq.id)}</p>
                  </TableCell>
                  <TableCell className="mono-tabular">{dlq.finalAttemptNumber}</TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs font-mono text-danger truncate" title={dlq.lastErrorMessage ?? ''}>
                      {dlq.lastErrorMessage ?? '—'}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted">{formatRelativeTime(dlq.deadLetteredAt)}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button size="sm" variant="secondary" disabled={pendingId === dlq.id} onClick={() => requeue(dlq.id)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Requeue
                    </Button>
                    <Button size="sm" variant="ghost" disabled={pendingId === dlq.id} onClick={() => discard(dlq.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Discard
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (data?.content.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted">Nothing here — every job is either running cleanly or still retrying.</TableCell></TableRow>
              )}
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
