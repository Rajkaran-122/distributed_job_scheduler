import { cn } from '@/lib/utils';

/**
 * The dashboard's signature motif: a heartbeat/ECG-style tick rail, echoing the
 * platform's own lease-heartbeat mechanism (workers.last_heartbeat_at). Each bar
 * pulses independently on a staggered delay so the rail reads as "alive" rather
 * than a static decoration -- used on stat cards to signal live/healthy state.
 */
export function PulseRail({ tone = 'healthy', count = 24, className }: {
  tone?: 'healthy' | 'brand' | 'retry' | 'danger' | 'neutral';
  count?: number;
  className?: string;
}) {
  const toneColor = {
    healthy: 'bg-healthy', brand: 'bg-brand', retry: 'bg-retry', danger: 'bg-danger', neutral: 'bg-muted',
  }[tone];

  return (
    <div className={cn('flex items-end gap-[3px] h-4', className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn('w-[2px] rounded-full origin-bottom animate-pulse-tick', toneColor)}
          style={{
            height: `${30 + ((i * 37) % 70)}%`,
            animationDelay: `${(i % 8) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
