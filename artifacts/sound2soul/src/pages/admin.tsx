import React from 'react';
import { useGetAdminMetrics, useGetAdminTracks, useApproveTrack, useRejectTrack, useFeatureTrack, getGetAdminTracksQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Star } from 'lucide-react';

export default function AdminDashboard() {
  const { data: metrics, isLoading: isMetricsLoading } = useGetAdminMetrics();
  const { data: tracksData, isLoading: isTracksLoading } = useGetAdminTracks({ status: 'pending' });
  const queryClient = useQueryClient();
  
  const approveMutation = useApproveTrack();
  const rejectMutation = useRejectTrack();
  const featureMutation = useFeatureTrack();

  const handleApprove = async (trackId: string) => {
    try {
      await approveMutation.mutateAsync({ trackId });
      toast.success('Track approved');
      queryClient.invalidateQueries({ queryKey: getGetAdminTracksQueryKey({ status: 'pending' }) });
    } catch (e) {
      toast.error('Failed to approve track');
    }
  };

  const handleReject = async (trackId: string) => {
    try {
      await rejectMutation.mutateAsync({ trackId, data: { reason: 'Admin rejection' } });
      toast.success('Track rejected');
      queryClient.invalidateQueries({ queryKey: getGetAdminTracksQueryKey({ status: 'pending' }) });
    } catch (e) {
      toast.error('Failed to reject track');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform oversight and moderation.</p>
      </div>

      {isMetricsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={(metrics.totalCreators + metrics.totalListeners).toString()} />
          <StatCard title="Pending Tracks" value={metrics.pendingTracks.toString()} highlight={metrics.pendingTracks > 0} />
          <StatCard title="Total Plays" value={metrics.totalPlays.toString()} />
          <StatCard title="Open Reports" value={metrics.openReports.toString()} highlight={metrics.openReports > 0} />
        </div>
      ) : null}

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          Pending Tracks Queue
          {tracksData && tracksData.total > 0 && (
            <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">{tracksData.total}</Badge>
          )}
        </h2>

        {isTracksLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : tracksData?.tracks.length === 0 ? (
          <Card className="bg-card/20 border-white/5 border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              No pending tracks to review.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tracksData?.tracks.map(track => (
              <Card key={track.id} className="bg-card/40 border-white/10">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                      {track.coverImageUrl ? (
                        <img src={track.coverImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">♫</div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{track.title}</h3>
                      <p className="text-sm text-muted-foreground">{track.creator?.artistName}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{track.aiInvolvementType || 'Unknown AI'}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleReject(track.id)}
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(track.id)}
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight = false }: { title: string, value: string, highlight?: boolean }) {
  return (
    <Card className={`bg-card/50 border-white/10 ${highlight ? 'border-primary/50' : ''}`}>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        <div className={`text-3xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
