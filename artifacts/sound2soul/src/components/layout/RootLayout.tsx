import React, { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { MiniPlayer } from '@/components/MiniPlayer';
import { AudioPlayerProvider, useAudioPlayer } from '@/lib/audio-player';
import { Button } from '@/components/ui/button';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { currentTrack } = useAudioPlayer();
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('sound2soul_cookie_consent');
    if (!consent) setShowCookieBanner(true);
  }, []);

  const saveConsent = (value: 'accepted' | 'declined') => {
    localStorage.setItem('sound2soul_cookie_consent', value);
    setShowCookieBanner(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark selection:bg-primary/30">
      <Navbar />
      <main className={`flex-1 w-full${currentTrack ? ' pb-[72px]' : ''}`}>
        {children}
      </main>
      <MiniPlayer />
      {showCookieBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">We use cookies</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sound2Soul uses essential cookies and local storage to keep you signed in and remember preferences.
                Optional analytics and marketing cookies are only used if you accept them.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => saveConsent('declined')}>
                Decline
              </Button>
              <Button size="sm" onClick={() => saveConsent('accepted')}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}
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
