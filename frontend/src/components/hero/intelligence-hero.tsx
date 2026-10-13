import * as React from 'react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Layers,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  Server,
  Database,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArchitectureDialog } from './architecture-dialog';

interface IntelligenceHeroProps {
  activeWorkers?: number;
  runningJobs?: number;
  pendingJobs?: number;
  connected?: boolean;
  onExploreClick?: () => void;
}

export function IntelligenceHero({
  activeWorkers = 0,
  runningJobs = 0,
  pendingJobs = 0,
  connected = true,
  onExploreClick,
}: IntelligenceHeroProps) {
  const navigate = useNavigate();
  const [archOpen, setArchOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleExplore = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      navigate('/jobs');
    }
  };

  return (
    <>
      <section
        aria-label="Platform Overview Hero"
        className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-[#0F1420] via-[#0B0E17] to-[#080A10] p-6 sm:p-8 lg:p-10 shadow-2xl"
      >
        {/* Ambient atmospheric background glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px] animate-glow-breathe"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -right-20 h-96 w-96 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-violet-600/5 blur-[90px]"
        />

        {/* Subtle background tech grid lines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70"
        />

        <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-8">
          {/* ================= LEFT COLUMN ================= */}
          <div className="flex flex-col justify-center space-y-5 lg:col-span-7">
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-brand/30 bg-brand/10 px-3 py-1 shadow-[0_0_15px_rgba(91,141,239,0.15)] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                Intelligence Meets Automation
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl xl:text-5xl leading-[1.12]">
              Complex workflows.{' '}
              <span className="block mt-1 bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Intelligently orchestrated.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
              A distributed scheduling and execution plane built for precision. Coordinate asynchronous workloads,
              atomic queue claiming, and resilient worker failover with real-time operational telemetry.
            </p>

            {/* Action Hierarchy CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={handleExplore}
                className="group relative overflow-hidden bg-brand px-6 text-sm font-medium text-white shadow-[0_0_20px_rgba(91,141,239,0.3)] transition-all hover:bg-brand-muted hover:shadow-[0_0_25px_rgba(91,141,239,0.5)] active:scale-[0.98]"
              >
                <span>Explore the Platform</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setArchOpen(true)}
                className="border-border/80 bg-surface/40 px-5 text-sm font-medium text-text backdrop-blur-md transition-all hover:border-brand/50 hover:bg-surface-raised active:scale-[0.98]"
              >
                <Layers className="mr-2 h-4 w-4 text-cyan-400" />
                View Architecture
              </Button>
            </div>

            {/* Subtle Trust & Technology Line */}
            <div className="pt-4 border-t border-border/50">
              <p className="mb-2 text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                Engineered with resilient distributed primitives
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-text-secondary">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-surface/60 px-2 py-0.5">
                  <Database className="h-3 w-3 text-cyan-400" />
                  PostgreSQL <span className="text-[10px] text-text-tertiary">(SKIP LOCKED)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-surface/60 px-2 py-0.5">
                  <Cpu className="h-3 w-3 text-brand" />
                  Redis Lease Engine
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-surface/60 px-2 py-0.5">
                  <Server className="h-3 w-3 text-violet-400" />
                  Spring Boot 3
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-surface/60 px-2 py-0.5">
                  <Activity className="h-3 w-3 text-healthy" />
                  STOMP WebSocket
                </span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (AI ARTWORK FOCAL POINT) ================= */}
          <div className="relative flex items-center justify-center lg:col-span-5">
            {/* Ambient Backlight Halo behind the artwork */}
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-brand/25 to-violet-500/20 blur-2xl opacity-75 -z-10"
            />

            {/* Framed Core Container with Soft Vignette Transitions */}
            <div className="relative w-full max-w-[420px] aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              {/* Media Element: High performance video with poster fallback */}
              {!videoError ? (
                <video
                  ref={videoRef}
                  src="/ai-intelligence-core.mp4"
                  poster="/ai-neural-core-poster.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onLoadedData={() => setVideoLoaded(true)}
                  onError={() => setVideoError(true)}
                  className={`h-full w-full object-cover transition-opacity duration-700 ${
                    videoLoaded ? 'opacity-95' : 'opacity-85'
                  }`}
                />
              ) : (
                <img
                  src="/ai-neural-core-poster.png"
                  alt="Autonomous AI Neural Core"
                  className="h-full w-full object-cover"
                />
              )}

              {/* Edge Gradient Blending: Vignette overlay so artwork blends seamlessly into dark canvas */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080A10] via-transparent to-transparent opacity-80"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0F1420]/60 via-transparent to-[#080A10]/60"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(11,14,23,0.9)]"
              />

              {/* Orbital ambient line decoration */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-10 rounded-full border border-cyan-400/10 opacity-60"
              />
            </div>

            {/* --- FLOATING TRANSLUCENT HUD ELEMENT 1 (Top-Right: Neural Stream / Live Signal) --- */}
            <div
              className="absolute -top-3 -right-2 sm:-right-4 z-20 hidden sm:flex items-center gap-2.5 rounded-xl border border-white/15 bg-surface/85 px-3 py-2 text-xs shadow-2xl backdrop-blur-xl animate-float-slow"
              title="Real-time control plane connection status"
            >
              <div className="relative flex h-2.5 w-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    connected ? 'animate-ping bg-healthy' : 'bg-muted'
                  }`}
                />
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    connected ? 'bg-healthy' : 'bg-muted'
                  }`}
                />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary leading-none">
                  Telemetry Stream
                </p>
                <p className="text-xs font-semibold text-text mt-0.5">
                  {connected ? 'STOMP / Live' : 'Polling Sync'}
                </p>
              </div>
              <Radio className="h-3.5 w-3.5 text-cyan-400 ml-1" />
            </div>

            {/* --- FLOATING TRANSLUCENT HUD ELEMENT 2 (Bottom-Left: Active Fleet & Atomic Dispatch) --- */}
            <div
              className="absolute -bottom-4 -left-2 sm:-left-4 z-20 flex items-center gap-3 rounded-xl border border-white/15 bg-surface/85 px-3.5 py-2.5 text-xs shadow-2xl backdrop-blur-xl animate-float-reverse"
              title="Current active worker nodes and claiming invariant"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand shadow-inner">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-text mono-tabular">
                    {activeWorkers} {activeWorkers === 1 ? 'Worker' : 'Workers'} Active
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-healthy" />
                </div>
                <p className="font-mono text-[10px] text-text-tertiary">
                  Atomic Claiming · 0 Races
                </p>
              </div>
            </div>

            {/* --- FLOATING TRANSLUCENT HUD ELEMENT 3 (Bottom-Right: In-flight executions) --- */}
            {(runningJobs > 0 || pendingJobs > 0) && (
              <div
                className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 hidden md:flex items-center gap-2 rounded-lg border border-border/80 bg-surface/90 px-2.5 py-1.5 text-[11px] shadow-lg backdrop-blur-md"
              >
                <Activity className="h-3 w-3 text-healthy animate-pulse" />
                <span className="font-mono text-text">
                  <strong className="text-healthy">{runningJobs}</strong> running ·{' '}
                  <strong className="text-brand">{pendingJobs}</strong> pending
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive System Architecture Modal */}
      <ArchitectureDialog open={archOpen} onOpenChange={setArchOpen} />
    </>
  );
}
