import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlayTrack } from '../hooks/usePlayTrack';
import { useLibrary } from '../context/LibraryContext';
import { Track } from '../types/api';

type TrackListItemProps = {
  track: Track;
};

export default function TrackListItem({ track }: TrackListItemProps) {
  const { playTrack } = usePlayTrack();
  const { isLiked, toggleLike, isLoading } = useLibrary();

  const isLikedStatus = useMemo(() => isLiked(track.spotifyId), [isLiked, track.spotifyId]);

  return (
    <Pressable style={styles.container} onPress={() => playTrack(track)}>
      <Image source={{ uri: track.image || 'https://via.placeholder.com/50' }} style={styles.image} />
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.iconContainer} 
        onPress={() => toggleLike(track)}
        disabled={isLoading}
      >
        {isLikedStatus ? (
          <Ionicons name="heart" size={24} color="#1DB954" />
        ) : (
          <Ionicons name="heart-outline" size={24} color="#B3B3B3" />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconContainer}
        onPress={() => router.push({
          pathname: '/modal',
          params: { track: JSON.stringify(track) }
        })}
      >
        <Entypo name="dots-three-horizontal" size={20} color="#B3B3B3" />
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  iconContainer: {
    padding: 10,
  },
});
