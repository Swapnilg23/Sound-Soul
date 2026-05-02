import React, { useState, useEffect } from 'react';
import { useExploreTracks, useGetCuratedSections } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Repeat2, Sparkles, Users } from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';
import { useAuth } from '@/lib/auth';

interface FeedItem {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  genre: string | null;
  creator: { artistName: string; avatarUrl: string | null; slug: string } | null;
  sortDate: string;
  type: 'release' | 'repost';
  repostedBy?: { artistName: string; slug: string };
}

async function authFetch(path: string) {
  const token = localStorage.getItem('sound2soul_token');
  const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.ok ? res.json() : null;
}

function useFollowingFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setItems([]); return; }
    setIsLoading(true);

    Promise.all([
      authFetch('/api/following/feed'),
      authFetch('/api/reposts/feed'),
    ])
      .then(([releasesData, repostsData]) => {
        const releases: FeedItem[] = (releasesData?.tracks ?? []).map((t: any) => ({
          id: `release-${t.id}`,
          title: t.title,
          slug: t.slug,
          coverImageUrl: t.coverImageUrl,
          genre: t.genre,
          creator: t.creator,
          sortDate: t.createdAt,
          type: 'release' as const,
        }));

        const reposts: FeedItem[] = (repostsData?.tracks ?? []).map((t: any) => ({
          id: `repost-${t.id}`,
          title: t.title,
          slug: t.slug,
          coverImageUrl: t.coverImageUrl,
          genre: t.genre,
          creator: t.creator,
          sortDate: t.repostedAt ?? t.createdAt,
          type: 'repost' as const,
          repostedBy: t.repostedBy,
        }));

        // Merge and dedupe (prefer release over repost for same slug)
        const seen = new Set<string>();
        const merged = [...releases, ...reposts]
          .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
          .filter(item => {
            if (seen.has(item.slug)) return false;
            seen.add(item.slug);
            return true;
          });

        setItems(merged);
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  return { items, isLoading };
}

export default function Explore() {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const { data: curatedData, isLoading: isCuratedLoading } = useGetCuratedSections();
  const { items: feedItems, isLoading: isFeedLoading } = useFollowingFeed();

  const { data: searchData, isLoading: isSearchLoading } = useExploreTracks(
    { search: search.length > 2 ? search : undefined, limit: 20 },
    { query: { enabled: search.length > 2 } }
  );

  const isSearching = search.length > 2;
  const showFeed = !!user && (isFeedLoading || feedItems.length > 0);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] pb-20">

      {/* Page header */}
      <div className="px-6 lg:px-10 pt-10 pb-8 space-y-5 max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Explore</h1>
        <div className="relative max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tracks, moods, genres..."
            className="w-full bg-card/60 border border-white/8 rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isSearching ? (
        <div className="px-6 lg:px-10 max-w-7xl mx-auto space-y-6">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Results for <span className="text-foreground">"{search}"</span>
          </h2>
          {isSearchLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : searchData?.tracks.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">No tracks found matching "{search}"</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchData?.tracks.map(track => <TrackCard key={track.id} track={track} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Following Feed ─────────────────────────────────────────────── */}
          {showFeed && (
            <section className="px-6 lg:px-10 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-xl font-bold">From Creators You Follow</h2>
                </div>
                <Link href="/library" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Manage following →
                </Link>
              </div>

              {isFeedLoading ? (
                <FeedSkeleton />
              ) : feedItems.length === 0 ? (
                <EmptyFeed />
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {feedItems.slice(0, 8).map(item => (
                    <FeedItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Curated sections ───────────────────────────────────────────── */}
          {isCuratedLoading ? (
            <>
              <SectionSkeleton />
              <SectionSkeleton />
              <SectionSkeleton />
            </>
          ) : (
            <>
              {curatedData?.featured && curatedData.featured.length > 0 && (
                <ScrollSection title="Featured" tracks={curatedData.featured} />
              )}

              <div className="px-6 lg:px-10 max-w-7xl mx-auto">
                <AdBanner variant="explore" />
              </div>

              {curatedData?.calmRightNow && curatedData.calmRightNow.length > 0 && (
                <ScrollSection title="Calm Right Now" tracks={curatedData.calmRightNow} />
              )}
              {curatedData?.hopefulSounds && curatedData.hopefulSounds.length > 0 && (
                <ScrollSection title="Hopeful Sounds" tracks={curatedData.hopefulSounds} />
              )}
              {curatedData?.cinematicAi && curatedData.cinematicAi.length > 0 && (
                <ScrollSection title="Cinematic AI" tracks={curatedData.cinematicAi} />
              )}
              {curatedData?.humanAiCollaborations && curatedData.humanAiCollaborations.length > 0 && (
                <ScrollSection title="Human + AI Collaborations" tracks={curatedData.humanAiCollaborations} />
              )}
              {curatedData?.focusAndFlow && curatedData.focusAndFlow.length > 0 && (
                <ScrollSection title="Focus and Flow" tracks={curatedData.focusAndFlow} />
              )}
              {curatedData?.latest && curatedData.latest.length > 0 && (
                <ScrollSection title="New Releases" tracks={curatedData.latest} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Feed Item ────────────────────────────────────────────────────────────────

function FeedItem({ item }: { item: FeedItem }) {
  const isRepost = item.type === 'repost';

  return (
    <Link href={`/track/${item.slug}`}>
      <div className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white/4 transition-colors cursor-pointer border border-transparent hover:border-white/8">
        {/* Cover */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
          {item.coverImageUrl ? (
            <img
              src={item.coverImageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary/30 text-lg">♫</div>
          )}
          {/* Type badge on cover */}
          <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center ${
            isRepost ? 'bg-emerald-500/90' : 'bg-primary/90'
          }`}>
            {isRepost
              ? <Repeat2 className="w-2.5 h-2.5 text-white" />
              : <Sparkles className="w-2.5 h-2.5 text-white" />
            }
          </div>
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          {/* Activity label */}
          <div className="flex items-center gap-1.5 mb-0.5">
            {isRepost ? (
              <span className="text-[10px] text-emerald-400/70 font-medium flex items-center gap-1">
                <Repeat2 className="w-2.5 h-2.5" />
                Repost
              </span>
            ) : (
              <span className="text-[10px] text-primary/70 font-medium flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                New release
              </span>
            )}
          </div>

          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors leading-tight">
            {item.title}
          </p>

          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            {item.creator?.avatarUrl && (
              <img src={item.creator.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
            )}
            <span className="truncate">{item.creator?.artistName}</span>
            {item.genre && (
              <>
                <span>·</span>
                <span className="text-muted-foreground/50">{item.genre}</span>
              </>
            )}
          </div>
        </div>

        {/* Play hint */}
        <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Play className="w-3.5 h-3.5 text-foreground ml-0.5" fill="currentColor" />
        </div>
      </div>
    </Link>
  );
}

function EmptyFeed() {
  return (
    <div className="py-8 px-6 rounded-2xl bg-card/20 border border-white/5 border-dashed flex flex-col sm:flex-row items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Users className="w-5 h-5 text-primary/50" />
      </div>
      <div className="text-center sm:text-left">
        <p className="font-medium text-sm mb-1">Your feed is empty</p>
        <p className="text-xs text-muted-foreground mb-3">Follow creators to see their new releases and reposts here.</p>
        <Link href="/explore" className="text-xs text-primary hover:underline font-medium">Discover creators →</Link>
      </div>
    </div>
  );
}

// ── Scroll Section (curated) ─────────────────────────────────────────────────

function ScrollSection({
  title, tracks, headerLink, accent,
}: {
  title: string;
  tracks: any[];
  headerLink?: { label: string; href: string };
  accent?: boolean;
}) {
  return (
    <section>
      <div className="px-6 lg:px-10 max-w-7xl mx-auto mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {accent && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
          <h2 className={`text-xl font-bold ${accent ? 'text-foreground' : ''}`}>{title}</h2>
        </div>
        {headerLink && (
          <Link href={headerLink.href} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {headerLink.label} →
          </Link>
        )}
      </div>
      <div className="scroll-row flex gap-4 overflow-x-auto px-6 lg:px-10 pb-2" style={{ scrollPaddingLeft: '1.5rem' }}>
        {tracks.map(track => (
          <div key={track.id} className="flex-shrink-0 w-40 sm:w-48">
            <TrackCard track={track} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TrackCard({ track }: { track: any }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/track/${track.slug}`}>
      <div
        className="group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative rounded-2xl overflow-hidden aspect-square bg-card mb-3">
          {track.coverImageUrl ? (
            <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-11 h-11 rounded-full bg-foreground flex items-center justify-center shadow-xl transform transition-transform duration-200 scale-90 group-hover:scale-100">
              <Play className="w-5 h-5 text-background ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
        <div className="space-y-0.5 px-0.5">
          <p className="text-sm font-semibold truncate leading-tight">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.creator?.artistName || 'Unknown Artist'}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-2xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

function SectionSkeleton({ label }: { label?: string } = {}) {
  return (
    <section>
      <div className="px-6 lg:px-10 mb-4 flex items-center gap-3">
        {label ? (
          <>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xl font-bold">{label}</span>
          </>
        ) : (
          <Skeleton className="h-6 w-40" />
        )}
      </div>
      <div className="flex gap-4 px-6 lg:px-10">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-40 sm:w-48 space-y-3">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
