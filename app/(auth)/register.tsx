import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !username) return setError('Please fill all fields');
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: email.toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Fetch user data using token
      const meRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const userData = await meRes.json();
      await login(data.token, userData);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sign up for free to start listening.</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#B3B3B3"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#B3B3B3"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#B3B3B3"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.loginBtn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.loginText}>Sign Up</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ marginTop: 24 }}>
        <Text style={styles.linkText}>Already have an account? Log in.</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
        <Text style={styles.linkTextCanceled}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24, justifyContent: 'center' },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  input: {
    backgroundColor: '#282828',
    color: '#FFF',
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: '#1DB954',
    padding: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: { color: '#000', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#FF4C4C', marginBottom: 16, textAlign: 'center' },
  linkText: { color: '#B3B3B3', textAlign: 'center', fontSize: 14, fontWeight: 'bold' },
  linkTextCanceled: { color: '#B3B3B3', textAlign: 'center', fontSize: 14 },
});
