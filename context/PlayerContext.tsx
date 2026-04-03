import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { API_URL } from '../constants/api';
import { useYoutubeResolver } from '../hooks/useYoutubeResolver';

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
  const { resolveAudioUrl } = useYoutubeResolver();

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

      let streamUrl = track.url;
      
      if (!streamUrl) {
        try {
          const innerTubeUrl = await resolveAudioUrl(track.id);
          if (innerTubeUrl) {
            console.log('[player] Using client-side InnerTube URL');
            streamUrl = innerTubeUrl;
          }
        } catch (err) {
          console.warn('Error resolving InnerTube URL:', err);
        }

        if (!streamUrl) {
          console.log('[player] Falling back to Railway server');
          streamUrl = `${API_URL}/api/stream?id=${track.id}`;
        }
      } else {
        console.log('Playing:', streamUrl);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: streamUrl as string },
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
