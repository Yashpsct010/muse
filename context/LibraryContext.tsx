import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../constants/api';
import { Track, Playlist } from '../types/api';

type LibraryContextType = {
  likedSongs: Track[];
  playlists: Playlist[];
  isLoading: boolean;
  refreshLibrary: () => Promise<void>;
  toggleLike: (track: Track) => Promise<void>;
  isLiked: (spotifyId: string) => boolean;
  createPlaylist: (name: string, description?: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<boolean>;
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshLibrary = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [likedRes, playRes] = await Promise.all([
        fetch(`${API_URL}/api/library/liked`, { headers: { Authorization: `Bearer ${token}` }}),
        fetch(`${API_URL}/api/library/playlists`, { headers: { Authorization: `Bearer ${token}` }})
      ]);

      if (likedRes.ok) setLikedSongs(await likedRes.json());
      if (playRes.ok) setPlaylists(await playRes.json());
    } catch (err) {
      console.error('Failed to fetch library', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshLibrary();
    } else {
      setLikedSongs([]);
      setPlaylists([]);
    }
  }, [isAuthenticated, refreshLibrary]);

  const toggleLike = async (track: Track) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/library/liked`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ track })
      });
      if (res.ok) {
        setLikedSongs(await res.json());
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  };

  const isLiked = (spotifyId: string) => {
    return likedSongs.some(t => t.spotifyId === spotifyId);
  };

  const createPlaylist = async (name: string, description: string = '') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/library/playlists`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        const newPlaylist = await res.json();
        setPlaylists(prev => [...prev, newPlaylist]);
      }
    } catch (err) {
      console.error('Failed to create playlist', err);
    }
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_URL}/api/library/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ track })
      });
      if (res.ok) {
        await refreshLibrary(); // Refresh to update the counts/thumbnails
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add track to playlist', err);
      return false;
    }
  };

  return (
    <LibraryContext.Provider value={{
      likedSongs, playlists, isLoading, refreshLibrary, toggleLike, isLiked, createPlaylist, addTrackToPlaylist
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
};
