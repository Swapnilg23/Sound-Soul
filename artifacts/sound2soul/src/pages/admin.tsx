import React from 'react';
import { useGetAdminMetrics, useGetAdminTracks, useApproveTrack, useRejectTrack, useFeatureTrack, getGetAdminTracksQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Star } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { data: metrics, isLoading: isMetricsLoading } = useGetAdminMetrics();
  const { data: tracksData, isLoading: isTracksLoading } = useGetAdminTracks({ status: 'pending' });
  const queryClient = useQueryClient();
  
  const approveMutation = useApproveTrack();
  const rejectMutation = useRejectTrack();
  const featureMutation = useFeatureTrack();

  useEffect(() => {
    document.title = 'Admin Dashboard | Sound2Soul';
    setMeta('robots', 'noindex, nofollow');
  }, []);

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

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Trust & Fan Growth Metrics</h2>
        <p className="text-sm text-muted-foreground">Acquisition demo metrics focused on trust metadata, fan capture, creator activation, and release readiness.</p>
        {isMetricsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : metrics ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total creators" value={metrics.totalCreators.toString()} />
              <StatCard title="Total tracks" value={metrics.totalTracks.toString()} />
              <StatCard title="Approved public tracks" value={metrics.approvedTracks.toString()} />
              <StatCard title="Pending review tracks" value={metrics.pendingTracks.toString()} highlight={metrics.pendingTracks > 0} />
              <StatCard title="Total fan emails collected" value={metrics.totalFanEmails.toString()} />
              <StatCard title="Total follows" value={(metrics.totalCreators + metrics.totalListeners).toString()} />
              <StatCard title="Total saves" value={metrics.totalSaves.toString()} />
              <StatCard title="Total plays" value={metrics.totalPlays.toString()} />
              <StatCard title="Pro waitlist signups" value={metrics.proWaitlistCount.toString()} />
              <StatCard title="Reported tracks" value={metrics.openReports.toString()} highlight={metrics.openReports > 0} />
            </div>
            <Card className="bg-card/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Trust readiness snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                <MetricBar label="Approved public tracks" value={metrics.approvedTracks} total={metrics.totalTracks} />
                <MetricBar label="Pending review" value={metrics.pendingTracks} total={metrics.totalTracks} />
                <MetricBar label="Fan growth" value={metrics.totalFanEmails} total={Math.max(metrics.totalFanEmails, 1)} />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          Pending Tracks Queue
          {tracksData && tracksData.length > 0 && (
            <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">{tracksData.length}</Badge>
          )}
        </h2>

        {isTracksLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : tracksData?.length === 0 ? (
          <Card className="bg-card/20 border-white/5 border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              No pending tracks to review.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tracksData?.map(track => (
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

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
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

function MetricBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
