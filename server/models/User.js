const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true }, // We'll store the yt-search video id here for consistency (even though we call it spotifyId in frontend for now)
  name: { type: String, required: true },
  artist: { type: String, required: true },
  albumName: { type: String, default: 'Single' },
  image: { type: String, default: '' },
  durationMs: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  likedSongs: [trackSchema],
  avatar: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
