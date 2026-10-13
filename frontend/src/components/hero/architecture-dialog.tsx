import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Database,
  Layers,
  Server,
  Activity,
  ShieldCheck,
  RotateCcw,
  Zap,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface ArchitectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchitectureDialog({ open, onOpenChange }: ArchitectureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto border-border bg-surface/95 backdrop-blur-xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/15 text-brand">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand font-semibold">
              System Architecture & Core Invariants
            </span>
          </div>
          <DialogTitle className="font-display text-2xl text-text font-bold">
            Distributed Job Scheduler Control Plane
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-sm">
            Transactional queue claiming, distributed lease consensus, and fault-tolerant worker execution.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="topology" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full bg-surface-raised border border-border">
            <TabsTrigger value="topology" className="text-xs sm:text-sm">
              <Layers className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" /> System Topology
            </TabsTrigger>
            <TabsTrigger value="claiming" className="text-xs sm:text-sm">
              <Lock className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" /> SKIP LOCKED Engine
            </TabsTrigger>
            <TabsTrigger value="resilience" className="text-xs sm:text-sm">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" /> Leases & Recovery
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: System Topology */}
          <TabsContent value="topology" className="space-y-4 pt-3">
            <div className="rounded-xl border border-border bg-surface-raised/80 p-4 font-mono text-xs text-text">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-border bg-surface flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-brand font-semibold mb-1">
                      <Server className="h-4 w-4" /> Edge & Ingestion
                    </div>
                    <p className="text-[11px] text-text-secondary font-sans leading-relaxed">
                      Nginx reverse proxy handles SSL, static Vite bundles, and routes REST/WebSocket calls.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] text-text-tertiary">
                    Multi-Tenant Auth · JWT / API Key
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-brand/30 bg-brand/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-brand font-semibold mb-1">
                      <Activity className="h-4 w-4" /> Core Scheduler
                    </div>
                    <p className="text-[11px] text-text-secondary font-sans leading-relaxed">
                      Spring Boot 3 (Java 21) control plane runs dispatcher loop, reaper cycle, and STOMP fanout.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] text-brand/80">
                    Async Executor · Dead-Letter Isolation
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-surface flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-healthy font-semibold mb-1">
                      <Database className="h-4 w-4" /> Storage & Cache
                    </div>
                    <p className="text-[11px] text-text-secondary font-sans leading-relaxed">
                      PostgreSQL guarantees ACID durability; Redis manages worker lease heartbeats and ephemeral keys.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] text-text-tertiary">
                    PostgreSQL 16 · Redis Lettuce Client
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-healthy shrink-0 mt-0.5" />
                <p>
                  <strong className="text-text font-medium">Decoupled Worker Fleet:</strong> Distributed workers poll queues based on concurrency limits, report heartbeat pulses, and release leases upon success.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-healthy shrink-0 mt-0.5" />
                <p>
                  <strong className="text-text font-medium">Telemetry & Observability:</strong> Full Micrometer metrics exposed via Spring Actuator, scraped by Prometheus, and visualized via Grafana dashboards.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SKIP LOCKED Engine */}
          <TabsContent value="claiming" className="space-y-4 pt-3">
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <h4 className="text-sm font-semibold text-text mb-1 flex items-center gap-2">
                <Lock className="h-4 w-4 text-brand" /> Atomic Job Claiming via PostgreSQL
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed mb-3">
                Traditional distributed schedulers suffer from race conditions or lock contention when multiple worker nodes query the database simultaneously.
              </p>
              <div className="rounded-lg bg-bg border border-border p-3 font-mono text-[11px] text-text overflow-x-auto">
                <span className="text-brand">SELECT</span> * <span className="text-brand">FROM</span> jobs<br />
                <span className="text-brand">WHERE</span> status = <span className="text-healthy">'PENDING'</span> <span className="text-brand">AND</span> run_at &lt;= NOW()<br />
                <span className="text-brand">ORDER BY</span> priority <span className="text-brand">DESC</span>, run_at <span className="text-brand">ASC</span><br />
                <span className="text-brand">LIMIT</span> :batchSize<br />
                <span className="text-retry font-bold">FOR UPDATE SKIP LOCKED</span>;
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-secondary">
              <div className="p-3 rounded-lg border border-border bg-surface">
                <span className="font-semibold text-text block mb-1">Why SKIP LOCKED Wins</span>
                Locks matching rows without blocking other worker threads. Workers skip locked items immediately, yielding non-blocking parallel throughput.
              </div>
              <div className="p-3 rounded-lg border border-border bg-surface">
                <span className="font-semibold text-text block mb-1">Zero Race Conditions</span>
                Guarantees that a single job execution cannot be claimed twice across distributed container replicas, even under heavy thundering herds.
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: Leases & Resilience */}
          <TabsContent value="resilience" className="space-y-4 pt-3">
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg border border-border bg-surface-raised">
                <div className="flex items-center gap-2 font-medium text-text text-sm mb-1">
                  <Activity className="h-4 w-4 text-healthy" />
                  Worker Lease Heartbeats & Dead Worker Detection
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Every worker periodically renews an active lease on claimed jobs. If a node crashes, network-partitions, or is OOM-killed, the scheduler's Reaper background service detects the expired lease and safely resets the job to <code className="font-mono text-text">RETRYING</code> or re-dispatches it.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-surface-raised">
                <div className="flex items-center gap-2 font-medium text-text text-sm mb-1">
                  <ShieldCheck className="h-4 w-4 text-brand" />
                  Exponential Jitter & DLQ Quarantine
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Retry delays use full-jitter exponential backoff to prevent thundering herd spikes on downstream databases. Failed attempts exceeding <code className="font-mono text-text">max_retries</code> are immediately safely isolated into the Dead Letter Queue for root cause analysis and manual/AI requeuing.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
