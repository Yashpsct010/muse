import { useCallback } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types/api';

export function usePlayTrack() {
  const { playTrack: play } = usePlayer();

  const playTrack = useCallback(async (track: Track) => {
    try {
      await play({
        id: track.spotifyId,
        title: track.name,
        artist: track.artist,
        image: track.image,
      });
    } catch (err) {
      console.error('playTrack error:', err);
    }
  }, [play]);

  return { playTrack };
}
