import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetCreatorBySlug, useGetCreatorTracks, useFollowCreator, useUnfollowCreator } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateTrustScore } from '@/lib/trustScore';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { TrustScoreNudge } from '@/components/TrustScoreNudge';
import { toast } from 'sonner';
import { Repeat2, Sparkles, Play, Share2, Check } from 'lucide-react';

type Tab = 'tracks' | 'activity';

interface TopFan {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  profileSlug: string | null;
  role: string;
  likes: number;
  saves: number;
  comments: number;
  score: number;
}

interface ActivityItem {
  type: 'release' | 'repost';
  sortDate: string;
  repostedAt?: string;
  track: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string | null;
    genre: string | null;
    playCount: number;
    likeCount: number;
    aiInvolvementType: string | null;
    soulStory: string | null;
    rightsConfirmation: Record<string, unknown> | null;
    creator: { artistName: string; avatarUrl: string | null; slug: string } | null;
  };
}

async function fetchFollowState(creatorId: string): Promise<boolean> {
  const token = localStorage.getItem('sound2soul_token');
  if (!token) return false;
  const res = await fetch(`/api/follows/${creatorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  return (await res.json()).isFollowing ?? false;
}

async function fetchActivity(slug: string): Promise<ActivityItem[]> {
  const res = await fetch(`/api/creators/${slug}/activity`);
  if (!res.ok) return [];
  return (await res.json()).activity ?? [];
}

async function fetchTopFans(slug: string): Promise<TopFan[]> {
  const res = await fetch(`/api/creators/${slug}/top-fans`);
  if (!res.ok) return [];
  return (await res.json()).fans ?? [];
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

  const [activeTab, setActiveTab] = useState<Tab>('tracks');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [fans, setFans] = useState<TopFan[]>([]);
  const [fansLoading, setFansLoading] = useState(false);

  const followMutation = useFollowCreator();
  const unfollowMutation = useUnfollowCreator();

  useEffect(() => {
    if (profile) setFollowerCount(profile.followerCount ?? 0);
  }, [profile]);

  useEffect(() => {
    if (profile?.id && user && !isOwnProfile) {
      fetchFollowState(profile.id).then(setIsFollowing);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, user?.id]);

  useEffect(() => {
    if (!slug) return;
    setFansLoading(true);
    fetchTopFans(slug).then(setFans).finally(() => setFansLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug || activeTab !== 'activity') return;
    setActivityLoading(true);
    fetchActivity(slug)
      .then(setActivity)
      .finally(() => setActivityLoading(false));
  }, [slug, activeTab]);

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

  const handleFollow = async () => {
    if (!user) { toast.info('Sign in to follow creators'); return; }
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount(c => wasFollowing ? Math.max(0, c - 1) : c + 1);
    try {
      if (wasFollowing) {
        await unfollowMutation.mutateAsync({ creatorId: profile.id });
      } else {
        await followMutation.mutateAsync({ creatorId: profile.id });
        toast.success(`Following ${profile.artistName}`);
      }
    } catch {
      setIsFollowing(wasFollowing);
      setFollowerCount(c => wasFollowing ? c + 1 : Math.max(0, c - 1));
      toast.error('Something went wrong. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/creator/${slug}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedProfile(true);
    toast.success('Profile link copied!');
    setTimeout(() => setCopiedProfile(false), 2500);
  };

  const repostCount = !activityLoading ? activity.filter(a => a.type === 'repost').length : 0;

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

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
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
              <div className="text-muted-foreground mt-1.5 flex gap-4 text-sm">
                <span className="tabular-nums">
                  <span className="font-semibold text-foreground">{followerCount}</span> followers
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold text-foreground">{profile.trackCount || 0}</span> tracks
                </span>
              </div>
            </div>

            {/* Trust Score */}
            {!isTracksLoading && <TrustScoreBadge trustScore={trustScore} />}

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

            {/* Follow / Dashboard + Share */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Link href="/creator/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full rounded-full">Go to Dashboard</Button>
                </Link>
              ) : (
                <Button
                  className={`flex-1 rounded-full transition-all duration-200 ${
                    isFollowing
                      ? 'bg-white/8 text-foreground border border-white/15 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                      : ''
                  }`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {isFollowing ? 'Unfollowing…' : 'Following…'}
                    </span>
                  ) : isFollowing ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      Following
                    </span>
                  ) : 'Follow Creator'}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-white/10 hover:border-white/20 flex-shrink-0"
                onClick={handleShareProfile}
                title="Copy profile link"
              >
                {copiedProfile ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
              </Button>
            </div>

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

            {/* Top Fans */}
            {(fansLoading || fans.length > 0) && (
              <div className="pt-4 border-t border-white/8 space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground pt-2">Top Fans</h3>
                {fansLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-2.5 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-white/8 flex-shrink-0" />
                        <div className="flex-1 h-3 rounded bg-white/8" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {fans.map((fan, i) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                      const initials = fan.displayName.slice(0, 2).toUpperCase();
                      const engagementLabel = [
                        fan.likes > 0 && `${fan.likes} ♥`,
                        fan.saves > 0 && `${fan.saves} saved`,
                        fan.comments > 0 && `${fan.comments} comments`,
                      ].filter(Boolean).join(' · ');

                      const inner = (
                        <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors ${
                          fan.profileSlug ? 'hover:bg-white/5 cursor-pointer' : ''
                        }`}>
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-xs font-bold text-primary/60">
                              {fan.avatarUrl
                                ? <img src={fan.avatarUrl} alt={fan.displayName} className="w-full h-full object-cover" />
                                : initials}
                            </div>
                            {medal && (
                              <span className="absolute -top-1 -right-1 text-[10px] leading-none">{medal}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate leading-tight">{fan.displayName}</p>
                            {engagementLabel && (
                              <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{engagementLabel}</p>
                            )}
                          </div>
                        </div>
                      );

                      return fan.profileSlug ? (
                        <Link key={fan.userId} href={`/creator/${fan.profileSlug}`}>{inner}</Link>
                      ) : (
                        <div key={fan.userId}>{inner}</div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Main content ────────────────────────────────────────────────── */}
          <div className="w-full md:w-2/3 pt-4 md:pt-24">

            {/* Tab bar */}
            <div className="flex gap-1 border-b border-white/8 mb-6">
              {([
                { id: 'tracks' as Tab, label: 'Tracks', count: profile.trackCount || tracksData?.length },
                { id: 'activity' as Tab, label: 'Activity' },
              ] as { id: Tab; label: string; count?: number }[]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-white/8 text-muted-foreground'
                    }`}>{tab.count}</span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Tracks tab ────────────────────────────────────────────────── */}
            {activeTab === 'tracks' && (
              <>
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
                        !!(track.rightsConfirmation && Object.keys(track.rightsConfirmation as object).length > 0) &&
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
              </>
            )}

            {/* ── Activity tab ──────────────────────────────────────────────── */}
            {activeTab === 'activity' && (
              <>
                {activityLoading ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-3">
                        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
                        <div className="flex-grow space-y-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity.length === 0 ? (
                  <div className="text-center py-16 bg-card/20 rounded-2xl border border-white/5 border-dashed">
                    <div className="text-3xl mb-3 opacity-30">🎵</div>
              <p className="font-medium text-sm mb-1">No activity yet</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.artistName}'s releases and reposts will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary strip */}
                    <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                        {activity.filter(a => a.type === 'release').length} releases
                      </span>
                      {repostCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          {repostCount} reposts
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {activity.map((item, idx) => (
                        <ActivityRow key={`${item.type}-${item.track.id}-${idx}`} item={item} creatorName={profile.artistName} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ item, creatorName }: { item: ActivityItem; creatorName: string }) {
  const isRepost = item.type === 'repost';
  const isOwnTrack = !isRepost;
  const displayCreator = isRepost ? item.track.creator : null;

  return (
    <Link href={`/track/${item.track.slug}`}>
      <div className="group flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/4 transition-colors cursor-pointer border border-transparent hover:border-white/6">

        {/* Cover with type badge */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
            {item.track.coverImageUrl ? (
              <img
                src={item.track.coverImageUrl}
                alt={item.track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary/30 text-xl">♫</div>
            )}
          </div>
          {/* Type indicator badge */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center ${
            isRepost ? 'bg-emerald-500' : 'bg-primary'
          }`}>
            {isRepost
              ? <Repeat2 className="w-3 h-3 text-white" />
              : <Sparkles className="w-3 h-3 text-white" />
            }
          </div>
        </div>

        {/* Text */}
        <div className="flex-grow min-w-0">
          {/* Activity label */}
          <div className="flex items-center gap-1.5 mb-0.5">
            {isRepost ? (
              <span className="text-[10px] font-medium text-emerald-400/80 flex items-center gap-1">
                <Repeat2 className="w-2.5 h-2.5" />
                {creatorName} reposted
              </span>
            ) : (
              <span className="text-[10px] font-medium text-primary/70 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                New release
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/40">· {formatTimeAgo(item.sortDate)}</span>
          </div>

          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
            {item.track.title}
          </p>

          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            {isRepost && displayCreator ? (
              <>
                {displayCreator.avatarUrl && (
                  <img src={displayCreator.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                )}
                <span className="truncate">{displayCreator.artistName}</span>
                <span>·</span>
              </>
            ) : null}
            <span className="text-muted-foreground/50">{item.track.genre || 'Uncategorized'}</span>
            <span>·</span>
            <span>{item.track.playCount.toLocaleString()} plays</span>
          </div>
        </div>

        {/* Hover play */}
        <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Play className="w-3.5 h-3.5 text-foreground ml-0.5" fill="currentColor" />
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

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
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}
