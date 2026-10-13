import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'healthy' | 'retry' | 'danger';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-raised text-text-secondary border-border',
  brand: 'bg-brand/10 text-brand border-brand/20',
  healthy: 'bg-healthy/10 text-healthy border-healthy/20',
  retry: 'bg-retry/10 text-retry border-retry/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
};

const dotColors: Record<Tone, string> = {
  neutral: 'bg-text-tertiary',
  brand: 'bg-brand',
  healthy: 'bg-healthy',
  retry: 'bg-retry',
  danger: 'bg-danger',
};

export function Badge({
  className, tone = 'neutral', children, dot = false, pulse = false, ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean; pulse?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium font-mono tracking-wide whitespace-nowrap',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone], pulse && 'animate-status-pulse')} />
      )}
      {children}
    </span>
  );
}

const JOB_STATUS_TONE: Record<string, Tone> = {
  PENDING: 'neutral', SCHEDULED: 'brand', RUNNING: 'brand', SUCCEEDED: 'healthy',
  FAILED: 'danger', RETRYING: 'retry', DEAD_LETTERED: 'danger', CANCELLED: 'neutral', PAUSED: 'retry',
};

const JOB_STATUS_PULSE: Record<string, boolean> = {
  RUNNING: true, RETRYING: true,
};

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      tone={JOB_STATUS_TONE[status] ?? 'neutral'}
      dot
      pulse={JOB_STATUS_PULSE[status] ?? false}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
