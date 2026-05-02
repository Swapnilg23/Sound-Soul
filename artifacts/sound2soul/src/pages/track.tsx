import React, { useState, useEffect, useRef } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetTrackBySlug, useLikeTrack, useUnlikeTrack, useSaveTrack, useUnsaveTrack, useGetTrackInteractions, getGetTrackInteractionsQueryKey } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TrustCard } from '@/components/TrustCard';
import { AdBanner } from '@/components/AdBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, Share2, Repeat2, MessageCircle, Trash2, Send } from 'lucide-react';
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

  // Load repost state + comments when track is ready
  useEffect(() => {
    if (!track?.slug) return;
    setCommentsLoading(true);
    apiFetch(`/api/tracks/${track.slug}/comments`)
      .then(d => setComments(d.comments))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [track?.slug]);

  useEffect(() => {
    if (!track?.id || !user) return;
    apiFetch(`/api/interactions/reposts/${track.id}`)
      .then(d => { setIsReposted(d.isReposted); setRepostCount(d.count ?? 0); })
      .catch(() => {});
  }, [track?.id, user]);

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
    } catch {
      toast.error('Failed to update like status');
    }
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
    } catch {
      toast.error('Failed to update save status');
    }
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
        await apiFetch(`/api/interactions/reposts/${track.id}`, { method: 'DELETE' });
        setIsReposted(false);
        setRepostCount(c => Math.max(0, c - 1));
        toast.success('Repost removed');
      } else {
        await apiFetch(`/api/interactions/reposts/${track.id}`, { method: 'POST' });
        setIsReposted(true);
        setRepostCount(c => c + 1);
        toast.success('Reposted to your profile!');
      }
    } catch {
      toast.error('Failed to repost');
    } finally {
      setRepostLoading(false);
    }
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
      // Reload comments
      const d = await apiFetch(`/api/tracks/${track!.slug}/comments`);
      setComments(d.comments);
      setCommentBody('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiFetch(`/api/tracks/${track!.slug}/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (isLoading) return <TrackSkeleton />;
  if (!track) return <div className="text-center py-20">Track not found</div>;

  const isLiked = interactions?.isLiked || false;
  const isSaved = interactions?.isSaved || false;

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">

      {/* Hero Header */}
      <div className="relative pt-12 pb-24 px-4 overflow-hidden">
        {track.coverImageUrl && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110 -z-20"
              style={{ backgroundImage: `url(${track.coverImageUrl})` }}
            />
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
            <div className="flex flex-wrap gap-2 pt-2">
              {track.moodTags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-sm border border-white/8">
                  {tag}
                </span>
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
              <div className="flex items-center gap-1 mt-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isLiked
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
                  <span>{track.likeCount || 0}</span>
                </button>

                <button
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSaved
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
                  <span>{track.saveCount || 0}</span>
                </button>

                <button
                  onClick={handleRepost}
                  disabled={repostLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isReposted
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
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

            {/* Soul Story */}
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

            {/* Comments */}
            <div className="space-y-5 pt-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                Comments
                {comments.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
                )}
              </h2>

              {/* Comment input */}
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
                      <Button
                        size="sm"
                        onClick={handleComment}
                        disabled={submitting || !commentBody.trim()}
                        className="rounded-full gap-1.5 text-xs"
                      >
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

              {/* Comment list */}
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
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  currentUserId,
  currentUserRole,
  onDelete,
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
        <img
          src={comment.author.avatarUrl}
          alt={comment.author.displayName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
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
