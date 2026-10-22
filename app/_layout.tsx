import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, Text, useWindowDimensions, View } from 'react-native';

import { IntroVideo } from '../src/intro-video';
import { StoreProvider, useStore } from '../src/store';
import { colors } from '../src/theme';
import { supabaseConfigError } from '../utils/supabase';

function Frame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < 560) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.navyDark, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 390,
          height: Math.min(height - 48, 844),
          borderRadius: 36,
          overflow: 'hidden',
          borderWidth: 10,
          borderColor: colors.navy,
          backgroundColor: colors.paper,
        }}
      >
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useStore();
  const pathname = usePathname();
  const [introDone, setIntroDone] = useState(false);
  const booting = !fontsReady || !ready || !introDone;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={booting || pathname === '/welcome' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
      {booting ? (
        <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
          <IntroVideo onFinished={() => setIntroDone(true)} />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (supabaseConfigError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          {supabaseConfigError}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? colors.navyDark : colors.paper }}>
      <StoreProvider>
        <Frame>
          <RootNavigator fontsReady={fontsLoaded || Boolean(fontError)} />
        </Frame>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
