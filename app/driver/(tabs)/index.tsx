import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { firstName, greeting, inr, statusMeta } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors, shadow } from '../../../src/theme';
import { AppText, Banner, CityMap, Wordmark } from '../../../src/ui';

export default function DriverHome() {
  const router = useRouter();
  const { user, online, setOnline, driverRides, activeDriverRide, incoming, refreshRides } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  if (!user) return null;

  const today = driverRides.filter(
    (ride) => ride.status === 'completed' && new Date(ride.createdAt).toDateString() === new Date().toDateString(),
  );
  const earned = today.reduce((sum, ride) => sum + ride.fare, 0);
  const stats = [
    { label: 'Today', value: inr(earned) },
    { label: 'Trips', value: String(today.length) },
    { label: 'Rating', value: user.verified ? '4.9' : 'New' },
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark size={22} />
          <View style={{ backgroundColor: user.verified ? colors.mint : colors.goldSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <AppText size={12} weight="bold" color={user.verified ? colors.greenDark : '#8A6410'}>
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
              <AppText size={13} color="rgba(255,255,255,0.72)" style={{ marginTop: 2 }}>
                Central Delhi
              </AppText>
            </View>
            <Switch
              value={online}
              onValueChange={setOnline}
              trackColor={{ false: '#D5DDD8', true: '#1F9A78' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={{ opacity: online ? 1 : 0.4 }}>
            <CityMap />
          </View>
          <AppText size={13} color="rgba(255,255,255,0.78)" style={{ marginTop: 12 }}>
            {online ? 'Riders nearby can request you.' : 'You are hidden. Go online to receive requests.'}
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
            style={{
              marginTop: 16,
              backgroundColor: colors.goldSoft,
              borderRadius: 18,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Ionicons name="notifications" size={20} color="#8A6410" />
            <View style={{ flex: 1 }}>
              <AppText weight="bold">{incoming.length} ride {incoming.length === 1 ? 'request' : 'requests'}</AppText>
              <AppText size={13} color={colors.inkSoft}>
                Review pickup, drop, and fare.
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8A6410" />
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
