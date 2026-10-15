import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { firstName, formatWhen, greeting, inr, nearbyDrivers, passengerHeadline } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors, shadow } from '../../../src/theme';
import { AppText, Avatar, Banner, CityMap, Wordmark } from '../../../src/ui';

const shortcuts: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'lajpat', label: 'Home', icon: 'home-outline' },
  { id: 'nehru', label: 'Work', icon: 'briefcase-outline' },
  { id: 'rajiv', label: 'Metro', icon: 'train-outline' },
  { id: 'sarojini', label: 'Market', icon: 'basket-outline' },
];

export default function PassengerHome() {
  const router = useRouter();
  const { user, activePassengerRide, refreshRides } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  if (!user) return null;

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
          <Pressable accessibilityRole="button" onPress={() => router.push('/passenger/profile')}>
            <Avatar name={user.name} />
          </Pressable>
        </View>

        <AppText color={colors.muted} style={{ marginTop: 22 }}>
          {greeting()}
        </AppText>
        <AppText size={30} weight="extra" style={{ letterSpacing: -0.6 }}>
          {firstName(user.name)}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Ionicons name="location" size={16} color={colors.green} />
          <AppText size={13} weight="semibold" color={colors.inkSoft}>
            Connaught Place, Delhi
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/passenger/book')}
          style={({ pressed }) => ({
            marginTop: 20,
            backgroundColor: colors.greenDark,
            borderRadius: 24,
            padding: 14,
            opacity: pressed ? 0.94 : 1,
            ...shadow,
          })}
        >
          <CityMap />
          <View
            style={{
              marginTop: 12,
              height: 52,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.12)',
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="search" size={18} color="#FFFFFF" />
            <AppText color="rgba(255,255,255,0.88)" weight="semibold" style={{ flex: 1 }}>
              Where to?
            </AppText>
            <Ionicons name="arrow-forward" size={18} color={colors.gold} />
          </View>
          <AppText size={12} color="rgba(255,255,255,0.7)" style={{ marginTop: 10, marginLeft: 4 }}>
            Fares from ₹30 · e-rickshaw only
          </AppText>
        </Pressable>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
          {shortcuts.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/passenger/book', params: { drop: item.id } })}
              style={{ width: 72, alignItems: 'center' }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={item.icon} size={22} color={colors.green} />
              </View>
              <AppText size={12} weight="semibold" center style={{ marginTop: 8 }}>
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {activePassengerRide ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/passenger/tracking', params: { id: activePassengerRide.id } })}
            style={{
              marginTop: 18,
              backgroundColor: colors.white,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.line,
              borderLeftWidth: 4,
              borderLeftColor: colors.gold,
              padding: 14,
            }}
          >
            <AppText size={12} weight="bold" color={colors.gold}>
              RIDE IN PROGRESS
            </AppText>
            <AppText weight="bold" style={{ marginTop: 4 }}>
              {passengerHeadline(activePassengerRide.status)}
            </AppText>
            <AppText size={13} color={colors.muted} style={{ marginTop: 2 }}>
              {activePassengerRide.pickup} to {activePassengerRide.drop} · {inr(activePassengerRide.fare)}
            </AppText>
          </Pressable>
        ) : null}

        <AppText size={12} weight="bold" color={colors.muted} style={{ letterSpacing: 0.8, marginTop: 26, marginBottom: 10 }}>
          AROUND YOU
        </AppText>
        <View style={{ backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14 }}>
          {nearbyDrivers.map((driver, index) => (
            <View
              key={driver.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: index === nearbyDrivers.length - 1 ? 0 : 1,
                borderBottomColor: colors.line,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: colors.mint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="flash" size={16} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold">{driver.name}</AppText>
                <AppText size={12} color={colors.muted}>
                  {driver.vehicle} · {driver.trips.toLocaleString('en-IN')} trips
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText weight="bold">{driver.eta} min</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <AppText size={12} color={colors.muted}>
                    {driver.rating.toFixed(2)}
                  </AppText>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 16, backgroundColor: colors.greenDeep, borderRadius: 20, padding: 18 }}>
          <AppText size={12} weight="bold" color={colors.gold} style={{ letterSpacing: 0.8 }}>
            WHY ERIDE
          </AppText>
          <AppText size={20} weight="extra" color="#FFFFFF" style={{ marginTop: 8 }}>
            A fair fare, before you sit down.
          </AppText>
          <AppText color="rgba(255,255,255,0.75)" style={{ marginTop: 6 }}>
            E-rickshaws only. No surge. Pay the driver in cash at the end of the ride.
          </AppText>
          {activePassengerRide ? (
            <AppText size={12} color="rgba(255,255,255,0.6)" style={{ marginTop: 10 }}>
              Last update {formatWhen(activePassengerRide.createdAt)}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
