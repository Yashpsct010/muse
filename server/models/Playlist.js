const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: null },
  tracks: [{
    spotifyId: String,
    name: String,
    artist: String,
    albumName: String,
    image: String,
    durationMs: Number
  }]
}, { timestamps: true });

// Add virtual for trackCount to easily map frontend
playlistSchema.virtual('trackCount').get(function() {
  return this.tracks.length;
});

// Ensure virtual fields are serialized.
playlistSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Playlist', playlistSchema);
