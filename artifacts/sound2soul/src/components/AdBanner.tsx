import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Sparkles, Zap } from 'lucide-react';

interface AdBannerProps {
  variant?: 'track' | 'explore' | 'library-upgrade' | 'library-mid';
}

const SPONSORED_ADS = [
  {
    label: 'Sponsored · BandLab Education',
    headline: 'Learn music production with AI tools — free courses for creators.',
    cta: 'Explore Courses',
    href: '#',
    accent: 'from-violet-900/40 to-violet-800/20',
    icon: (
      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: 'Sponsored · Splice',
    headline: 'Get 3 months of unlimited samples free. Millions of royalty-cleared sounds.',
    cta: 'Claim Offer',
    href: '#',
    accent: 'from-amber-900/40 to-amber-800/20',
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  {
    label: 'Sponsored · Landr',
    headline: 'AI mastering trusted by 2 million musicians. First track free.',
    cta: 'Master Free',
    href: '#',
    accent: 'from-emerald-900/40 to-teal-900/20',
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 000 12M8.464 8.464a5 5 0 000 7.072" />
      </svg>
    ),
  },
];

export function AdBanner({ variant = 'explore' }: AdBannerProps) {
  const { user } = useAuth();

  // Never show ads to creators or admins
  if (user?.role === 'creator' || user?.role === 'admin') return null;

  // Library upgrade banner — mimics SoundCloud's "Listen Ad-Free" prompt
  if (variant === 'library-upgrade') {
    return (
      <div className="flex items-center gap-4 px-5 py-3.5 bg-gradient-to-r from-primary/12 via-primary/6 to-secondary/8 border border-primary/20 rounded-2xl">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-primary" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Listen Ad-Free on Sound2Soul Pro</p>
          <p className="text-xs text-muted-foreground mt-0.5">Unlimited plays · No ads · Offline listening · Priority support</p>
        </div>
        <Link href="/pricing">
          <button className="flex-shrink-0 text-xs font-bold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap shadow-lg shadow-primary/20">
            Go Pro
          </button>
        </Link>
      </div>
    );
  }

  // Library mid-page ad — compact horizontal banner
  if (variant === 'library-mid') {
    const ad = SPONSORED_ADS[2];
    return (
      <div className="w-full">
        <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/25 text-center mb-1.5">
          Advertisement
        </p>
        <div className={`relative w-full bg-gradient-to-r ${ad.accent} border border-white/6 rounded-xl overflow-hidden`}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-shrink-0 w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center">
              {ad.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/50">{ad.label}</p>
              <p className="text-xs font-medium leading-snug truncate">{ad.headline}</p>
            </div>
            <a
              href={ad.href}
              className="flex-shrink-0 text-xs font-semibold bg-white/10 hover:bg-white/16 text-foreground px-3 py-1.5 rounded-full transition-colors border border-white/10 whitespace-nowrap"
            >
              {ad.cta}
            </a>
          </div>
          <div className="absolute bottom-0 right-0 px-2 py-0.5">
            <Link href="/pricing" className="text-[9px] text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors">
              Remove ads ↗
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Track / Explore sponsored ad (existing full-size)
  const ad = variant === 'track' ? SPONSORED_ADS[0] : SPONSORED_ADS[1];

  return (
    <div className="w-full my-2">
      <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/30 text-center mb-1.5">
        Advertisement
      </p>
      <div className={`relative w-full bg-gradient-to-r ${ad.accent} border border-white/6 rounded-2xl overflow-hidden`}>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex-shrink-0 w-10 h-10 bg-white/8 rounded-xl flex items-center justify-center">
            {ad.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground/50 mb-0.5">{ad.label}</p>
            <p className="text-sm font-medium leading-snug">{ad.headline}</p>
          </div>
          <a
            href={ad.href}
            className="flex-shrink-0 text-xs font-semibold bg-white/10 hover:bg-white/16 text-foreground px-4 py-2 rounded-full transition-colors border border-white/10 whitespace-nowrap"
          >
            {ad.cta}
          </a>
        </div>
        <div className="absolute bottom-0 right-0 px-2 py-1">
          <Link href="/pricing" className="text-[9px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
            Remove ads ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
