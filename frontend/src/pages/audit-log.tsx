import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { auditApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDateTime, truncateId } from '@/lib/utils';

export default function AuditLogPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page],
    queryFn: () => auditApi.list({ page, size: 25 }),
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-brand" />
        <div>
          <h1 className="font-display text-xl font-semibold text-text">Audit Log</h1>
          <p className="text-sm text-muted">Who did what, when — immutable and tenant-scoped.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Correlation ID</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted">Loading…</TableCell></TableRow>}
              {data?.content.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell><Badge tone="brand">{entry.action}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">
                    {entry.resourceType}{entry.resourceId ? ` · ${truncateId(entry.resourceId)}` : ''}
                  </TableCell>
                  <TableCell className="text-xs">{entry.actorEmail ?? 'system'}</TableCell>
                  <TableCell className="text-xs font-mono text-muted">{entry.ipAddress ?? '—'}</TableCell>
                  <TableCell className="text-xs font-mono text-muted">{entry.correlationId ? truncateId(entry.correlationId, 12) : '—'}</TableCell>
                  <TableCell className="text-right text-xs text-muted whitespace-nowrap">{formatDateTime(entry.createdAt)}</TableCell>
                </TableRow>
              ))}
              {!isLoading && (data?.content.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted">No audit events recorded yet.</TableCell></TableRow>
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
