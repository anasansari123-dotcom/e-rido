import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { firstParam, inr, places, quoteBetween } from '../../src/data';
import { useStore } from '../../src/store';
import { colors, font } from '../../src/theme';
import { AppText, Banner, Button, Page, ScreenHeader } from '../../src/ui';
import type { Place } from '../../src/types';

const connaught = places.find((place) => place.id === 'cp') ?? places[0];

export default function BookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ drop?: string }>();
  const { bookRide, activePassengerRide, passengerRides } = useStore();
  const preset = places.find((place) => place.id === firstParam(params.drop)) ?? null;
  const [pickup, setPickup] = useState<Place | null>(connaught);
  const [drop, setDrop] = useState<Place | null>(preset);
  const [pickupText, setPickupText] = useState(connaught.name);
  const [dropText, setDropText] = useState(preset?.name ?? '');
  const [active, setActive] = useState<'pickup' | 'drop' | null>(preset ? null : 'drop');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const match = places.find((place) => place.id === firstParam(params.drop));
    if (!match) return;
    setDrop(match);
    setDropText(match.name);
    setActive(null);
  }, [params.drop]);

  const samePlace = Boolean(pickup && drop && pickup.id === drop.id);
  const quote = pickup && drop && !samePlace ? quoteBetween(pickup, drop) : null;
  const query = (active === 'pickup' ? pickupText : dropText).trim().toLowerCase();
  const recent =
    active === 'drop' && !query
      ? [...new Set(passengerRides.map((ride) => ride.drop))]
          .map((name) => places.find((place) => place.name === name))
          .filter((place): place is Place => Boolean(place && place.id !== pickup?.id))
          .slice(0, 3)
      : [];
  const recentIds = new Set(recent.map((place) => place.id));
  const suggestions = active
    ? places
        .filter((place) => {
          if (active === 'pickup' && drop?.id === place.id) return false;
          if (active === 'drop' && pickup?.id === place.id) return false;
          if (recentIds.has(place.id)) return false;
          if (!query) return true;
          return place.name.toLowerCase().includes(query) || place.area.toLowerCase().includes(query);
        })
        .slice(0, 6)
    : [];

  function updateStop(kind: 'pickup' | 'drop', text: string) {
    setActive(kind);
    setMessage('');
    const match = places.find((place) => place.name.toLowerCase() === text.trim().toLowerCase());
    if (kind === 'pickup') {
      setPickupText(text);
      setPickup(match ?? null);
    } else {
      setDropText(text);
      setDrop(match ?? null);
    }
  }

  function choose(place: Place) {
    if (active === 'pickup') {
      setPickup(place);
      setPickupText(place.name);
      setActive(drop ? null : 'drop');
    } else {
      setDrop(place);
      setDropText(place.name);
      setActive(pickup ? null : 'pickup');
    }
    setMessage('');
  }

  function swap() {
    setPickup(drop);
    setDrop(pickup);
    setPickupText(drop?.name ?? '');
    setDropText(pickup?.name ?? '');
  }

  async function confirm() {
    if (!quote || !pickup || !drop || submitting) return;
    setSubmitting(true);
    const result = await bookRide({
      pickup: pickup.name,
      pickupArea: pickup.area,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      drop: drop.name,
      dropArea: drop.area,
      dropLat: drop.lat,
      dropLng: drop.lng,
      fare: quote.fare,
      distanceKm: quote.distanceKm,
      minutes: quote.minutes,
    });
    setSubmitting(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    router.replace({ pathname: '/passenger/tracking', params: { id: result.ride.id } });
  }

  return (
    <Page
      bottomInset={!quote}
      footer={
        quote ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: colors.mint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="rickshaw" size={24} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="bold">E-Rickshaw</AppText>
                <AppText size={12} color={colors.muted}>
                  {quote.distanceKm.toFixed(1)} km · {quote.minutes} min
                </AppText>
              </View>
              <AppText size={22} weight="extra">
                {inr(quote.fare)}
              </AppText>
            </View>
            <AppText size={12} color={colors.muted}>
              Pay the driver in cash when you arrive.
            </AppText>
            <Button label="Confirm e-rickshaw" onPress={confirm} disabled={submitting} />
          </>
        ) : undefined
      }
    >
      <ScreenHeader title="Plan your ride" subtitle="Delhi demo routes, fare shown first." fallback="/passenger" />
      {activePassengerRide ? (
        <Banner tone="info" message="You already have a ride in progress. Finish or cancel it before booking another." />
      ) : null}
      {message ? <Banner message={message} /> : null}
      {samePlace ? <Banner message="Pickup and drop should be different places." /> : null}

      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 12,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 18 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green }} />
          <View style={{ width: 2, height: 42, backgroundColor: colors.line, marginVertical: 4 }} />
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.gold }} />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <StopInput
            value={pickupText}
            placeholder="Pickup"
            active={active === 'pickup'}
            onFocus={() => setActive('pickup')}
            onChangeText={(text) => updateStop('pickup', text)}
          />
          <StopInput
            value={dropText}
            placeholder="Where to?"
            active={active === 'drop'}
            onFocus={() => setActive('drop')}
            onChangeText={(text) => updateStop('drop', text)}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={swap} style={{ alignSelf: 'center', padding: 8 }}>
          <Ionicons name="swap-vertical" size={20} color={colors.green} />
        </Pressable>
      </View>

      {active && recent.length > 0 ? (
        <View style={{ marginTop: 18 }}>
          <AppText size={12} weight="bold" color={colors.muted} style={{ letterSpacing: 0.8, marginBottom: 8 }}>
            RECENT
          </AppText>
          {recent.map((place) => (
            <PlaceRow key={place.id} place={place} onPress={() => choose(place)} />
          ))}
        </View>
      ) : null}

      {active ? (
        <View style={{ marginTop: 18 }}>
          <AppText size={12} weight="bold" color={colors.muted} style={{ letterSpacing: 0.8, marginBottom: 8 }}>
            PLACES
          </AppText>
          {suggestions.length === 0 ? (
            <AppText color={colors.muted}>No matching place in this Delhi demo.</AppText>
          ) : (
            suggestions.map((place) => <PlaceRow key={place.id} place={place} onPress={() => choose(place)} />)
          )}
        </View>
      ) : null}
    </Page>
  );
}

function StopInput({
  value,
  placeholder,
  active,
  onChangeText,
  onFocus,
}: {
  value: string;
  placeholder: string;
  active: boolean;
  onChangeText: (value: string) => void;
  onFocus: () => void;
}) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      onChangeText={onChangeText}
      onFocus={onFocus}
      selectionColor={colors.green}
      style={{
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: colors.paper,
        borderWidth: 1.5,
        borderColor: active ? colors.green : 'transparent',
        fontFamily: font.semibold,
        fontSize: 15,
        color: colors.ink,
        ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
      }}
    />
  );
}

function PlaceRow({ place, onPress }: { place: Place; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.mint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="location-outline" size={16} color={colors.green} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="semibold">{place.name}</AppText>
        <AppText size={12} color={colors.muted}>
          {place.area}
        </AppText>
      </View>
    </Pressable>
  );
}
