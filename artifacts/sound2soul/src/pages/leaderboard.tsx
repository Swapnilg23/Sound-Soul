import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

type Window = '24h' | '7d' | '30d' | 'all';

interface LeaderboardTrack {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  genre: string | null;
  aiInvolvementType: string | null;
  playCount: number;
  likeCount: number;
  saveCount: number;
  creator: { id: string; artistName: string; slug: string; avatarUrl: string | null } | null;
}

const WINDOWS: { id: Window; label: string }[] = [
  { id: '24h',  label: 'Today' },
  { id: '7d',   label: 'This Week' },
  { id: '30d',  label: 'This Month' },
  { id: 'all',  label: 'All Time' },
];

async function fetchLeaderboard(win: Window, genre: string) {
  const params = new URLSearchParams({ window: win });
  if (genre) params.set('genre', genre);
  const res = await fetch(`/api/leaderboard?${params}`);
  if (!res.ok) return [];
  const d = await res.json();
  return d.tracks as LeaderboardTrack[];
}

async function fetchGenres(): Promise<string[]> {
  const res = await fetch('/api/leaderboard/genres');
  if (!res.ok) return [];
  const d = await res.json();
  return d.genres as string[];
}

export default function Leaderboard() {
  const [activeWindow, setActiveWindow] = useState<Window>('7d');
  const [activeGenre, setActiveGenre] = useState('');
  const [tracks, setTracks] = useState<LeaderboardTrack[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGenres().then(setGenres);
  }, []);

  const load = useCallback(async (win: Window, genre: string) => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboard(win, genre);
      setTracks(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeWindow, activeGenre);
  }, [activeWindow, activeGenre, load]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] pb-20">
      {/* Header */}
      <div className="px-6 lg:px-10 pt-10 pb-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏆</span>
          <h1 className="text-4xl font-extrabold tracking-tight">Charts</h1>
        </div>
        <p className="text-muted-foreground text-sm">The most-played AI-assisted tracks on Sound2Soul.</p>
      </div>

      {/* Controls */}
      <div className="px-6 lg:px-10 max-w-4xl mx-auto space-y-4 mb-8">
        {/* Time window tabs */}
        <div className="flex gap-1 border-b border-white/8">
          {WINDOWS.map(w => (
            <button
              key={w.id}
              onClick={() => setActiveWindow(w.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeWindow === w.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {w.label}
              {activeWindow === w.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <GenrePill label="All Genres" active={activeGenre === ''} onClick={() => setActiveGenre('')} />
            {genres.map(g => (
              <GenrePill key={g} label={g} active={activeGenre === g} onClick={() => setActiveGenre(activeGenre === g ? '' : g)} />
            ))}
          </div>
        )}
      </div>

      {/* Chart list */}
      <div className="px-6 lg:px-10 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-6 rounded" />
                <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="w-16 h-4 rounded" />
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <EmptyState genre={activeGenre} window={activeWindow} />
        ) : (
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <ChartRow
                key={track.id}
                rank={index + 1}
                track={track}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartRow({ rank, track }: { rank: number; track: LeaderboardTrack }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <Link href={`/track/${track.slug}`}>
      <div className="group flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/4 transition-colors cursor-pointer">
        {/* Rank */}
        <div className="w-8 flex-shrink-0 text-center">
          {medal ? (
            <span className="text-xl leading-none">{medal}</span>
          ) : (
            <span className={`text-sm font-bold tabular-nums ${rank <= 10 ? 'text-foreground/60' : 'text-muted-foreground/40'}`}>
              {rank}
            </span>
          )}
        </div>

        {/* Cover */}
        <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-muted">
          {track.coverImageUrl ? (
            <img
              src={track.coverImageUrl}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary/30 text-xl">♫</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <p className="font-semibold truncate group-hover:text-primary transition-colors">{track.title}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            {track.creator && (
              <span className="truncate">{track.creator.artistName}</span>
            )}
            {track.genre && (
              <>
                <span>·</span>
                <span>{track.genre}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 flex-shrink-0 text-right">
          <div className="hidden sm:block text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Likes</p>
            <p className="text-sm font-semibold tabular-nums">{track.likeCount.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Plays</p>
            <p className={`text-sm font-bold tabular-nums ${rank <= 3 ? 'text-primary' : ''}`}>
              {track.playCount.toLocaleString()}
            </p>
          </div>
          {/* Spark bar */}
          <div className="hidden md:block w-24">
            <SparkBar value={track.playCount} likeRatio={track.playCount > 0 ? track.likeCount / track.playCount : 0} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SparkBar({ value, likeRatio }: { value: number; likeRatio: number }) {
  const pct = Math.min(100, Math.round(likeRatio * 100));
  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
          style={{ width: `${Math.max(8, pct)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-right">{pct}% liked</p>
    </div>
  );
}

function GenrePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-white/4 text-muted-foreground border-white/8 hover:border-white/20 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ genre, window: win }: { genre: string; window: Window }) {
  const windowLabel = WINDOWS.find(w => w.id === win)?.label ?? '';
  return (
    <div className="py-20 text-center bg-card/20 rounded-2xl border border-white/5 border-dashed">
      <div className="text-4xl mb-4 opacity-30">🎵</div>
      <p className="font-medium text-foreground">No tracks yet</p>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        {genre
          ? `No ${genre} tracks in the ${windowLabel.toLowerCase()} chart yet.`
          : `No tracks in the ${windowLabel.toLowerCase()} chart yet.`}
      </p>
      <Link href="/explore" className="text-sm text-primary hover:underline font-medium">
        Explore all tracks →
      </Link>
    </div>
  );
}
