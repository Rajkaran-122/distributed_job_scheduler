import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Cpu,
  Database,
  Layers,
  Lock,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
  Building2,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Maximize2,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SchedulerLogo } from '@/components/ui/scheduler-logo';
import { useAuthStore } from '@/store/auth';

export default function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [activeStep, setActiveStep] = useState<number>(0);

  const STEPS = [
    {
      num: '01',
      title: 'Client API Ingestion',
      subtitle: 'HTTP POST /api/v1/jobs',
      desc: 'Submissions are validated, attributed to the tenant org, and persisted with status PENDING and target run_at timestamp.',
      badge: 'ACID Persisted',
    },
    {
      num: '02',
      title: 'Atomic SKIP LOCKED Claiming',
      subtitle: 'PostgreSQL Row Locking',
      desc: 'The leader scheduler node claims due jobs using non-blocking row locks. Parallel worker instances never wait or dual-execute.',
      badge: 'Zero Contention',
    },
    {
      num: '03',
      title: 'Fast Redis Memory Buffer',
      subtitle: 'BLPOP Dispatch Channel',
      desc: 'Upon DB transaction commit, job IDs are dispatched into Redis queue lists for instant microsecond pickup by workers.',
      badge: '< 5ms Latency',
    },
    {
      num: '04',
      title: 'Worker Fleet & Heartbeat Leases',
      subtitle: 'Dynamic Lease Pulse',
      desc: 'Executing workers emit periodic heartbeat pulses to Redis. Active leases prevent orphan collisions across nodes.',
      badge: 'Heartbeat Protected',
    },
    {
      num: '05',
      title: 'Autonomous Reaper & Jitter Retry',
      subtitle: 'Self-Healing Consensus',
      desc: 'Crashed worker leases are reclaimed within 5 seconds. Failures retry with randomized full jitter to avoid thundering herds.',
      badge: 'Crash Resilient',
    },
  ];

  const FEATURES = [
    {
      id: 'skip-locked',
      title: 'Atomic Queue Claiming',
      subtitle: 'PostgreSQL SKIP LOCKED',
      description:
        'Workers atomically claim pending jobs with zero race conditions. Multiple threads query the database simultaneously without table locking or dual execution.',
      icon: Lock,
      tag: '0 Contention',
    },
    {
      id: 'redis-leases',
      title: 'Distributed Lease Heartbeats',
      subtitle: 'Redis & Autonomous Reaper',
      description:
        'Active executions hold renewable leases in Redis. If a worker node crashes or network partitions, the Reaper engine reclaims the lease and reschedules.',
      icon: Activity,
      tag: 'Self-Healing',
    },
    {
      id: 'exponential-jitter',
      title: 'Smart Jittered Retries',
      subtitle: 'Thundering-Herd Prevention',
      description:
        'Pure framework-free exponential backoff with full randomized jitter prevents synchronized thundering herds against your downstream infrastructure.',
      icon: Zap,
      tag: 'Jitter Safe',
    },
    {
      id: 'dlq-quarantine',
      title: 'Dead Letter Isolation',
      subtitle: 'Zero Silent Failures',
      description:
        'Exhausted jobs automatically route to quarantine with error traces, attempt tallies, and input payloads preserved for 1-click manual or AI requeue.',
      icon: ShieldCheck,
      tag: 'Guaranteed Audit',
    },
    {
      id: 'ai-insights',
      title: 'AI Root-Cause Diagnosis',
      subtitle: 'Provider-Agnostic LLM',
      description:
        'Intelligent failure explanations, dynamic retry tuning, and automated root cause analysis generated directly from runtime execution logs.',
      icon: Sparkles,
      tag: 'Autonomous AI',
    },
    {
      id: 'multi-tenant',
      title: 'Multi-Tenant RBAC Security',
      subtitle: 'Strict Isolation & API Keys',
      description:
        'Enterprise organization boundaries with Owner, Admin, Developer, and Viewer roles. Programmatic access via hashed X-API-Key credentials.',
      icon: Building2,
      tag: 'Tenant Isolated',
    },
    {
      id: 'telemetry',
      title: 'Real-Time Telemetry & STOMP',
      subtitle: 'Sub-Second Event Stream',
      description:
        'Live WebSocket event bus streams job transitions directly to the browser. Prometheus actuator metrics preconfigured for Grafana visualization.',
      icon: Activity,
      tag: 'Live WebSocket',
    },
    {
      id: 'cron-engine',
      title: 'High-Precision Cron & Delay',
      subtitle: 'One-Off, Delayed & Recurring',
      description:
        'Full support for standard 5-field cron syntax, delayed future timestamp runs, and instant one-off executions with customizable priority queues.',
      icon: Clock,
      tag: 'Micro-Delay',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080A0F] text-slate-100 selection:bg-blue-500/30 selection:text-white">
      {/* ================= 1. PUBLIC TOP NAVIGATION ================= */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0D14]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <SchedulerLogo size="md" showText={true} />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <Link
              to="/architecture"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Architecture Spec</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400">
                Full Page
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] text-xs sm:text-sm font-medium"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-xs sm:text-sm text-slate-300 hover:text-white"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] text-xs sm:text-sm font-medium"
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= 2. HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left Column: Typography & CTAs */}
            <div className="flex flex-col justify-center space-y-6 lg:col-span-7">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                </span>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Distributed Orchestration Core
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl xl:text-6xl leading-[1.08]">
                Complex workflows.{' '}
                <span className="block mt-1 text-blue-400">
                  Intelligently orchestrated.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                An enterprise distributed job scheduling platform engineered for mission-critical reliability.
                Combines PostgreSQL <code className="font-mono text-blue-300 text-sm">SKIP LOCKED</code> atomic claiming,
                autonomous Redis lease recovery, and intelligent telemetry streaming across your entire worker fleet.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                  className="bg-blue-600 hover:bg-blue-500 px-7 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all active:scale-[0.98]"
                >
                  <span>{isAuthenticated ? 'Open Control Plane' : 'Explore the Platform'}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/architecture')}
                  className="border-white/15 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-blue-500/50 hover:bg-blue-500/10 active:scale-[0.98]"
                >
                  <Layers className="mr-2 h-4 w-4 text-blue-400" />
                  <span>View Full Architecture Spec</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Video Artwork (Clean, no floating overlay boxes) */}
            <div className="relative flex items-center justify-center lg:col-span-5">
              <div className="relative w-full max-w-[440px] aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E17] shadow-2xl">
                <video
                  src="/ai-intelligence-core.mp4"
                  poster="/ai-neural-core-poster.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. STATS STRIP ================= */}
      <section className="border-y border-white/10 bg-[#0A0D14] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-white mono-tabular">100%</p>
              <p className="text-xs text-slate-400 mt-1">Race-Condition Immune</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-blue-400 mono-tabular">&lt; 50ms</p>
              <p className="text-xs text-slate-400 mt-1">Dispatch Claim Latency</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-white mono-tabular">Automatic</p>
              <p className="text-xs text-slate-400 mt-1">Dead Lease Recovery</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-blue-400 mono-tabular">Sub-second</p>
              <p className="text-xs text-slate-400 mt-1">STOMP Telemetry Fanout</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. ALL PROJECT FEATURES SHOWCASE ================= */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3 mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-blue-400 font-semibold">
              Complete Feature Arsenal
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Built for resilient distributed workloads at scale.
            </h2>
            <p className="text-slate-400 text-base">
              Every component is intentionally architected to guarantee at-least-once execution, prevent cascading failures, and provide instant operational visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-[#0D111A] p-6 shadow-sm hover:border-blue-500/40 hover:bg-[#111724] transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/30 text-blue-400 bg-blue-500/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {f.tag}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {f.title}
                    </h3>
                    <p className="font-mono text-[11px] text-blue-400/80 mt-0.5 mb-2.5">
                      {f.subtitle}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {f.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 5. HOW IT WORKS: WORKFLOW SHOWCASE ================= */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-[#0A0D14] border-y border-white/10 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl space-y-3">
              <span className="font-mono text-xs uppercase tracking-widest text-blue-400 font-semibold flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                How It Works · Execution Blueprint
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                Distributed Execution &amp; Consensus Workflow
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Step-by-step lifecycle of an asynchronous job: from client HTTP ingestion, PostgreSQL transactional row lock, to Redis memory dispatch and autonomous lease healing.
              </p>
            </div>

            <Button
              onClick={() => navigate('/architecture')}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-md self-start md:self-end text-xs sm:text-sm shrink-0 font-medium"
            >
              <span>Explore Architecture Spec</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Clean Black Theme Architecture Diagram */}
          <div className="rounded-2xl border border-white/10 bg-[#05070B] p-4 sm:p-6 shadow-2xl overflow-hidden mb-10 group">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="font-mono text-xs text-slate-300">
                  Job Lifecycle Data Flow Architecture (DFD)
                </span>
              </div>
              <Link
                to="/architecture"
                className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
              >
                <span>View Full Page</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-white/5 bg-black">
              <img
                src="/architecture/dfd-job-lifecycle.jpg"
                alt="Distributed Job Scheduler Architecture and Workflow Lifecycle"
                className="w-full object-contain max-h-[520px] mx-auto rounded-lg"
              />
            </div>
          </div>

          {/* Step-by-Step Interactive Workflow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STEPS.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`cursor-pointer rounded-xl border p-4.5 transition-all flex flex-col justify-between ${
                  activeStep === idx
                    ? 'border-blue-500 bg-[#131926] shadow-sm ring-1 ring-blue-500'
                    : 'border-white/10 bg-[#0D111A] hover:border-white/20 hover:bg-[#111724]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
                      {step.badge}
                    </span>
                  </div>
                  <h4 className="font-display text-sm font-semibold text-white mb-1">
                    {step.title}
                  </h4>
                  <p className="font-mono text-[10px] text-blue-400/80 mb-2">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. SYSTEM ARCHITECTURE & TOPOLOGY SHOWCASE ================= */}
      <section id="architecture" className="py-20 sm:py-28 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-[#0D111A] p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-2xl">
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Context & Core Invariants */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-blue-400">
                  <Zap className="h-3.5 w-3.5 text-blue-400" />
                  <span>System Architecture &amp; Core Invariants</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  Distributed Job Scheduler Control Plane
                </h2>

                <p className="text-slate-400 text-base leading-relaxed">
                  Transactional queue claiming, distributed lease consensus, and fault-tolerant worker execution.
                  Zero external distributed locks required — strictly coordinated via atomic PostgreSQL primitives and Redis ephemeral heartbeats.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#131926] p-3.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display text-sm font-semibold text-white">
                        PostgreSQL SKIP LOCKED Invariant
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Multiple replicas query concurrently without lock waits or dual-executions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#131926] p-3.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display text-sm font-semibold text-white">
                        Autonomous Redis Lease Reaping
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Heartbeat expiration reclaims orphaned executions within 5s if a node crashes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#131926] p-3.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display text-sm font-semibold text-white">
                        Full-Jitter Backoff &amp; DLQ Isolation
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Prevents downstream thundering-herd waves; quarantines exhausted payloads safely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    onClick={() => navigate('/architecture')}
                    className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] px-7 font-medium"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    <span>Open Full Page Architecture Spec</span>
                  </Button>
                </div>
              </div>

              {/* Right Column: Ai_image.png Architecture Preview */}
              <div className="lg:col-span-6">
                <div
                  onClick={() => navigate('/architecture')}
                  className="cursor-pointer group relative rounded-2xl border border-white/10 bg-[#05070B] p-3 shadow-2xl overflow-hidden hover:border-blue-500/40 transition-all flex items-center justify-center"
                >
                  <img
                    src="/Ai_image.png"
                    alt="Distributed Job Scheduler Architecture"
                    className="w-full object-contain rounded-xl max-h-[560px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold">
                      <Maximize2 className="h-4 w-4" />
                      Click to explore full diagrams (HLD · DFD · LLD)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. CALL TO ACTION ================= */}
      <section className="py-20 border-t border-white/10 bg-[#0A0D14]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="font-mono text-xs text-blue-400 font-medium">Ready for deployment</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Take full control of your distributed queue fleet.
          </h2>

          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Log in to the live control plane or register a new tenant workspace to monitor workers, manage queues, and schedule recurring workloads.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] px-8 font-medium"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Sign in to Control Plane'}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!isAuthenticated && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/register')}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                Register Organization
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-500 font-mono pt-4">
            Default sandbox credentials: <code className="text-slate-300">admin@demo.local</code> / <code className="text-slate-300">ChangeMe123!</code>
          </p>
        </div>
      </section>

      {/* ================= 8. FOOTER ================= */}
      <footer className="border-t border-white/10 py-8 bg-[#080A0F]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <SchedulerLogo size="sm" withPulse={false} />
            <span className="font-display font-medium text-white">Distributed Job Scheduler</span>
            <span>· Control Plane v1.0.0</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Rajkaran-122/distributed_job_scheduler"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              GitHub Repository <ExternalLink className="h-3 w-3" />
            </a>
            <Link to="/architecture" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Architecture Spec (Full Page)
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Control Plane Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
