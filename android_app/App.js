import { SafeAreaView, StatusBar, View } from 'react-native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Navigationsleiste transparent machen
      NavigationBar.setBackgroundColorAsync('transparent');
      // Behavior: Die Leiste wird versteckt und erscheint nur bei Swipe
      NavigationBar.setBehaviorAsync('overlay-swipe');
      // Navigationsleiste komplett verstecken
      NavigationBar.setVisibilityAsync('hidden');
      // Button-Style (falls sichtbar): 'light' oder 'dark'
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <iframe
        src="https://mtg-price-guess-frontend.vercel.app"
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title="WebView"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* StatusBar auch verstecken für echtes Fullscreen */}
      <StatusBar hidden={true} />
      
      <WebView
        source={{ uri: 'https://mtg-price-guess-frontend.vercel.app' }}
        style={styles.webview}
        // Wichtig für Edge-to-Edge
        contentInsetAdjustmentBehavior="automatic"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e', // Passend zu deinem App-Hintergrund
  },
  webview: {
    flex: 1,
  },
});