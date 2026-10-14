import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { formatPhone } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors } from '../../../src/theme';
import { AppText, Avatar, KeyValue, Page, SessionActions, Surface } from '../../../src/ui';

const saved = [
  { id: 'lajpat', label: 'Home', value: 'Lajpat Nagar' },
  { id: 'nehru', label: 'Work', value: 'Nehru Place' },
];

export default function PassengerProfile() {
  const router = useRouter();
  const { user, logout, resetDemo } = useStore();
  if (!user) return null;

  return (
    <Page>
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <Avatar name={user.name} size={72} />
        <AppText size={24} weight="extra" style={{ marginTop: 12 }}>
          {user.name}
        </AppText>
        <View style={{ marginTop: 8, backgroundColor: colors.mint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <AppText size={12} weight="bold" color={colors.greenDark}>
            Passenger
          </AppText>
        </View>
      </View>

      <Surface style={{ marginBottom: 12 }}>
        <KeyValue label="Phone" value={formatPhone(user.phone)} />
        <KeyValue label="Email" value={user.email} />
        <KeyValue label="Payment" value="Cash" />
      </Surface>

      <AppText size={12} weight="bold" color={colors.muted} style={{ letterSpacing: 0.8, marginBottom: 10 }}>
        SAVED PLACES
      </AppText>
      <View style={{ gap: 10, marginBottom: 12 }}>
        {saved.map((place) => (
          <Pressable
            key={place.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/passenger/book', params: { drop: place.id } })}
          >
            <Surface style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <AppText size={12} color={colors.muted}>
                  {place.label}
                </AppText>
                <AppText weight="semibold">{place.value}</AppText>
              </View>
              <AppText weight="bold" color={colors.green}>
                Ride
              </AppText>
            </Surface>
          </Pressable>
        ))}
      </View>

      <Surface>
        <AppText weight="bold">About this demo</AppText>
        <AppText size={13} color={colors.muted} style={{ marginTop: 6 }}>
          Rides, fares, and accounts stay on this phone. There is no live driver network or payment.
        </AppText>
      </Surface>

      <SessionActions onLogout={logout} onReset={resetDemo} />
    </Page>
  );
}
