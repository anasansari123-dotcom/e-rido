import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { driverActionLabel, driverHeadline, firstParam, formatPhone, inr } from '../../src/data';
import { RealMap } from '../../src/real-map';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import {
  AppText,
  Avatar,
  Banner,
  Button,
  callPhone,
  EmptyState,
  Field,
  IconAction,
  openDirections,
  Page,
  RouteSummary,
  ScreenHeader,
  Surface,
} from '../../src/ui';
import { useCurrentLocation } from '../../src/use-current-location';

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
  const { place: currentLocation, error: locationError } = useCurrentLocation(true);
  const action = ride ? driverActionLabel(ride.status) : null;
  const passengerPhone = ride?.passengerPhone;
  // Navigate to the pickup until the ride starts, then to the drop.
  const target =
    !ride || ride.status === 'completed' || ride.status === 'cancelled'
      ? null
      : ride.status === 'ongoing'
        ? ride.dropLat !== undefined && ride.dropLng !== undefined
          ? { lat: ride.dropLat, lng: ride.dropLng }
          : null
        : ride.pickupLat !== undefined && ride.pickupLng !== undefined
          ? { lat: ride.pickupLat, lng: ride.pickupLng }
          : null;

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
            loading={pending}
            disabled={ride.status === 'arriving' && otp.length !== 4}
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
      {locationError ? <Banner message={locationError} /> : null}
      <Surface style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={ride.passengerName} size={48} />
        <View style={{ flex: 1 }}>
          <AppText size={12} color={colors.muted}>
            Passenger
          </AppText>
          <AppText size={18} weight="extra" numberOfLines={1}>
            {ride.passengerName}
          </AppText>
          <AppText size={13} color={colors.muted}>
            {passengerPhone ? formatPhone(passengerPhone) : 'Phone not provided'}
          </AppText>
        </View>
        {passengerPhone && ride.status !== 'completed' ? (
          <IconAction icon="call" label="Call" tone="light" onPress={() => callPhone(passengerPhone)} />
        ) : null}
        {target ? (
          <IconAction
            icon="navigate"
            label={ride.status === 'ongoing' ? 'To drop' : 'To pickup'}
            onPress={() => openDirections(target.lat, target.lng)}
          />
        ) : null}
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
      {ride.pickupLat !== undefined &&
      ride.pickupLng !== undefined &&
      ride.dropLat !== undefined &&
      ride.dropLng !== undefined ? (
        <View style={{ marginBottom: 14 }}>
          <RealMap
            current={
              currentLocation
                ? { latitude: currentLocation.lat, longitude: currentLocation.lng, title: currentLocation.name }
                : undefined
            }
            pickup={{ latitude: ride.pickupLat, longitude: ride.pickupLng, title: ride.pickup }}
            drop={{ latitude: ride.dropLat, longitude: ride.dropLng, title: ride.drop }}
            height={220}
          />
        </View>
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
