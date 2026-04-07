require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec, execFile } = require('child_process');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
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

// yt-dlp binary downloaded via postinstall — always latest version from GitHub
const YTDLP_FILENAME = os.platform() === 'win32' ? 'yt-dlp.exe' : (os.platform() === 'darwin' ? 'yt-dlp_macos' : 'yt-dlp_linux');
const YTDLP_BIN = path.join(__dirname, '..', YTDLP_FILENAME);

// YouTube cookies — needed because Railway's IP is flagged as a bot by YouTube
// Set YOUTUBE_COOKIES env var in Railway dashboard with the contents of cookies.txt
const COOKIES_FILE = path.join(os.tmpdir(), 'yt_cookies.txt');
if (process.env.YOUTUBE_COOKIES) {
  try {
    fs.writeFileSync(COOKIES_FILE, process.env.YOUTUBE_COOKIES, 'utf8');
    console.log('[cookies] YouTube cookies loaded from env var');
  } catch (err) {
    console.error('[cookies] Failed to write cookies file:', err);
  }
} else if (process.env.YOUTUBE_BROWSER_COOKIES) {
  console.log(`[cookies] Will extract cookies directly from local browser: ${process.env.YOUTUBE_BROWSER_COOKIES}`);
} else {
  console.warn('[cookies] Neither YOUTUBE_COOKIES nor YOUTUBE_BROWSER_COOKIES set — yt-dlp may be blocked by YouTube bot detection');
}

// In-memory cache: expo-av sends multiple Range requests per playback session
// Cache the Google CDN URL so yt-dlp only runs ONCE per video (TTL: 4 hours)
const urlCache = new Map();
const CACHE_TTL = 4 * 60 * 60 * 1000;

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

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set' });
    }
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
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

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set' });
    }
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
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

    // Cache search results for 1 hour to heavily optimize load times
    res.setHeader('Cache-Control', 'public, max-age=3600');
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

// Debug: verify which yt-dlp version Railway is actually using
// Protected — requires admin key set in Railway env vars
app.get('/api/ytdlp-version', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  execFile(YTDLP_BIN, ['--version'], (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ version: stdout.trim() });
  });
});

function extractAudioUrl(videoId) {
  return new Promise((resolve, reject) => {
    // Serve from cache if fresh (avoids duplicate yt-dlp calls from expo-av Range probes)
    const cached = urlCache.get(videoId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      console.log('[cache] hit for', videoId);
      return resolve(cached.url);
    }

    const args = [
      '--format', 'bestaudio/best',
      '--extractor-args', 'youtube:player_client=android,ios',
      '--get-url',
      '--no-warnings',
      '--no-playlist',
    ];
    // Pass cookies if available — required to bypass YouTube bot detection on cloud IPs
    if (process.env.YOUTUBE_COOKIES) {
      args.push('--cookies', COOKIES_FILE);
    } else if (process.env.YOUTUBE_BROWSER_COOKIES) {
      args.push('--cookies-from-browser', process.env.YOUTUBE_BROWSER_COOKIES);
    }
    args.push(`https://www.youtube.com/watch?v=${videoId}`);

    execFile(YTDLP_BIN, args, { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('[yt-dlp error]', stderr);
        return reject(new Error('yt-dlp failed: ' + stderr.trim()));
      }
      const url = stdout.trim().split('\n')[0];
      if (!url || !url.startsWith('http')) {
        return reject(new Error('yt-dlp returned invalid URL: ' + url));
      }
      urlCache.set(videoId, { url, ts: Date.now() });
      resolve(url);
    });
  });
}

app.get('/api/stream', async (req, res) => {
  const { id } = req.query;
  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid or missing video ID' });
  }

  let audioUrl;
  try {
    audioUrl = await extractAudioUrl(id);
    console.log('[stream] Extracted for ' + id + ': ' + audioUrl.slice(0, 80) + '...');
  } catch (err) {
    console.error('[stream] Extraction failed:', err.message);
    return res.status(502).json({ error: 'Audio extraction failed', detail: err.message });
  }

  const parsedUrl = new URL(audioUrl);
  const lib = parsedUrl.protocol === 'https:' ? https : http;
  const rangeHeader = req.headers['range'] || 'bytes=0-';

  const upstreamReq = lib.get(
    audioUrl,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        'Range': rangeHeader,
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
      },
    },
    (upstreamRes) => {
      res.status(upstreamRes.statusCode || 200);
      res.setHeader('Content-Type', upstreamRes.headers['content-type'] || 'audio/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (upstreamRes.headers['content-length']) res.setHeader('Content-Length', upstreamRes.headers['content-length']);
      if (upstreamRes.headers['content-range'])  res.setHeader('Content-Range',  upstreamRes.headers['content-range']);
      upstreamRes.pipe(res);
    }
  );

  upstreamReq.on('error', (err) => {
    console.error('[stream] Upstream error:', err.message);
    if (!res.headersSent) res.status(502).json({ error: 'Upstream stream failed' });
  });

  req.on('close', () => upstreamReq.destroy());
});

// Start server — Railway provides PORT env var automatically
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Muse backend listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;

