import React, { useRef, useState } from 'react';
import { Link } from 'wouter';
import { useAudioPlayer } from '@/lib/audio-player';
import { Play, Pause, Volume2, VolumeX, X, ExternalLink } from 'lucide-react';

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function MiniPlayer() {
  const { currentTrack, isPlaying, currentTime, duration, volume, pause, resume, seek, setVolume, dismiss } = useAudioPlayer();
  const [muted, setMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(0.8);
  const progressRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;

  const pct = duration > 0 ? currentTime / duration : 0;
  const noAudio = !currentTrack.audioUrl;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const handleMuteToggle = () => {
    if (muted) {
      setVolume(prevVol || 0.5);
      setMuted(false);
    } else {
      setPrevVol(volume);
      setVolume(0);
      setMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (v > 0) setPrevVol(v);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0c14]/95 backdrop-blur-2xl border-t border-white/8 shadow-2xl shadow-black/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center gap-4">

        {/* ── Track info ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-0 w-56 shrink-0">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-primary/20 flex-shrink-0 shadow-lg">
            {currentTrack.coverImageUrl
              ? <img src={currentTrack.coverImageUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-primary/40 text-xs">♫</div>
            }
            {isPlaying && (
              <div className="absolute inset-0 flex items-end justify-center gap-[2px] p-1.5">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-[3px] bg-white/80 rounded-full"
                    style={{
                      height: `${40 + i * 20}%`,
                      animation: `soundbar 0.${6 + i}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/track/${currentTrack.slug}`}>
              <p className="text-sm font-semibold truncate hover:text-primary transition-colors leading-tight">
                {currentTrack.title}
              </p>
            </Link>
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {currentTrack.creator?.artistName || 'Unknown Artist'}
            </p>
          </div>
        </div>

        {/* ── Controls + progress bar ─────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 min-w-0">
          {/* Play / Pause */}
          <button
            onClick={isPlaying ? pause : resume}
            disabled={noAudio}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 shadow-lg ${
              noAudio
                ? 'bg-white/5 text-muted-foreground/30 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
            }`}
            title={noAudio ? 'No audio available' : isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause className="w-4 h-4" fill="currentColor" />
              : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
            }
          </button>

          {/* Progress bar + times */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/50 tabular-nums w-8 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className={`flex-1 h-1 bg-white/10 rounded-full overflow-hidden ${duration > 0 ? 'cursor-pointer group' : ''}`}
            >
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-100 relative"
                style={{ width: `${pct * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity -mr-1.5" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/50 tabular-nums w-8 shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* ── Volume + dismiss ────────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0 w-40 justify-end">
          {/* Volume */}
          <button
            onClick={handleMuteToggle}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            {muted || volume === 0
              ? <VolumeX className="w-4 h-4" />
              : <Volume2 className="w-4 h-4" />
            }
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 accent-primary cursor-pointer hidden sm:block"
          />

          {/* Go to track */}
          <Link href={`/track/${currentTrack.slug}`} className="text-muted-foreground hover:text-foreground transition-colors hidden md:block">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes soundbar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
