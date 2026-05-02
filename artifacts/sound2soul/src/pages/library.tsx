import React, { useState, useEffect } from 'react';
import { useGetLibrary } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Repeat2, Play } from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';
import { useAuth } from '@/lib/auth';
import { useAudioPlayer } from '@/lib/audio-player';

type Tab = 'saved' | 'liked' | 'reposts' | 'following';

interface Track {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  audioUrl?: string | null;
  genre: string | null;
  creator: { artistName: string; slug: string; avatarUrl?: string | null } | null;
  repostedAt?: string;
}

async function apiFetch(path: string) {
  const token = localStorage.getItem('sound2soul_token');
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;
  return res.json();
}

export default function Library() {
  const { data: library, isLoading } = useGetLibrary();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [reposts, setReposts] = useState<Track[]>([]);
  const [repostsLoading, setRepostsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'reposts') return;
    setRepostsLoading(true);
    apiFetch('/api/library/reposts')
      .then(d => setReposts(d?.tracks ?? []))
      .catch(() => {})
      .finally(() => setRepostsLoading(false));
  }, [activeTab]);

  const tabs: { id: Tab; label: string; count?: number; icon?: React.ReactNode }[] = [
    { id: 'saved',     label: 'Saved',     count: library?.savedTracks.length },
    { id: 'liked',     label: 'Liked',     count: library?.likedTracks.length },
    { id: 'reposts',   label: 'Reposts',   count: reposts.length || undefined, icon: <Repeat2 className="h-3.5 w-3.5" /> },
    { id: 'following', label: 'Following', count: library?.followedCreators.length },
  ];

  const showUpgradePrompt = user && user.role !== 'creator' && user.role !== 'admin';

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Your Library
        </h1>
        <p className="text-muted-foreground">Tracks you've saved, liked, reposted, and creators you follow.</p>
      </div>

      {/* ── Listen Ad-Free upgrade banner (free listeners only) ── */}
      {showUpgradePrompt && <AdBanner variant="library-upgrade" />}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'bg-white/8 text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && activeTab !== 'reposts' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          {activeTab === 'saved' && (
            library?.savedTracks.length === 0 ? (
              <EmptyState icon="🎵" message="You haven't saved any tracks yet." sub="Tap the bookmark on any track to save it here." linkText="Explore tracks" href="/explore" />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {library?.savedTracks.slice(0, 6).map((track: any) => <TrackCard key={track.id} track={track} />)}
                </div>
                {/* Mid-page ad after first 6 tracks */}
                {(library?.savedTracks.length ?? 0) > 6 && showUpgradePrompt && (
                  <AdBanner variant="library-mid" />
                )}
                {(library?.savedTracks.length ?? 0) > 6 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {library?.savedTracks.slice(6).map((track: any) => <TrackCard key={track.id} track={track} />)}
                  </div>
                )}
              </>
            )
          )}

          {activeTab === 'liked' && (
            library?.likedTracks.length === 0 ? (
              <EmptyState icon="♥" message="You haven't liked any tracks yet." sub="Tap the heart on any track to like it." linkText="Explore tracks" href="/explore" />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {library?.likedTracks.slice(0, 6).map((track: any) => <TrackCard key={track.id} track={track} />)}
                </div>
                {(library?.likedTracks.length ?? 0) > 6 && showUpgradePrompt && (
                  <AdBanner variant="library-mid" />
                )}
                {(library?.likedTracks.length ?? 0) > 6 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {library?.likedTracks.slice(6).map((track: any) => <TrackCard key={track.id} track={track} />)}
                  </div>
                )}
              </>
            )
          )}

          {activeTab === 'reposts' && (
            repostsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : reposts.length === 0 ? (
              <EmptyState
                icon="🔁"
                message="You haven't reposted any tracks yet."
                sub="Hit Repost on any track to share it with your followers."
                linkText="Discover tracks"
                href="/explore"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reposts.map(track => <TrackCard key={track.id} track={track} reposted />)}
              </div>
            )
          )}

          {activeTab === 'following' && (
            library?.followedCreators.length === 0 ? (
              <EmptyState icon="✦" message="You're not following any creators yet." sub="Follow a creator to get notified when they drop new music." linkText="Discover creators" href="/explore" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {library?.followedCreators.map((creator: any) => <CreatorCard key={creator.id} creator={creator} />)}
              </div>
            )
          )}

          {/* Bottom ad — always show for free listeners on non-empty tabs */}
          {showUpgradePrompt && (
            <AdBanner variant="library-mid" />
          )}
        </>
      )}
    </div>
  );
}

function TrackCard({ track, reposted }: { track: any; reposted?: boolean }) {
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
      creator: track.creator ? { artistName: track.creator.artistName, slug: track.creator.slug ?? track.slug, avatarUrl: track.creator.avatarUrl ?? null } : null,
    });
  };

  return (
    <Link href={`/track/${track.slug}`}>
      <Card className={`border-white/5 transition-all cursor-pointer group ${isLoaded ? 'bg-primary/5 border-primary/20' : 'bg-card/40 hover:bg-card/80'}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative w-16 h-16 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
            {track.coverImageUrl ? (
              <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xl text-primary/40">♫</div>
            )}
            {/* Play button overlay */}
            <button
              onClick={handlePlay}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                isLoaded ? 'bg-black/20' : 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isLoaded ? 'bg-primary' : 'bg-white/90'}`}>
                {isCurrentlyPlaying
                  ? <span className="flex gap-[2px] items-end h-3">{[1,2,3].map(i=><span key={i} className="w-[2px] bg-white rounded-full animate-pulse" style={{height:`${40+i*20}%`,animationDelay:`${i*0.15}s`}}/>)}</span>
                  : <Play className={`w-3.5 h-3.5 ml-0.5 ${isLoaded ? 'text-white' : 'text-background'}`} fill="currentColor" />
                }
              </div>
            </button>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className={`font-semibold text-base truncate transition-colors ${isLoaded ? 'text-primary' : 'group-hover:text-primary'}`}>{track.title}</h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{track.creator?.artistName || 'Unknown Artist'}</p>
            {reposted && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/70 mt-1">
                <Repeat2 className="h-3 w-3" /> Reposted
              </span>
            )}
            {!reposted && track.genre && (
              <span className="text-xs text-muted-foreground/60">{track.genre}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CreatorCard({ creator }: { creator: any }) {
  return (
    <Link href={`/creator/${creator.slug}`}>
      <Card className="bg-card/40 hover:bg-card/80 border-white/5 transition-colors cursor-pointer group">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex-shrink-0 overflow-hidden border-2 border-white/10 group-hover:border-primary/40 transition-colors">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.artistName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary/40 text-lg">
                {creator.artistName?.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{creator.artistName}</h3>
            {creator.genres && creator.genres.length > 0 && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{creator.genres.join(' · ')}</p>
            )}
            {creator.bio && (
              <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{creator.bio}</p>
            )}
          </div>
          <svg className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-primary/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ icon, message, sub, linkText, href }: {
  icon: string; message: string; sub: string; linkText: string; href: string;
}) {
  return (
    <div className="py-20 text-center bg-card/20 rounded-2xl border border-white/5 border-dashed">
      <div className="text-4xl mb-4 opacity-40">{icon}</div>
      <p className="text-foreground font-medium mb-1">{message}</p>
      <p className="text-sm text-muted-foreground mb-6">{sub}</p>
      <Link href={href} className="text-sm text-primary hover:underline font-medium">{linkText} →</Link>
    </div>
  );
}
