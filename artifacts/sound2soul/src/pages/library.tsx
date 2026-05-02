import React from 'react';
import { useGetLibrary } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Library() {
  const { data: library, isLoading } = useGetLibrary();

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Your Library</h1>
        <p className="text-muted-foreground">Tracks you've saved and creators you follow.</p>
      </div>

      {isLoading ? (
        <div className="space-y-12">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      ) : (
        <div className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Saved Tracks</h2>
            {library?.savedTracks.length === 0 ? (
              <EmptyState message="You haven't saved any tracks yet." linkText="Explore tracks" href="/explore" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {library?.savedTracks.map(track => (
                  <TrackListItem key={track.id} track={track} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Liked Tracks</h2>
            {library?.likedTracks.length === 0 ? (
              <EmptyState message="You haven't liked any tracks yet." linkText="Explore tracks" href="/explore" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {library?.likedTracks.map(track => (
                  <TrackListItem key={track.id} track={track} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function TrackListItem({ track }: { track: any }) {
  return (
    <Link href={`/track/${track.slug}`}>
      <Card className="bg-card/40 hover:bg-card/80 border-white/5 transition-colors cursor-pointer group">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
            {track.coverImageUrl ? (
              <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary/40">♫</div>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{track.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{track.creator?.artistName || 'Unknown Artist'}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ message, linkText, href }: { message: string, linkText: string, href: string }) {
  return (
    <div className="p-8 text-center bg-card/20 rounded-xl border border-white/5 border-dashed">
      <p className="text-muted-foreground mb-4">{message}</p>
      <Link href={href} className="text-primary hover:underline font-medium">{linkText}</Link>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  );
}
