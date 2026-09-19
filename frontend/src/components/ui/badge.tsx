import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'healthy' | 'retry' | 'danger';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-raised text-muted border-border',
  brand: 'bg-brand/10 text-brand border-brand/30',
  healthy: 'bg-healthy/10 text-healthy border-healthy/30',
  retry: 'bg-retry/10 text-retry border-retry/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
};

export function Badge({
  className, tone = 'neutral', children, dot = false, ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium font-mono tracking-wide',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-muted': tone === 'neutral', 'bg-brand': tone === 'brand',
        'bg-healthy': tone === 'healthy', 'bg-retry': tone === 'retry', 'bg-danger': tone === 'danger',
      })} />}
      {children}
    </span>
  );
}

const JOB_STATUS_TONE: Record<string, Tone> = {
  PENDING: 'neutral', SCHEDULED: 'brand', RUNNING: 'brand', SUCCEEDED: 'healthy',
  FAILED: 'danger', RETRYING: 'retry', DEAD_LETTERED: 'danger', CANCELLED: 'neutral', PAUSED: 'retry',
};

export function JobStatusBadge({ status }: { status: string }) {
  return <Badge tone={JOB_STATUS_TONE[status] ?? 'neutral'} dot>{status.replace('_', ' ')}</Badge>;
}
