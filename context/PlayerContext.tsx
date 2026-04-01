import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { API_URL } from '../constants/api';

export type Track = {
  id: string; // YouTube Video ID representing the song
  title: string;
  artist: string;
  image: string;
  url?: string; // Optional direct stream URL
};

type PlayerContextType = {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  sound: Audio.Sound | null;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    // Cleanup sound on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playTrack = async (track: Track) => {
    try {
      setIsLoading(true);
      setCurrentTrack(track);
      
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // 1. Determine local stream proxy URL or use hardcoded if available
      const resolvedUrl = track.url || `${API_URL}/api/stream?id=${track.id}`;

      // 2. Configure audio session (not supported on web)
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
      }

      // 3. Play stream directly from localhost proxy
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: resolvedUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.log('Error streaming track', error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, isLoading, playTrack, togglePlayPause, sound }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
