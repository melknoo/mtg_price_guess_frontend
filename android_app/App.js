import { SafeAreaView } from 'react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';



export default function App() {

   if (Platform.OS === 'web') {
    // Im Web einfach iframe benutzen
    return (
      <iframe
        src="https://mtg-price-guess-frontend.vercel.app"
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title="WebView"
      />
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: 'https://mtg-price-guess-frontend.vercel.app' }}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});