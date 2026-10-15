import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { driverActionLabel, driverHeadline, firstParam, formatPhone, inr } from '../../src/data';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import { AppText, Banner, Button, EmptyState, Field, Page, RouteSummary, ScreenHeader, Surface } from '../../src/ui';

export default function TripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user, rideById, activeDriverRide, advanceRide, refreshRides } = useStore();
  const id = firstParam(params.id);
  const found = id ? rideById(id) : activeDriverRide;
  const ride =
    found && user && (found.driverId === user.id || (!found.driverId && found.driverPhone === user.phone))
      ? found
      : null;
  const [pending, setPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const action = ride ? driverActionLabel(ride.status) : null;

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
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        setMessage('');
        const result = await refreshRides();
        setRefreshing(false);
        if (!result.ok) setMessage(result.error);
      }}
      footer={
        action ? (
          <Button
            label={action}
            disabled={pending}
            onPress={async () => {
              if (ride.status === 'arriving' && otp.length !== 4) {
                setMessage('Enter the 4-digit OTP from the passenger.');
                return;
              }
              setPending(true);
              setMessage('');
              const result = await advanceRide(ride.id, ride.status === 'arriving' ? otp : undefined);
              setPending(false);
              if (!result.ok) setMessage(result.error);
            }}
          />
        ) : ride.status === 'completed' ? (
          <Button label="Back to dashboard" onPress={() => router.replace('/driver')} />
        ) : undefined
      }
    >
      <ScreenHeader title={ride.passengerName} subtitle={driverHeadline(ride.status)} fallback="/driver" />
      {message ? <Banner message={message} /> : null}
      <Surface style={{ marginBottom: 14 }}>
        <AppText size={12} color={colors.muted}>
          Passenger
        </AppText>
        <AppText size={20} weight="extra" style={{ marginTop: 2 }}>
          {ride.passengerName}
        </AppText>
        <AppText color={colors.muted} style={{ marginTop: 4 }}>
          {ride.passengerPhone ? formatPhone(ride.passengerPhone) : 'Phone not provided'}
        </AppText>
      </Surface>
      {ride.status === 'arriving' ? (
        <Surface style={{ marginBottom: 14 }}>
          <AppText weight="bold" style={{ marginBottom: 4 }}>
            Verify passenger
          </AppText>
          <AppText size={13} color={colors.muted} style={{ marginBottom: 12 }}>
            Ask the passenger for their 4-digit trip OTP before starting.
          </AppText>
          <Field
            label="Trip OTP"
            value={otp}
            onChangeText={(value) => setOtp(value.replace(/\D/g, ''))}
            placeholder="4-digit code"
            keyboardType="number-pad"
            maxLength={4}
          />
        </Surface>
      ) : null}
      <RouteSummary ride={ride} />
      {ride.status === 'completed' ? (
        <AppText center color={colors.muted} style={{ marginTop: 14 }}>
          Collect {inr(ride.fare)} in cash from the passenger.
        </AppText>
      ) : null}
    </Page>
  );
}
