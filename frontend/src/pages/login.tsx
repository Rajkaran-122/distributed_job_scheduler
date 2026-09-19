import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PulseRail } from '@/components/charts/pulse-rail';
import { toast } from '@/components/ui/toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('admin@demo.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      setSession(data.accessToken, data.refreshToken, data.user);
      toast.success('Welcome back', `Signed in as ${data.user.fullName}`);
      navigate('/');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5 bg-bg">
      {/* Left: brand / signature panel */}
      <div className="relative hidden lg:col-span-2 lg:flex flex-col justify-between overflow-hidden border-r border-border bg-surface p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(91,141,239,0.12),transparent_45%)]" />
        <div className="relative flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-brand/15">
            <Activity className="h-4 w-4 text-brand" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-healthy ring-2 ring-surface" />
          </div>
          <span className="font-display text-sm font-semibold text-text">Scheduler</span>
        </div>

        <div className="relative space-y-6">
          <p className="font-display text-3xl font-semibold leading-tight text-text">
            Every job,<br />accounted for.
          </p>
          <p className="text-sm text-muted max-w-xs leading-relaxed">
            SKIP LOCKED claiming, lease-based recovery, and full retry visibility —
            watch the whole fleet breathe in real time.
          </p>
          <div className="rounded-lg border border-border bg-bg/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-muted">worker heartbeats</span>
              <span className="text-[11px] font-mono text-healthy">live</span>
            </div>
            <PulseRail tone="healthy" count={32} />
          </div>
        </div>

        <p className="relative text-[11px] text-muted font-mono">v1.0.0 — control plane</p>
      </div>

      {/* Right: form */}
      <div className="lg:col-span-3 flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div className="space-y-1 mb-6">
            <h1 className="font-display text-2xl font-semibold text-text">Sign in</h1>
            <p className="text-sm text-muted">Access your organization's scheduler dashboard.</p>
          </div>

          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
          </Button>

          <p className="text-center text-xs text-muted">
            Don't have an organization?{' '}
            <Link to="/register" className="text-brand hover:underline">Create one</Link>
          </p>

          <p className="text-center text-[11px] text-muted font-mono border-t border-border pt-4">
            demo: admin@demo.local / ChangeMe123!
          </p>
        </form>
      </div>
    </div>
  );
}
