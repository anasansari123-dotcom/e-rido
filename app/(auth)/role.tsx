import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { firstParam } from '../../src/data';
import { colors } from '../../src/theme';
import { AppText, Page, ScreenHeader } from '../../src/ui';
import type { Role } from '../../src/types';

const options: {
  role: Role;
  title: string;
  body: string;
  icon: 'person' | 'rickshaw';
}[] = [
  {
    role: 'passenger',
    title: 'Passenger',
    body: 'Book a nearby e-rickshaw and see the fare before you ride.',
    icon: 'person',
  },
  {
    role: 'driver',
    title: 'Service provider',
    body: 'Go online, accept e-rickshaw trips, and track what you earn.',
    icon: 'rickshaw',
  },
];

export default function RoleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ intent?: string }>();
  const intent = firstParam(params.intent) === 'login' ? 'login' : 'signup';

  return (
    <Page bottomInset>
      <ScreenHeader
        title={intent === 'login' ? 'Sign in as' : 'Join eRide as'}
        subtitle="Pick the side of the ride you want."
        fallback="/welcome"
      />
      <View style={{ gap: 12 }}>
        {options.map((option) => (
          <Pressable
            key={option.role}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: intent === 'login' ? '/login' : '/signup',
                params: { role: option.role },
              })
            }
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              backgroundColor: colors.white,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.line,
              padding: 16,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: option.role === 'driver' ? colors.goldSoft : colors.mint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {option.icon === 'rickshaw' ? (
                <MaterialCommunityIcons name="rickshaw" size={26} color={colors.greenDark} />
              ) : (
                <Ionicons name="person" size={24} color={colors.greenDark} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={18} weight="extra">
                {option.title}
              </AppText>
              <AppText size={13} color={colors.muted} style={{ marginTop: 4 }}>
                {option.body}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.green} />
          </Pressable>
        ))}
      </View>
      <AppText size={13} color={colors.muted} style={{ marginTop: 18 }}>
        Demo accounts are filled in on the sign-in screen. You can switch roles anytime by logging out.
      </AppText>
    </Page>
  );
}
