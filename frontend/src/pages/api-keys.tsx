import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Plus, Copy, Check, Trash2, Loader2 } from 'lucide-react';
import { apiKeysApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import type { ApiKeyResponse } from '@/types/api';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [justCreated, setJustCreated] = useState<ApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => apiKeysApi.create({ name }),
    onSuccess: (key) => {
      setKeys((k) => [key, ...k]);
      setJustCreated(key);
      setName('');
      toast.success('API key created', 'Copy it now — it will not be shown again.');
    },
    onError: (err: any) => toast.error('Could not create key', err?.response?.data?.message),
  });

  async function revoke(id: string) {
    try {
      await apiKeysApi.revoke(id);
      setKeys((k) => k.filter((x) => x.id !== id));
      toast.info('Key revoked');
    } catch (err: any) {
      toast.error('Could not revoke key', err?.response?.data?.message);
    }
  }

  function copyKey(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-brand" />
          <div>
            <h1 className="font-display text-xl font-semibold text-text">API Keys</h1>
            <p className="text-sm text-muted">Programmatic access via <code className="font-mono text-xs">X-API-Key</code>.</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setJustCreated(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> New key</Button></DialogTrigger>
          <DialogContent>
            {!justCreated ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create an API key</DialogTitle>
                  <DialogDescription>Scoped to jobs:read and jobs:write by default.</DialogDescription>
                </DialogHeader>
                <div>
                  <Label htmlFor="keyname">Name</Label>
                  <Input id="keyname" placeholder="CI pipeline" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button disabled={!name || createMutation.isPending} onClick={() => createMutation.mutate()}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Key created</DialogTitle>
                  <DialogDescription>This is shown once. Store it somewhere safe.</DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 rounded-md border border-border bg-surface-raised p-3">
                  <code className="flex-1 text-xs font-mono text-text break-all">{justCreated.plaintextKey}</code>
                  <Button size="icon" variant="ghost" onClick={() => copyKey(justCreated.plaintextKey ?? '')}>
                    {copied ? <Check className="h-4 w-4 text-healthy" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setOpen(false); setJustCreated(null); }}>Done</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Keys created this session</CardTitle>
            <CardDescription>Full history lives in the Audit Log — plaintext keys are never retrievable again.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {keys.length === 0 && <p className="text-xs text-muted py-8 text-center">No keys created yet in this session.</p>}
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-text">{k.name}</p>
                <p className="text-[11px] font-mono text-muted">{k.keyPrefix}…</p>
                <p className="text-[11px] text-muted mt-0.5">Created {formatDateTime(k.createdAt)}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => revoke(k.id)}>
                <Trash2 className="h-3.5 w-3.5 text-danger" /> Revoke
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
