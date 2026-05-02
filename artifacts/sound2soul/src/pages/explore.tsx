import React, { useState, useEffect, useRef } from 'react';
import { useExploreTracks, useGetCuratedSections } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Repeat2, Sparkles, Users, ArrowRight, Music2, Flame } from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';
import { useAuth } from '@/lib/auth';
import { useAudioPlayer } from '@/lib/audio-player';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HomepageData {
  spotlight: {
    id: string; artistName: string; slug: string;
    avatarUrl: string | null; bannerUrl: string | null;
    bio: string | null; creatorStatement: string | null;
    genres: string[] | null; aiToolsUsed: string[] | null;
    followerCount: number;
    topTrack: HomepageTrack | null;
  } | null;
  todaysPick: HomepageTrack | null;
  dailyDrops: HomepageTrack[];
  weeklyWave: HomepageTrack[];
}

interface HomepageTrack {
  id: string; title: string; slug: string;
  audioUrl: string | null;
  coverImageUrl: string | null; genre: string | null;
  moodTags: string[] | null; soulStory: string | null;
  aiInvolvementType: string | null;
  playCount: number; likeCount: number; saveCount: number;
  isFeatured: boolean; createdAt: string;
  creator: {
    artistName: string; slug: string;
    avatarUrl: string | null; bannerUrl: string | null; bio: string | null;
    creatorStatement: string | null; genres: string[] | null;
  } | null;
}

interface FeedItem {
  id: string; title: string; slug: string;
  coverImageUrl: string | null; genre: string | null;
  creator: { artistName: string; avatarUrl: string | null; slug: string } | null;
  sortDate: string; type: 'release' | 'repost';
  repostedBy?: { artistName: string; slug: string };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useHomepageData() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetch('/api/homepage')
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, []);
  return { data, isLoading };
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
    Promise.all([authFetch('/api/following/feed'), authFetch('/api/reposts/feed')])
      .then(([releasesData, repostsData]) => {
        const releases: FeedItem[] = (releasesData?.tracks ?? []).map((t: any) => ({
          id: `release-${t.id}`, title: t.title, slug: t.slug,
          coverImageUrl: t.coverImageUrl, genre: t.genre, creator: t.creator,
          sortDate: t.createdAt, type: 'release' as const,
        }));
        const reposts: FeedItem[] = (repostsData?.tracks ?? []).map((t: any) => ({
          id: `repost-${t.id}`, title: t.title, slug: t.slug,
          coverImageUrl: t.coverImageUrl, genre: t.genre, creator: t.creator,
          sortDate: t.repostedAt ?? t.createdAt, type: 'repost' as const,
          repostedBy: t.repostedBy,
        }));
        const seen = new Set<string>();
        const merged = [...releases, ...reposts]
          .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
          .filter(item => { if (seen.has(item.slug)) return false; seen.add(item.slug); return true; });
        setItems(merged);
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  return { items, isLoading };
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Explore() {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const { data: homepage, isLoading: isHomepageLoading } = useHomepageData();
  const { data: curatedData, isLoading: isCuratedLoading } = useGetCuratedSections();
  const { items: feedItems, isLoading: isFeedLoading } = useFollowingFeed();

  const { data: searchData, isLoading: isSearchLoading } = useExploreTracks(
    { search: search.length > 2 ? search : undefined, limit: 20 },
    { query: { enabled: search.length > 2 } }
  );

  const isSearching = search.length > 2;
  const showFeed = !!user && (isFeedLoading || feedItems.length > 0);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] pb-24">

      {/* Page header */}
      <div className="px-6 lg:px-10 pt-10 pb-8 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <h1 className="text-4xl font-extrabold tracking-tight shrink-0">Explore</h1>
        <div className="relative w-full max-w-sm">
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
        /* ── Search Results ─────────────────────────────────────────────────── */
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
        <div className="space-y-14">

          {/* ── Soul in Focus (Creator Spotlight) ──────────────────────────── */}
          {isHomepageLoading ? (
            <SpotlightSkeleton />
          ) : homepage?.spotlight ? (
            <SoulInFocus creator={homepage.spotlight} />
          ) : null}

          {/* ── Today's Soul Pick ───────────────────────────────────────────── */}
          {isHomepageLoading ? (
            <div className="px-6 lg:px-10 max-w-7xl mx-auto">
              <Skeleton className="h-52 w-full rounded-3xl" />
            </div>
          ) : homepage?.todaysPick ? (
            <TodaysSoulPick track={homepage.todaysPick} />
          ) : null}

          {/* ── Following Feed ───────────────────────────────────────────────── */}
          {showFeed && (
            <section className="px-6 lg:px-10 max-w-7xl mx-auto">
              <SectionHeader
                eyebrow="Creators You Follow"
                title="Your Feed"
                icon={<span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                action={<Link href="/library" className="text-xs text-muted-foreground hover:text-primary transition-colors">Manage →</Link>}
              />
              {isFeedLoading ? <FeedSkeleton /> : feedItems.length === 0 ? <EmptyFeed /> : (
                <div className="grid md:grid-cols-2 gap-3">
                  {feedItems.slice(0, 8).map(item => <FeedItemCard key={item.id} item={item} />)}
                </div>
              )}
            </section>
          )}

          {/* ── Daily Drops ─────────────────────────────────────────────────── */}
          {isHomepageLoading ? (
            <SectionSkeleton />
          ) : homepage?.dailyDrops && homepage.dailyDrops.length > 0 ? (
            <section>
              <div className="px-6 lg:px-10 max-w-7xl mx-auto mb-5">
                <SectionHeader
                  eyebrow="Freshest sounds right now"
                  title="Daily Drops"
                  titleIcon={<span className="text-2xl leading-none">🌅</span>}
                  action={
                    <Link href="/explore" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      All tracks <ArrowRight className="w-3 h-3" />
                    </Link>
                  }
                />
              </div>
              <div className="flex gap-4 overflow-x-auto px-6 lg:px-10 pb-2 no-scrollbar" style={{ scrollPaddingLeft: '1.5rem' }}>
                {homepage.dailyDrops.map(track => (
                  <div key={track.id} className="flex-shrink-0 w-40 sm:w-48">
                    <TrackCard track={track} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── The Weekly Wave ─────────────────────────────────────────────── */}
          {isHomepageLoading ? (
            <div className="px-6 lg:px-10 max-w-7xl mx-auto space-y-3">
              <Skeleton className="h-6 w-40" />
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : homepage?.weeklyWave && homepage.weeklyWave.length > 0 ? (
            <WeeklyWave tracks={homepage.weeklyWave} />
          ) : null}

          {/* ── Ad Banner ───────────────────────────────────────────────────── */}
          <div className="px-6 lg:px-10 max-w-7xl mx-auto">
            <AdBanner variant="explore" />
          </div>

          {/* ── Curated sections ─────────────────────────────────────────────── */}
          {isCuratedLoading ? (
            <><SectionSkeleton /><SectionSkeleton /></>
          ) : (
            <>
              {curatedData?.featured && curatedData.featured.length > 0 && (
                <ScrollSection title="Featured" tracks={curatedData.featured} />
              )}
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
                <ScrollSection title="Human × AI" tracks={curatedData.humanAiCollaborations} />
              )}
              {curatedData?.focusAndFlow && curatedData.focusAndFlow.length > 0 && (
                <ScrollSection title="Focus & Flow" tracks={curatedData.focusAndFlow} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Soul in Focus (Creator Spotlight) ─────────────────────────────────────────

function SoulInFocus({ creator }: { creator: NonNullable<HomepageData['spotlight']> }) {
  const initials = creator.artistName.slice(0, 2).toUpperCase();
  const { play, currentTrack, isPlaying } = useAudioPlayer();

  const handleTopTrackPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!creator.topTrack) return;
    play({
      id: creator.topTrack.id,
      title: creator.topTrack.title,
      slug: creator.topTrack.slug,
      audioUrl: creator.topTrack.audioUrl ?? null,
      coverImageUrl: creator.topTrack.coverImageUrl ?? null,
      creator: { artistName: creator.artistName, slug: creator.slug, avatarUrl: creator.avatarUrl },
    });
  };

  const topIsLoaded = currentTrack?.id === creator.topTrack?.id;
  const topIsPlaying = topIsLoaded && isPlaying;

  return (
    <section className="px-6 lg:px-10 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden min-h-[340px] flex flex-col justify-end">
        {/* Banner background */}
        {creator.bannerUrl ? (
          <img
            src={creator.bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background to-secondary/20" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
          {/* Left: Creator info */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="text-secondary text-xs font-bold uppercase tracking-widest">✦ Soul in Focus</span>
            </div>

            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/20 overflow-hidden bg-primary/30 flex-shrink-0 shadow-2xl">
                {creator.avatarUrl
                  ? <img src={creator.avatarUrl} alt={creator.artistName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white/60">{initials}</div>
                }
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{creator.artistName}</h2>
                <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-white/50">
                  <span>{creator.followerCount} followers</span>
                  {creator.genres && creator.genres.slice(0, 2).map(g => (
                    <span key={g} className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/70 border border-white/10">{g}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Creator statement */}
            {creator.creatorStatement && (
              <p className="text-white/70 text-sm italic leading-relaxed max-w-md line-clamp-2">
                "{creator.creatorStatement}"
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <Link href={`/creator/${creator.slug}`}>
                <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
                  Discover Creator <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Right: Top track preview */}
          {creator.topTrack && (
            <button onClick={handleTopTrackPlay} className="flex-shrink-0 hidden md:block text-left">
              <div className={`group bg-black/40 backdrop-blur-md border rounded-2xl p-3 flex items-center gap-3 w-72 hover:bg-black/60 transition-all duration-200 cursor-pointer ${topIsLoaded ? 'border-primary/40' : 'border-white/10 hover:border-white/20'}`}>
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  {creator.topTrack.coverImageUrl
                    ? <img src={creator.topTrack.coverImageUrl} alt={creator.topTrack.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-primary/30 flex items-center justify-center text-primary/60"><Music2 className="w-5 h-5" /></div>
                  }
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {topIsPlaying
                      ? <span className="flex gap-[3px] items-end h-5">{[1,2,3].map(i=><span key={i} className="w-[3px] bg-white rounded-full animate-pulse" style={{height:`${40+i*20}%`,animationDelay:`${i*0.15}s`}}/>)}</span>
                      : <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                    }
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Top Track</p>
                  <p className={`text-sm font-semibold truncate ${topIsLoaded ? 'text-primary' : 'text-white'}`}>{creator.topTrack.title}</p>
                  <p className="text-xs text-white/50">{(creator.topTrack.playCount || 0).toLocaleString()} plays</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Today's Soul Pick ─────────────────────────────────────────────────────────

function TodaysSoulPick({ track }: { track: HomepageTrack }) {
  const { play, currentTrack, isPlaying } = useAudioPlayer();
  const isLoaded = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isLoaded && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    play({
      id: track.id, title: track.title, slug: track.slug,
      audioUrl: track.audioUrl ?? null,
      coverImageUrl: track.coverImageUrl ?? null,
      creator: track.creator ? { artistName: track.creator.artistName, slug: track.creator.slug, avatarUrl: track.creator.avatarUrl ?? null } : null,
    });
  };

  return (
    <section className="px-6 lg:px-10 max-w-7xl mx-auto">
      <div className={`group relative rounded-3xl overflow-hidden bg-card/60 border transition-all duration-300 ${isLoaded ? 'border-secondary/40' : 'border-white/8 hover:border-secondary/30'}`}>
          {/* Amber left accent */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-secondary via-secondary/60 to-transparent rounded-l-3xl" />

          <div className="flex flex-col sm:flex-row items-stretch gap-0">
            {/* Cover art — clicking plays; card title area navigates */}
            <button onClick={handlePlay} className="relative sm:w-52 sm:h-52 h-48 flex-shrink-0 overflow-hidden cursor-pointer text-left">
              {track.coverImageUrl ? (
                <img
                  src={track.coverImageUrl}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                  <Music2 className="w-12 h-12 text-secondary/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-200">
                  {isCurrentlyPlaying
                    ? <span className="flex gap-1 items-end h-6">{[1,2,3].map(i=><span key={i} className="w-1 bg-background rounded-full animate-pulse" style={{height:`${40+i*20}%`,animationDelay:`${i*0.15}s`}}/>)}</span>
                    : <Play className="w-6 h-6 text-background ml-1" fill="currentColor" />
                  }
                </div>
              </div>
            </button>

            {/* Info */}
            <div className="flex flex-col justify-center p-6 sm:p-8 gap-3 flex-1 min-w-0">
              {/* Eyebrow */}
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-secondary" />
                <span className="text-secondary text-xs font-bold uppercase tracking-widest">Today's Soul Pick</span>
              </div>

              {/* Title + creator */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight group-hover:text-secondary transition-colors duration-200">
                  {track.title}
                </h3>
                <div className="flex items-center gap-2.5 mt-2">
                  {track.creator?.avatarUrl && (
                    <img src={track.creator.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10" />
                  )}
                  <span className="text-sm text-muted-foreground">{track.creator?.artistName}</span>
                  {track.genre && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-xs px-2.5 py-0.5 bg-white/6 rounded-full border border-white/8 text-muted-foreground">{track.genre}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Soul story excerpt */}
              {track.soulStory && (
                <p className="text-sm text-muted-foreground/70 italic leading-relaxed line-clamp-2 max-w-lg">
                  "{track.soulStory}"
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-5 text-xs text-muted-foreground/50 pt-1">
                <span className="flex items-center gap-1.5">
                  <Play className="w-3 h-3" fill="currentColor" />
                  {(track.playCount || 0).toLocaleString()} plays
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-rose-400/70">♥</span>
                  {(track.likeCount || 0).toLocaleString()} likes
                </span>
                {track.aiInvolvementType && (
                  <span className="hidden sm:flex items-center gap-1.5 text-primary/50">
                    <Sparkles className="w-3 h-3" />
                    {track.aiInvolvementType}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}

// ── Weekly Wave ────────────────────────────────────────────────────────────────

function WeeklyWave({ tracks }: { tracks: HomepageTrack[] }) {
  const maxPlays = tracks[0]?.playCount ?? 1;

  return (
    <section className="px-6 lg:px-10 max-w-7xl mx-auto">
      <div className="mb-6">
        <SectionHeader
          eyebrow="This week's most-played sounds"
          title="The Weekly Wave"
          titleIcon={<span className="text-2xl leading-none">〜</span>}
          action={
            <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Full charts <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        {tracks.map((track, i) => {
          const rankColors = ['text-secondary', 'text-secondary/70', 'text-muted-foreground/70'];
          const rankColor = rankColors[Math.min(i, rankColors.length - 1)];
          const barWidth = Math.round((track.playCount / maxPlays) * 100);

          return (
            <Link key={track.id} href={`/track/${track.slug}`}>
              <div className="group flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/8">
                {/* Rank */}
                <span className={`w-6 text-center text-sm font-bold tabular-nums ${rankColor} flex-shrink-0`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1).padStart(2, '0')}
                </span>

                {/* Cover */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  {track.coverImageUrl
                    ? <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><Music2 className="w-4 h-4 text-primary/40" /></div>
                  }
                </div>

                {/* Info + bar */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{track.title}</p>
                    <span className="text-[11px] text-muted-foreground/50 tabular-nums shrink-0">{(track.playCount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate">{track.creator?.artistName}</p>
                    {track.genre && (
                      <span className="text-[10px] text-muted-foreground/40 shrink-0">· {track.genre}</span>
                    )}
                  </div>
                  {/* Play count bar */}
                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary/60 to-secondary/60 rounded-full transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow, title, titleIcon, icon, action,
}: {
  eyebrow?: string;
  title: string;
  titleIcon?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-0">
      <div className="space-y-0.5">
        {eyebrow && (
          <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest">{eyebrow}</p>
        )}
        <div className="flex items-center gap-2.5">
          {icon}
          {titleIcon && <span className="leading-none">{titleIcon}</span>}
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Feed Item ─────────────────────────────────────────────────────────────────

function FeedItemCard({ item }: { item: FeedItem }) {
  const isRepost = item.type === 'repost';
  return (
    <Link href={`/track/${item.slug}`}>
      <div className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white/4 transition-colors cursor-pointer border border-transparent hover:border-white/8">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
          {item.coverImageUrl
            ? <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary/30 text-lg">♫</div>
          }
          <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center ${isRepost ? 'bg-emerald-500/90' : 'bg-primary/90'}`}>
            {isRepost ? <Repeat2 className="w-2.5 h-2.5 text-white" /> : <Sparkles className="w-2.5 h-2.5 text-white" />}
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isRepost
              ? <span className="text-[10px] text-emerald-400/70 font-medium flex items-center gap-1"><Repeat2 className="w-2.5 h-2.5" />Repost</span>
              : <span className="text-[10px] text-primary/70 font-medium flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />New release</span>
            }
          </div>
          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors leading-tight">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            {item.creator?.avatarUrl && <img src={item.creator.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
            <span className="truncate">{item.creator?.artistName}</span>
            {item.genre && <><span>·</span><span className="text-muted-foreground/50">{item.genre}</span></>}
          </div>
        </div>
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

// ── Scroll Section ─────────────────────────────────────────────────────────────

function ScrollSection({ title, tracks }: { title: string; tracks: any[] }) {
  return (
    <section>
      <div className="px-6 lg:px-10 max-w-7xl mx-auto mb-4">
        <SectionHeader title={title} />
      </div>
      <div className="flex gap-4 overflow-x-auto px-6 lg:px-10 pb-2 no-scrollbar" style={{ scrollPaddingLeft: '1.5rem' }}>
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
  const { play, currentTrack, isPlaying } = useAudioPlayer();
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const isLoaded = currentTrack?.id === track.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    play({
      id: track.id,
      title: track.title,
      slug: track.slug,
      audioUrl: track.audioUrl ?? null,
      coverImageUrl: track.coverImageUrl ?? null,
      creator: track.creator ? {
        artistName: track.creator.artistName,
        slug: track.creator.slug,
        avatarUrl: track.creator.avatarUrl ?? null,
      } : null,
    });
  };

  return (
    <Link href={`/track/${track.slug}`}>
      <div className="group cursor-pointer">
        <div className="relative rounded-2xl overflow-hidden aspect-square bg-card mb-3">
          {track.coverImageUrl
            ? <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Music2 className="w-10 h-10 text-primary/30" />
              </div>
          }
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handlePlay}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-200 scale-90 group-hover:scale-100 ${isLoaded ? 'bg-primary text-white' : 'bg-foreground text-background'}`}
            >
              {isCurrentlyPlaying
                ? <span className="flex gap-[3px] items-end h-4">
                    {[1,2,3].map(i => <span key={i} className="w-[3px] bg-white rounded-full animate-pulse" style={{ height: `${50 + i * 16}%`, animationDelay: `${i*0.15}s` }} />)}
                  </span>
                : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
              }
            </button>
          </div>
          {isLoaded && (
            <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
              {isCurrentlyPlaying
                ? <span className="flex gap-px items-end h-2.5">{[1,2].map(i=><span key={i} className="w-[2px] bg-white rounded-full animate-pulse" style={{height:`${50+i*30}%`}}/>)}</span>
                : <Play className="w-2 h-2 text-white ml-px" fill="currentColor" />
              }
            </div>
          )}
        </div>
        <div className="space-y-0.5 px-0.5">
          <p className={`text-sm font-semibold truncate leading-tight ${isLoaded ? 'text-primary' : ''}`}>{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.creator?.artistName || 'Unknown Artist'}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SpotlightSkeleton() {
  return (
    <div className="px-6 lg:px-10 max-w-7xl mx-auto">
      <Skeleton className="h-[340px] w-full rounded-3xl" />
    </div>
  );
}

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

function SectionSkeleton() {
  return (
    <section>
      <div className="px-6 lg:px-10 mb-4 space-y-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-44" />
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
