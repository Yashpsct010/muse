import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import TrackListItem from '../../components/TrackListItem';
import { router } from 'expo-router';

export default function LibraryScreen() {
  const { isAuthenticated } = useAuth();
  const { likedSongs, playlists, isLoading } = useLibrary();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Your Library</Text>
          <Text style={styles.subTitle}>Log in to see your saved songs and playlists.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Your Library</Text>
      
      {isLoading ? (
        <ActivityIndicator color="#1DB954" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={likedSongs}
          keyExtractor={(item) => item.spotifyId}
          renderItem={({ item }) => <TrackListItem track={item} />}
          ListHeaderComponent={() => (
             <>
               <Text style={styles.sectionHeader}>Liked Songs ({likedSongs.length})</Text>
             </>
          )}
          ListEmptyComponent={() => (
             <Text style={styles.emptyText}>You haven't liked any songs yet.</Text>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { color: '#FFF', fontSize: 28, fontWeight: 'bold', padding: 16 },
  sectionHeader: { color: '#FFF', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16, paddingBottom: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subTitle: { color: '#B3B3B3', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  loginBtn: { backgroundColor: '#FFF', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  loginText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#B3B3B3', textAlign: 'center', marginTop: 20 }
});
