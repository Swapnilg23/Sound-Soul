import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';

export interface PlayerTrack {
  id: string;
  title: string;
  slug: string;
  audioUrl: string | null;
  coverImageUrl: string | null;
  creator: { artistName: string; slug: string; avatarUrl: string | null } | null;
}

interface AudioPlayerContextType {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (track: PlayerTrack) => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  dismiss: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const currentTrackRef = useRef<PlayerTrack | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const play = useCallback((track: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrackRef.current?.id === track.id) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
      return;
    }

    currentTrackRef.current = track;
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);

    if (track.audioUrl) {
      audio.src = track.audioUrl;
      audio.load();
      audio.play().catch(() => {});
      fetch(`/api/tracks/${track.slug}/play`, { method: 'POST' }).catch(() => {});
    }
  }, []);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);
  const resume = useCallback(() => { audioRef.current?.play().catch(() => {}); }, []);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds;
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const dismiss = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ''; }
    currentTrackRef.current = null;
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      currentTrack, isPlaying, currentTime, duration, volume,
      play, pause, resume, seek, setVolume, dismiss,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}
