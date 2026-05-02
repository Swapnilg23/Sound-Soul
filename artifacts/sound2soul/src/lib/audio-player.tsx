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
  queue: PlayerTrack[];
  queueIndex: number;
  play: (track: PlayerTrack) => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  dismiss: () => void;
  setQueue: (tracks: PlayerTrack[], startAt?: number) => void;
  addToQueue: (track: PlayerTrack) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueueState] = useState<PlayerTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  const currentTrackRef = useRef<PlayerTrack | null>(null);
  const queueRef = useRef<PlayerTrack[]>([]);
  const queueIndexRef = useRef(-1);

  // Internal: load a track into the audio element and play
  const loadAndPlay = useCallback((track: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
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

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      const nextIdx = queueIndexRef.current + 1;
      if (nextIdx < queueRef.current.length) {
        const next = queueRef.current[nextIdx];
        queueIndexRef.current = nextIdx;
        setQueueIndex(nextIdx);
        loadAndPlay(next);
      }
    };

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
  }, [loadAndPlay]);

  const play = useCallback((track: PlayerTrack) => {
    // Toggle if same track
    if (currentTrackRef.current?.id === track.id) {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
      return;
    }
    // Check if track is already in queue
    const existingIdx = queueRef.current.findIndex(t => t.id === track.id);
    if (existingIdx >= 0) {
      queueIndexRef.current = existingIdx;
      setQueueIndex(existingIdx);
    } else {
      // Single-track queue
      const newQueue = [track];
      queueRef.current = newQueue;
      queueIndexRef.current = 0;
      setQueueState(newQueue);
      setQueueIndex(0);
    }
    loadAndPlay(track);
  }, [loadAndPlay]);

  const setQueue = useCallback((tracks: PlayerTrack[], startAt = 0) => {
    queueRef.current = tracks;
    queueIndexRef.current = startAt;
    setQueueState(tracks);
    setQueueIndex(startAt);
    if (tracks[startAt]) loadAndPlay(tracks[startAt]);
  }, [loadAndPlay]);

  const addToQueue = useCallback((track: PlayerTrack) => {
    const newQueue = [...queueRef.current, track];
    queueRef.current = newQueue;
    setQueueState(newQueue);
    // If nothing is playing, start this track
    if (!currentTrackRef.current) {
      queueIndexRef.current = newQueue.length - 1;
      setQueueIndex(newQueue.length - 1);
      loadAndPlay(track);
    }
  }, [loadAndPlay]);

  const nextTrack = useCallback(() => {
    const nextIdx = queueIndexRef.current + 1;
    if (nextIdx < queueRef.current.length) {
      queueIndexRef.current = nextIdx;
      setQueueIndex(nextIdx);
      loadAndPlay(queueRef.current[nextIdx]);
    }
  }, [loadAndPlay]);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    // If > 3s in, restart current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prevIdx = queueIndexRef.current - 1;
    if (prevIdx >= 0) {
      queueIndexRef.current = prevIdx;
      setQueueIndex(prevIdx);
      loadAndPlay(queueRef.current[prevIdx]);
    } else if (audio) {
      audio.currentTime = 0;
    }
  }, [loadAndPlay]);

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
    queueRef.current = [];
    queueIndexRef.current = -1;
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setQueueState([]);
    setQueueIndex(-1);
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      currentTrack, isPlaying, currentTime, duration, volume,
      queue, queueIndex,
      play, pause, resume, seek, setVolume, dismiss,
      setQueue, addToQueue, nextTrack, prevTrack,
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
