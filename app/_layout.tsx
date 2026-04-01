import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlayerProvider } from '../context/PlayerContext';
import { AuthProvider } from '../context/AuthContext';
import { LibraryProvider } from '../context/LibraryContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <PlayerProvider>
          <ThemeProvider value={DarkTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </PlayerProvider>
      </LibraryProvider>
    </AuthProvider>
  );
}
