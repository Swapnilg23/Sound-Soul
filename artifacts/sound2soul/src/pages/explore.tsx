import React, { useState } from 'react';
import { useExploreTracks, useGetCuratedSections } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Explore() {
  const [search, setSearch] = useState('');
  
  const { data: curatedData, isLoading: isCuratedLoading } = useGetCuratedSections();
  
  const { data: searchData, isLoading: isSearchLoading } = useExploreTracks({
    search: search.length > 2 ? search : undefined,
    limit: 20
  }, {
    query: {
      enabled: search.length > 2
    }
  });

  const isSearching = search.length > 2;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Explore</h1>
        <Input 
          placeholder="Search tracks, moods, or genres..." 
          className="max-w-md bg-card/50 border-white/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isSearching ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Search Results</h2>
          {isSearchLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map(i => <TrackSkeleton key={i} />)}
            </div>
          ) : searchData?.tracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tracks found matching "{search}"
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {searchData?.tracks.map(track => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {isCuratedLoading ? (
            <div className="space-y-12">
              <SectionSkeleton title="Featured" />
              <SectionSkeleton title="Calm Right Now" />
            </div>
          ) : (
            <div className="space-y-12">
              {curatedData?.featured && curatedData.featured.length > 0 && (
                <Section title="Featured" tracks={curatedData.featured} />
              )}
              {curatedData?.calmRightNow && curatedData.calmRightNow.length > 0 && (
                <Section title="Calm Right Now" tracks={curatedData.calmRightNow} />
              )}
              {curatedData?.hopefulSounds && curatedData.hopefulSounds.length > 0 && (
                <Section title="Hopeful Sounds" tracks={curatedData.hopefulSounds} />
              )}
              {curatedData?.cinematicAi && curatedData.cinematicAi.length > 0 && (
                <Section title="Cinematic AI" tracks={curatedData.cinematicAi} />
              )}
              {curatedData?.humanAiCollaborations && curatedData.humanAiCollaborations.length > 0 && (
                <Section title="Human + AI Collaborations" tracks={curatedData.humanAiCollaborations} />
              )}
              {curatedData?.latest && curatedData.latest.length > 0 && (
                <Section title="New Releases" tracks={curatedData.latest} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, tracks }: { title: string, tracks: any[] }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {tracks.slice(0, 5).map(track => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </section>
  );
}

function TrackCard({ track }: { track: any }) {
  return (
    <Link href={`/track/${track.slug}`}>
      <Card className="group cursor-pointer bg-card/40 hover:bg-card/80 border-white/5 transition-all duration-300 overflow-hidden">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {track.coverImageUrl ? (
            <img src={track.coverImageUrl} alt={track.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-lg shadow-primary/50">
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate mb-1">{track.title}</h3>
          <p className="text-sm text-muted-foreground truncate hover:text-primary transition-colors" onClick={(e) => {
            e.preventDefault();
            window.location.href = `/creator/${track.creator?.slug}`;
          }}>
            {track.creator?.artistName || 'Unknown Artist'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5].map(i => <TrackSkeleton key={i} />)}
      </div>
    </section>
  );
}

function TrackSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
