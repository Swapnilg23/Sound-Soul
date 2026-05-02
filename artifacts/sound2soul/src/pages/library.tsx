import React, { useState } from 'react';
import { useGetLibrary } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Tab = 'saved' | 'liked' | 'following';

export default function Library() {
  const { data: library, isLoading } = useGetLibrary();
  const [activeTab, setActiveTab] = useState<Tab>('saved');

  const tabs: { id: Tab; label: string; count: number | undefined }[] = [
    { id: 'saved',     label: 'Saved',     count: library?.savedTracks.length },
    { id: 'liked',     label: 'Liked',     count: library?.likedTracks.length },
    { id: 'following', label: 'Following', count: library?.followedCreators.length },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Your Library
        </h1>
        <p className="text-muted-foreground">Tracks you've saved, liked, and creators you follow.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {!isLoading && tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary'
                  : 'bg-white/8 text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          {activeTab === 'saved' && (
            library?.savedTracks.length === 0 ? (
              <EmptyState
                icon="🎵"
                message="You haven't saved any tracks yet."
                sub="Tap the bookmark on any track to save it here."
                linkText="Explore tracks"
                href="/explore"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {library?.savedTracks.map(track => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            )
          )}

          {activeTab === 'liked' && (
            library?.likedTracks.length === 0 ? (
              <EmptyState
                icon="♥"
                message="You haven't liked any tracks yet."
                sub="Tap the heart on any track to like it."
                linkText="Explore tracks"
                href="/explore"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {library?.likedTracks.map(track => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            )
          )}

          {activeTab === 'following' && (
            library?.followedCreators.length === 0 ? (
              <EmptyState
                icon="✦"
                message="You're not following any creators yet."
                sub="Follow a creator to get notified when they drop new music."
                linkText="Discover creators"
                href="/explore"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {library?.followedCreators.map((creator: any) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

function TrackCard({ track }: { track: any }) {
  return (
    <Link href={`/track/${track.slug}`}>
      <Card className="bg-card/40 hover:bg-card/80 border-white/5 transition-colors cursor-pointer group">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
            {track.coverImageUrl ? (
              <img src={track.coverImageUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xl text-primary/40">♫</div>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{track.title}</h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{track.creator?.artistName || 'Unknown Artist'}</p>
            {track.genre && (
              <span className="text-xs text-muted-foreground/60">{track.genre}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CreatorCard({ creator }: { creator: any }) {
  return (
    <Link href={`/creator/${creator.slug}`}>
      <Card className="bg-card/40 hover:bg-card/80 border-white/5 transition-colors cursor-pointer group">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex-shrink-0 overflow-hidden border-2 border-white/10 group-hover:border-primary/40 transition-colors">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.artistName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary/40 text-lg">
                {creator.artistName?.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{creator.artistName}</h3>
            {creator.genres && creator.genres.length > 0 && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{creator.genres.join(' · ')}</p>
            )}
            {creator.bio && (
              <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{creator.bio}</p>
            )}
          </div>
          <svg className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-primary/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ icon, message, sub, linkText, href }: {
  icon: string; message: string; sub: string; linkText: string; href: string;
}) {
  return (
    <div className="py-20 text-center bg-card/20 rounded-2xl border border-white/5 border-dashed">
      <div className="text-4xl mb-4 opacity-40">{icon}</div>
      <p className="text-foreground font-medium mb-1">{message}</p>
      <p className="text-sm text-muted-foreground mb-6">{sub}</p>
      <Link href={href} className="text-sm text-primary hover:underline font-medium">{linkText} →</Link>
    </div>
  );
}
