import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import TrackListItem from '../../../components/TrackListItem';
import { useAuth } from '../../../context/AuthContext';
import { API_URL } from '../../../constants/api';
import { Playlist } from '../../../types/api';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams();
  const { token, isAuthenticated } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const fetchPlaylist = async () => {
      try {
        const res = await fetch(`${API_URL}/api/library/playlists/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPlaylist(data);
        }
      } catch (err) {
        console.error('Playlist load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id, isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
            <Text style={{ color: 'white', fontSize: 18 }}>Please log in to view this playlist</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1DB954" size="large" />
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'white'}}>Playlist not found!</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['rgba(90,90,90,1)', '#121212']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={32} color="white" />
        </TouchableOpacity>

        <FlatList
          data={playlist.tracks}
          keyExtractor={(item, index) => `${item.spotifyId}-${index}`}
          renderItem={({ item }) => <TrackListItem track={item} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.headerContainer}>
              <Image 
                source={{ uri: playlist.image || 'https://via.placeholder.com/250' }} 
                style={styles.coverImage} 
              />
              <Text style={styles.playlistName}>{playlist.name}</Text>
              <Text style={styles.ownerText}>Playlist Owner</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  backButton: { marginHorizontal: 16, marginTop: 8 },
  headerContainer: { alignItems: 'center', paddingVertical: 24 },
  coverImage: { width: 250, height: 250, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, marginBottom: 20 },
  playlistName: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  ownerText: { color: '#B3B3B3', fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center'}
});
