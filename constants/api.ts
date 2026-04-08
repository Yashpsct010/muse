import Constants from "expo-constants";
import { Platform } from "react-native";

let LOCAL_URL = "http://localhost:4000";

if (__DEV__) {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    // This dynamically gets the LAN IP from Expo (e.g., 192.168.x.x)
    // Works perfectly for physical devices, iOS simulators, and Android emulators
    const ip = debuggerHost.split(":")[0];
    LOCAL_URL = `http://${ip}:4000`;
  } else {
    // Fallback if hostUri isn't perfectly resolved
    if (Platform.OS === "android") {
      LOCAL_URL = "http://10.0.2.2:4000";
    } else {
      LOCAL_URL = "http://localhost:4000";
    }
  }
}

// __DEV__ is true when running locally via Expo, false in production builds
export const API_URL = __DEV__
  ? LOCAL_URL
  : "https://muse-production-9dd6.up.railway.app";
