import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { NextPrayerBanner } from '@/components/NextPrayerBanner';
import { PrayerProvider } from '@/context/PrayerContext';
import { Brand } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PrayerProvider>
          <View style={{ flex: 1, backgroundColor: Brand.night }}>
            {/* Bandeau « prochaine prière » permanent, au-dessus de toute l'app */}
            <NextPrayerBanner />
            <View style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="ville/[slug]" options={{ headerShown: true }} />
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
