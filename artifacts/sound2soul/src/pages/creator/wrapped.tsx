import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  ArrowLeft, Share2, Check, Music, MapPin, Flame, Star, TrendingUp,
  Users, Heart, Bookmark, Sparkles, Trophy, Radio,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface WrappedData {
  year: number;
  artistName: string;
  avatarUrl: string | null;
  totalPlays: number;
  totalLikes: number;
  totalSaves: number;
  followerCount: number;
  uniqueListeners: number;
  soulScore: number;
  soulScoreStart: number;
  soulScoreGrowth: number;
  soulScoreGrowthPct: number;
  topTrack: {
    id: string; title: string; slug: string;
    coverImageUrl: string | null; genre: string | null; playCount: number; likeCount: number;
  } | null;
  topGenre: string | null;
  topCity: string;
  peakMonth: string;
  monthStreak: number;
  monthlyPlays: { month: string; plays: number }[];
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

async function fetchWrapped(year: number, token: string): Promise<WrappedData> {
  const res = await fetch(`${BASE}/api/wrapped?year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load Wrapped data');
  return res.json();
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{fmt(val)}</>;
}

export default function SoulWrapped() {
  const { user, token } = useAuth() as any;
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 - i);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    fetchWrapped(year, token)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, token]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Please <Link href="/login" className="text-primary underline">sign in</Link> to view your Wrapped.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080810]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#080810]/80 backdrop-blur-md border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <Link href="/creator/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  year === y ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <Button
            onClick={handleShare}
            size="sm"
            variant="outline"
            className="gap-2 border-white/20 hover:border-white/40"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Crafting your {year} story…</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!loading && data && (
        <div ref={cardRef} className="max-w-3xl mx-auto px-4 py-12 space-y-6">

          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-950 via-[#1a0a2e] to-[#0d0820] border border-violet-500/20 p-10 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {data.avatarUrl && (
                <img
                  src={data.avatarUrl}
                  alt={data.artistName}
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-violet-400/40 object-cover"
                />
              )}
              <p className="text-violet-300 text-sm font-semibold tracking-[0.2em] uppercase mb-1">Soul Wrapped</p>
              <h1 className="text-5xl font-black text-white mb-1">{data.year}</h1>
              <p className="text-2xl font-bold text-violet-200 mb-6">{data.artistName}</p>

              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-6 py-2">
                <Star className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300 font-semibold text-sm">Soul Score</span>
                <span className="text-amber-400 font-black text-lg tabular-nums">
                  <CountUp target={data.soulScore} duration={1400} />
                </span>
                <span className="text-green-400 text-sm font-bold">+{data.soulScoreGrowthPct}%</span>
              </div>
            </div>
          </div>

          {/* Big Number Row */}
          <div className="grid grid-cols-2 gap-4">
            <StatPill
              icon={<Music className="h-5 w-5" />}
              label="Total Plays"
              value={data.totalPlays}
              color="violet"
              delay={100}
            />
            <StatPill
              icon={<Users className="h-5 w-5" />}
              label="Unique Listeners"
              value={data.uniqueListeners}
              color="amber"
              delay={200}
            />
            <StatPill
              icon={<Heart className="h-5 w-5" />}
              label="Likes"
              value={data.totalLikes}
              color="rose"
              delay={300}
            />
            <StatPill
              icon={<Bookmark className="h-5 w-5" />}
              label="Saves"
              value={data.totalSaves}
              color="cyan"
              delay={400}
            />
          </div>

          {/* Top Track */}
          {data.topTrack && (
            <Link href={`/track/${data.topTrack.slug}`}>
              <div className="group rounded-2xl bg-gradient-to-r from-violet-950/80 to-violet-900/40 border border-violet-500/20 p-6 flex items-center gap-5 cursor-pointer hover:border-violet-400/40 transition-all">
                <div className="relative flex-shrink-0">
                  {data.topTrack.coverImageUrl
                    ? <img src={data.topTrack.coverImageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    : <div className="w-20 h-20 rounded-xl bg-violet-800/50 flex items-center justify-center"><Music className="h-8 w-8 text-violet-400" /></div>
                  }
                  <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full w-7 h-7 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-amber-900" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">Your #1 Track of {data.year}</p>
                  <h2 className="text-white text-xl font-bold truncate group-hover:text-violet-200 transition-colors">{data.topTrack.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Music className="h-3 w-3" />{fmt(data.topTrack.playCount)} plays</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{fmt(data.topTrack.likeCount)} likes</span>
                    {data.topTrack.genre && <span className="bg-violet-800/40 px-2 py-0.5 rounded-full text-xs">{data.topTrack.genre}</span>}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Highlights Row */}
          <div className="grid grid-cols-3 gap-4">
            <HighlightCard
              icon={<MapPin className="h-5 w-5 text-rose-400" />}
              label="Top City"
              value={data.topCity}
              bg="from-rose-950/60 to-rose-900/20"
              border="border-rose-500/20"
            />
            <HighlightCard
              icon={<Radio className="h-5 w-5 text-amber-400" />}
              label="Peak Month"
              value={data.peakMonth}
              bg="from-amber-950/60 to-amber-900/20"
              border="border-amber-500/20"
            />
            <HighlightCard
              icon={<Flame className="h-5 w-5 text-orange-400" />}
              label="Top Genre"
              value={data.topGenre ?? 'Various'}
              bg="from-orange-950/60 to-orange-900/20"
              border="border-orange-500/20"
            />
          </div>

          {/* Monthly Plays Chart */}
          <div className="rounded-2xl bg-card/30 border border-white/8 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-white">Monthly Plays</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Your listening wave throughout {data.year}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400 text-xs font-semibold">{data.monthStreak} month streak</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.monthlyPlays} barSize={18}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#a78bfa' }}
                  itemStyle={{ color: '#e5e7eb' }}
                  formatter={(v: number) => [fmt(v), 'plays']}
                />
                <Bar dataKey="plays" radius={[4, 4, 0, 0]}>
                  {data.monthlyPlays.map((entry, idx) => {
                    const isPeak = entry.month === data.peakMonth.slice(0, 3);
                    return (
                      <Cell
                        key={idx}
                        fill={isPeak ? '#f59e0b' : `rgba(124,58,237,${0.4 + (entry.plays / Math.max(...data.monthlyPlays.map(m => m.plays))) * 0.6})`}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Soul Score Journey */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 to-violet-950/40 border border-amber-500/15 p-6">
            <h3 className="font-bold text-white mb-1">Soul Score Journey</h3>
            <p className="text-xs text-muted-foreground mb-5">How your impact grew across {data.year}</p>
            <div className="flex items-end gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Jan {data.year}</p>
                <div
                  className="w-20 rounded-t-lg bg-violet-800/50 border border-violet-600/30 flex items-end justify-center pb-2 transition-all"
                  style={{ height: `${Math.round(80 * (data.soulScoreStart / data.soulScore))}px` }}
                >
                  <span className="text-xs text-violet-300 font-bold">{fmt(data.soulScoreStart)}</span>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-black text-xl">+{data.soulScoreGrowthPct}%</span>
                  </div>
                  <p className="text-muted-foreground text-xs">growth</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Dec {data.year}</p>
                <div
                  className="w-20 h-20 rounded-t-lg bg-gradient-to-t from-amber-600/60 to-amber-400/40 border border-amber-500/30 flex items-end justify-center pb-2"
                >
                  <span className="text-xs text-amber-300 font-bold">{fmt(data.soulScore)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-violet-900/30 to-violet-800/20 border border-violet-500/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white">This is your Sound2Soul story.</p>
              <p className="text-sm text-muted-foreground mt-0.5">Share it with your fans and keep creating.</p>
            </div>
            <Button onClick={handleShare} className="gap-2 bg-primary hover:bg-primary/90 shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? 'Link copied!' : 'Share your Wrapped'}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-4">
            Sound2Soul · Soul Wrapped {data.year}
          </p>
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon, label, value, color, delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'violet' | 'amber' | 'rose' | 'cyan';
  delay: number;
}) {
  const colors = {
    violet: 'from-violet-950/80 to-violet-900/40 border-violet-500/20 text-violet-300 bg-violet-500/10',
    amber: 'from-amber-950/80 to-amber-900/40 border-amber-500/20 text-amber-300 bg-amber-500/10',
    rose: 'from-rose-950/80 to-rose-900/40 border-rose-500/20 text-rose-300 bg-rose-500/10',
    cyan: 'from-cyan-950/80 to-cyan-900/40 border-cyan-500/20 text-cyan-300 bg-cyan-500/10',
  };
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors[color]} border p-5 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${colors[color].split(' ').pop()} mb-3`}>
        <span className={colors[color].split(' ')[2].replace('border-', 'text-').replace('/20', '/100')}>{icon}</span>
      </div>
      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
      <p className="text-white text-2xl font-black tabular-nums">
        {visible ? <CountUp target={value} duration={1000} /> : '0'}
      </p>
    </div>
  );
}

function HighlightCard({
  icon, label, value, bg, border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${bg} ${border} border p-4 text-center`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-sm leading-tight">{value}</p>
    </div>
  );
}
