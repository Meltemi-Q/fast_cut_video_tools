import { useState, useRef, useCallback, useEffect } from 'react';
import { PlayerState } from '@/types';
import { PLAYER_SETTINGS } from '@/constants';
import { formatDuration } from '@/utils/file';

export interface UseVideoPlayerReturn {
  // 播放器引用
  videoRef: React.RefObject<HTMLVideoElement>;
  
  // 播放状态
  playerState: PlayerState;
  
  // 格式化的时间显示
  formattedCurrentTime: string;
  formattedDuration: string;
  
  // 控制方法
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  
  // 事件处理
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleVolumeChange: () => void;
  
  // 状态查询
  isLoading: boolean;
  canPlay: boolean;
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: PLAYER_SETTINGS.DEFAULT_VOLUME,
    isMuted: false,
    playbackRate: 1,
  });

  // 播放控制
  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }).catch(console.error);
    }
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (playerState.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [playerState.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      videoRef.current.volume = clampedVolume;
      setPlayerState(prev => ({ 
        ...prev, 
        volume: clampedVolume,
        isMuted: clampedVolume === 0 
      }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !playerState.isMuted;
      videoRef.current.muted = newMuted;
      setPlayerState(prev => ({ ...prev, isMuted: newMuted }));
    }
  }, [playerState.isMuted]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlayerState(prev => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  // 事件处理
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setPlayerState(prev => ({
        ...prev,
        currentTime: videoRef.current!.currentTime,
      }));
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      setPlayerState(prev => ({
        ...prev,
        duration: video.duration,
        volume: video.volume,
        isMuted: video.muted,
      }));
      setIsLoading(false);
      setCanPlay(true);
    }
  }, []);

  const handleVolumeChange = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      setPlayerState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted,
      }));
    }
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!canPlay) return;
      
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          seek(Math.max(0, playerState.currentTime - PLAYER_SETTINGS.SEEK_STEP));
          break;
        case 'ArrowRight':
          event.preventDefault();
          seek(Math.min(playerState.duration, playerState.currentTime + PLAYER_SETTINGS.SEEK_STEP));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setVolume(Math.min(1, playerState.volume + 0.1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setVolume(Math.max(0, playerState.volume - 0.1));
          break;
        case 'KeyM':
          event.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [canPlay, playerState, togglePlay, seek, setVolume, toggleMute]);

  // 格式化时间显示
  const formattedCurrentTime = formatDuration(playerState.currentTime);
  const formattedDuration = formatDuration(playerState.duration);

  return {
    videoRef,
    playerState,
    formattedCurrentTime,
    formattedDuration,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleVolumeChange,
    isLoading,
    canPlay,
  };
} 