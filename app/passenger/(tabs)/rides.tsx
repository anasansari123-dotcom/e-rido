import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isPassengerOpen } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors } from '../../../src/theme';
import { AppText, Button, EmptyState, Page, RideRow } from '../../../src/ui';

export default function PassengerRides() {
  const router = useRouter();
  const { passengerRides } = useStore();
  const active = passengerRides.filter((ride) => isPassengerOpen(ride.status));
  const past = passengerRides.filter((ride) => !isPassengerOpen(ride.status));

  return (
    <Page>
      <AppText size={30} weight="extra">
        Your rides
      </AppText>
      <AppText color={colors.muted} style={{ marginTop: 4, marginBottom: 18 }}>
        Active trips and earlier e-rickshaw rides.
      </AppText>
      {passengerRides.length === 0 ? (
        <EmptyState
          title="No rides yet"
          body="Book an e-rickshaw and it will show up here."
          action={<Button label="Book a ride" onPress={() => router.push('/passenger/book')} />}
        />
      ) : (
        <View>
          {active.length > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <AppText size={12} weight="bold" color={colors.muted} style={{ letterSpacing: 0.8, marginBottom: 10 }}>
                ACTIVE
              </AppText>
              {active.map((ride) => (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  onPress={() => router.push({ pathname: '/passenger/tracking', params: { id: ride.id } })}
                />
              ))}
            </View>
          ) : null}
          {past.length > 0 ? (
            <View>
              <AppText size={12} weight="bold" color={colors.muted} style={{ letterSpacing: 0.8, marginBottom: 10 }}>
                EARLIER
              </AppText>
              {past.map((ride) => (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  onPress={() => router.push({ pathname: '/passenger/tracking', params: { id: ride.id } })}
                />
              ))}
            </View>
          ) : null}
        </View>
      )}
    </Page>
  );
}
