import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { driverActionLabel, driverHeadline, firstParam, inr } from '../../src/data';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import { AppText, Button, EmptyState, Page, RouteSummary, ScreenHeader, Surface } from '../../src/ui';

export default function TripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user, rideById, activeDriverRide, advanceRide } = useStore();
  const id = firstParam(params.id);
  const found = id ? rideById(id) : activeDriverRide;
  const ride = found && user && found.driverPhone === user.phone ? found : null;
  const [pending, setPending] = useState(false);
  const action = ride ? driverActionLabel(ride.status) : null;

  useEffect(() => {
    setPending(false);
  }, [ride?.status]);

  if (!ride) {
    return (
      <Page bottomInset>
        <ScreenHeader title="Trip" fallback="/driver" />
        <EmptyState title="No trip open" body="Accept a request to start a ride." action={<Button label="View requests" onPress={() => router.replace('/driver/requests')} />} />
      </Page>
    );
  }

  return (
    <Page
      bottomInset={!action && ride.status !== 'completed'}
      footer={
        action ? (
          <Button
            label={action}
            disabled={pending}
            onPress={() => {
              setPending(true);
              advanceRide(ride.id);
            }}
          />
        ) : ride.status === 'completed' ? (
          <Button label="Back to dashboard" onPress={() => router.replace('/driver')} />
        ) : undefined
      }
    >
      <ScreenHeader title={ride.passengerName} subtitle={driverHeadline(ride.status)} fallback="/driver" />
      <Surface style={{ marginBottom: 14 }}>
        <AppText size={12} color={colors.muted}>
          Passenger
        </AppText>
        <AppText size={20} weight="extra" style={{ marginTop: 2 }}>
          {ride.passengerName}
        </AppText>
        <AppText color={colors.muted} style={{ marginTop: 4 }}>
          Ask for the OTP before you start the ride.
        </AppText>
      </Surface>
      <View style={{ backgroundColor: colors.goldSoft, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 14 }}>
        <AppText size={12} weight="bold" color="#8A6410">
          TRIP OTP
        </AppText>
        <AppText size={32} weight="extra" style={{ letterSpacing: 6, marginTop: 4 }}>
          {ride.otp}
        </AppText>
      </View>
      <RouteSummary ride={ride} />
      {ride.status === 'completed' ? (
        <AppText center color={colors.muted} style={{ marginTop: 14 }}>
          Collect {inr(ride.fare)} in cash from the passenger.
        </AppText>
      ) : null}
    </Page>
  );
}
