import React, { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useAudioPlayer, PlayerTrack } from '@/lib/audio-player';
import { Play, Radio, Shuffle, ArrowLeft, Music2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RadioTrack {
  id: string;
  title: string;
  slug: string;
  genre: string | null;
  moodTags: string[];
  audioUrl: string | null;
  coverImageUrl: string | null;
  playCount: number;
  likeCount: number;
  creator: { artistName: string; slug: string; avatarUrl: string | null };
}

function toPlayerTrack(t: RadioTrack): PlayerTrack {
  return {
    id: t.id, title: t.title, slug: t.slug,
    audioUrl: t.audioUrl ?? null,
    coverImageUrl: t.coverImageUrl ?? null,
    creator: { artistName: t.creator.artistName, slug: t.creator.slug, avatarUrl: t.creator.avatarUrl ?? null },
  };
}

async function fetchRadio(tag: string): Promise<{ tag: string; tracks: RadioTrack[] }> {
  const qs = new URLSearchParams();
  if (tag && tag !== 'all') { qs.set('mood', tag); qs.set('genre', tag); }
  qs.set('limit', '20');
  const res = await fetch(`/api/radio?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch radio');
  return res.json();
}

export default function SoulRadio() {
  const [, params] = useRoute('/radio/:tag');
  const [, navigate] = useLocation();
  const tag = decodeURIComponent(params?.tag ?? 'all');

  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [started, setStarted] = useState(false);

  const { setQueue, play, currentTrack, isPlaying, addToQueue } = useAudioPlayer();

  useEffect(() => {
    setIsLoading(true);
    setStarted(false);
    fetchRadio(tag)
      .then(d => setTracks(d.tracks))
      .catch(() => toast.error('Could not load radio station'))
      .finally(() => setIsLoading(false));
  }, [tag]);

  const handleStart = () => {
    if (tracks.length === 0) return;
    setQueue(tracks.map(toPlayerTrack), 0);
    setStarted(true);
    toast.success(`Soul Radio · ${tag === 'all' ? 'All Sounds' : tag} is playing`);
  };

  const handleShuffle = () => {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setTracks(shuffled);
    setQueue(shuffled.map(toPlayerTrack), 0);
    setStarted(true);
    toast.success('Shuffled the station');
  };

  const displayTag = tag === 'all' ? 'All Sounds' : tag;
  const isCurrentStationPlaying = started && currentTrack && tracks.some(t => t.id === currentTrack.id);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/10 px-6 py-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Explore
          </Link>
          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Radio className="w-7 h-7 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Soul Radio</p>
            <h1 className="text-4xl font-extrabold">{displayTag}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {isLoading ? 'Loading your station…' : `${tracks.length} tracks · endless listening`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              onClick={handleStart}
              disabled={isLoading || tracks.length === 0}
              className="gap-2 rounded-full px-6 bg-primary hover:bg-primary/90"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              {isCurrentStationPlaying ? 'Playing…' : 'Start Radio'}
            </Button>
            <Button
              variant="outline"
              onClick={handleShuffle}
              disabled={isLoading || tracks.length === 0}
              className="gap-2 rounded-full px-5 border-white/10"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </Button>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-muted-foreground">Station Playlist</h2>
          {!isLoading && (
            <button
              onClick={handleShuffle}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Shuffle className="w-3 h-3" /> Reshuffle
            </button>
          )}
        </div>

        {isLoading ? (
          Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : tracks.length === 0 ? (
          <div className="py-20 text-center">
            <Music2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No tracks found for this station.</p>
            <Link href="/explore" className="text-primary text-sm hover:underline mt-2 inline-block">Explore all sounds →</Link>
          </div>
        ) : (
          tracks.map((track, i) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border ${isActive ? 'bg-primary/8 border-primary/20' : 'border-transparent hover:bg-white/5 hover:border-white/8'}`}
                onClick={() => { play(toPlayerTrack(track)); setStarted(true); }}
              >
                <span className={`w-5 text-center text-xs tabular-nums flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>
                  {isActive && isPlaying
                    ? <span className="flex gap-[2px] items-end h-3.5 justify-center">{[1,2,3].map(j=><span key={j} className="w-[2px] bg-primary rounded-full animate-pulse" style={{height:`${40+j*20}%`,animationDelay:`${j*0.12}s`}}/>)}</span>
                    : i + 1
                  }
                </span>
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  {track.coverImageUrl
                    ? <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><Music2 className="w-4 h-4 text-primary/40" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`}>{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.creator.artistName} {track.genre ? `· ${track.genre}` : ''}</p>
                </div>
                <span className="text-[11px] text-muted-foreground/40 tabular-nums shrink-0">{track.playCount.toLocaleString()} plays</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
