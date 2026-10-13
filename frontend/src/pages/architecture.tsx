import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Layers,
  Server,
  Activity,
  ShieldCheck,
  Zap,
  Lock,
  Maximize2,
  X,
  Copy,
  Check,
  Cpu,
  FileCode,
  Radio,
  ExternalLink,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SchedulerLogo } from '@/components/ui/scheduler-logo';
import { useAuthStore } from '@/store/auth';

type ArchTab = 'dfd' | 'hld' | 'lld';

export default function ArchitecturePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [activeTab, setActiveTab] = useState<ArchTab>('dfd');
  const [zoomImg, setZoomImg] = useState<{ src: string; title: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copySnippet = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-slate-100 selection:bg-blue-500/30 selection:text-white">
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0D14]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="group flex items-center gap-2.5">
              <SchedulerLogo size="md" showText={true} />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs sm:text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Button>

            {isAuthenticated ? (
              <Button
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] text-xs sm:text-sm font-medium"
              >
                <span>Dashboard</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] text-xs sm:text-sm font-medium"
              >
                <span>Sign in</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO HEADER ================= */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#0A0D14] py-12 sm:py-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-blue-400">
              <Zap className="h-3.5 w-3.5 text-blue-400" />
              <span>System Architecture &amp; Core Invariants</span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Distributed Job Scheduler Control Plane
            </h1>

            <p className="text-base text-slate-300 sm:text-lg leading-relaxed max-w-3xl">
              Transactional queue claiming, distributed lease consensus, and fault-tolerant worker execution.
              Engineered with PostgreSQL <code className="font-mono text-blue-300 text-sm">SKIP LOCKED</code>,
              Redis lease heartbeats, and autonomous crash recovery to prevent double-execution across distributed worker fleets.
            </p>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#131926] px-3 py-1.5 font-mono text-xs text-slate-300">
                <Lock className="h-3.5 w-3.5 text-blue-400" />
                <span>Postgres SKIP LOCKED Claiming</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#131926] px-3 py-1.5 font-mono text-xs text-slate-300">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
                <span>Redis Lease Heartbeats &amp; Reaper</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#131926] px-3 py-1.5 font-mono text-xs text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Exponential Jitter Retries &amp; DLQ</span>
              </span>
            </div>
          </div>

          {/* Architecture Navigation Tabs */}
          <div className="mt-10 flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('dfd')}
              className={`relative px-5 py-3 font-display text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'dfd'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>Job Lifecycle &amp; Data Flow (DFD)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131926] border border-white/10 text-blue-400">
                How It Works
              </span>
            </button>

            <button
              onClick={() => setActiveTab('hld')}
              className={`relative px-5 py-3 font-display text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'hld'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>High-Level Design (HLD)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131926] border border-white/10 text-slate-300">
                System Topology
              </span>
            </button>

            <button
              onClick={() => setActiveTab('lld')}
              className={`relative px-5 py-3 font-display text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'lld'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Low-Level Design (LLD)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131926] border border-white/10 text-slate-300">
                Engine Internals
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= TAB CONTENT 1: DATA FLOW DIAGRAM (DFD) ================= */}
      {activeTab === 'dfd' && (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          {/* Main Diagram Showcase Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0D111A] p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-blue-400 font-semibold">
                  Workflow Blueprint · DFD.md
                </span>
                <h2 className="font-display text-2xl font-bold text-white mt-1">
                  End-to-End Job Lifecycle &amp; Transition Engine
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  From HTTP creation to zero-lock claim, memory queueing, worker execution, heartbeats, and autonomous resolution.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setZoomImg({
                      src: '/architecture/dfd-job-lifecycle.jpg',
                      title: 'Data Flow Diagram — Job Lifecycle',
                    })
                  }
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 text-xs"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  Full-Screen Diagram
                </Button>
              </div>
            </div>

            {/* Diagram Graphic */}
            <div className="relative mt-6 group rounded-xl overflow-hidden border border-white/10 bg-black">
              <img
                src="/architecture/dfd-job-lifecycle.jpg"
                alt="Distributed Job Scheduler Architecture and Workflow Lifecycle"
                className="w-full object-contain max-h-[600px] mx-auto"
              />
              <button
                onClick={() =>
                  setZoomImg({
                    src: '/architecture/dfd-job-lifecycle.jpg',
                    title: 'Data Flow Diagram — Job Lifecycle',
                  })
                }
                className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-xs font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="h-3.5 w-3.5 text-blue-400" />
                Click to inspect full screen
              </button>
            </div>
          </div>

          {/* Step-by-Step Flow Walkthrough */}
          <div className="space-y-6">
            <div className="max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wider text-blue-400 font-semibold">
                Interactive Walkthrough
              </span>
              <h3 className="font-display text-2xl font-bold text-white mt-1">
                How It Works: Step-by-Step Distributed Protocol
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 font-mono text-xs font-bold">
                      01
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      HTTP POST
                    </span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Creation &amp; Persistence
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    A client or cron trigger submits a request. The job is instantly inserted into PostgreSQL with status <code className="text-blue-300 font-mono">PENDING</code> and target <code className="text-white font-mono">run_at</code> timestamp.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-blue-400">
                  Status: PENDING
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 font-mono text-xs font-bold">
                      02
                    </span>
                    <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded">
                      SKIP LOCKED
                    </span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Leader Dispatch &amp; Claim
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    The active elected scheduler leader polls Postgres using non-blocking row claiming. Multiple threads atomically claim batches without deadlocks or waiting locks.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-blue-400">
                  Status: QUEUED
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 font-mono text-xs font-bold">
                      03
                    </span>
                    <span className="font-mono text-[10px] text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      REDIS BLPOP
                    </span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Fast Memory Queueing
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    After transactional commit in Postgres, job IDs are pushed to Redis memory lists. Distributed worker nodes receive work via blocking pop (<code className="text-blue-300 font-mono">BLPOP</code>) in sub-milliseconds.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-blue-400">
                  Latency: &lt; 5ms
                </div>
              </div>

              {/* Step 4 */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 font-mono text-xs font-bold">
                      04
                    </span>
                    <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded">
                      LEASE HEARTBEAT
                    </span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Execution &amp; Lease Pulse
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    The worker marks the job <code className="text-blue-300 font-mono">RUNNING</code> and executes the payload while periodically emitting heartbeat leases to Redis.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-blue-400">
                  Status: RUNNING
                </div>
              </div>

              {/* Step 5 */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 font-mono text-xs font-bold">
                      05
                    </span>
                    <span className="font-mono text-[10px] text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      EXPONENTIAL JITTER
                    </span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Retry &amp; Thundering-Herd Shield
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    If an exception occurs and retries remain, the calculator computes next <code className="text-blue-300 font-mono">run_at</code> with randomized jitter to de-synchronize retry waves against downstream services.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-blue-400">
                  Backoff: Exponential + Jitter
                </div>
              </div>

              {/* Step 6 */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 font-mono text-xs font-bold">
                      06
                    </span>
                    <span className="font-mono text-[10px] text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                      AUTO REAPER
                    </span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-white">
                    Crash Recovery &amp; DLQ Isolation
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    If a worker node crashes mid-execution, its Redis lease expires. The autonomous <code className="text-white font-mono">LeaseReaperService</code> detects the dead lease, salvaging the job back to <code className="text-blue-300 font-mono">PENDING</code>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-blue-400">
                  Status: DEAD_LETTER / RECLAIMED
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= TAB CONTENT 2: HIGH-LEVEL DESIGN (HLD) ================= */}
      {activeTab === 'hld' && (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          {/* Main Diagram Showcase Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0D111A] p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-blue-400 font-semibold">
                  System Architecture · HLD.md
                </span>
                <h2 className="font-display text-2xl font-bold text-white mt-1">
                  Full-Stack Distributed System Topology
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Primary communication paths across Web Client, Nginx Gateway, Spring Boot Core, PostgreSQL, Redis, and Observability.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setZoomImg({
                      src: '/architecture/hld-system-topology.svg',
                      title: 'High-Level Design — System Architecture Topology',
                    })
                  }
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 text-xs"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  Full-Screen Diagram
                </Button>
              </div>
            </div>

            {/* Diagram Graphic */}
            <div className="relative mt-6 group rounded-xl overflow-hidden border border-white/10 bg-[#05070B]">
              <img
                src="/architecture/hld-system-topology.svg"
                alt="Distributed Job Scheduler High-Level Architecture Topology"
                className="w-full object-contain max-h-[600px] mx-auto"
              />
              <button
                onClick={() =>
                  setZoomImg({
                    src: '/architecture/hld-system-topology.svg',
                    title: 'High-Level Design — System Architecture Topology',
                  })
                }
                className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-xs font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="h-3.5 w-3.5 text-blue-400" />
                Click to inspect full screen
              </button>
            </div>
          </div>

          {/* Component Deep Dives */}
          <div className="space-y-6">
            <div className="max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wider text-blue-400 font-semibold">
                Architecture Components
              </span>
              <h3 className="font-display text-2xl font-bold text-white mt-1">
                Subsystems &amp; Invariant Boundaries
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-sm">
                      1. Nginx API Gateway &amp; Reverse Proxy
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">Edge Ingress · SSL Termination · HTTP/2</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Acts as the unified edge gateway. Serves the optimized Vite React static bundle, terminates TLS, and proxies REST and WebSocket (<code className="font-mono text-blue-300">/ws/jobs</code>) connections seamlessly to backend instances.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-sm">
                      2. Spring Boot 3 Engine (Java 21)
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">Control Plane · Dispatcher · Reaper Loop</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The mission-critical orchestrator running on virtual threads and Java 21. Coordinates multi-tenant JWT and X-API-Key authentication, transactional job claiming, Redis leader coordination, and real-time STOMP event dispatch.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-sm">
                      3. PostgreSQL 16 (SKIP LOCKED Queue)
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">ACID Durability · Zero Race Claims</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Doubles as durable storage and atomic queue using <code className="font-mono text-blue-300">SELECT ... FOR UPDATE SKIP LOCKED</code>. Allows dozens of worker threads to query concurrently without table locks, serialization errors, or duplicate executions.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-sm">
                      4. Redis Cache &amp; Ephemeral Engine
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">Lettuce Driver · Leases · Pub/Sub</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Powers distributed leader election locks, sub-millisecond worker queue dispatch via <code className="font-mono text-blue-300">BLPOP</code>, dynamic worker lease heartbeats, and pub/sub message broadcast to browser clients.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-5 space-y-3 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <Radio className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-sm">
                      5. Full Observability: Prometheus &amp; Grafana Stack
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">Micrometer Metrics · Scrape Endpoints · Real-time Telemetry</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Spring Boot Actuator exports fine-grained Micrometer metrics (job throughput, dispatch latency, worker thread utilization, queue backpressure) scraped by Prometheus at <code className="font-mono text-white">/actuator/prometheus</code> and visualized in Grafana dashboards.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= TAB CONTENT 3: LOW-LEVEL DESIGN (LLD) ================= */}
      {activeTab === 'lld' && (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          {/* Main Diagram Showcase Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0D111A] p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-blue-400 font-semibold">
                  Internal Mechanics · LLD.md
                </span>
                <h2 className="font-display text-2xl font-bold text-white mt-1">
                  Spring Boot Low-Level Job Execution Loop
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  JobRepository SKIP LOCKED row concurrency, Leader Elector, TransactionSynchronization afterCommit hook, and Lease Reaper.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setZoomImg({
                      src: '/architecture/lld-engine-loop.svg',
                      title: 'Low-Level Design — Spring Boot Execution Loop',
                    })
                  }
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 text-xs"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  Full-Screen Diagram
                </Button>
              </div>
            </div>

            {/* Diagram Graphic */}
            <div className="relative mt-6 group rounded-xl overflow-hidden border border-white/10 bg-[#05070B]">
              <img
                src="/architecture/lld-engine-loop.svg"
                alt="Spring Boot Low-Level Job Execution Loop"
                className="w-full object-contain max-h-[600px] mx-auto"
              />
              <button
                onClick={() =>
                  setZoomImg({
                    src: '/architecture/lld-engine-loop.svg',
                    title: 'Low-Level Design — Spring Boot Execution Loop',
                  })
                }
                className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-xs font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="h-3.5 w-3.5 text-blue-400" />
                Click to inspect full screen
              </button>
            </div>
          </div>

          {/* Interactive Code & Implementation Invariants */}
          <div className="space-y-6">
            <div className="max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wider text-blue-400 font-semibold">
                Engine Invariants
              </span>
              <h3 className="font-display text-2xl font-bold text-white mt-1">
                Zero-Contention Code Implementations
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: SKIP LOCKED SQL */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] shadow-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#131926] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-blue-400" />
                      <span className="font-mono text-xs text-white font-semibold">
                        JobRepository.sql (Atomic Claim)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copySnippet(
                          'sql',
                          `SELECT id, payload, retry_count FROM job_executions\nWHERE status = 'PENDING' AND run_at <= NOW()\nORDER BY priority DESC, run_at ASC\nLIMIT :batchSize\nFOR UPDATE SKIP LOCKED;`
                        )
                      }
                      className="h-7 text-xs text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'sql' ? <Check className="h-3.5 w-3.5 text-blue-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed text-slate-200">
                    <pre>
                      <span className="text-blue-400">SELECT</span> id, payload, retry_count{'\n'}
                      <span className="text-blue-400">FROM</span> job_executions{'\n'}
                      <span className="text-blue-400">WHERE</span> status = <span className="text-white">'PENDING'</span>{'\n'}
                      {'  '}<span className="text-blue-400">AND</span> run_at &lt;= <span className="text-blue-300">NOW()</span>{'\n'}
                      <span className="text-blue-400">ORDER BY</span> priority <span className="text-blue-400">DESC</span>, run_at <span className="text-blue-400">ASC</span>{'\n'}
                      <span className="text-blue-400">LIMIT</span> :batchSize{'\n'}
                      <span className="text-white font-bold underline decoration-blue-500">FOR UPDATE SKIP LOCKED</span>;
                    </pre>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-[#101522] text-xs text-slate-400 leading-relaxed">
                  <strong className="text-white font-medium">Why it guarantees zero double-execution:</strong> If Replica A locks rows 1 &amp; 2, Replica B instantly skips them without waiting, claiming rows 3 &amp; 4. Locks release automatically upon transaction commit.
                </div>
              </div>

              {/* Box 2: TransactionSynchronizationManager Hook */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] shadow-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#131926] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-blue-400" />
                      <span className="font-mono text-xs text-white font-semibold">
                        JobDispatchService.java (afterCommit Hook)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copySnippet(
                          'tx',
                          `@Transactional\npublic void dispatchBatch() {\n  List<Job> claimed = jobRepo.claimPending(batchSize);\n  claimed.forEach(j -> j.setStatus(Status.QUEUED));\n\n  TransactionSynchronizationManager.registerSynchronization(\n    new TransactionSynchronization() {\n      @Override\n      public void afterCommit() {\n        claimed.forEach(j -> redisTemplate.opsForList().rightPush("queue:" + j.getQueueName(), j.getId()));\n      }\n    }\n  );\n}`
                        )
                      }
                      className="h-7 text-xs text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'tx' ? <Check className="h-3.5 w-3.5 text-blue-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed text-slate-200">
                    <pre>
                      <span className="text-blue-400">@Transactional</span>{'\n'}
                      <span className="text-blue-400">public void</span> <span className="text-white font-semibold">dispatchBatch</span>() {'{'}{'\n'}
                      {'  '}List&lt;Job&gt; claimed = jobRepo.claimPending(batchSize);{'\n'}
                      {'  '}claimed.forEach(j -&gt; j.setStatus(Status.QUEUED));{'\n\n'}
                      {'  '}TransactionSynchronizationManager.registerSynchronization({'\n'}
                      {'    '}<span className="text-blue-400">new</span> TransactionSynchronization() {'{'}{'\n'}
                      {'      '}<span className="text-blue-400">@Override</span>{'\n'}
                      {'      '}<span className="text-blue-400">public void</span> <span className="text-blue-300">afterCommit</span>() {'{'}{'\n'}
                      {'        '}claimed.forEach(j -&gt; redis.opsForList().rightPush(j.getId()));{'\n'}
                      {'      '}{'}'}{'\n'}
                      {'    '}{'}'});{'\n'}
                      {'}'}
                    </pre>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-[#101522] text-xs text-slate-400 leading-relaxed">
                  <strong className="text-white font-medium">Why the hook is essential:</strong> Guarantees jobs are pushed to the Redis fast memory buffer <em>only after</em> the PostgreSQL transaction commits safely, preventing phantom jobs.
                </div>
              </div>

              {/* Box 3: Exponential Backoff with Jitter */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] shadow-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#131926] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-blue-400" />
                      <span className="font-mono text-xs text-white font-semibold">
                        RetryPolicyCalculator.java (Full Jitter)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copySnippet(
                          'jitter',
                          `long baseDelay = initialIntervalMs * (long) Math.pow(multiplier, attempt - 1);\nlong cappedDelay = Math.min(baseDelay, maxIntervalMs);\nlong jitteredDelay = ThreadLocalRandom.current().nextLong(0, cappedDelay + 1);\nreturn Instant.now().plusMillis(jitteredDelay);`
                        )
                      }
                      className="h-7 text-xs text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'jitter' ? <Check className="h-3.5 w-3.5 text-blue-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed text-slate-200">
                    <pre>
                      <span className="text-blue-400">long</span> base = initialMs * (<span className="text-blue-400">long</span>) Math.pow(mult, attempt - 1);{'\n'}
                      <span className="text-blue-400">long</span> capped = Math.min(base, maxMs);{'\n\n'}
                      <span className="text-slate-500">{'// Full-jitter randomized variance to prevent sync waves'}</span>{'\n'}
                      <span className="text-blue-400">long</span> jitter = ThreadLocalRandom.current().nextLong(0, capped + 1);{'\n'}
                      <span className="text-blue-400">return</span> Instant.now().plusMillis(jitter);
                    </pre>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-[#101522] text-xs text-slate-400 leading-relaxed">
                  <strong className="text-white font-medium">Thundering-herd immunity:</strong> Without jitter, thousands of failed jobs retry at the exact same second, causing downstream denial-of-service. Jitter scatters retries evenly over time.
                </div>
              </div>

              {/* Box 4: Lease Reaper Service */}
              <div className="rounded-xl border border-white/10 bg-[#0D111A] shadow-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#131926] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-blue-400" />
                      <span className="font-mono text-xs text-white font-semibold">
                        LeaseReaperService.java (Auto Failover)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copySnippet(
                          'reaper',
                          `@Scheduled(fixedDelay = 5000)\npublic void reclaimExpiredLeases() {\n  Instant threshold = Instant.now().minus(leaseTimeout);\n  List<Job> expired = jobRepository.findExpiredLeases(threshold);\n  expired.forEach(job -> {\n    log.warn("Reclaiming abandoned lease for job: {}", job.getId());\n    job.reclaimExpiredLease();\n  });\n}`
                        )
                      }
                      className="h-7 text-xs text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'reaper' ? <Check className="h-3.5 w-3.5 text-blue-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed text-slate-200">
                    <pre>
                      <span className="text-blue-400">@Scheduled</span>(fixedDelay = 5000){'\n'}
                      <span className="text-blue-400">public void</span> <span className="text-white font-semibold">reclaimExpiredLeases</span>() {'{'}{'\n'}
                      {'  '}Instant threshold = Instant.now().minus(leaseTimeout);{'\n'}
                      {'  '}List&lt;Job&gt; expired = jobRepo.findExpired(threshold);{'\n\n'}
                      {'  '}expired.forEach(j -&gt; {'{'}{'\n'}
                      {'    '}log.warn(<span className="text-slate-300">"Reclaiming crashed worker job: {}"</span>, j.getId());{'\n'}
                      {'    '}j.reclaimExpiredLease(); <span className="text-slate-500">// resets to PENDING / DLQ</span>{'\n'}
                      {'  '}{'}'});{'\n'}
                      {'}'}
                    </pre>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-[#101522] text-xs text-slate-400 leading-relaxed">
                  <strong className="text-white font-medium">Worker Crash Resilience:</strong> If a node is OOM-killed or network partitions, its heartbeat stops. The reaper detects the expired lease within 5s, restoring the job automatically.
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= LIGHTBOX / FULL-SCREEN IMAGE MODAL ================= */}
      {zoomImg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-8 animate-fade-in"
          onClick={() => setZoomImg(null)}
        >
          <div
            className="relative max-h-[95vh] max-w-[96vw] overflow-hidden rounded-2xl border border-white/20 bg-[#080A10] p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0D111A]">
              <span className="font-display font-semibold text-sm text-white">
                {zoomImg.title}
              </span>
              <button
                onClick={() => setZoomImg(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[82vh] overflow-auto p-2 bg-black flex items-center justify-center">
              <img
                src={zoomImg.src}
                alt={zoomImg.title}
                className="w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 py-8 bg-[#080A0F] mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <SchedulerLogo size="sm" withPulse={false} />
            <span className="font-display font-medium text-white">Distributed Job Scheduler</span>
            <span>· Control Plane Architecture v1.0.0</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">
              Control Plane Dashboard
            </Link>
            <a
              href="https://github.com/Rajkaran-122/distributed_job_scheduler"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
