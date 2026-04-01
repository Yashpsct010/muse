import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, FlatList, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Entypo } from '@expo/vector-icons';
import { useLibrary } from '../context/LibraryContext';
import { Track } from '../types/api';

export default function AddToPlaylistModal() {
  const { track: trackParam } = useLocalSearchParams();
  const track: Track = trackParam ? JSON.parse(trackParam as string) : null;
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibrary();

  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!track) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No track selected</Text>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const handleCreateNew = async () => {
    if (!newPlaylistName.trim()) {
        Alert.alert('Error', 'Please enter a name for your playlist');
        return;
    }
    await createPlaylist(newPlaylistName);
    setIsCreating(false);
    setNewPlaylistName('');
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    const success = await addTrackToPlaylist(playlistId, track);
    if (success) {
      router.back();
    } else {
      Alert.alert('Error', 'Failed to add song to playlist');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Track Info */}
      <View style={styles.header}>
        <Image source={{ uri: track.image || 'https://via.placeholder.com/100' }} style={styles.headerImage} />
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>{track.name}</Text>
          <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Add to playlist</Text>

      {/* New Playlist CTA */}
      {!isCreating ? (
        <TouchableOpacity style={styles.newPlaylistBtn} onPress={() => setIsCreating(true)}>
          <View style={styles.newPlaylistIconContainer}>
            <Entypo name="plus" size={24} color="#FFF" />
          </View>
          <Text style={styles.newPlaylistText}>New Playlist</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.creatingContainer}>
            <TextInput
                style={styles.input}
                placeholder="Give your playlist a name"
                placeholderTextColor="#B3B3B3"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
            />
            <View style={styles.createActions}>
                <TouchableOpacity onPress={() => setIsCreating(false)} style={styles.cancelAction}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateNew} style={styles.saveAction}>
                    <Text style={styles.saveText}>Create</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}

      {/* Playlist List */}
      <FlatList
        data={playlists}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.playlistRow} onPress={() => handleAddToPlaylist(item._id)}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/50' }} style={styles.playlistImage} />
            <View>
              <Text style={styles.playlistName}>{item.name}</Text>
              <Text style={styles.playlistCount}>{item.tracks.length} tracks</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Strict dark theme sonic
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  newPlaylistIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  newPlaylistText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playlistImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 16,
  },
  playlistName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playlistCount: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  creatingContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#282828',
    color: '#FFF',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  createActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
  },
  cancelAction: {
      padding: 12,
      marginRight: 8,
  },
  cancelText: {
      color: '#B3B3B3',
      fontSize: 14,
      fontWeight: 'bold',
  },
  saveAction: {
      backgroundColor: '#1DB954',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
  },
  saveText: {
      color: '#000',
      fontSize: 14,
      fontWeight: 'bold',
  },
  errorText: { color: '#FF4C4C', textAlign: 'center', marginTop: 40 },
  closeButton: {
      marginTop: 20,
      padding: 16,
      backgroundColor: '#333',
      alignItems: 'center',
      borderRadius: 8,
  },
  closeText: {
      color: '#FFF',
      fontWeight: 'bold',
  }
});
