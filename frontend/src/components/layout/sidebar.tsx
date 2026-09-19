import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ListTree, Layers, Users, Skull, ShieldCheck, Sparkles,
  KeyRound, ScrollText, Building2, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/jobs', label: 'Jobs', icon: ListTree },
  { to: '/queues', label: 'Queues', icon: Layers },
  { to: '/workers', label: 'Workers', icon: Users },
  { to: '/dead-letter-queue', label: 'Dead Letter Queue', icon: Skull },
  { to: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
  { to: '/api-keys', label: 'API Keys', icon: KeyRound },
  { to: '/organization', label: 'Organization', icon: Building2 },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-brand/15">
          <Activity className="h-4 w-4 text-brand" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-healthy ring-2 ring-surface" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-text">Scheduler</p>
          <p className="text-[10px] text-muted font-mono -mt-0.5">control plane</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted hover:bg-surface-raised hover:text-text'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="rounded-lg border border-border bg-surface-raised p-3">
          <p className="text-[11px] text-muted leading-relaxed">
            Dispatcher, reaper, and worker fleet are polling live via REST + WebSocket.
          </p>
        </div>
      </div>
    </aside>
  );
}
