import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TrackListItem from '../../components/TrackListItem';
import { API_URL } from '../../constants/api';
import { Track } from '../../types/api';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the query to avoid spamming the local yt-search server
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const searchYT = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error('Failed to search');
        const data = await res.json();
        setResults(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    searchYT();
  }, [debouncedQuery]);

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (text.trim().length > 0) {
      setLoading(true);
      setError('');
    } else {
      setLoading(false);
      setResults([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Search</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#000" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="What do you want to listen to?"
          placeholderTextColor="#535353"
          value={query}
          onChangeText={handleSearchChange}
          autoFocus={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close" size={24} color="#000" style={styles.closeIcon} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        {loading && <ActivityIndicator color="#1DB954" style={{ marginTop: 40 }} />}
        
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {!loading && !error && results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.spotifyId}
            renderItem={({ item }) => <TrackListItem track={item} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {!loading && !error && query && results.length === 0 && (
          <Text style={styles.emptyText}>No results found for "{query}"</Text>
        )}

        {!query && (
          <Text style={styles.emptyText}>Search for songs using YouTube under the hood.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { color: '#FFF', fontSize: 24, fontWeight: 'bold', padding: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#000', fontSize: 16, height: '100%' },
  closeIcon: { marginLeft: 8 },
  contentContainer: { flex: 1, marginTop: 16 },
  errorText: { color: '#FF4C4C', textAlign: 'center', marginTop: 20 },
  emptyText: { color: '#B3B3B3', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
