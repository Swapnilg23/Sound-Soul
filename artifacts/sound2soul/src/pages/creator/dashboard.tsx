import React, { useState, useEffect, useCallback } from 'react';
import { useGetDashboardStats, useGetMyTracks } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, AreaChart, Area,
} from 'recharts';
import {
  MapPin, Flame, TrendingUp, Clock, Star, Sparkles, Check, ArrowRight,
  Bell, Heart, UserPlus, Bookmark, Mail, MessageSquare, Repeat2, BellOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

type Tab = 'overview' | 'analytics' | 'insights' | 'activity';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  trackSlug: string | null;
  creatorSlug: string | null;
  read: boolean;
  createdAt: string;
}

function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('sound2soul_token');

  const fetchNotifications = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((rows: Notification[]) => {
        setNotifications(rows);
        setUnreadCount(rows.filter(n => !n.read).length);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [token]);

  const markRead = useCallback(async (id: string) => {
    if (!token) return;
    await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [token]);

  return { notifications, unreadCount, isLoading, markAllRead, markRead, refresh: fetchNotifications };
}

interface AnalyticsTrack {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  genre: string | null;
  moderationStatus: string;
  playCount: number;
  likeCount: number;
  saveCount: number;
  weeklyPlays: { week: string; plays: number }[];
}

interface InsightsData {
  soulScore: number;
  totalPlays: number;
  totalLikes: number;
  totalSaves: number;
  followerCount: number;
  recentPlayCount: number;
  topCities: { city: string; listeners: number; share: number }[];
  peakHours: { hour: string; plays: number }[];
  tracks: {
    id: string; title: string; slug: string; coverImageUrl: string | null;
    playCount: number; likeCount: number; saveCount: number; genre: string | null;
    conversionRate: number; avgListenPct: number;
  }[];
}

function useAnalytics() {
  const [data, setData] = useState<AnalyticsTrack[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sound2soul_token');
    if (!token) return;
    setIsLoading(true);
    fetch('/api/analytics/tracks', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { tracks: [] })
      .then(d => setData(d.tracks ?? []))
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading };
}

function useInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sound2soul_token');
    if (!token) return;
    setIsLoading(true);
    fetch('/api/insights', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { user } = useAuth();
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: tracksData, isLoading: isTracksLoading } = useGetMyTracks();
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useAnalytics();
  const { data: insightsData, isLoading: isInsightsLoading } = useInsights();
  const { notifications, unreadCount, isLoading: isNotifLoading, markAllRead, markRead } = useNotifications();

  // Mark notifications as read when Activity tab is opened
  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'activity' && unreadCount > 0) {
      markAllRead();
    }
  };

  const TAB_LABELS: Record<Tab, React.ReactNode> = {
    overview: 'Overview',
    analytics: 'Analytics',
    insights: '✦ Insights',
    activity: (
      <span className="flex items-center gap-1.5">
        Activity
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
    ),
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your tracks and monitor your growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="gap-2 border-amber-500/30 text-amber-400 hover:border-amber-400/60 hover:bg-amber-500/10">
            <Link href="/creator/wrapped">
              <Sparkles className="h-4 w-4" /> Soul Wrapped
            </Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link href="/creator/upload">Upload Track</Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8">
        {(['overview', 'analytics', 'insights', 'activity'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TAB_LABELS[tab]}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          stats={stats}
          isStatsLoading={isStatsLoading}
          tracksData={tracksData}
          isTracksLoading={isTracksLoading}
          creatorProfile={(user as any)?.creatorProfile}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab data={analyticsData} isLoading={isAnalyticsLoading} />
      )}

      {activeTab === 'insights' && (
        <InsightsTab data={insightsData} isLoading={isInsightsLoading} />
      )}

      {activeTab === 'activity' && (
        <ActivityTab
          notifications={notifications}
          isLoading={isNotifLoading}
          markRead={markRead}
          markAllRead={markAllRead}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}

function OverviewTab({ stats, isStatsLoading, tracksData, isTracksLoading, creatorProfile }: any) {
  return (
    <div className="space-y-8">

      {/* Profile Completion — shown until fully complete */}
      <ProfileCompletion profile={creatorProfile} tracksData={tracksData} isTracksLoading={isTracksLoading} />

      {isStatsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Plays" value={stats.totalPlays} icon="▶" />
          <StatCard title="Total Saves" value={stats.totalSaves} icon="♥" />
          <StatCard title="Followers" value={stats.followerCount ?? stats.fanEmailCount ?? 0} icon="♟" />
          <StatCard title="Published Tracks" value={stats.publishedTracks} icon="♫" />
        </div>
      ) : null}

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Tracks</h2>

        {isTracksLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : tracksData?.tracks.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent text-center py-12">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 text-xl">♫</div>
              <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
              <p className="text-muted-foreground mb-6">Upload your first AI-assisted track to start building your audience.</p>
              <Button asChild><Link href="/creator/upload">Upload Track</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tracksData?.tracks.map((track: any) => (
              <Card key={track.id} className="bg-card/50 border-white/5 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                    {track.coverImageUrl ? (
                      <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center">♫</div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <Link href={`/track/${track.slug}`} className="font-semibold text-lg hover:text-primary transition-colors truncate block">
                      {track.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{track.genre || 'No genre'}</span>
                      <span>·</span>
                      <span>{track.playCount || 0} plays</span>
                      <span>·</span>
                      <span>{track.likeCount || 0} likes</span>
                      <span>·</span>
                      <span className="capitalize">{track.visibility}</span>
                    </div>
                  </div>
                  <Badge variant={track.moderationStatus === 'approved' ? 'default' : 'secondary'} className="capitalize flex-shrink-0">
                    {track.moderationStatus}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ── Profile Completion Widget ─────────────────────────────────────────────────

interface CompletionItem {
  key: string;
  label: string;
  desc: string;
  done: boolean;
  pts: number;
  bonus?: boolean;
  href: string;
}

function ProfileCompletion({
  profile,
  tracksData,
  isTracksLoading,
}: {
  profile: any;
  tracksData: any;
  isTracksLoading: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  const items: CompletionItem[] = [
    {
      key: 'avatar',
      label: 'Profile photo',
      desc: 'Adds a face to your music and builds instant recognition',
      done: !!profile?.avatarUrl,
      pts: 10,
      href: '/creator/onboarding',
    },
    {
      key: 'bio',
      label: 'Bio',
      desc: 'Tell listeners who you are and where your music comes from',
      done: !!(profile?.bio && profile.bio.trim().length > 15),
      pts: 10,
      href: '/creator/onboarding',
    },
    {
      key: 'statement',
      label: 'Creator Statement',
      desc: 'What does your music help people feel or do?',
      done: !!(profile?.creatorStatement && profile.creatorStatement.trim().length > 15),
      pts: 10,
      href: '/creator/onboarding',
    },
    {
      key: 'aitools',
      label: 'AI Tools Declared',
      desc: 'Declare your creative stack — transparency earns listener trust',
      done: !!(profile?.aiToolsUsed && profile.aiToolsUsed.length > 0),
      pts: 5,
      href: '/creator/onboarding',
    },
    {
      key: 'genres',
      label: 'Genres Selected',
      desc: 'Help listeners discover your sound on Explore',
      done: !!(profile?.genres && profile.genres.length > 0),
      pts: 5,
      href: '/creator/onboarding',
    },
    {
      key: 'banner',
      label: 'Banner image',
      desc: 'Give your profile page a distinctive look',
      done: !!profile?.bannerUrl,
      pts: 0,
      bonus: true,
      href: '/creator/onboarding',
    },
  ];

  const scoredItems = items.filter(i => !i.bonus);
  const earnedPts = scoredItems.filter(i => i.done).reduce((s, i) => s + i.pts, 0);
  const maxPts = scoredItems.reduce((s, i) => s + i.pts, 0);
  const pct = Math.round((earnedPts / maxPts) * 100);

  // Track disclosure avg
  const tracks: any[] = tracksData?.tracks ?? [];
  const avgDisclosure =
    tracks.length === 0
      ? null
      : Math.round(
          tracks.reduce((sum: number, t: any) => {
            let score = 0;
            if (t.aiInvolvementType?.trim()) score += 20;
            if (t.rightsConfirmation && Object.keys(t.rightsConfirmation).length > 0) score += 20;
            if (t.soulStory && t.soulStory.trim().length > 15) score += 20;
            return sum + score;
          }, 0) / tracks.length
        );

  const profileAllDone = earnedPts === maxPts;
  const disclosureAllDone = avgDisclosure !== null && avgDisclosure >= 60;
  const bannerDone = !!profile?.bannerUrl;
  const tracksExist = tracks.length > 0;

  if (profileAllDone && (disclosureAllDone || (!tracksExist && !isTracksLoading)) && bannerDone) return null;

  const barColor =
    pct >= 80
      ? 'from-green-500 to-emerald-400'
      : pct >= 50
      ? 'from-violet-500 to-primary'
      : 'from-amber-500 to-amber-400';
  const pctColor =
    pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-violet-400' : 'text-amber-400';

  const missingCount = items.filter(i => !i.done).length;

  return (
    <div className="rounded-2xl border border-white/8 bg-card/30 overflow-hidden">

      {/* Header row */}
      <div className="flex items-start justify-between px-6 py-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-base">Profile Completion</h3>
            {missingCount > 0 && (
              <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {missingCount} to-do
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">A complete profile earns more listener trust and a higher Trust Score</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-2xl font-black tabular-nums leading-none ${pctColor}`}>{pct}%</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">{earnedPts}/{maxPts} pts</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-5">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700 ease-out`}
            style={{ width: mounted ? `${pct}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/40">
          <span>Profile completeness</span>
          {maxPts - earnedPts > 0 && <span>+{maxPts - earnedPts} pts available</span>}
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-white/5 divide-y divide-white/5">
        {items.map(item => (
          <div
            key={item.key}
            className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
              item.done ? 'opacity-40' : 'hover:bg-white/2'
            }`}
          >
            {/* Status dot / checkmark */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.done
                  ? 'bg-green-500/15 text-green-400'
                  : item.bonus
                  ? 'bg-amber-500/10 text-amber-400/40'
                  : 'bg-violet-500/10 text-violet-400/50'
              }`}
            >
              {item.done ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>

            {/* Label + desc */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${item.done ? '' : 'text-foreground'}`}>{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
            </div>

            {/* Points badge */}
            {item.bonus ? (
              !item.done && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                  Bonus
                </span>
              )
            ) : (
              <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${item.done ? 'text-green-400' : 'text-muted-foreground/40'}`}>
                +{item.pts}
              </span>
            )}

            {/* Action link */}
            {!item.done && (
              <Link
                href={item.href}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1 flex-shrink-0 transition-colors"
              >
                Add <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Track disclosure footer */}
      {!isTracksLoading && (
        <>
          {tracks.length === 0 ? (
            <div className="px-6 py-4 bg-violet-500/5 border-t border-violet-500/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-violet-300/80">Upload your first track</p>
                <p className="text-xs text-muted-foreground mt-0.5">Track disclosure quality makes up 60 of your 100 Trust Score points</p>
              </div>
              <Link
                href="/creator/upload"
                className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1 flex-shrink-0 transition-colors"
              >
                Upload <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : avgDisclosure !== null && avgDisclosure < 60 ? (
            <div className="px-6 py-4 bg-amber-500/5 border-t border-amber-500/10">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium text-amber-300/90">Track Disclosure Average</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {avgDisclosure}/60 pts avg — add AI type, rights + Soul Story to each track
                  </p>
                </div>
                <Link
                  href="/creator/upload"
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 flex-shrink-0 transition-colors"
                >
                  Improve <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500/60 rounded-full transition-all duration-700 ease-out"
                  style={{ width: mounted ? `${Math.round((avgDisclosure / 60) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function InsightsTab({ data, isLoading }: { data: InsightsData | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data || data.tracks.length === 0) {
    return (
      <div className="py-20 text-center bg-card/20 rounded-2xl border border-white/5 border-dashed">
        <div className="text-4xl mb-4 opacity-30">✦</div>
        <p className="font-medium">No insights yet.</p>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Publish a track to start unlocking your Soul Score and listener data.</p>
        <Link href="/creator/upload" className="text-sm text-primary hover:underline font-medium">Upload your first track →</Link>
      </div>
    );
  }

  const scoreColor = data.soulScore >= 10000 ? 'text-secondary' : data.soulScore >= 3000 ? 'text-primary' : 'text-muted-foreground';
  const scoreLabel = data.soulScore >= 10000 ? 'Rising Star' : data.soulScore >= 3000 ? 'Growing' : 'Starting Out';

  const topTrack = data.tracks[0];
  const radarData = [
    { metric: 'Plays', value: Math.min(100, Math.round(data.totalPlays / 30)) },
    { metric: 'Likes', value: Math.min(100, Math.round(data.totalLikes / 10)) },
    { metric: 'Saves', value: Math.min(100, Math.round(data.totalSaves / 5)) },
    { metric: 'Followers', value: Math.min(100, data.followerCount * 10) },
    { metric: 'Momentum', value: Math.min(100, Math.round(data.recentPlayCount / 5)) },
  ];

  const peakHour = data.peakHours.reduce((a, b) => a.plays > b.plays ? a : b);

  return (
    <div className="space-y-8">

      {/* Soul Score hero */}
      <Card className="bg-gradient-to-br from-primary/10 via-card/60 to-secondary/10 border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Soul Score</p>
            <div className={`text-6xl font-extrabold tabular-nums ${scoreColor}`}>
              {data.soulScore.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Flame className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">{scoreLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">plays×1 + likes×5 + saves×3 + followers×10</p>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            <MiniStat label="30-day plays" value={data.recentPlayCount} />
            <MiniStat label="Total likes" value={data.totalLikes} />
            <MiniStat label="Total saves" value={data.totalSaves} />
            <MiniStat label="Followers" value={data.followerCount} />
          </div>
        </CardContent>
      </Card>

      {/* Radar + Peak Hours row */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Radar chart — Engagement Profile */}
        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" /> Engagement Profile
            </CardTitle>
            <p className="text-xs text-muted-foreground">Your overall creator health across 5 dimensions</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar name="You" dataKey="value" stroke="hsl(262 72% 62%)" fill="hsl(262 72% 62%)" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak listening hours */}
        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Peak Listening Hours
            </CardTitle>
            <p className="text-xs text-muted-foreground">Your listeners are most active around {peakHour.hour}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.peakHours} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => v.slice(0,2)} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Area type="monotone" dataKey="plays" name="Plays" stroke="hsl(262 72% 62%)" fill="hsl(262 72% 62%)" fillOpacity={0.15} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Cities */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-secondary" /> Top Listener Cities
          </CardTitle>
          <p className="text-xs text-muted-foreground">Where your audience is located (estimated)</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.topCities.map((city, i) => (
            <div key={city.city} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground/50 w-4 tabular-nums">{i + 1}</span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{city.city}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{city.listeners.toLocaleString()} listeners</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/70 to-secondary/70 rounded-full transition-all duration-700"
                    style={{ width: `${city.share}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Track performance table with conversion */}
      <Card className="bg-card/40 border-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Track Performance
          </CardTitle>
          <p className="text-xs text-muted-foreground">Conversion = % of track listeners who became followers</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Track</th>
                  <th className="text-right px-4 py-3 font-medium">Plays</th>
                  <th className="text-right px-4 py-3 font-medium">Avg Listen</th>
                  <th className="text-right px-5 py-3 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.tracks.map((t, i) => (
                  <tr key={t.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i === data.tracks.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-5 py-3.5">
                      <Link href={`/track/${t.slug}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {t.coverImageUrl ? (
                            <img src={t.coverImageUrl} alt={t.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs text-primary/40">♫</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.genre || '—'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{t.playCount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${t.avgListenPct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{t.avgListenPct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      <span className={`text-xs font-semibold ${t.conversionRate > 5 ? 'text-secondary' : t.conversionRate > 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {t.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsTab({ data, isLoading }: { data: AnalyticsTrack[] | null; isLoading: boolean }) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const tracks = data ?? [];
  const approved = tracks.filter(t => t.moderationStatus === 'approved');

  const selectedTrack = selectedTrackId
    ? tracks.find(t => t.id === selectedTrackId)
    : approved[0] ?? tracks[0] ?? null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="py-20 text-center bg-card/20 rounded-2xl border border-white/5 border-dashed">
        <div className="text-4xl mb-4 opacity-30">📊</div>
        <p className="font-medium">No tracks to analyse yet.</p>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Upload and publish a track to start seeing analytics.</p>
        <Link href="/creator/upload" className="text-sm text-primary hover:underline font-medium">Upload your first track →</Link>
      </div>
    );
  }

  const comparisonData = approved.map(t => ({
    name: t.title.length > 20 ? t.title.slice(0, 18) + '…' : t.title,
    Plays: t.playCount,
    Likes: t.likeCount,
    Saves: t.saveCount,
  }));

  const weeklyData = buildWeeklyData(selectedTrack?.weeklyPlays ?? []);

  const topTrack = [...approved].sort((a, b) => b.playCount - a.playCount)[0];
  const totalPlays = approved.reduce((s, t) => s + t.playCount, 0);
  const totalLikes = approved.reduce((s, t) => s + t.likeCount, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Plays" value={totalPlays} />
        <MiniStat label="Total Likes" value={totalLikes} />
        <MiniStat label="Engagement" value={totalPlays > 0 ? `${((totalLikes / totalPlays) * 100).toFixed(1)}%` : '—'} />
        <MiniStat label="Published" value={approved.length} />
      </div>

      {topTrack && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {topTrack.coverImageUrl ? (
                <img src={topTrack.coverImageUrl} alt={topTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary/40">♫</div>
              )}
            </div>
            <div>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-0.5">Top Performer</p>
              <p className="font-bold text-lg">{topTrack.title}</p>
              <p className="text-sm text-muted-foreground">{topTrack.playCount} plays · {topTrack.likeCount} likes · {topTrack.saveCount} saves</p>
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonData.length > 0 && (
        <Card className="bg-card/40 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Track Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">Plays, likes, and saves across all published tracks</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparisonData} barGap={4} margin={{ top: 4, right: 16, bottom: 4, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
                <Bar dataKey="Plays" fill="hsl(262 72% 62%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Likes" fill="hsl(38 92% 58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saves" fill="hsl(200 70% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/40 border-white/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Weekly Plays</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Last 8 weeks of play activity</p>
            </div>
            {tracks.length > 1 && (
              <select
                value={selectedTrack?.id ?? ''}
                onChange={e => setSelectedTrackId(e.target.value)}
                className="text-xs bg-card border border-white/10 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {tracks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              No play data yet — plays will appear here as listeners discover your track.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData} margin={{ top: 4, right: 16, bottom: 4, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Line type="monotone" dataKey="plays" name="Plays" stroke="hsl(262 72% 62%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(262 72% 62%)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">All Tracks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Track</th>
                  <th className="text-right px-4 py-3 font-medium">Plays</th>
                  <th className="text-right px-4 py-3 font-medium">Likes</th>
                  <th className="text-right px-4 py-3 font-medium">Saves</th>
                  <th className="text-right px-4 py-3 font-medium">Engagement</th>
                  <th className="text-right px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((t, i) => {
                  const engagement = t.playCount > 0 ? ((t.likeCount + t.saveCount) / t.playCount * 100).toFixed(1) : '—';
                  return (
                    <tr key={t.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i === tracks.length - 1 ? 'border-0' : ''}`}>
                      <td className="px-5 py-3.5">
                        <Link href={`/track/${t.slug}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {t.coverImageUrl ? (
                              <img src={t.coverImageUrl} alt={t.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs text-primary/40">♫</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">{t.title}</p>
                            <p className="text-xs text-muted-foreground">{t.genre || '—'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{t.playCount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{t.likeCount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{t.saveCount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">{engagement}{engagement !== '—' ? '%' : ''}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge variant={t.moderationStatus === 'approved' ? 'default' : 'secondary'} className="capitalize text-xs">
                          {t.moderationStatus}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

const NOTIF_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  like:        { icon: Heart,        color: 'text-rose-400',    bg: 'bg-rose-500/10' },
  save:        { icon: Bookmark,     color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  follow:      { icon: UserPlus,     color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  repost:      { icon: Repeat2,      color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  soul_story:  { icon: MessageSquare,color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  fan_email:   { icon: Mail,         color: 'text-green-400',   bg: 'bg-green-500/10' },
};

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_FILTERS = [
  { value: 'all',        label: 'All' },
  { value: 'follow',     label: 'Follows' },
  { value: 'like',       label: 'Likes' },
  { value: 'save',       label: 'Saves' },
  { value: 'repost',     label: 'Reposts' },
  { value: 'soul_story', label: 'Soul Stories' },
  { value: 'fan_email',  label: 'Fan Signups' },
];

function ActivityTab({
  notifications,
  isLoading,
  markRead,
  markAllRead,
  unreadCount,
}: {
  notifications: Notification[];
  isLoading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
}) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Activity Feed
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notifications.length === 0
              ? 'No activity yet — engage with your audience to see events here.'
              : `${notifications.length} recent event${notifications.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="border-white/10 text-muted-foreground hover:text-foreground gap-2 self-start sm:self-auto"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Type filter pills */}
      {notifications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => {
            const count = f.value === 'all'
              ? notifications.length
              : notifications.filter(n => n.type === f.value).length;
            if (f.value !== 'all' && count === 0) return null;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filter === f.value
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-white/3 border-white/8 text-muted-foreground hover:border-white/20 hover:text-foreground'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`ml-1.5 tabular-nums ${filter === f.value ? 'text-primary/70' : 'text-muted-foreground/50'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty states */}
      {notifications.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-white/5 border-dashed bg-card/20">
          <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
            <BellOff className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-muted-foreground">No activity yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
            When listeners follow you, like your tracks, or sign up for your fan list, you'll see it here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-white/5 border-dashed bg-card/20">
          <p className="text-muted-foreground text-sm">No {filter.replace('_', ' ')} events yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 overflow-hidden divide-y divide-white/5">
          {filtered.map(notif => {
            const cfg = NOTIF_CONFIG[notif.type] ?? { icon: Bell, color: 'text-muted-foreground', bg: 'bg-white/5' };
            const Icon = cfg.icon;

            const linkHref = notif.trackSlug
              ? `/track/${notif.trackSlug}`
              : notif.creatorSlug
              ? `/creator/${notif.creatorSlug}`
              : null;

            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  notif.read ? 'bg-transparent' : 'bg-primary/3 hover:bg-primary/5'
                }`}
                onClick={() => !notif.read && markRead(notif.id)}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
                  {linkHref && (
                    <Link
                      href={linkHref}
                      className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary mt-1.5 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {/* Right side — time + unread dot */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[11px] text-muted-foreground/50 whitespace-nowrap">
                    {timeAgo(notif.createdAt)}
                  </span>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildWeeklyData(weeklyPlays: { week: string; plays: number }[]) {
  if (weeklyPlays.length === 0) return [];
  return weeklyPlays.map(w => ({
    week: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    plays: w.plays,
  }));
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: string }) {
  return (
    <Card className="bg-card/50 border-white/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">{icon}</div>
        </div>
        <div className="text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="bg-card/40 border-white/8">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </CardContent>
    </Card>
  );
}
