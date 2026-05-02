import React from 'react';
import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetMyTracks, getGetMyTracksQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreatorDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats();
  const { data: tracksData, isLoading: isTracksLoading } = useGetMyTracks();

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your tracks and monitor your growth.</p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground">
          <Link href="/creator/upload">Upload Track</Link>
        </Button>
      </div>

      {isStatsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Plays" value={stats.totalPlays.toString()} icon="▶" />
          <StatCard title="Total Saves" value={stats.totalSaves.toString()} icon="♥" />
          <StatCard title="Fan Emails" value={stats.fanEmailCount.toString()} icon="✉" />
          <StatCard title="Published Tracks" value={stats.publishedTracks.toString()} icon="♫" />
        </div>
      ) : null}

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Tracks</h2>
        
        {isTracksLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : tracksData?.tracks.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent text-center py-12">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 text-xl">♫</div>
              <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
              <p className="text-muted-foreground mb-6">Upload your first AI-assisted track to start building your audience.</p>
              <Button asChild>
                <Link href="/creator/upload">Upload Track</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tracksData?.tracks.map(track => (
              <Card key={track.id} className="bg-card/50 border-white/5 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                    {track.coverImageUrl ? (
                      <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center">♫</div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <Link href={`/track/${track.slug}`} className="font-semibold text-lg hover:text-primary transition-colors truncate block">
                      {track.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{track.genre || 'No genre'}</span>
                      <span>•</span>
                      <span>{track.playCount || 0} plays</span>
                      <span>•</span>
                      <span className="capitalize">{track.visibility}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={track.moderationStatus === 'approved' ? 'default' : 'secondary'} className="capitalize">
                      {track.moderationStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {stats && !stats.trustProfileComplete && (
        <Card className="bg-secondary/10 border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary">Complete Your Trust Profile</CardTitle>
            <CardDescription>Users are more likely to listen to creators who disclose their process.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="border-secondary/50 text-secondary hover:bg-secondary/20">
              <Link href="/creator/onboarding">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: string }) {
  return (
    <Card className="bg-card/50 border-white/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
