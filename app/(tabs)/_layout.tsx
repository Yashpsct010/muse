import { Tabs } from 'expo-router';
import { Home, Search, Library } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';
import MiniPlayer from '../../components/MiniPlayer';

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#B3B3B3',
          tabBarStyle: {
            backgroundColor: 'rgba(18, 18, 18, 0.95)',
            borderTopWidth: 0,
            position: 'absolute',
            elevation: 0,
            height: 65,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 4,
          },
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <Search color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Your Library',
            tabBarIcon: ({ color }) => <Library color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="playlist/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
      {/* Mini Player Placeholder - Floating above tabs */}
      <View style={styles.miniPlayerContainer}>
        <MiniPlayer />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 72,
    left: 8,
    right: 8,
  },
});
