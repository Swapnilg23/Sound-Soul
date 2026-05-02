import React from 'react';
import type { TrustScore, TrustTier, TrackDisclosureScore } from '@/lib/trustScore';

const TIER_CONFIG: Record<TrustTier, {
  color: string;
  bgColor: string;
  borderColor: string;
  barColor: string;
  icon: React.ReactNode;
}> = {
  verified: {
    color: 'text-violet-300',
    bgColor: 'bg-violet-500/12',
    borderColor: 'border-violet-500/25',
    barColor: 'bg-violet-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  trusted: {
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/8',
    borderColor: 'border-violet-500/20',
    barColor: 'bg-violet-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  building: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/8',
    borderColor: 'border-amber-500/20',
    barColor: 'bg-amber-400',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  starting: {
    color: 'text-muted-foreground',
    bgColor: 'bg-white/4',
    borderColor: 'border-white/10',
    barColor: 'bg-muted-foreground/50',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

interface TrustScoreBadgeProps {
  trustScore: TrustScore;
}

export function TrustScoreBadge({ trustScore }: TrustScoreBadgeProps) {
  const cfg = TIER_CONFIG[trustScore.tier];

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${cfg.bgColor} ${cfg.borderColor}`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 font-semibold text-sm ${cfg.color}`}>
          {cfg.icon}
          <span>{trustScore.label}</span>
        </div>
        <span className={`text-2xl font-bold tabular-nums ${cfg.color}`}>
          {trustScore.score}
          <span className="text-sm font-normal text-muted-foreground/50">/100</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
          style={{ width: `${trustScore.score}%` }}
        />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">Profile</p>
          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
            <div
              className={`h-full rounded-full ${cfg.barColor} opacity-70`}
              style={{ width: `${(trustScore.profilePoints / trustScore.maxProfile) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            {trustScore.profilePoints}/{trustScore.maxProfile} pts
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">Disclosure</p>
          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
            <div
              className={`h-full rounded-full ${cfg.barColor} opacity-70`}
              style={{ width: `${(trustScore.disclosurePoints / trustScore.maxDisclosure) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            {trustScore.disclosurePoints}/{trustScore.maxDisclosure} pts
          </p>
        </div>
      </div>
    </div>
  );
}

interface TrackDisclosureBadgeProps {
  disclosure: TrackDisclosureScore;
}

export function TrackDisclosureBadge({ disclosure }: TrackDisclosureBadgeProps) {
  const cfg = TIER_CONFIG[disclosure.tier];

  const checks = [
    { label: 'AI Disclosed', done: disclosure.hasAiDisclosure },
    { label: 'Rights Certified', done: disclosure.hasRights },
    { label: 'Soul Story', done: disclosure.hasSoulStory },
  ];

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-2.5 ${cfg.bgColor} ${cfg.borderColor}`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
          {cfg.icon}
          <span>{disclosure.label}</span>
        </div>
        <span className={`text-sm font-bold tabular-nums ${cfg.color}`}>
          {disclosure.score}<span className="text-[10px] font-normal text-muted-foreground/50">/100</span>
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {checks.map(c => (
          <span
            key={c.label}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border
              ${c.done
                ? `${cfg.color} ${cfg.borderColor} ${cfg.bgColor}`
                : 'text-muted-foreground/40 border-white/6 bg-white/3'
              }`}
          >
            {c.done ? (
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
              </svg>
            )}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
