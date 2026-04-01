require('dotenv').config();
const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Playlist = require('../models/Playlist');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGODB_URI not set. Database features will fail.');
}

// ----------------------------------------------------
//                   AUTHENTICATION
// ----------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    user = new User({ username, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid Credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ----------------------------------------------------
//                   LIBRARY & PLAYLISTS
// ----------------------------------------------------

// Get user library (liked songs)
app.get('/api/library/liked', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('likedSongs');
    res.json(user.likedSongs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Add/Remove liked song
app.post('/api/library/liked', authMiddleware, async (req, res) => {
  const { track } = req.body; // Expects { spotifyId, name, artist, image, etc }
  if (!track || !track.spotifyId) return res.status(400).json({ error: 'Track details required' });
  try {
    const user = await User.findById(req.user.id);
    const index = user.likedSongs.findIndex(t => t.spotifyId === track.spotifyId);
    
    if (index > -1) {
      // remove
      user.likedSongs.splice(index, 1);
    } else {
      // add
      user.likedSongs.push(track);
    }
    await user.save();
    res.json(user.likedSongs);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Get user playlists
app.get('/api/library/playlists', authMiddleware, async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user.id });
    res.json(playlists);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create playlist
app.post('/api/library/playlists', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  try {
    const newPlaylist = new Playlist({
      userId: req.user.id,
      name,
      description
    });
    const playlist = await newPlaylist.save();
    res.json(playlist);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Get specific playlist
app.get('/api/library/playlists/:id', authMiddleware, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId.toString() !== req.user.id) return res.status(401).json({ error: 'Not authorized' });
    res.json(playlist);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Add track to playlist
app.post('/api/library/playlists/:id/tracks', authMiddleware, async (req, res) => {
  const { track } = req.body;
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId.toString() !== req.user.id) return res.status(401).json({ error: 'Not authorized' });
    
    // Check if already in playlist (optional, depending on if you allow dupes)
    if (!playlist.tracks.find(t => t.spotifyId === track.spotifyId)) {
        playlist.tracks.push(track);
        if (!playlist.image) {
            playlist.image = track.image; // Set artwork
        }
        await playlist.save();
    }
    
    res.json(playlist);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// ----------------------------------------------------
//                   AUDIO & SEARCH ENGINE
// ----------------------------------------------------

// Health check
app.get('/api', (req, res) => {
  res.json({ status: 'Custom Auth Spotify Clone API is running' });
});

// Endpoint 1: Search YouTube
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter (q)' });
  }

  try {
    const results = await yts(q + ' official audio');
    // Map to a clean object
    const tracks = results.videos.slice(0, 10).map((video) => ({
      spotifyId: String(video.videoId).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 11),
      name: video.title,
      artist: video.author.name,
      image: video.thumbnail,
      durationMs: video.seconds * 1000,
    }));

    return res.json(tracks);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// Endpoint 1.5: Resolve a track name+artist to a YouTube video ID
app.get('/api/resolve', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter (q)' });
  }
  try {
    const results = await yts(String(q) + ' audio');
    const top = results.videos[0];
    if (!top) return res.status(404).json({ error: 'No results found' });
    const id = String(top.videoId).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 11);
    return res.json({ id, title: top.title, thumbnail: top.thumbnail });
  } catch (error) {
    console.error('Resolve error:', error);
    return res.status(500).json({ error: 'Failed to resolve track' });
  }
});

// /api/stream is handled by api/stream.py (Python serverless function on Vercel)
// which uses yt-dlp to extract and redirect to the raw audio URL.

// For local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server listening on http://0.0.0.0:${PORT}`);
  });
}

// For Vercel serverless deployment
module.exports = app;

