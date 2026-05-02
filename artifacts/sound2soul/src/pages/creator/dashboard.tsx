import React, { useState, useEffect } from 'react';
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
import { MapPin, Flame, TrendingUp, Clock, Star, Sparkles } from 'lucide-react';

type Tab = 'overview' | 'analytics' | 'insights';

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
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: tracksData, isLoading: isTracksLoading } = useGetMyTracks();
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useAnalytics();
  const { data: insightsData, isLoading: isInsightsLoading } = useInsights();

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
        {(['overview', 'analytics', 'insights'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'insights' ? '✦ Insights' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab data={analyticsData} isLoading={isAnalyticsLoading} />
      )}

      {activeTab === 'insights' && (
        <InsightsTab data={insightsData} isLoading={isInsightsLoading} />
      )}
    </div>
  );
}

function OverviewTab({ stats, isStatsLoading, tracksData, isTracksLoading }: any) {
  return (
    <div className="space-y-8">
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

      {stats && !stats.trustProfileComplete && (
        <Card className="bg-secondary/10 border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary">Complete Your Trust Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">Listeners are more likely to engage with creators who disclose their process.</p>
            <Button variant="outline" asChild className="border-secondary/50 text-secondary hover:bg-secondary/20">
              <Link href="/creator/onboarding">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
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
