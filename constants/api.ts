import Constants from 'expo-constants';

function getApiUrl(): string {
  // In Expo Go, hostUri is like "192.168.x.x:8081" — extract the LAN IP and use port 4000
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:4000`;
  }
  return 'http://localhost:4000';
}

export const API_URL = getApiUrl();
