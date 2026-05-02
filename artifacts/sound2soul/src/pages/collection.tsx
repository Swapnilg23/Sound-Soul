import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useAudioPlayer, PlayerTrack } from '@/lib/audio-player';
import { Play, Music2, Share2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CollectionTrack {
  id: string;
  title: string;
  slug: string;
  genre: string | null;
  audioUrl: string | null;
  coverImageUrl: string | null;
  playCount: number;
  creator: { artistName: string; slug: string; avatarUrl: string | null };
}

interface CollectionData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  trackCount: number;
  createdAt: string;
  owner?: { displayName: string; avatarUrl: string | null };
  tracks: CollectionTrack[];
}

function toPlayerTrack(t: CollectionTrack): PlayerTrack {
  return {
    id: t.id, title: t.title, slug: t.slug,
    audioUrl: t.audioUrl ?? null,
    coverImageUrl: t.coverImageUrl ?? null,
    creator: { artistName: t.creator.artistName, slug: t.creator.slug, avatarUrl: t.creator.avatarUrl ?? null },
  };
}

export default function CollectionPage() {
  const [, params] = useRoute('/collection/:slug');
  const slug = params?.slug ?? '';

  const [data, setData] = useState<CollectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { setQueue, play, currentTrack, isPlaying } = useAudioPlayer();

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    fetch(`/api/playlists/${encodeURIComponent(slug)}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handlePlayAll = () => {
    if (!data?.tracks.length) return;
    setQueue(data.tracks.map(toPlayerTrack), 0);
    toast.success(`Playing "${data.title}"`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] max-w-2xl mx-auto px-6 py-12 space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-4 text-center px-6">
        <Music2 className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-lg font-semibold">Collection not found</p>
        <p className="text-muted-foreground text-sm">This playlist may be private or doesn't exist.</p>
        <Link href="/library" className="text-primary text-sm hover:underline">Go to Library →</Link>
      </div>
    );
  }

  const cover = data.coverImageUrl ?? data.tracks[0]?.coverImageUrl ?? null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden px-6 pt-12 pb-16 bg-gradient-to-b from-primary/10 to-transparent">
        {cover && (
          <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-15 scale-110" style={{ backgroundImage: `url(${cover})` }} />
        )}
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col sm:flex-row items-start gap-6">
          <div className="w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0 bg-primary/20 shadow-xl ring-1 ring-white/10">
            {cover
              ? <img src={cover} alt={data.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Music2 className="w-10 h-10 text-primary/40" /></div>
            }
          </div>
          <div className="flex-1 space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Soul Collection</p>
            <h1 className="text-3xl font-extrabold leading-tight">{data.title}</h1>
            {data.description && <p className="text-muted-foreground text-sm">{data.description}</p>}
            <p className="text-xs text-muted-foreground">
              {data.owner?.displayName ? `by ${data.owner.displayName} · ` : ''}{data.tracks.length} tracks
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handlePlayAll} className="gap-2 rounded-full px-5" disabled={data.tracks.length === 0}>
                <Play className="w-4 h-4" fill="currentColor" /> Play All
              </Button>
              <button onClick={handleShare} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-full hover:bg-white/5">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="max-w-2xl mx-auto px-6 space-y-1">
        {data.tracks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">This collection is empty.</p>
          </div>
        ) : (
          data.tracks.map((track, i) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border ${isActive ? 'bg-primary/8 border-primary/20' : 'border-transparent hover:bg-white/5 hover:border-white/8'}`}
                onClick={() => play(toPlayerTrack(track))}
              >
                <span className="w-5 text-center text-xs tabular-nums text-muted-foreground/40 flex-shrink-0">
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
                  <p className="text-xs text-muted-foreground truncate">{track.creator.artistName}{track.genre ? ` · ${track.genre}` : ''}</p>
                </div>
                <Link
                  href={`/track/${track.slug}`}
                  onClick={e => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground/50 hover:text-primary transition-all"
                >
                  View →
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
