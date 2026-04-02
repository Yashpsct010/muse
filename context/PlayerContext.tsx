import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
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
  togglePlayPause: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => { sound?.unloadAsync(); };
  }, [sound]);

  const playTrack = async (track: Track) => {
    try {
      setIsLoading(true);
      setCurrentTrack(track);

      // Unload the previous track
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Set audio mode for background play
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Railway streams audio directly — a clean HTTP audio pipe from yt-dlp
      const streamUrl = track.url || `${API_URL}/api/stream?id=${track.id}`;
      console.log('Playing:', streamUrl);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) setIsPlaying(false);
          }
        }
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing track:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

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
