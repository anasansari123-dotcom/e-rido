import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { firstParam, inr, places, quoteBetween } from '../../src/data';
import { decodePolyline } from '../../src/polyline';
import { RealMap } from '../../src/real-map';
import { useStore } from '../../src/store';
import { colors, font } from '../../src/theme';
import { AppText, Banner, Button, Page, ScreenHeader } from '../../src/ui';
import type { Place } from '../../src/types';
import { useCurrentLocation } from '../../src/use-current-location';
import {
  getPlaceDetails,
  getRouteQuote,
  newPlacesSession,
  searchRealPlaces,
  type PlaceSuggestion,
  type RouteQuote,
} from '../../utils/api';

const connaught = places.find((place) => place.id === 'cp') ?? places[0];

type Choice = Place | PlaceSuggestion;

function isSuggestion(choice: Choice): choice is PlaceSuggestion {
  return 'placeId' in choice;
}

// A drop passed in from the home screen: a known Delhi place id, or a previous ride's drop ("Ride again").
function presetDrop(params: {
  drop?: string | string[];
  dropName?: string | string[];
  dropArea?: string | string[];
  dropLat?: string | string[];
  dropLng?: string | string[];
}): Place | null {
  const known = places.find((place) => place.id === firstParam(params.drop));
  if (known) return known;
  const name = firstParam(params.dropName);
  const lat = Number(firstParam(params.dropLat));
  const lng = Number(firstParam(params.dropLng));
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { id: `again-${lat},${lng}`, name, area: firstParam(params.dropArea) ?? '', lat, lng };
}

function routeKey(pickup: Place, drop: Place) {
  return `${pickup.lat},${pickup.lng}>${drop.lat},${drop.lng}`;
}

function currentPickupText(place: Place) {
  const detail = place.name === 'Current location' ? place.area : place.name;
  return `Current location · ${detail}`;
}

export default function BookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    drop?: string;
    dropName?: string;
    dropArea?: string;
    dropLat?: string;
    dropLng?: string;
  }>();
  const { bookRide, activePassengerRide, passengerRides } = useStore();
  const preset = presetDrop(params);
  const [pickup, setPickup] = useState<Place | null>(connaught);
  const [drop, setDrop] = useState<Place | null>(preset);
  const [pickupText, setPickupText] = useState(connaught.name);
  const [dropText, setDropText] = useState(preset?.name ?? '');
  const [active, setActive] = useState<'pickup' | 'drop' | null>(preset ? null : 'drop');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placeSearch, setPlaceSearch] = useState<{ query: string; places: PlaceSuggestion[] }>({
    query: '',
    places: [],
  });
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placesSession, setPlacesSession] = useState(newPlacesSession);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [route, setRoute] = useState<{ key: string; quote: RouteQuote | null }>({ key: '', quote: null });
  const [pickupEdited, setPickupEdited] = useState(false);
  const { place: currentLocation, loading: locating, error: locationError, locate } = useCurrentLocation(true);

  const { drop: dropParam, dropName, dropArea, dropLat, dropLng } = params;
  useEffect(() => {
    const match = presetDrop({ drop: dropParam, dropName, dropArea, dropLat, dropLng });
    if (!match) return;
    const timer = setTimeout(() => {
      setDrop(match);
      setDropText(match.name);
      setActive(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [dropParam, dropName, dropArea, dropLat, dropLng]);

  useEffect(() => {
    if (!currentLocation || pickupEdited) return;
    const timer = setTimeout(() => {
      setPickup(currentLocation);
      setPickupText(currentPickupText(currentLocation));
    }, 0);
    return () => clearTimeout(timer);
  }, [currentLocation, pickupEdited]);

  const samePlace = Boolean(pickup && drop && pickup.id === drop.id);
  const currentKey = pickup && drop && !samePlace ? routeKey(pickup, drop) : '';
  const estimate = pickup && drop && !samePlace ? quoteBetween(pickup, drop) : null;
  // Show the Routes API fare once it arrives; the straight-line estimate is only a fallback.
  const quoting = Boolean(currentKey) && route.key !== currentKey;
  const quote = route.key === currentKey && route.quote ? route.quote : estimate;
  const routePath = useMemo(
    () => (route.key === currentKey && route.quote?.polyline ? decodePolyline(route.quote.polyline) : undefined),
    [currentKey, route],
  );

  useEffect(() => {
    if (!pickup || !drop || !currentKey) return;
    let cancelled = false;
    getRouteQuote(pickup, drop).then((result) => {
      if (!cancelled) setRoute({ key: currentKey, quote: result.ok ? result.data.quote : null });
    });
    return () => {
      cancelled = true;
    };
  }, [currentKey, drop, pickup]);

  const query = (active === 'pickup' ? pickupText : dropText).trim().toLowerCase();
  const nearLat = currentLocation?.lat;
  const nearLng = currentLocation?.lng;
  useEffect(() => {
    if (!active || query.length < 3) return;
    let cancelled = false;
    const near = nearLat !== undefined && nearLng !== undefined ? { lat: nearLat, lng: nearLng } : undefined;
    const timer = setTimeout(() => {
      setSearchingPlaces(true);
      searchRealPlaces(query, placesSession, near)
        .then((result) => {
          if (!cancelled && result.ok) setPlaceSearch({ query, places: result.data.suggestions });
        })
        .finally(() => {
          if (!cancelled) setSearchingPlaces(false);
        });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, nearLat, nearLng, placesSession, query]);
  const recent =
    active === 'drop' && !query
      ? [...new Set(passengerRides.map((ride) => ride.drop))]
          .map((name) => places.find((place) => place.name === name))
          .filter((place): place is Place => Boolean(place && place.id !== pickup?.id))
          .slice(0, 3)
      : [];
  const recentIds = new Set(recent.map((place) => place.id));
  const localSuggestions = active
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
  const remoteSuggestions = placeSearch.query === query ? placeSearch.places : [];
  const suggestions: Choice[] = [
    ...remoteSuggestions,
    ...localSuggestions.filter(
      (local) =>
        !remoteSuggestions.some(
          (remote) =>
            remote.name.toLowerCase() === local.name.toLowerCase() &&
            remote.area.toLowerCase() === local.area.toLowerCase(),
        ),
    ),
  ].slice(0, 6);

  function updateStop(kind: 'pickup' | 'drop', text: string) {
    setActive(kind);
    setMessage('');
    const match = places.find((place) => place.name.toLowerCase() === text.trim().toLowerCase());
    if (kind === 'pickup') {
      setPickupEdited(true);
      setPickupText(text);
      setPickup(match ?? null);
    } else {
      setDropText(text);
      setDrop(match ?? null);
    }
  }

  async function choose(choice: Choice) {
    if (resolvingPlace) return;
    const kind = active;
    let place: Place;
    if (isSuggestion(choice)) {
      setResolvingPlace(true);
      const result = await getPlaceDetails(choice, placesSession);
      setResolvingPlace(false);
      // The session ends with this Place Details call; start a fresh one for the next search.
      setPlacesSession(newPlacesSession());
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      place = result.data;
    } else {
      place = choice;
    }
    if (kind === 'pickup') {
      setPickupEdited(true);
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
    setPickupEdited(true);
    setPickup(drop);
    setDrop(pickup);
    setPickupText(drop?.name ?? '');
    setDropText(pickup?.name ?? '');
  }

  async function useCurrentPickup() {
    const current = currentLocation ?? (await locate());
    if (!current) return;
    setPickupEdited(false);
    setPickup(current);
    setPickupText(currentPickupText(current));
    setActive(drop ? null : 'drop');
    setMessage('');
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
              {quoting
                ? 'Checking the road route…'
                : route.quote?.source === 'route'
                  ? 'Fare from the road route. Pay the driver in cash when you arrive.'
                  : 'Pay the driver in cash when you arrive.'}
            </AppText>
            <Button
              label={submitting ? 'Booking…' : `Confirm · ${inr(quote.fare)}`}
              onPress={confirm}
              loading={submitting}
              disabled={quoting}
            />
          </>
        ) : undefined
      }
    >
      <ScreenHeader title="Plan your ride" subtitle="Live GPS pickup with upfront fare." fallback="/passenger" />
      {activePassengerRide ? (
        <Banner tone="info" message="You already have a ride in progress. Finish or cancel it before booking another." />
      ) : null}
      {message ? <Banner message={message} /> : null}
      {locationError ? <Banner message={locationError} /> : null}
      {samePlace ? <Banner message="Pickup and drop should be different places." /> : null}

      <View style={{ marginBottom: 14 }}>
        <RealMap
          current={
            currentLocation
              ? { latitude: currentLocation.lat, longitude: currentLocation.lng, title: currentLocation.name }
              : undefined
          }
          pickup={pickup ? { latitude: pickup.lat, longitude: pickup.lng, title: pickup.name } : undefined}
          drop={drop ? { latitude: drop.lat, longitude: drop.lng, title: drop.name } : undefined}
          route={routePath}
          height={190}
        />
      </View>

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
      <Pressable
        accessibilityRole="button"
        disabled={locating}
        onPress={useCurrentPickup}
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          paddingVertical: 10,
          paddingHorizontal: 4,
          opacity: locating ? 0.55 : 1,
        }}
      >
        <Ionicons name="navigate" size={17} color={colors.green} />
        <AppText size={13} weight="bold" color={colors.green}>
          {locating ? 'Finding your location…' : 'Use my current location'}
        </AppText>
      </Pressable>
      {pickup?.id === 'current-location' ? (
        <AppText size={12} color={colors.muted} style={{ marginTop: -4, marginBottom: 4, marginLeft: 4 }}>
          GPS pickup: {pickup.name}, {pickup.area}
        </AppText>
      ) : null}

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
            {searchingPlaces || resolvingPlace ? 'SEARCHING GOOGLE MAPS…' : 'PLACES'}
          </AppText>
          {suggestions.length === 0 ? (
            <AppText color={colors.muted}>
              {searchingPlaces ? 'Finding real places…' : 'Type at least 3 letters to search Google Maps.'}
            </AppText>
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

function PlaceRow({ place, onPress }: { place: Choice; onPress: () => void }) {
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
