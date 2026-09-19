import { Moon, Sun, Search, LogOut, User as UserIcon, Wifi, WifiOff } from 'lucide-react';
import { useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

export function Topbar({ live }: { live?: boolean }) {
  const { theme, toggle } = useThemeStore();
  const { user, clearSession } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 lg:px-6">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input placeholder="Search jobs, queues, workers…" className="pl-8" />
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-mono text-muted">
          {live ? <Wifi className="h-3 w-3 text-healthy" /> : <WifiOff className="h-3 w-3 text-muted" />}
          {live ? 'live' : 'polling'}
        </div>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-brand font-display text-xs font-semibold">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <span className="hidden md:block text-sm text-text">{user?.fullName ?? 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuItem disabled>
              <UserIcon className="h-3.5 w-3.5 mr-2" /> {user?.role}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { clearSession(); navigate('/login'); }}>
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
