import React, { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as NavigationBar from 'expo-navigation-bar';

const APP_URL = 'https://mtg-price-guess-frontend.vercel.app';

// Rueckkehr-Scheme aus dem Custom Tab (siehe public/native-oauth.html + app.json "scheme").
const OAUTH_RETURN_URL = 'mtgpriceguess://oauth';

export default function App() {
  const webviewRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  // Google-Login: OAuth laeuft im System-Browser (Chrome Custom Tab), nicht im WebView.
  // Google blockt eingebettete WebViews ("disallowed_useragent"), Custom Tabs gelten
  // als sicherer Browser und werden akzeptiert.
  const handleGoogleLogin = useCallback(async (authUrl) => {
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, OAUTH_RETURN_URL);
      if (result.type !== 'success' || !result.url) return;

      // result.url = mtgpriceguess://oauth#access_token=...
      const hashIndex = result.url.indexOf('#');
      if (hashIndex === -1) return;
      const params = new URLSearchParams(result.url.slice(hashIndex + 1));
      const accessToken = params.get('access_token');
      if (!accessToken) return;

      // Token zurueck in die WebView geben — dort uebernimmt AuthContext den Backend-Austausch.
      const safeToken = JSON.stringify(accessToken);
      webviewRef.current?.injectJavaScript(
        `window.__handleGoogleAccessToken && window.__handleGoogleAccessToken(${safeToken}); true;`
      );
    } catch (err) {
      console.error('Google OAuth failed:', err);
    }
  }, []);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'google-login' && data.url) {
        handleGoogleLogin(data.url);
      }
    } catch (_) {
      // Nicht-JSON-Messages ignorieren.
    }
  }, [handleGoogleLogin]);

  if (Platform.OS === 'web') {
    return (
      <iframe
        src={APP_URL}
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title="WebView"
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <WebView
        ref={webviewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}
        contentInsetAdjustmentBehavior="automatic"
        onMessage={handleMessage}
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
