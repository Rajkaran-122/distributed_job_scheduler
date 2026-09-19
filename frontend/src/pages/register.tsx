import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ organizationName: '', fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register(form);
      setSession(data.accessToken, data.refreshToken, data.user);
      toast.success('Organization created', `Welcome, ${data.user.fullName}`);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/15">
            <Activity className="h-4 w-4 text-brand" />
          </div>
          <span className="font-display text-sm font-semibold text-text">Scheduler</span>
        </div>

        <div className="space-y-1 mb-6">
          <h1 className="font-display text-2xl font-semibold text-text">Create your organization</h1>
          <p className="text-sm text-muted">You'll be the OWNER of this workspace.</p>
        </div>

        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        <div>
          <Label htmlFor="organizationName">Organization name</Label>
          <Input id="organizationName" required value={form.organizationName} onChange={(e) => update('organizationName', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="fullName">Your full name</Label>
          <Input id="fullName" required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={12} value={form.password} onChange={(e) => update('password', e.target.value)} />
          <p className="text-[11px] text-muted mt-1">At least 12 characters, with letters and numbers.</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create organization <ArrowRight className="h-4 w-4" /></>}
        </Button>

        <p className="text-center text-xs text-muted">
          Already have an account? <Link to="/login" className="text-brand hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
