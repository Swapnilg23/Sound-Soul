import React, { useState, useEffect, useCallback } from 'react';
import { useGetLibrary } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Repeat2, Play, Clock, Plus, Trash2, FolderOpen, Music2, ExternalLink } from 'lucide-react';
import { AdBanner } from '@/components/AdBanner';
import { useAuth } from '@/lib/auth';
import { useAudioPlayer } from '@/lib/audio-player';
import { toast } from 'sonner';
import { useEffect as useDocumentEffect } from 'react';

type Tab = 'saved' | 'liked' | 'reposts' | 'following' | 'collections' | 'history';

interface Track {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  audioUrl?: string | null;
  genre: string | null;
  creator: { artistName: string; slug: string; avatarUrl?: string | null } | null;
  repostedAt?: string;
  playedAt?: string;
}

interface Playlist {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  trackCount: number;
  isPublic: boolean;
  createdAt: string;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('sound2soul_token');
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function Library() {
  const { data: library, isLoading } = useGetLibrary();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('saved');

  const [reposts, setReposts] = useState<Track[]>([]);
  const [repostsLoading, setRepostsLoading] = useState(false);

  const [history, setHistory] = useState<Track[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useDocumentEffect(() => {
    document.title = 'Your Library | Sound2Soul';
    setMeta('description', 'View your saved, liked, reposted tracks and creator collections on Sound2Soul.');
    setMeta('robots', 'noindex, nofollow');
  }, []);

  useEffect(() => {
    if (activeTab === 'reposts') {
      setRepostsLoading(true);
      apiFetch('/api/library/reposts')
        .then(d => setReposts(d?.tracks ?? []))
        .catch(() => {})
        .finally(() => setRepostsLoading(false));
    }
    if (activeTab === 'history') {
      setHistoryLoading(true);
      apiFetch('/api/history')
        .then(d => setHistory(d?.tracks ?? []))
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
    if (activeTab === 'collections') {
      setPlaylistsLoading(true);
      apiFetch('/api/playlists')
        .then(d => setPlaylists(d?.playlists ?? []))
        .catch(() => {})
        .finally(() => setPlaylistsLoading(false));
    }
  }, [activeTab]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) return;
    setCreatingPlaylist(true);
    const result = await apiFetch('/api/playlists', {
      method: 'POST',
      body: JSON.stringify({ title: newPlaylistTitle.trim(), isPublic: true }),
    });
    if (result) {
      setPlaylists(prev => [result, ...prev]);
      setNewPlaylistTitle('');
      setShowCreateForm(false);
      toast.success('Collection created!');
    } else {
      toast.error('Could not create collection');
    }
    setCreatingPlaylist(false);
  };

  const handleDeletePlaylist = async (id: string) => {
    await apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });
    setPlaylists(prev => prev.filter(p => p.id !== id));
    toast.success('Collection deleted');
  };

  const tabs: { id: Tab; label: string; count?: number; icon?: React.ReactNode }[] = [
    { id: 'saved',       label: 'Saved',       count: library?.savedTracks.length },
    { id: 'liked',       label: 'Liked',        count: library?.likedTracks.length },
    { id: 'reposts',     label: 'Reposts',      count: reposts.length || undefined, icon: <Repeat2 className="h-3.5 w-3.5" /> },
    { id: 'following',   label: 'Following',    count: library?.followedCreators.length },
    { id: 'collections', label: 'Collections',  count: playlists.length || undefined, icon: <FolderOpen className="h-3.5 w-3.5" /> },
    { id: 'history',     label: 'History',      icon: <Clock className="h-3.5 w-3.5" /> },
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

      {showUpgradePrompt && <AdBanner variant="library-upgrade" />}

      {/* Tabs */}
      <div className="flex flex-wrap gap-0 border-b border-white/8 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-white/8 text-muted-foreground'
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
      {isLoading && (activeTab === 'saved' || activeTab === 'liked' || activeTab === 'following') ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Saved */}
          {activeTab === 'saved' && (
            library?.savedTracks.length === 0 ? (
              <EmptyState icon="🎵" message="You haven't saved any tracks yet." sub="Tap the bookmark on any track to save it here." linkText="Explore tracks" href="/explore" />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {library?.savedTracks.slice(0, 6).map((track: any) => <TrackCard key={track.id} track={track} />)}
                </div>
                {(library?.savedTracks.length ?? 0) > 6 && showUpgradePrompt && <AdBanner variant="library-mid" />}
                {(library?.savedTracks.length ?? 0) > 6 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {library?.savedTracks.slice(6).map((track: any) => <TrackCard key={track.id} track={track} />)}
                  </div>
                )}
              </>
            )
          )}

          {/* Liked */}
          {activeTab === 'liked' && (
            library?.likedTracks.length === 0 ? (
              <EmptyState icon="♥" message="You haven't liked any tracks yet." sub="Tap the heart on any track to like it." linkText="Explore tracks" href="/explore" />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {library?.likedTracks.slice(0, 6).map((track: any) => <TrackCard key={track.id} track={track} />)}
                </div>
                {(library?.likedTracks.length ?? 0) > 6 && showUpgradePrompt && <AdBanner variant="library-mid" />}
                {(library?.likedTracks.length ?? 0) > 6 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {library?.likedTracks.slice(6).map((track: any) => <TrackCard key={track.id} track={track} />)}
                  </div>
                )}
              </>
            )
          )}

          {/* Reposts */}
          {activeTab === 'reposts' && (
            repostsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : reposts.length === 0 ? (
              <EmptyState icon="🔁" message="You haven't reposted any tracks yet." sub="Hit Repost on any track to share it." linkText="Discover tracks" href="/explore" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reposts.map(track => <TrackCard key={track.id} track={track} reposted />)}
              </div>
            )
          )}

          {/* Following */}
          {activeTab === 'following' && (
            library?.followedCreators.length === 0 ? (
              <EmptyState icon="✦" message="You're not following any creators yet." sub="Follow a creator to get notified when they drop new music." linkText="Discover creators" href="/explore" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {library?.followedCreators.map((creator: any) => <CreatorCard key={creator.id} creator={creator} />)}
              </div>
            )
          )}

          {/* Collections */}
          {activeTab === 'collections' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{playlists.length > 0 ? `${playlists.length} collection${playlists.length !== 1 ? 's' : ''}` : 'No collections yet'}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateForm(v => !v)}
                  className="gap-1.5 rounded-full border-white/10 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Collection
                </Button>
              </div>

              {showCreateForm && (
                <div className="flex items-center gap-2 p-4 bg-white/3 rounded-xl border border-white/8">
                  <input
                    type="text"
                    value={newPlaylistTitle}
                    onChange={e => setNewPlaylistTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreatePlaylist(); if (e.key === 'Escape') setShowCreateForm(false); }}
                    placeholder="Collection name…"
                    maxLength={80}
                    autoFocus
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
                  />
                  <Button size="sm" onClick={handleCreatePlaylist} disabled={creatingPlaylist || !newPlaylistTitle.trim()} className="rounded-full text-xs px-4">
                    {creatingPlaylist ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              )}

              {playlistsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : playlists.length === 0 ? (
                <EmptyState icon="📂" message="No Soul Collections yet." sub='Create a collection and add tracks from any track page using "Add to Collection".' linkText="Explore tracks" href="/explore" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {playlists.map(pl => (
                    <PlaylistCard key={pl.id} playlist={pl} onDelete={handleDeletePlaylist} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Your last 30 plays</p>
              </div>
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <EmptyState icon="⏱" message="No listening history yet." sub="Tracks you play will appear here so you can easily find them again." linkText="Start listening" href="/explore" />
              ) : (
                <div className="space-y-1">
                  {history.map((track, i) => (
                    <HistoryRow key={`${track.id}-${i}`} track={track} />
                  ))}
                </div>
              )}
            </div>
          )}

          {showUpgradePrompt && activeTab !== 'collections' && activeTab !== 'history' && (
            <AdBanner variant="library-mid" />
          )}
        </>
      )}
    </div>
  );
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function HistoryRow({ track }: { track: any }) {
  const { play, currentTrack, isPlaying } = useAudioPlayer();
  const isActive = currentTrack?.id === track.id;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div
      className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-primary/8 border-primary/20' : 'border-transparent hover:bg-white/5 hover:border-white/8'}`}
      onClick={() => play({ id: track.id, title: track.title, slug: track.slug, audioUrl: track.audioUrl ?? null, coverImageUrl: track.coverImageUrl ?? null, creator: track.creator ? { artistName: track.creator.artistName, slug: track.creator.slug, avatarUrl: track.creator.avatarUrl ?? null } : null })}
    >
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
        {track.coverImageUrl
          ? <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><Music2 className="w-4 h-4 text-primary/40" /></div>
        }
        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isActive && isPlaying
            ? <span className="flex gap-[2px] items-end h-3">{[1,2,3].map(i=><span key={i} className="w-[2px] bg-white rounded-full animate-pulse" style={{height:`${40+i*20}%`,animationDelay:`${i*0.15}s`}}/>)}</span>
            : <Play className="w-3 h-3 text-white ml-0.5" fill="currentColor" />
          }
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`}>{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.creator?.artistName ?? 'Unknown'}{track.genre ? ` · ${track.genre}` : ''}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] text-muted-foreground/40 tabular-nums">{track.playedAt ? timeAgo(track.playedAt) : ''}</span>
        <Link href={`/track/${track.slug}`} onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-primary transition-all">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function PlaylistCard({ playlist, onDelete }: { playlist: Playlist; onDelete: (id: string) => void }) {
  return (
    <div className="group relative">
      <Link href={`/collection/${playlist.slug}`}>
        <Card className="bg-card/40 hover:bg-card/80 border-white/5 hover:border-primary/20 transition-all cursor-pointer">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-white/8 overflow-hidden">
              {playlist.coverImageUrl
                ? <img src={playlist.coverImageUrl} alt={playlist.title} className="w-full h-full object-cover" />
                : <FolderOpen className="w-6 h-6 text-primary/40" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{playlist.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{playlist.trackCount} tracks · {playlist.isPublic ? 'Public' : 'Private'}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors flex-shrink-0" />
          </CardContent>
        </Card>
      </Link>
      <button
        onClick={() => onDelete(playlist.id)}
        className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive p-1 rounded"
        title="Delete collection"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
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
            <button
              onClick={handlePlay}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isLoaded ? 'bg-black/20' : 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100'}`}
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
