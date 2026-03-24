import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as NavigationBar from 'expo-navigation-bar';

// Pretend to be Chrome so Google doesn't block OAuth in WebView
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setVisibilityAsync('hidden');
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
      <StatusBar hidden={true} />
      <WebView
        source={{ uri: 'https://mtg-price-guess-frontend.vercel.app' }}
        style={styles.webview}
        contentInsetAdjustmentBehavior="automatic"
        userAgent={CHROME_USER_AGENT}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  webview: {
    flex: 1,
  },
});
