import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { firstName, greeting, inr, statusMeta } from '../../../src/data';
import { RealMap } from '../../../src/real-map';
import { useStore } from '../../../src/store';
import { colors, shadow } from '../../../src/theme';
import { AppText, Banner, Wordmark } from '../../../src/ui';
import { useCurrentLocation } from '../../../src/use-current-location';

export default function DriverHome() {
  const router = useRouter();
  const { user, online, setOnline, driverRides, activeDriverRide, incoming, refreshRides } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const { place: currentLocation, error: locationError } = useCurrentLocation(true);
  if (!user) return null;

  const today = driverRides.filter(
    (ride) => ride.status === 'completed' && new Date(ride.createdAt).toDateString() === new Date().toDateString(),
  );
  const earned = today.reduce((sum, ride) => sum + ride.fare, 0);
  const allTrips = driverRides.filter((ride) => ride.status === 'completed').length;
  const stats = [
    { label: 'Earned today', value: inr(earned) },
    { label: 'Trips today', value: String(today.length) },
    { label: 'All trips', value: String(allTrips) },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              setMessage('');
              const result = await refreshRides();
              setRefreshing(false);
              if (!result.ok) setMessage(result.error);
            }}
            colors={[colors.green]}
            tintColor={colors.green}
            progressBackgroundColor={colors.white}
          />
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
      >
        {message ? <Banner message={message} /> : null}
        {!user.verified ? (
          <Banner message="Submit documents on the MTUK Nagar Ride website if you have not already. Pickup stays locked until admin verification." />
        ) : null}
        {locationError ? <Banner message={locationError} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark size={22} />
          <View style={{ backgroundColor: user.verified ? colors.mint : colors.goldSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <AppText size={12} weight="bold" color={user.verified ? colors.greenDark : colors.goldDark}>
              {user.verified ? 'Verified' : 'In review'}
            </AppText>
          </View>
        </View>
        <AppText color={colors.muted} style={{ marginTop: 22 }}>
          {greeting()}
        </AppText>
        <AppText size={30} weight="extra" style={{ letterSpacing: -0.6 }}>
          {firstName(user.name)}
        </AppText>
        <AppText size={13} color={colors.inkSoft} style={{ marginTop: 4 }}>
          {user.vehicleNumber ?? 'Vehicle pending'} · {user.vehicleModel ?? 'E-Rickshaw'}
        </AppText>

        <View style={{ marginTop: 20, backgroundColor: colors.greenDark, borderRadius: 24, padding: 16, ...shadow }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <AppText color="#FFFFFF" size={20} weight="extra">
                {online ? 'You are online' : 'You are offline'}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <Ionicons name="location" size={13} color={colors.gold} />
                <AppText size={13} color="rgba(255,255,255,0.75)" numberOfLines={1} style={{ flex: 1 }}>
                  {currentLocation ? `${currentLocation.name}, ${currentLocation.area}` : 'Finding your location…'}
                </AppText>
              </View>
            </View>
            <Switch
              accessibilityLabel={online ? 'Go offline' : 'Go online'}
              value={online}
              onValueChange={setOnline}
              disabled={!user.verified}
              trackColor={{ false: '#D5DEE7', true: colors.green }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={{ opacity: online ? 1 : 0.4 }}>
            <View pointerEvents="none">
              <RealMap
                current={
                  currentLocation
                    ? { latitude: currentLocation.lat, longitude: currentLocation.lng, title: currentLocation.name }
                    : undefined
                }
                height={156}
              />
            </View>
          </View>
          <AppText size={13} color="rgba(255,255,255,0.78)" style={{ marginTop: 12 }}>
            {!user.verified
              ? 'Documents are in review. You can go online after MTUK approves your partner application.'
              : online
                ? 'Riders nearby can request you.'
                : 'You are hidden. Go online to receive requests.'}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.line,
                padding: 12,
              }}
            >
              <AppText size={12} color={colors.muted}>
                {stat.label}
              </AppText>
              <AppText weight="extra" size={18} style={{ marginTop: 4 }}>
                {stat.value}
              </AppText>
            </View>
          ))}
        </View>

        {activeDriverRide ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/driver/trip', params: { id: activeDriverRide.id } })}
            style={{
              marginTop: 16,
              backgroundColor: colors.white,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.line,
              borderLeftWidth: 4,
              borderLeftColor: colors.green,
              padding: 14,
            }}
          >
            <AppText size={12} weight="bold" color={colors.green}>
              CURRENT TRIP
            </AppText>
            <AppText weight="bold" style={{ marginTop: 4 }}>
              {activeDriverRide.passengerName}
            </AppText>
            <AppText size={13} color={colors.muted}>
              {activeDriverRide.pickup} to {activeDriverRide.drop}
            </AppText>
            <AppText size={13} weight="semibold" style={{ marginTop: 6 }}>
              {statusMeta[activeDriverRide.status].label} · {inr(activeDriverRide.fare)}
            </AppText>
          </Pressable>
        ) : null}

        {online && !activeDriverRide && incoming.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/driver/requests')}
            style={({ pressed }) => ({
              marginTop: 16,
              backgroundColor: colors.gold,
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.9 : 1,
              ...shadow,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.greenDeep,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText size={18} weight="extra" color={colors.gold}>
                {incoming.length}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="extra" color={colors.greenDeep}>
                New ride {incoming.length === 1 ? 'request' : 'requests'}
              </AppText>
              <AppText size={13} color={colors.greenDark}>
                Tap to see pickup, drop and fare.
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.greenDeep} />
          </Pressable>
        ) : null}

        <View style={{ marginTop: 16, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16 }}>
          <AppText weight="bold">Before you start</AppText>
          <AppText size={13} color={colors.muted} style={{ marginTop: 6 }}>
            Ask the passenger for the trip OTP, then mark arrived, start, and complete. Cash is collected at the drop.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
