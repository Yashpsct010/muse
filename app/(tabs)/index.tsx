import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import TrackListItem from '../../components/TrackListItem';
import { API_URL } from '../../constants/api';
import { Track, Playlist } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { router } from 'expo-router';

// Helper component for horizontal playlist cards
const PlaylistCard = ({ item }: { item: Playlist }) => (
  <TouchableOpacity 
    style={styles.playlistCard}
    onPress={() => router.push(`/(tabs)/playlist/${item._id}`)}
  >
    <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.playlistImage} />
    <Text style={styles.playlistText} numberOfLines={2}>{item.name}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const { playlists } = useLibrary();
  
  const [mixes, setMixes] = useState<{title: string, tracks: Track[]}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch a couple of dynamic mixes from YouTube
        const queries = ['Top Pop Hits', 'Trending Viral Music'];
        
        const mixPromises = queries.map(async (q) => {
          const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            return { title: q, tracks: await res.json() };
          }
          return { title: q, tracks: [] };
        });

        const results = await Promise.all(mixPromises);
        setMixes(results.filter(m => m.tracks.length > 0));
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{getGreeting()}</Text>
      {!isAuthenticated ? (
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.profileCircle}>
          <Text style={styles.profileInitial}>{user?.username?.charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#3B5998', '#121212']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {isAuthenticated && playlists && playlists.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Playlists</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={playlists}
                renderItem={({ item }) => <PlaylistCard item={item} />}
                keyExtractor={(p) => p._id}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            </View>
          )}

          {loading ? (
            <ActivityIndicator color="#1DB954" size="large" style={{ marginTop: 50 }} />
          ) : (
            mixes.map((mix, index) => (
              <View key={index} style={styles.section}>
                <Text style={styles.sectionTitle}>{mix.title}</Text>
                {mix.tracks.map((track) => (
                   <TrackListItem key={`${mix.title}-${track.spotifyId}`} track={track} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 24,
  },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  loginButton: {
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20
  },
  loginText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  profileCircle: {
    backgroundColor: '#FF6347', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'
  },
  profileInitial: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  section: {
    marginBottom: 24,
  },
  sectionTitle: { 
    color: '#FFF', fontSize: 22, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 16 
  },
  playlistCard: {
    marginRight: 16,
    width: 140,
  },
  playlistImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  }
});
