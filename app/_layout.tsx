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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, Text, useWindowDimensions, View } from 'react-native';

import { StoreProvider, useStore } from '../src/store';
import { colors } from '../src/theme';
import { Mark } from '../src/ui';
import { supabaseConfigError } from '../utils/supabase';

function Boot() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.greenDeep, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Mark size={72} />
      <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>eRide</Text>
    </View>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < 560) {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#07140F', alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 390,
          height: Math.min(height - 48, 860),
          borderRadius: 36,
          overflow: 'hidden',
          borderWidth: 10,
          borderColor: '#12352C',
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
  const booting = !fontsReady || !ready;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={booting || pathname === '/welcome' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
      {booting ? (
        <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
          <Boot />
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? '#07140F' : colors.paper }}>
      <StoreProvider>
        <Frame>
          <RootNavigator fontsReady={fontsLoaded || Boolean(fontError)} />
        </Frame>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
