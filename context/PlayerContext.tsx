import React, { createContext, useContext, useState, useEffect } from 'react';
import { AudioPlayer } from 'expo-audio';
import { API_URL } from '../constants/api';

export type Track = {
  id: string;
  title: string;
  artist: string;
  image: string;
  url?: string;
};

type PlayerContextType = {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Module-level player so audio continues when navigating between screens
let globalPlayer: AudioPlayer | null = null;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = async (track: Track) => {
    try {
      setIsLoading(true);
      setCurrentTrack(track);

      // Railway streams audio directly — just pass the URL
      const streamUrl = track.url || `${API_URL}/api/stream?id=${track.id}`;

      // Release previous player cleanly
      if (globalPlayer) {
        globalPlayer.remove();
        globalPlayer = null;
      }

      const player = new AudioPlayer({ uri: streamUrl });
      globalPlayer = player;

      await player.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing track:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!globalPlayer) return;
    if (isPlaying) {
      globalPlayer.pause();
      setIsPlaying(false);
    } else {
      globalPlayer.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      globalPlayer?.remove();
      globalPlayer = null;
    };
  }, []);

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, isLoading, playTrack, togglePlayPause }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
};
