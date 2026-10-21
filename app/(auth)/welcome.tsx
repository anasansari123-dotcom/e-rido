import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../src/theme';
import { AppText, Button, Wordmark } from '../../src/ui';

const points = [
  { value: 'Live', label: 'Ride tracking' },
  { value: '₹30', label: 'Fares from' },
  { value: 'Local', label: 'Nagar rides' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.navyDark }}>
      <LinearGradient colors={[colors.navyDark, colors.navy, '#087DB8']} style={{ flex: 1 }}>
        <View
          style={{
            position: 'absolute',
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: 'rgba(0,168,79,0.22)',
            top: -70,
            right: -65,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: 'rgba(255,170,0,0.18)',
            bottom: 65,
            left: -60,
          }}
        />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 52 }}>
            <Wordmark light size={32} />
            <AppText
              size={38}
              weight="extra"
              color="#FFFFFF"
              style={{ marginTop: 22, letterSpacing: -1 }}
            >
              Apna Nagar.{'\n'}Apni Ride.
            </AppText>
            <AppText color="rgba(255,255,255,0.78)" style={{ marginTop: 10 }}>
              Real-time e-rickshaw booking for passengers and local service providers.
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
              {points.map((point) => (
                <View
                  key={point.label}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.14)',
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                  }}
                >
                  <AppText color="#FFFFFF" weight="extra" size={15} center>
                    {point.value}
                  </AppText>
                  <AppText color="rgba(255,255,255,0.72)" size={11} center>
                    {point.label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
      <View
        style={{
          marginTop: -28,
          backgroundColor: colors.paper,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 20,
          paddingTop: 22,
          paddingBottom: Math.max(insets.bottom, 18),
          gap: 10,
        }}
      >
        <Button label="Get started" onPress={() => router.push({ pathname: '/role', params: { intent: 'signup' } })} />
        <Button
          label="I already have an account"
          variant="secondary"
          onPress={() => router.push({ pathname: '/role', params: { intent: 'login' } })}
        />
      </View>
    </View>
  );
}
