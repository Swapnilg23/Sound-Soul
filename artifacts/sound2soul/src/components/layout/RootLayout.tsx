import React from 'react';
import { Navbar } from './Navbar';
import { MiniPlayer } from '@/components/MiniPlayer';
import { AudioPlayerProvider, useAudioPlayer } from '@/lib/audio-player';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { currentTrack } = useAudioPlayer();
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark selection:bg-primary/30">
      <Navbar />
      <main className={`flex-1 w-full${currentTrack ? ' pb-[72px]' : ''}`}>
        {children}
      </main>
      <MiniPlayer />
    </div>
  );
}

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AudioPlayerProvider>
      <LayoutInner>{children}</LayoutInner>
    </AudioPlayerProvider>
  );
};
