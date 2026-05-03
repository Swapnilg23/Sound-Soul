import React, { useState, useEffect, useRef } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useGetTrackBySlug, useLikeTrack, useUnlikeTrack, useSaveTrack, useUnsaveTrack, useGetTrackInteractions, getGetTrackInteractionsQueryKey } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TrustCard } from '@/components/TrustCard';
import { AdBanner } from '@/components/AdBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, Share2, Repeat2, MessageCircle, Trash2, Send, Radio, Pin, Plus, FolderOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    slug: string | null;
    role: string;
  };
}

interface SoulStory {
  id: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  isOwn: boolean;
  author: { displayName: string; avatarUrl: string | null; slug: string | null };
}

interface Playlist { id: string; title: string; slug: string; }

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('sound2soul_token');
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export default function TrackDetail() {
  const [, params] = useRoute('/track/:slug');
  const [, navigate] = useLocation();
  const slug = params?.slug || '';
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: track, isLoading } = useGetTrackBySlug(slug, {
    query: { enabled: !!slug }
  });

  const { data: interactions } = useGetTrackInteractions(track?.id || '', {
    query: { enabled: !!track?.id && !!user }
  });

  const likeMutation = useLikeTrack();
  const unlikeMutation = useUnlikeTrack();
  const saveMutation = useSaveTrack();
  const unsaveMutation = useUnsaveTrack();

  // Repost state
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [repostLoading, setRepostLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Soul Stories state
  const [stories, setStories] = useState<SoulStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storyBody, setStoryBody] = useState('');
  const [submittingStory, setSubmittingStory] = useState(false);
  const [myStory, setMyStory] = useState<SoulStory | null>(null);

  // Add to Collection modal
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);

  useEffect(() => {
    if (!track?.slug) return;
    setCommentsLoading(true);
    apiFetch(`/api/tracks/${track.slug}/comments`)
      .then(d => setComments(d.comments))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));

    setStoriesLoading(true);
    apiFetch(`/api/tracks/${track.slug}/soul-stories`)
      .then(d => {
        setStories(d.stories);
        const own = d.stories.find((s: SoulStory) => s.isOwn);
        if (own) { setMyStory(own); setStoryBody(own.body); }
      })
      .catch(() => {})
      .finally(() => setStoriesLoading(false));
  }, [track?.slug]);

  useEffect(() => {
    if (!track?.id || !user) return;
    apiFetch(`/api/reposts/${track.id}`)
      .then(d => { setIsReposted(d.isReposted); setRepostCount(d.count ?? 0); })
      .catch(() => {});
  }, [track?.id, user]);

  const loadPlaylists = async () => {
    if (playlistsLoaded) return;
    const d = await apiFetch('/api/playlists').catch(() => null);
    setPlaylists(d?.playlists ?? []);
    setPlaylistsLoaded(true);
  };

  const handleOpenCollectionModal = async () => {
    if (!user) { toast('Please sign in to add to collections'); return; }
    setShowCollectionModal(true);
    loadPlaylists();
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!track) return;
    setAddingToPlaylist(playlistId);
    await apiFetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackId: track.id }),
    }).catch(() => {});
    setAddingToPlaylist(null);
    toast.success('Added to collection!');
    setShowCollectionModal(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newCollectionTitle.trim() || !track) return;
    setCreatingCollection(true);
    const pl = await apiFetch('/api/playlists', {
      method: 'POST',
      body: JSON.stringify({ title: newCollectionTitle.trim(), isPublic: true }),
    }).catch(() => null);
    if (pl) {
      await apiFetch(`/api/playlists/${pl.id}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ trackId: track.id }),
      }).catch(() => {});
      toast.success(`Added to "${pl.title}"`);
    }
    setNewCollectionTitle('');
    setCreatingCollection(false);
    setShowCollectionModal(false);
  };

  const handleLike = async () => {
    if (!user) { toast('Please log in to like tracks'); return; }
    if (!track) return;
    try {
      if (interactions?.isLiked) {
        await unlikeMutation.mutateAsync({ trackId: track.id });
      } else {
        await likeMutation.mutateAsync({ trackId: track.id });
      }
      queryClient.invalidateQueries({ queryKey: getGetTrackInteractionsQueryKey(track.id) });
    } catch { toast.error('Failed to update like status'); }
  };

  const handleSave = async () => {
    if (!user) { toast('Please log in to save tracks'); return; }
    if (!track) return;
    try {
      if (interactions?.isSaved) {
        await unsaveMutation.mutateAsync({ trackId: track.id });
        toast.success('Removed from Library');
      } else {
        await saveMutation.mutateAsync({ trackId: track.id });
        toast.success('Saved to Library');
      }
      queryClient.invalidateQueries({ queryKey: getGetTrackInteractionsQueryKey(track.id) });
    } catch { toast.error('Failed to update save status'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleRepost = async () => {
    if (!user) { toast('Please log in to repost'); return; }
    if (!track) return;
    setRepostLoading(true);
    try {
      if (isReposted) {
        await apiFetch(`/api/reposts/${track.id}`, { method: 'DELETE' });
        setIsReposted(false); setRepostCount(c => Math.max(0, c - 1));
        toast.success('Repost removed');
      } else {
        await apiFetch(`/api/reposts/${track.id}`, { method: 'POST' });
        setIsReposted(true); setRepostCount(c => c + 1);
        toast.success('Reposted to your profile!');
      }
    } catch { toast.error('Failed to repost'); }
    finally { setRepostLoading(false); }
  };

  const handleComment = async () => {
    if (!user) { toast('Please log in to comment'); return; }
    if (!commentBody.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/tracks/${track!.slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      const d = await apiFetch(`/api/tracks/${track!.slug}/comments`);
      setComments(d.comments);
      setCommentBody('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to post comment');
    } finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiFetch(`/api/tracks/${track!.slug}/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete comment'); }
  };

  const handleSubmitStory = async () => {
    if (!user) { toast('Please sign in to share your story'); return; }
    if (!storyBody.trim()) return;
    setSubmittingStory(true);
    try {
      await apiFetch(`/api/tracks/${track!.slug}/soul-stories`, {
        method: 'POST',
        body: JSON.stringify({ body: storyBody.trim() }),
      });
      const d = await apiFetch(`/api/tracks/${track!.slug}/soul-stories`);
      setStories(d.stories);
      const own = d.stories.find((s: SoulStory) => s.isOwn);
      setMyStory(own ?? null);
      toast.success('Your story was shared!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit story');
    } finally { setSubmittingStory(false); }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await apiFetch(`/api/tracks/${track!.slug}/soul-stories/${storyId}`, { method: 'DELETE' });
      setStories(prev => prev.filter(s => s.id !== storyId));
      setMyStory(null);
      toast.success('Story removed');
    } catch { toast.error('Failed to delete story'); }
  };

  const handlePinStory = async (storyId: string, isPinned: boolean) => {
    try {
      const action = isPinned ? 'unpin' : 'pin';
      await apiFetch(`/api/tracks/${track!.slug}/soul-stories/${storyId}/${action}`, { method: 'PATCH' });
      const d = await apiFetch(`/api/tracks/${track!.slug}/soul-stories`);
      setStories(d.stories);
      toast.success(isPinned ? 'Unpinned' : 'Pinned as Community Voice');
    } catch { toast.error('Failed to update pin'); }
  };

  if (isLoading) return <TrackSkeleton />;
  if (!track) return <div className="text-center py-20">Track not found</div>;

  const isLiked = interactions?.isLiked || false;
  const isSaved = interactions?.isSaved || false;

  const isTrackCreator = user && track.creator && (() => {
    const token = localStorage.getItem('sound2soul_token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.creatorId === (track.creator as any).id || user.role === 'admin';
    } catch { return false; }
  })();

  const pinnedStory = stories.find(s => s.isPinned);
  const unpinnedStories = stories.filter(s => !s.isPinned);

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">

      {/* Hero Header */}
      <div className="relative pt-12 pb-24 px-4 overflow-hidden">
        {track.coverImageUrl && (
          <>
            <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110 -z-20" style={{ backgroundImage: `url(${track.coverImageUrl})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background -z-10" />
          </>
        )}

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-end gap-8 relative z-10">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl shadow-2xl overflow-hidden bg-muted flex-shrink-0 ring-1 ring-white/10">
            {track.coverImageUrl ? (
              <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-4xl text-primary/40">♫</span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full text-left space-y-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {track.genre || 'Uncategorized'}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">{track.title}</h1>
            <div
              className="flex items-center gap-2 text-xl font-medium hover:text-primary transition-colors cursor-pointer w-fit"
              onClick={() => window.location.href = `/creator/${track.creator?.slug}`}
            >
              {track.creator?.avatarUrl ? (
                <img src={track.creator.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                  {track.creator?.artistName?.substring(0, 2).toUpperCase() || '??'}
                </div>
              )}
              {track.creator?.artistName || 'Unknown Artist'}
            </div>

            {/* Mood tags with Soul Radio buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {track.moodTags?.map(tag => (
                <div key={tag} className="group relative">
                  <Link
                    href={`/radio/${encodeURIComponent(tag)}`}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-primary/10 rounded-full text-sm border border-white/8 hover:border-primary/20 transition-all group"
                  >
                    <span>{tag}</span>
                    <Radio className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8">

          <div className="md:col-span-2 space-y-8">
            {/* Audio Player */}
            <div className="sticky top-16 z-20">
              <AudioPlayer url={track.audioUrl || ''} trackId={track.id} />

              {/* Action bar */}
              <div className="flex items-center gap-1 mt-4 flex-wrap">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isLiked ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                >
                  <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
                  <span>{track.likeCount || 0}</span>
                </button>

                <button
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSaved ? 'bg-secondary/15 text-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                >
                  <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
                  <span>{track.saveCount || 0}</span>
                </button>

                <button
                  onClick={handleOpenCollectionModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                  title="Add to Collection"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>

                <button
                  onClick={handleRepost}
                  disabled={repostLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isReposted ? 'bg-emerald-500/15 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                >
                  <Repeat2 className="h-4 w-4" />
                  <span>{repostCount > 0 ? repostCount : ''}{repostCount === 0 ? 'Repost' : ''}</span>
                </button>

                <button
                  onClick={() => commentInputRef.current?.focus()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{comments.length > 0 ? comments.length : 'Comment'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all ml-auto"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Ad banner */}
            <AdBanner variant="track" />

            {/* Soul Story (creator's original) */}
            <div className="space-y-4 pt-4">
              <h2 className="text-2xl font-semibold">Soul Story</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {track.soulStory || 'No story provided for this track.'}
              </p>
              {track.description && (
                <div className="pt-4 text-muted-foreground">
                  <p>{track.description}</p>
                </div>
              )}
            </div>

            {/* ── Collaborative Soul Stories ───────────────────────────── */}
            <SoulStoriesSection
              stories={stories}
              pinnedStory={pinnedStory}
              unpinnedStories={unpinnedStories}
              storiesLoading={storiesLoading}
              myStory={myStory}
              storyBody={storyBody}
              setStoryBody={setStoryBody}
              submittingStory={submittingStory}
              user={user}
              isTrackCreator={!!isTrackCreator}
              onSubmit={handleSubmitStory}
              onDelete={handleDeleteStory}
              onPin={handlePinStory}
              trackSlug={track.slug}
            />

            {/* Comments */}
            <div className="space-y-5 pt-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                Comments
                {comments.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
                )}
              </h2>

              {user ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-1">
                    {user.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-grow space-y-2">
                    <textarea
                      ref={commentInputRef}
                      value={commentBody}
                      onChange={e => setCommentBody(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment(); }}
                      placeholder="Share your thoughts on this track…"
                      rows={2}
                      maxLength={500}
                      className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none placeholder:text-muted-foreground/50 transition-colors"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/40">{commentBody.length}/500 · ⌘↵ to post</span>
                      <Button size="sm" onClick={handleComment} disabled={submitting || !commentBody.trim()} className="rounded-full gap-1.5 text-xs">
                        <Send className="h-3 w-3" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 px-5 bg-white/3 rounded-xl border border-white/8 text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link> to leave a comment.
                </div>
              )}

              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="flex-grow space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 py-6 text-center">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                <div className="space-y-5">
                  {comments.map(comment => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      currentUserId={user?.id}
                      currentUserRole={user?.role}
                      onDelete={handleDeleteComment}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <TrustCard
              aiInvolvementType={track.aiInvolvementType}
              humanContributionChecklist={track.humanContributionChecklist as Record<string, unknown>}
              rightsConfirmation={track.rightsConfirmation as Record<string, unknown>}
              releaseNotes={track.releaseNotes as Record<string, unknown> | null}
              releaseNotesPublic={track.releaseNotesPublic}
            />

            <Card className="bg-card/40 border-white/10">
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="font-semibold text-lg">Support the Artist</h3>
                <p className="text-sm text-muted-foreground">
                  Join {track.creator?.artistName}'s inner circle to hear about new releases first.
                </p>
                <form className="space-y-2">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <Button className="w-full rounded-full">Join Mailing List</Button>
                </form>
              </CardContent>
            </Card>

            {/* Soul Radio shortcut */}
            {track.genre && (
              <Link href={`/radio/${encodeURIComponent(track.genre)}`}>
                <Card className="bg-card/40 border-white/10 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                      <Radio className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">Soul Radio</p>
                      <p className="text-xs text-muted-foreground">More {track.genre} sounds →</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Add to Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCollectionModal(false)}>
          <div className="bg-card border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">Add to Collection</h3>
              <button onClick={() => setShowCollectionModal(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>

            {/* Create new */}
            <div className="mb-4 p-3 bg-white/3 rounded-xl border border-white/8 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">New collection</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCollectionTitle}
                  onChange={e => setNewCollectionTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateAndAdd(); }}
                  placeholder="Collection name…"
                  maxLength={80}
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/40"
                />
                <Button size="sm" onClick={handleCreateAndAdd} disabled={creatingCollection || !newCollectionTitle.trim()} className="rounded-lg text-xs px-3">
                  {creatingCollection ? '…' : <Plus className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {!playlistsLoaded ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
              </div>
            ) : playlists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No collections yet — create one above!</p>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {playlists.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl.id)}
                    disabled={addingToPlaylist === pl.id}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <FolderOpen className="w-4 h-4 text-primary/60 flex-shrink-0" />
                    <span className="text-sm truncate">{pl.title}</span>
                    {addingToPlaylist === pl.id && <span className="ml-auto text-xs text-muted-foreground">Adding…</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SoulStoriesSection({
  stories, pinnedStory, unpinnedStories, storiesLoading,
  myStory, storyBody, setStoryBody, submittingStory,
  user, isTrackCreator, onSubmit, onDelete, onPin, trackSlug,
}: {
  stories: SoulStory[];
  pinnedStory?: SoulStory;
  unpinnedStories: SoulStory[];
  storiesLoading: boolean;
  myStory: SoulStory | null;
  storyBody: string;
  setStoryBody: (v: string) => void;
  submittingStory: boolean;
  user: any;
  isTrackCreator: boolean;
  onSubmit: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
  trackSlug: string;
}) {
  const MAX = 200;
  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-secondary" />
        <h2 className="text-2xl font-semibold">Community Voice</h2>
        {stories.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">({stories.length})</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground -mt-1">What does this track mean to you? Share a line.</p>

      {/* Pinned story */}
      {pinnedStory && (
        <div className="p-4 bg-secondary/8 border border-secondary/20 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary uppercase tracking-wider">
            <Pin className="w-3 h-3" /> Community Voice
          </div>
          <p className="text-base leading-relaxed italic text-foreground/90">"{pinnedStory.body}"</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pinnedStory.author.avatarUrl
                ? <img src={pinnedStory.author.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                : <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center text-[9px] font-bold text-secondary/60">{pinnedStory.author.displayName.substring(0,2).toUpperCase()}</div>
              }
              <span className="text-xs text-muted-foreground">{pinnedStory.author.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              {isTrackCreator && (
                <button onClick={() => onPin(pinnedStory.id, true)} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Unpin</button>
              )}
              {(pinnedStory.isOwn || isTrackCreator) && (
                <button onClick={() => onDelete(pinnedStory.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit / edit own story */}
      {user ? (
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 mt-0.5">
            {user.email.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={storyBody}
              onChange={e => setStoryBody(e.target.value.slice(0, MAX))}
              placeholder="This track makes me feel…"
              rows={2}
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none placeholder:text-muted-foreground/50 transition-colors"
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs tabular-nums ${storyBody.length >= MAX ? 'text-destructive' : 'text-muted-foreground/40'}`}>{storyBody.length}/{MAX}</span>
              <div className="flex items-center gap-2">
                {myStory && (
                  <button onClick={() => onDelete(myStory.id)} className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors">Remove mine</button>
                )}
                <Button size="sm" onClick={onSubmit} disabled={submittingStory || !storyBody.trim()} className="rounded-full gap-1.5 text-xs bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Sparkles className="h-3 w-3" />
                  {myStory ? 'Update' : 'Share Story'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-3 px-5 bg-white/3 rounded-xl border border-white/8 text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link> to share what this track means to you.
        </div>
      )}

      {/* Story list */}
      {storiesLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : unpinnedStories.length === 0 && !pinnedStory ? (
        <p className="text-sm text-muted-foreground/50 py-4 text-center">No stories yet. Be the first to share what this track means to you.</p>
      ) : (
        <div className="space-y-3">
          {unpinnedStories.map(story => (
            <div key={story.id} className="group flex gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
              {story.author.avatarUrl
                ? <img src={story.author.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                : <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary/60 flex-shrink-0 mt-0.5">{story.author.displayName.substring(0,2).toUpperCase()}</div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{story.author.displayName}</span>
                  <span className="text-xs text-muted-foreground/40">{formatTimeAgo(story.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">"{story.body}"</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1.5 mt-0.5">
                {isTrackCreator && !story.isPinned && (
                  <button onClick={() => onPin(story.id, false)} className="text-muted-foreground/40 hover:text-secondary transition-colors" title="Pin as Community Voice">
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                )}
                {(story.isOwn || isTrackCreator) && (
                  <button onClick={() => onDelete(story.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({
  comment, currentUserId, currentUserRole, onDelete,
}: {
  comment: Comment;
  currentUserId?: string;
  currentUserRole?: string;
  onDelete: (id: string) => void;
}) {
  const canDelete = currentUserId === comment.author.id || currentUserRole === 'admin';
  const timeAgo = formatTimeAgo(comment.createdAt);

  return (
    <div className="flex gap-3 group">
      {comment.author.avatarUrl ? (
        <img src={comment.author.avatarUrl} alt={comment.author.displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary/60 flex-shrink-0 mt-0.5">
          {comment.author.displayName.substring(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {comment.author.slug ? (
            <Link href={`/creator/${comment.author.slug}`} className="text-sm font-semibold hover:text-primary transition-colors">
              {comment.author.displayName}
            </Link>
          ) : (
            <span className="text-sm font-semibold">{comment.author.displayName}</span>
          )}
          <span className="text-xs text-muted-foreground/40">{timeAgo}</span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
      </div>
      {canDelete && (
        <button
          onClick={() => onDelete(comment.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive flex-shrink-0 mt-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function TrackSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="pt-12 pb-24 px-4 max-w-6xl mx-auto flex flex-col md:flex-row items-end gap-8">
        <Skeleton className="w-48 h-48 md:w-64 md:h-64 rounded-2xl" />
        <div className="flex-1 w-full space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 md:h-16 w-3/4" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-20 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
