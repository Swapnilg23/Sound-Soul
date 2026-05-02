import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useIncrementPlayCount } from '@workspace/api-client-react';

interface AudioPlayerProps {
  url: string;
  trackId: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, trackId }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hasLoggedPlay, setHasLoggedPlay] = useState(false);
  const incrementPlayCount = useIncrementPlayCount();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    setIsPlaying(!prevValue);
    if (!prevValue) {
      audioRef.current?.play();
      if (!hasLoggedPlay) {
        incrementPlayCount.mutate({ trackId });
        setHasLoggedPlay(true);
      }
    } else {
      audioRef.current?.pause();
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card/80 backdrop-blur border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <div className="flex items-center gap-4">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-12 w-12 rounded-full flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </Button>
        
        <div className="flex-grow flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
