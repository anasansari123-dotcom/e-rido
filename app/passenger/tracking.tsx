import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { firstParam, formatWhen, passengerHeadline, rideSteps } from '../../src/data';
import { RealMap } from '../../src/real-map';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import type { RideStatus } from '../../src/types';
import {
  AppText,
  Avatar,
  Banner,
  Button,
  callPhone,
  EmptyState,
  IconAction,
  Page,
  PulseDot,
  RouteSummary,
  ScreenHeader,
  Surface,
} from '../../src/ui';

const order: RideStatus[] = ['requested', 'accepted', 'arriving', 'ongoing', 'completed'];

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user, rideById, activePassengerRide, cancelRide, refreshRides } = useStore();
  const id = firstParam(params.id);
  const found = id ? rideById(id) : activePassengerRide;
  const ride =
    found && user && (found.passengerId === user.id || (!found.passengerId && found.passengerPhone === user.phone))
      ? found
      : null;
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const canCancel = ride?.status === 'requested' || ride?.status === 'accepted';

  if (!ride) {
    return (
      <Page bottomInset>
        <ScreenHeader title="Your ride" fallback="/passenger" />
        <EmptyState
          title="Ride not available"
          body="This trip is not on your account."
          action={<Button label="Book a ride" onPress={() => router.replace('/passenger/book')} />}
        />
      </Page>
    );
  }

  const finished = ride.status === 'completed' || ride.status === 'cancelled';
  const showOtp = ride.status === 'accepted' || ride.status === 'arriving';
  const current = order.indexOf(ride.status);
  const driverPhone = ride.driverPhone;
  const { pickupLat, pickupLng, dropLat, dropLng } = ride;

  return (
    <Page
      bottomInset
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        setMessage('');
        const result = await refreshRides();
        setRefreshing(false);
        if (!result.ok) setMessage(result.error);
      }}
    >
      <ScreenHeader
        title={finished ? 'Trip summary' : 'Your ride'}
        subtitle={ride.updatedAt ? `Updated ${formatWhen(ride.updatedAt)}` : formatWhen(ride.createdAt)}
        fallback="/passenger"
      />
      {message ? <Banner message={message} /> : null}

      {finished ? (
        <Surface style={{ alignItems: 'center', marginBottom: 14, paddingVertical: 22 }}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: ride.status === 'completed' ? colors.mint : colors.dangerSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={ride.status === 'completed' ? 'checkmark' : 'close'}
              size={34}
              color={ride.status === 'completed' ? colors.green : colors.danger}
            />
          </View>
          <AppText size={20} weight="extra" style={{ marginTop: 12 }}>
            {passengerHeadline(ride.status)}
          </AppText>
          <AppText center color={colors.muted} style={{ marginTop: 4 }}>
            {ride.status === 'completed' ? 'Paid in cash to your driver.' : 'You can book another e-rickshaw anytime.'}
          </AppText>
        </Surface>
      ) : (
        <>
          {pickupLat !== undefined && pickupLng !== undefined && dropLat !== undefined && dropLng !== undefined ? (
            <View style={{ marginBottom: 14 }}>
              <RealMap
                pickup={{ latitude: pickupLat, longitude: pickupLng, title: ride.pickup }}
                drop={{ latitude: dropLat, longitude: dropLng, title: ride.drop }}
                height={220}
              />
            </View>
          ) : null}

          <Surface style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <PulseDot color={ride.status === 'requested' ? colors.gold : colors.green} />
              <AppText size={18} weight="extra" style={{ flex: 1 }}>
                {passengerHeadline(ride.status)}
              </AppText>
            </View>
            {ride.status === 'requested' ? (
              <AppText size={13} color={colors.muted} style={{ marginTop: 6 }}>
                Keep this screen open. Driver details appear here as soon as someone accepts.
              </AppText>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
              {rideSteps.map((step, index) => (
                <View
                  key={step.status}
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: index < current ? colors.green : index === current ? colors.gold : colors.line,
                  }}
                />
              ))}
            </View>
            <AppText size={12} color={colors.muted} style={{ marginTop: 8 }}>
              {rideSteps[Math.min(current, rideSteps.length - 1)]?.body}
            </AppText>
          </Surface>
        </>
      )}

      {showOtp ? (
        <View
          style={{
            backgroundColor: colors.goldSoft,
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View style={{ flex: 1 }}>
          <AppText size={12} weight="bold" color={colors.goldDark} style={{ letterSpacing: 0.8 }}>
              TRIP OTP
            </AppText>
            <AppText size={12} color={colors.inkSoft} style={{ marginTop: 2 }}>
              Share with your driver to start the ride.
            </AppText>
          </View>
          <View
            accessible
            accessibilityLabel={`Trip OTP ${ride.otp.split('').join(' ')}`}
            style={{ flexDirection: 'row', gap: 6 }}
          >
            {ride.otp.split('').map((digit, index) => (
              <View
                key={index}
                style={{
                  width: 36,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText size={22} weight="extra">
                  {digit}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {ride.driverName ? (
        <Surface style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={ride.driverName} size={50} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <AppText weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {ride.driverName}
                </AppText>
                <Ionicons name="shield-checkmark" size={15} color={colors.green} />
              </View>
              <AppText size={13} color={colors.muted} numberOfLines={1}>
                {ride.vehicleModel ?? 'E-Rickshaw'}
              </AppText>
              {ride.vehicleNumber ? <NumberPlate value={ride.vehicleNumber} /> : null}
            </View>
            {driverPhone && !finished ? (
              <IconAction icon="call" label="Call" onPress={() => callPhone(driverPhone)} />
            ) : null}
          </View>
        </Surface>
      ) : null}

      <RouteSummary ride={ride} />

      {canCancel ? (
        <View style={{ marginTop: 16 }}>
          {confirming ? (
            <Surface style={{ gap: 8 }}>
              <AppText center weight="bold">
                Cancel this ride?
              </AppText>
              <AppText center size={13} color={colors.muted}>
                {ride.status === 'accepted' ? 'Your driver is already on the way.' : 'We will stop looking for a driver.'}
              </AppText>
              <Button
                label={cancelling ? 'Cancelling…' : 'Yes, cancel'}
                variant="danger"
                loading={cancelling}
                onPress={async () => {
                  setCancelling(true);
                  setMessage('');
                  const result = await cancelRide(ride.id);
                  setCancelling(false);
                  if (!result.ok) {
                    setMessage(result.error);
                    return;
                  }
                  setConfirming(false);
                }}
              />
              <Button label="Keep ride" variant="ghost" onPress={() => setConfirming(false)} />
            </Surface>
          ) : (
            <Button label="Cancel ride" variant="ghost" onPress={() => setConfirming(true)} />
          )}
        </View>
      ) : null}

      {finished ? (
        <View style={{ marginTop: 16 }}>
          <Button label="Book another ride" onPress={() => router.replace('/passenger/book')} />
        </View>
      ) : null}
    </Page>
  );
}

function NumberPlate({ value }: { value: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        marginTop: 6,
        borderWidth: 1.5,
        borderColor: colors.ink,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: '#FFFDF5',
      }}
    >
      <AppText size={13} weight="extra" style={{ letterSpacing: 1 }}>
        {value}
      </AppText>
    </View>
  );
}
