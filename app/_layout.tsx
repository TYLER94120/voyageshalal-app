import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AdhanScheduler } from '@/components/AdhanScheduler';
import { NextPrayerBanner } from '@/components/NextPrayerBanner';
import { PrayerProvider } from '@/context/PrayerContext';
import { configureNotificationHandler } from '@/lib/notifications';
import { Brand } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
    configureNotificationHandler();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PrayerProvider>
          <View style={{ flex: 1, backgroundColor: Brand.night }}>
            {/* Reprogrammation des rappels d'adhan au lancement / premier plan */}
            <AdhanScheduler />
            {/* Bandeau « prochaine prière » permanent, au-dessus de toute l'app */}
            <NextPrayerBanner />
            <View style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="ville/[slug]" options={{ headerShown: true }} />
                <Stack.Screen name="qibla" options={{ headerShown: true }} />
                <Stack.Screen name="adhan" options={{ headerShown: true }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </View>
          </View>
        </PrayerProvider>
      </ThemeProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
