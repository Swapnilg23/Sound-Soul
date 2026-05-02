import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useGetTrackBySlug, useLikeTrack, useUnlikeTrack, useSaveTrack, useUnsaveTrack, useGetTrackInteractions, getGetTrackInteractionsQueryKey } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TrustCard } from '@/components/TrustCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';

export default function TrackDetail() {
  const [, params] = useRoute('/track/:slug');
  const slug = params?.slug || '';
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: track, isLoading } = useGetTrackBySlug(slug, {
    query: {
      enabled: !!slug
    }
  });

  const { data: interactions } = useGetTrackInteractions(track?.id || '', {
    query: {
      enabled: !!track?.id && !!user
    }
  });

  const likeMutation = useLikeTrack();
  const unlikeMutation = useUnlikeTrack();
  const saveMutation = useSaveTrack();
  const unsaveMutation = useUnsaveTrack();

  const handleLike = async () => {
    if (!user) {
      toast('Please log in to like tracks');
      return;
    }
    if (!track) return;

    const isLiked = interactions?.isLiked;
    try {
      if (isLiked) {
        await unlikeMutation.mutateAsync({ trackId: track.id });
      } else {
        await likeMutation.mutateAsync({ trackId: track.id });
      }
      queryClient.invalidateQueries({ queryKey: getGetTrackInteractionsQueryKey(track.id) });
    } catch (e) {
      toast.error('Failed to update like status');
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast('Please log in to save tracks');
      return;
    }
    if (!track) return;

    const isSaved = interactions?.isSaved;
    try {
      if (isSaved) {
        await unsaveMutation.mutateAsync({ trackId: track.id });
        toast.success('Removed from Library');
      } else {
        await saveMutation.mutateAsync({ trackId: track.id });
        toast.success('Saved to Library');
      }
      queryClient.invalidateQueries({ queryKey: getGetTrackInteractionsQueryKey(track.id) });
    } catch (e) {
      toast.error('Failed to update save status');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  if (isLoading) {
    return <TrackSkeleton />;
  }

  if (!track) {
    return <div className="text-center py-20">Track not found</div>;
  }

  const isLiked = interactions?.isLiked || false;
  const isSaved = interactions?.isSaved || false;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
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
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-xl shadow-2xl overflow-hidden bg-muted flex-shrink-0 border border-white/10">
            {track.coverImageUrl ? (
              <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-4xl text-primary/40">♫</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full text-left space-y-4">
            <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {track.genre || 'Uncategorized'}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">{track.title}</h1>
            <div className="flex items-center gap-2 text-xl font-medium hover:text-primary transition-colors cursor-pointer w-fit" onClick={() => window.location.href = `/creator/${track.creator?.slug}`}>
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
                <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-sm backdrop-blur-sm border border-white/5">
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
            <div className="sticky top-20 z-20">
              <AudioPlayer url={track.audioUrl || ''} trackId={track.id} />
              
              <div className="flex items-center gap-4 mt-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLike}
                  className={isLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                >
                  <Heart className="h-6 w-6" fill={isLiked ? 'currentColor' : 'none'} />
                </Button>
                <span className="text-sm text-muted-foreground -ml-2">{track.likeCount || 0}</span>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSave}
                  className={isSaved ? 'text-secondary' : 'text-muted-foreground hover:text-foreground'}
                >
                  <Bookmark className="h-6 w-6" fill={isSaved ? 'currentColor' : 'none'} />
                </Button>
                
                <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground hover:text-foreground ml-auto">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

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
                <p className="text-sm text-muted-foreground">Join {track.creator?.artistName}'s inner circle to hear about new releases first.</p>
                <form className="space-y-2">
                  <input type="email" placeholder="Your email address" className="w-full bg-background/50 border border-white/10 rounded-md px-3 py-2 text-sm" />
                  <Button className="w-full">Join Mailing List</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="pt-12 pb-24 px-4 max-w-6xl mx-auto flex flex-col md:flex-row items-end gap-8">
        <Skeleton className="w-48 h-48 md:w-64 md:h-64 rounded-xl" />
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
