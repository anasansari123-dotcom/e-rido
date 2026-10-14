import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DEMO_DRIVER, firstParam, passengerHeadline, rideSteps } from '../../src/data';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import { AppText, Avatar, Button, EmptyState, Page, PulseDot, RouteSummary, ScreenHeader, Surface } from '../../src/ui';
import type { RideStatus } from '../../src/types';

const order: RideStatus[] = ['requested', 'accepted', 'arriving', 'ongoing', 'completed'];

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user, rideById, activePassengerRide, cancelRide } = useStore();
  const id = firstParam(params.id);
  const found = id ? rideById(id) : activePassengerRide;
  const ride = found && user && found.passengerPhone === user.phone ? found : null;
  const [confirming, setConfirming] = useState(false);
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

  const current = order.indexOf(ride.status);
  const rating = ride.driverPhone === DEMO_DRIVER.phone ? '4.9' : 'New';

  return (
    <Page bottomInset>
      <ScreenHeader title="Trip" subtitle={passengerHeadline(ride.status)} fallback="/passenger" />

      {ride.status === 'completed' || ride.status === 'cancelled' ? (
        <Surface style={{ alignItems: 'center', marginBottom: 14 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: ride.status === 'completed' ? colors.mint : colors.dangerSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={ride.status === 'completed' ? 'checkmark-circle' : 'close'}
              size={32}
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
        <Surface style={{ marginBottom: 14 }}>
          {ride.status === 'requested' ? (
            <View style={{ marginBottom: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PulseDot />
                <AppText weight="semibold">Checking nearby e-rickshaws</AppText>
              </View>
              <AppText size={13} color={colors.muted}>
                Log out and open the service provider demo to accept this trip.
              </AppText>
            </View>
          ) : null}
          {rideSteps.map((step, index) => {
            const state = index < current ? 'done' : index === current ? 'now' : 'wait';
            return (
              <View key={step.status} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 18, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      marginTop: 4,
                      backgroundColor: state === 'wait' ? colors.line : state === 'now' ? colors.gold : colors.green,
                    }}
                  />
                  {index < rideSteps.length - 1 ? (
                    <View
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 28,
                        marginVertical: 4,
                        backgroundColor: index < current ? colors.green : colors.line,
                      }}
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: 14 }}>
                  <AppText weight="semibold" color={state === 'wait' ? colors.muted : colors.ink}>
                    {step.title}
                  </AppText>
                  <AppText size={13} color={colors.muted}>
                    {step.body}
                  </AppText>
                </View>
              </View>
            );
          })}
        </Surface>
      )}

      {ride.driverName ? (
        <Surface style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar name={ride.driverName} />
          <View style={{ flex: 1 }}>
            <AppText weight="bold">{ride.driverName}</AppText>
            <AppText size={13} color={colors.muted}>
              {ride.vehicleModel} · {ride.vehicleNumber}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={14} color={colors.gold} />
              <AppText weight="bold">{rating}</AppText>
            </View>
            <AppText size={12} color={colors.muted}>
              Provider
            </AppText>
          </View>
        </Surface>
      ) : null}

      {ride.status === 'accepted' || ride.status === 'arriving' || ride.status === 'ongoing' ? (
        <View style={{ backgroundColor: colors.goldSoft, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 14 }}>
          <AppText size={12} weight="bold" color="#8A6410">
            TRIP OTP
          </AppText>
          <AppText size={32} weight="extra" style={{ letterSpacing: 6, marginTop: 4 }}>
            {ride.otp}
          </AppText>
          <AppText size={12} color={colors.inkSoft} center style={{ marginTop: 4 }}>
            Share this with your driver before the ride starts.
          </AppText>
        </View>
      ) : null}

      <RouteSummary ride={ride} />

      {canCancel ? (
        <View style={{ marginTop: 16 }}>
          {confirming ? (
            <View style={{ gap: 8 }}>
              <AppText center weight="semibold">
                Cancel this ride?
              </AppText>
              <Button label="Yes, cancel" variant="danger" onPress={() => cancelRide(ride.id)} />
              <Button label="Keep ride" variant="ghost" onPress={() => setConfirming(false)} />
            </View>
          ) : (
            <Button label="Cancel ride" variant="ghost" onPress={() => setConfirming(true)} />
          )}
        </View>
      ) : null}

      {ride.status === 'completed' || ride.status === 'cancelled' ? (
        <View style={{ marginTop: 16 }}>
          <Button label="Book another ride" onPress={() => router.replace('/passenger/book')} />
        </View>
      ) : null}
    </Page>
  );
}
