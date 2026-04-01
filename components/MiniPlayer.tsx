import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Play, Pause, Heart, Volume2 } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause } = usePlayer();

  if (!currentTrack) return null;

  return (
    <View style={styles.wrapper}>
      {/* Progress bar sits at the very top edge of the card */}
      <View style={styles.progressBar}>
        <View style={[styles.progressCurrent, { width: isPlaying ? '45%' : '15%' }]} />
      </View>

      <TouchableOpacity style={styles.row} activeOpacity={0.9}>
        <View style={styles.trackInfo}>
          <Image source={{ uri: currentTrack.image }} style={styles.albumArt} />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn}>
            <Volume2 color="#1DB954" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn}>
            <Heart color="#FFFFFF" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={togglePlayPause}>
            {isPlaying ? (
              <Pause color="#FFFFFF" size={24} fill="#FFFFFF" />
            ) : (
              <Play color="#FFFFFF" size={24} fill="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#303030',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  progressBar: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressCurrent: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    marginLeft: 16,
  },
});
