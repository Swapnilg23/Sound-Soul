import React from 'react';
import { Link } from 'wouter';
import type { TrustScore } from '@/lib/trustScore';

interface NudgeItem {
  label: string;
  description: string;
  href: string;
  points: number;
  category: 'profile' | 'disclosure';
}

interface TrustScoreNudgeProps {
  profile: {
    bio?: string | null;
    creatorStatement?: string | null;
    avatarUrl?: string | null;
    genres?: string[] | null;
    aiToolsUsed?: string[] | null;
  };
  tracks: Array<{
    aiInvolvementType?: string | null;
    rightsConfirmation?: Record<string, unknown> | null;
    soulStory?: string | null;
    title?: string;
    slug?: string;
  }>;
  trustScore: TrustScore;
}

export function TrustScoreNudge({ profile, tracks, trustScore }: TrustScoreNudgeProps) {
  if (trustScore.score >= 100) return null;

  const items: NudgeItem[] = [];

  // Profile gaps
  if (!profile.avatarUrl) {
    items.push({
      label: 'Add a profile photo',
      description: 'A face to your name builds instant listener trust.',
      href: '/creator/dashboard',
      points: 10,
      category: 'profile',
    });
  }
  if (!profile.bio || profile.bio.trim().length <= 15) {
    items.push({
      label: 'Write your bio',
      description: 'Tell listeners who you are and what drives your sound.',
      href: '/creator/dashboard',
      points: 10,
      category: 'profile',
    });
  }
  if (!profile.creatorStatement || profile.creatorStatement.trim().length <= 15) {
    items.push({
      label: 'Add a creator statement',
      description: 'Your philosophy on AI and music in one honest sentence.',
      href: '/creator/dashboard',
      points: 10,
      category: 'profile',
    });
  }
  if (!profile.aiToolsUsed || profile.aiToolsUsed.length === 0) {
    items.push({
      label: 'List your AI tools',
      description: 'Suno, Udio, ElevenLabs — show exactly how you create.',
      href: '/creator/dashboard',
      points: 5,
      category: 'profile',
    });
  }
  if (!profile.genres || profile.genres.length === 0) {
    items.push({
      label: 'Add your music genres',
      description: 'Help listeners find you through the right categories.',
      href: '/creator/dashboard',
      points: 5,
      category: 'profile',
    });
  }

  // Track disclosure gaps
  const missingAi = tracks.filter(t => !t.aiInvolvementType?.trim());
  const missingRights = tracks.filter(t => !t.rightsConfirmation || Object.keys(t.rightsConfirmation).length === 0);
  const missingSoul = tracks.filter(t => !t.soulStory || t.soulStory.trim().length <= 15);

  if (missingAi.length > 0) {
    items.push({
      label: `Disclose AI involvement on ${missingAi.length} track${missingAi.length > 1 ? 's' : ''}`,
      description: 'Required for full transparency — what did the AI do on each track?',
      href: '/creator/dashboard',
      points: 0,
      category: 'disclosure',
    });
  }
  if (missingRights.length > 0) {
    items.push({
      label: `Certify rights on ${missingRights.length} track${missingRights.length > 1 ? 's' : ''}`,
      description: 'Self-certify your right to publish each piece.',
      href: '/creator/dashboard',
      points: 0,
      category: 'disclosure',
    });
  }
  if (missingSoul.length > 0) {
    items.push({
      label: `Write soul stories for ${missingSoul.length} track${missingSoul.length > 1 ? 's' : ''}`,
      description: 'The human moment behind each track — listeners connect to these.',
      href: '/creator/dashboard',
      points: 0,
      category: 'disclosure',
    });
  }

  if (items.length === 0) return null;

  const profileItems = items.filter(i => i.category === 'profile');
  const disclosureItems = items.filter(i => i.category === 'disclosure');
  const potentialGain = profileItems.reduce((s, i) => s + i.points, 0);

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/6 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">Boost your Trust Score</p>
            <p className="text-[11px] text-amber-400/60 mt-0.5">
              {items.length} item{items.length > 1 ? 's' : ''} to complete
              {potentialGain > 0 && ` · up to +${potentialGain} pts`}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-400 tabular-nums mt-0.5">
          {trustScore.score}/100
        </span>
      </div>

      {/* Profile items */}
      {profileItems.length > 0 && (
        <div className="space-y-1.5">
          {profileItems.map(item => (
            <Link key={item.label} href={item.href}>
              <div className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-amber-500/10 transition-colors cursor-pointer">
                <div className="w-4 h-4 rounded-full border-2 border-amber-500/40 group-hover:border-amber-400 flex-shrink-0 mt-0.5 transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-amber-200/90 group-hover:text-amber-200 transition-colors">{item.label}</p>
                    {item.points > 0 && (
                      <span className="text-[10px] font-bold text-amber-500/70 flex-shrink-0">+{item.points} pts</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-relaxed">{item.description}</p>
                </div>
                <svg className="w-3 h-3 text-amber-500/40 group-hover:text-amber-400 flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Disclosure items */}
      {disclosureItems.length > 0 && (
        <>
          {profileItems.length > 0 && <div className="border-t border-amber-500/10" />}
          <div className="space-y-1.5">
            {disclosureItems.map(item => (
              <Link key={item.label} href={item.href}>
                <div className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-amber-500/10 transition-colors cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 border-violet-500/30 group-hover:border-violet-400 flex-shrink-0 mt-0.5 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-violet-300/80 group-hover:text-violet-200 transition-colors">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                  <svg className="w-3 h-3 text-violet-500/30 group-hover:text-violet-400 flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <Link href="/creator/dashboard">
        <div className="mt-1 text-center text-[11px] font-medium text-amber-400/60 hover:text-amber-400 transition-colors cursor-pointer">
          Go to dashboard →
        </div>
      </Link>
    </div>
  );
}
