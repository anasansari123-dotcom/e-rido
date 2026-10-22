import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { firstName, formatWhen, greeting, inr, passengerHeadline } from '../../../src/data';
import { RealMap } from '../../../src/real-map';
import { useStore } from '../../../src/store';
import { colors, shadow } from '../../../src/theme';
import type { Ride } from '../../../src/types';
import { AppText, Avatar, Banner, PulseDot, SectionLabel, StatusPill, Wordmark } from '../../../src/ui';
import { useCurrentLocation } from '../../../src/use-current-location';

// Real places from the Delhi list, labelled by what they are rather than pretending to be "Home".
const popular: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'rajiv', label: 'Rajiv Chowk', icon: 'train-outline' },
  { id: 'cp', label: 'CP', icon: 'business-outline' },
  { id: 'khan', label: 'Khan Market', icon: 'basket-outline' },
  { id: 'aiims', label: 'AIIMS', icon: 'medkit-outline' },
];

// Unique recent drops that have coordinates, newest first, so "Ride again" can prefill the booking.
function recentDrops(rides: Ride[]) {
  const seen = new Set<string>();
  return rides
    .filter((ride) => ride.status === 'completed' && ride.dropLat !== undefined && ride.dropLng !== undefined)
    .filter((ride) => {
      const key = ride.drop.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

export default function PassengerHome() {
  const router = useRouter();
  const { user, activePassengerRide, passengerRides, refreshRides } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const { place: currentLocation, error: locationError } = useCurrentLocation(true);
  if (!user) return null;

  const again = recentDrops(passengerRides);

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
        {locationError ? <Banner message={locationError} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark size={22} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push('/passenger/profile')}
          >
            <Avatar name={user.name} />
          </Pressable>
        </View>

        <AppText color={colors.muted} style={{ marginTop: 22 }}>
          {greeting()},
        </AppText>
        <AppText size={30} weight="extra" style={{ letterSpacing: -0.6 }}>
          {firstName(user.name)}
        </AppText>

        {activePassengerRide ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/passenger/tracking', params: { id: activePassengerRide.id } })}
            style={({ pressed }) => ({
              marginTop: 18,
              backgroundColor: colors.goldSoft,
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <PulseDot />
            <View style={{ flex: 1 }}>
              <AppText weight="bold">{passengerHeadline(activePassengerRide.status)}</AppText>
              <AppText size={13} color={colors.inkSoft} numberOfLines={1} style={{ marginTop: 2 }}>
                {activePassengerRide.pickup} → {activePassengerRide.drop}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <StatusPill status={activePassengerRide.status} />
                <AppText size={13} weight="bold">
                  {inr(activePassengerRide.fare)}
                </AppText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldDark} />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Book a ride. Where to?"
          onPress={() => router.push('/passenger/book')}
          style={({ pressed }) => ({
            marginTop: 18,
            backgroundColor: colors.greenDark,
            borderRadius: 24,
            padding: 14,
            opacity: pressed ? 0.94 : 1,
            ...shadow,
          })}
        >
          <View pointerEvents="none">
            <RealMap
              current={
                currentLocation
                  ? { latitude: currentLocation.lat, longitude: currentLocation.lng, title: currentLocation.name }
                  : undefined
              }
              height={150}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginLeft: 2 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold }} />
            <AppText size={12} weight="semibold" color="rgba(255,255,255,0.8)" numberOfLines={1} style={{ flex: 1 }}>
              {currentLocation ? `Pickup: ${currentLocation.name}` : 'Finding your location…'}
            </AppText>
          </View>
          <View
            style={{
              marginTop: 10,
              height: 54,
              borderRadius: 16,
              backgroundColor: colors.white,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="search" size={18} color={colors.green} />
            <AppText weight="bold" style={{ flex: 1 }}>
              Where to?
            </AppText>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-forward" size={17} color={colors.greenDeep} />
            </View>
          </View>
          <AppText size={12} color="rgba(255,255,255,0.7)" style={{ marginTop: 10, marginLeft: 2 }}>
            First ride free · No surge · Pay in cash
          </AppText>
        </Pressable>

        {again.length > 0 ? (
          <>
            <SectionLabel style={{ marginTop: 24 }}>RIDE AGAIN</SectionLabel>
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.line,
                paddingHorizontal: 14,
              }}
            >
              {again.map((ride, index) => (
                <Pressable
                  key={ride.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/passenger/book',
                      params: {
                        dropName: ride.drop,
                        dropArea: ride.dropArea ?? '',
                        dropLat: String(ride.dropLat),
                        dropLng: String(ride.dropLng),
                      },
                    })
                  }
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: index === again.length - 1 ? 0 : 1,
                    borderBottomColor: colors.line,
                    opacity: pressed ? 0.7 : 1,
                  })}
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
                    <Ionicons name="time-outline" size={18} color={colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold" numberOfLines={1}>
                      {ride.drop}
                    </AppText>
                    <AppText size={12} color={colors.muted} numberOfLines={1}>
                      {ride.dropArea || 'Previous drop'} · {formatWhen(ride.createdAt)}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <SectionLabel style={{ marginTop: 24 }}>POPULAR IN DELHI</SectionLabel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {popular.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Ride to ${item.label}`}
              onPress={() => router.push({ pathname: '/passenger/book', params: { drop: item.id } })}
              style={({ pressed }) => ({ width: 76, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 20,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={item.icon} size={22} color={colors.green} />
              </View>
              <AppText size={12} weight="semibold" center numberOfLines={1} style={{ marginTop: 8 }}>
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 24, backgroundColor: colors.greenDeep, borderRadius: 20, padding: 18 }}>
          <AppText size={12} weight="bold" color={colors.gold} style={{ letterSpacing: 0.8 }}>
            WHY ERIDE
          </AppText>
          <AppText size={20} weight="extra" color="#FFFFFF" style={{ marginTop: 8 }}>
            A fair fare, before you sit down.
          </AppText>
          <View style={{ marginTop: 12, gap: 8 }}>
            {[
              ['flash-outline', 'Quiet, zero-emission e-rickshaws'],
              ['pricetag-outline', 'Fare locked at booking, no surge'],
              ['shield-checkmark-outline', 'OTP check before every ride'],
            ].map(([icon, text]) => (
              <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.gold} />
                <AppText size={13} color="rgba(255,255,255,0.82)">
                  {text}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
