import React, { useRef, useState } from 'react';
import { useExploreTracks, useGetCuratedSections } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Play } from 'lucide-react';

export default function Explore() {
  const [search, setSearch] = useState('');

  const { data: curatedData, isLoading: isCuratedLoading } = useGetCuratedSections();

  const { data: searchData, isLoading: isSearchLoading } = useExploreTracks(
    { search: search.length > 2 ? search : undefined, limit: 20 },
    { query: { enabled: search.length > 2 } }
  );

  const isSearching = search.length > 2;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] pb-20">

      {/* Page header */}
      <div className="px-6 lg:px-10 pt-10 pb-8 space-y-5 max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Explore</h1>
        <div className="relative max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tracks, moods, genres..."
            className="w-full bg-card/60 border border-white/8 rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isSearching ? (
        <div className="px-6 lg:px-10 max-w-7xl mx-auto space-y-6">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Results for <span className="text-foreground">"{search}"</span>
          </h2>
          {isSearchLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : searchData?.tracks.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">No tracks found matching "{search}"</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchData?.tracks.map(track => <TrackCard key={track.id} track={track} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {isCuratedLoading ? (
            <>
              <SectionSkeleton />
              <SectionSkeleton />
              <SectionSkeleton />
            </>
          ) : (
            <>
              {curatedData?.featured && curatedData.featured.length > 0 && (
                <ScrollSection title="Featured" tracks={curatedData.featured} />
              )}
              {curatedData?.calmRightNow && curatedData.calmRightNow.length > 0 && (
                <ScrollSection title="Calm Right Now" tracks={curatedData.calmRightNow} />
              )}
              {curatedData?.hopefulSounds && curatedData.hopefulSounds.length > 0 && (
                <ScrollSection title="Hopeful Sounds" tracks={curatedData.hopefulSounds} />
              )}
              {curatedData?.cinematicAi && curatedData.cinematicAi.length > 0 && (
                <ScrollSection title="Cinematic AI" tracks={curatedData.cinematicAi} />
              )}
              {curatedData?.humanAiCollaborations && curatedData.humanAiCollaborations.length > 0 && (
                <ScrollSection title="Human + AI Collaborations" tracks={curatedData.humanAiCollaborations} />
              )}
              {curatedData?.focusAndFlow && curatedData.focusAndFlow.length > 0 && (
                <ScrollSection title="Focus and Flow" tracks={curatedData.focusAndFlow} />
              )}
              {curatedData?.latest && curatedData.latest.length > 0 && (
                <ScrollSection title="New Releases" tracks={curatedData.latest} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ScrollSection({ title, tracks }: { title: string; tracks: any[] }) {
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <section>
      <div className="px-6 lg:px-10 max-w-7xl mx-auto mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div
        ref={rowRef}
        className="scroll-row flex gap-4 overflow-x-auto px-6 lg:px-10 pb-2"
        style={{ scrollPaddingLeft: '1.5rem' }}
      >
        {tracks.map(track => (
          <div key={track.id} className="flex-shrink-0 w-40 sm:w-48">
            <TrackCard track={track} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TrackCard({ track }: { track: any }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/track/${track.slug}`}>
      <div
        className="group cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Cover art */}
        <div className="relative rounded-2xl overflow-hidden aspect-square bg-card mb-3">
          {track.coverImageUrl ? (
            <img
              src={track.coverImageUrl}
              alt={track.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}

          {/* Play overlay */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-11 h-11 rounded-full bg-foreground flex items-center justify-center shadow-xl transform transition-transform duration-200 scale-90 group-hover:scale-100">
              <Play className="w-5 h-5 text-background ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-0.5 px-0.5">
          <p className="text-sm font-semibold truncate leading-tight">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.creator?.artistName || 'Unknown Artist'}</p>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-2xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

function SectionSkeleton() {
  return (
    <section>
      <div className="px-6 lg:px-10 mb-4">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex gap-4 px-6 lg:px-10">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-40 sm:w-48 space-y-3">
            <Skeleton className="aspect-square rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
