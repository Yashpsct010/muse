export type Track = {
  spotifyId: string; // The YouTube ID
  name: string;
  artist: string;
  albumName: string;
  image: string;
  durationMs: number;
};

export type User = {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
  likedSongs: Track[];
};

export type Playlist = {
  _id: string;
  userId: string;
  name: string;
  description: string;
  image: string | null;
  tracks: Track[];
  trackCount: number;
};
