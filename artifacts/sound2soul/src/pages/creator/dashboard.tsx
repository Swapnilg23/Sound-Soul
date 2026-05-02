import React, { useState, useEffect } from 'react';
import { useGetDashboardStats, useGetMyTracks } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type Tab = 'overview' | 'analytics';

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

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: tracksData, isLoading: isTracksLoading } = useGetMyTracks();
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useAnalytics();

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your tracks and monitor your growth.</p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground">
          <Link href="/creator/upload">Upload Track</Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8">
        {(['overview', 'analytics'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
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

  // Build comparison chart data (all tracks side-by-side)
  const comparisonData = approved.map(t => ({
    name: t.title.length > 20 ? t.title.slice(0, 18) + '…' : t.title,
    Plays: t.playCount,
    Likes: t.likeCount,
    Saves: t.saveCount,
  }));

  // Build weekly trend data for selected track
  const weeklyData = buildWeeklyData(selectedTrack?.weeklyPlays ?? []);

  // Top performer
  const topTrack = [...approved].sort((a, b) => b.playCount - a.playCount)[0];
  const totalPlays = approved.reduce((s, t) => s + t.playCount, 0);
  const totalLikes = approved.reduce((s, t) => s + t.likeCount, 0);

  return (
    <div className="space-y-8">

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Plays" value={totalPlays} />
        <MiniStat label="Total Likes" value={totalLikes} />
        <MiniStat label="Engagement" value={totalPlays > 0 ? `${((totalLikes / totalPlays) * 100).toFixed(1)}%` : '—'} />
        <MiniStat label="Published" value={approved.length} />
      </div>

      {/* Top performer */}
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

      {/* Comparison chart */}
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
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
                <Bar dataKey="Plays" fill="hsl(262 72% 62%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Likes" fill="hsl(38 92% 58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saves" fill="hsl(200 70% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weekly trend for selected track */}
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
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="plays"
                  name="Plays"
                  stroke="hsl(262 72% 62%)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(262 72% 62%)', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Per-track breakdown table */}
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
  // Format week label as "Apr 28"
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
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">
            {icon}
          </div>
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
