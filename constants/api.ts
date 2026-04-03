import { Platform } from 'react-native';

// Your computer's local IP address
// Needed for physical devices on Expo Go to reach your local Node.js backend.
const LOCAL_DEV_IP = '192.168.0.12';

// Android Emulators use 10.0.2.2 to reach the host machine's localhost.
// iOS Simulators and physical devices need the specific IP.
const LOCAL_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:4000' 
  : `http://${LOCAL_DEV_IP}:4000`;

// __DEV__ is true when running locally via Expo, false in production builds
export const API_URL = __DEV__ 
  ? LOCAL_URL 
  : 'https://muse-production-9dd6.up.railway.app';
