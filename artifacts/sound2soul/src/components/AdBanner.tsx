import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';

interface AdBannerProps {
  variant?: 'track' | 'explore';
}

const ADS = [
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
];

export function AdBanner({ variant = 'explore' }: AdBannerProps) {
  const { user } = useAuth();

  if (user?.role === 'creator') return null;

  const ad = variant === 'track' ? ADS[0] : ADS[1];

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
