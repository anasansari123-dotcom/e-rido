import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../src/theme';
import { AppText, Button, Wordmark } from '../../src/ui';

const points = [
  { value: '4 min', label: 'Typical pickup' },
  { value: '₹30', label: 'Fares from' },
  { value: 'None', label: 'Surge pricing' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.greenDeep }}>
      <LinearGradient colors={['#041C17', '#0B4F40', '#12856C']} style={{ flex: 1 }}>
        <View
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: 'rgba(255,255,255,0.05)',
            top: -60,
            right: -50,
          }}
        />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 52 }}>
            <Wordmark light size={28} />
            <AppText
              size={36}
              weight="extra"
              color="#FFFFFF"
              style={{ marginTop: 22, letterSpacing: -1 }}
            >
              The city, by e-rickshaw.
            </AppText>
            <AppText color="rgba(255,255,255,0.78)" style={{ marginTop: 10 }}>
              Book a quiet electric ride across Delhi, or go online and earn.
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
              {points.map((point) => (
                <View
                  key={point.label}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 14,
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
        <AppText center size={12} color={colors.muted} style={{ marginTop: 4 }}>
          Demo only. No real trips or payments.
        </AppText>
      </View>
    </View>
  );
}
