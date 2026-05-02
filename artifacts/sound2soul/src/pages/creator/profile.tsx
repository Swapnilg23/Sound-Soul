import React from 'react';
import { useRoute } from 'wouter';
import { useGetCreatorBySlug, useGetCreatorTracks } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateTrustScore } from '@/lib/trustScore';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { TrustScoreNudge } from '@/components/TrustScoreNudge';

export default function CreatorProfile() {
  const [, params] = useRoute('/creator/:slug');
  const slug = params?.slug || '';
  const { user } = useAuth();

  const { data: profile, isLoading: isProfileLoading } = useGetCreatorBySlug(slug, {
    query: { enabled: !!slug }
  });

  const { data: tracksData, isLoading: isTracksLoading } = useGetCreatorTracks(slug, {
    query: { enabled: !!slug }
  });

  if (isProfileLoading) return <ProfileSkeleton />;

  if (!profile) {
    return <div className="text-center py-20 text-xl text-muted-foreground">Creator not found</div>;
  }

  const isOwnProfile = !!user && user.role === 'creator' && (user as any).creatorProfile?.slug === slug;

  const tracksForScore = (tracksData || []).map(t => ({
    aiInvolvementType: t.aiInvolvementType,
    rightsConfirmation: t.rightsConfirmation as Record<string, unknown> | null,
    soulStory: t.soulStory,
    humanContributionChecklist: t.humanContributionChecklist as Record<string, unknown> | null,
  }));

  const trustScore = calculateTrustScore({
    profile: {
      bio: profile.bio,
      creatorStatement: profile.creatorStatement,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
      genres: profile.genres,
      aiToolsUsed: profile.aiToolsUsed,
    },
    tracks: tracksForScore,
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Banner */}
      <div className="h-48 md:h-64 w-full bg-muted relative overflow-hidden">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Sidebar */}
          <div className="w-full md:w-1/3 space-y-5">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-background overflow-hidden bg-muted shadow-2xl">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.artistName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary/40">
                  {profile.artistName.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold">{profile.artistName}</h1>
              <div className="text-muted-foreground mt-1 flex gap-4 text-sm">
                <span>{profile.followerCount || 0} followers</span>
                <span>{profile.trackCount || 0} tracks</span>
              </div>
            </div>

            {/* Trust Score */}
            {!isTracksLoading && (
              <TrustScoreBadge trustScore={trustScore} />
            )}

            {/* Own-profile nudge */}
            {isOwnProfile && !isTracksLoading && (
              <TrustScoreNudge
                profile={{
                  bio: profile.bio,
                  creatorStatement: profile.creatorStatement,
                  avatarUrl: profile.avatarUrl,
                  genres: profile.genres,
                  aiToolsUsed: profile.aiToolsUsed,
                }}
                tracks={tracksForScore}
                trustScore={trustScore}
              />
            )}

            {!isOwnProfile && (
              <Button className="w-full rounded-full">Follow Creator</Button>
            )}
            {isOwnProfile && (
              <Link href="/creator/dashboard">
                <Button variant="outline" className="w-full rounded-full">Go to Dashboard</Button>
              </Link>
            )}

            {profile.bio && (
              <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
            )}

            {profile.creatorStatement && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">Creator Statement</h3>
                <p className="text-sm italic text-primary/80">"{profile.creatorStatement}"</p>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t border-white/8">
              <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground pt-2">Identity</h3>

              {profile.genres && profile.genres.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.genres.map(g => (
                      <span key={g} className="text-xs px-2.5 py-1 bg-white/5 rounded-full border border-white/8">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.aiToolsUsed && profile.aiToolsUsed.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">AI Tools Used</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.aiToolsUsed.map(t => (
                      <span key={t} className="text-xs px-2.5 py-1 bg-primary/10 text-primary/80 rounded-full border border-primary/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="w-full md:w-2/3 space-y-6 pt-4 md:pt-24">
            <h2 className="text-2xl font-bold">Tracks</h2>

            {isTracksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : tracksData?.length === 0 ? (
              <div className="text-center py-12 bg-card/30 rounded-2xl border border-white/5">
                <p className="text-muted-foreground">No tracks published yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {tracksData?.map(track => {
                  const allDisclosed =
                    !!track.aiInvolvementType &&
                    !!(track.rightsConfirmation && Object.keys(track.rightsConfirmation).length > 0) &&
                    !!(track.soulStory && track.soulStory.trim().length > 15);

                  return (
                    <Link href={`/track/${track.slug}`} key={track.id}>
                      <Card className="bg-card/40 hover:bg-card/80 border-white/5 transition-colors cursor-pointer group">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
                            {track.coverImageUrl ? (
                              <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary/40">♫</div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{track.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{track.genre || 'Uncategorized'}</span>
                              <span>·</span>
                              <span>{track.playCount || 0} plays</span>
                            </div>
                          </div>
                          {allDisclosed && (
                            <div className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Disclosed
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <Skeleton className="h-64 w-full" />
      <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 space-y-5">
          <Skeleton className="w-48 h-48 rounded-full border-4 border-background" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
        <div className="w-full md:w-2/3 space-y-4 pt-24">
          <Skeleton className="h-8 w-32" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}
