import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Component, type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors } from './theme';
import { Button } from './ui';
import type { MapPoint, RealMapProps } from './map-types';
export type { MapPoint } from './map-types';

const isExpoGo = Constants.appOwnership === 'expo';

// iOS falls back to Apple Maps unless the build was configured with a Maps SDK for iOS key.
const googleProvider =
  Platform.OS === 'android' || (Platform.OS === 'ios' && Constants.expoConfig?.extra?.iosGoogleMaps === true);

// Kill switch for every map in the app. Builds without a Maps key still fall back via the check below.
const MAPS_ENABLED = true;

// Google Maps on Android needs the API key baked into a custom/EAS build. Expo Go cannot use our project key.
const mapsUnavailable =
  !MAPS_ENABLED ||
  isExpoGo ||
  (Platform.OS === 'android' && Constants.expoConfig?.extra?.androidGoogleMaps !== true);

function mapsUnavailableMessage() {
  if (isExpoGo) {
    return 'Google Maps needs a custom APK (EAS preview build), not Expo Go. Build with: npx eas-cli build -p android --profile preview';
  }
  if (Platform.OS === 'android' && Constants.expoConfig?.extra?.androidGoogleMaps !== true) {
    return 'Map is not configured in this build. Set GOOGLE_MAPS_ANDROID_API_KEY in EAS (preview/production) and rebuild the Android app.';
  }
  return 'Map is unavailable on this device.';
}

function regionFor(points: MapPoint[]): Region {
  if (points.length === 0) {
    return {
      latitude: 28.6139,
      longitude: 77.209,
      latitudeDelta: 0.09,
      longitudeDelta: 0.09,
    };
  }
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.012),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.012),
  };
}

function NativeMap({
  current,
  pickup,
  drop,
  route,
  selected,
  onSelect,
  onRetry,
}: RealMapProps & { onRetry: () => void }) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const points = [pickup, drop, current, ...(route ?? [])].filter((point): point is MapPoint => Boolean(point));
  const region = regionFor(points);
  const regionKey = `${region.latitude.toFixed(5)},${region.longitude.toFixed(5)},${region.latitudeDelta.toFixed(4)},${region.longitudeDelta.toFixed(4)}`;
  const [initialRegion] = useState(region);

  // Move the existing map instead of remounting it whenever the stops change.
  useEffect(() => {
    if (ready) mapRef.current?.animateToRegion(region, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey, ready]);

  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => setTimedOut(true), 20000);
    return () => clearTimeout(timer);
  }, [loaded]);

  // Coordinates alone are not consent. Never ask for permission from a map view;
  // check the OS grant, including when returning from Android app settings.
  useEffect(() => {
    let active = true;
    let revision = 0;
    const check = async () => {
      const request = ++revision;
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (active && request === revision) setLocationAllowed(permission.granted);
      } catch {
        if (active && request === revision) setLocationAllowed(false);
      }
    };
    void check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
      else {
        revision++;
        setLocationAllowed(false);
      }
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [current]);

  return (
    <>
      <MapView
        ref={mapRef}
        provider={googleProvider ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={Boolean(current) && locationAllowed}
        showsMyLocationButton={Boolean(current) && locationAllowed}
        onMapReady={() => {
          setReady(true);
          if (!googleProvider) setLoaded(true);
        }}
        onMapLoaded={() => setLoaded(true)}
        onPress={onSelect ? (event) => onSelect({ ...event.nativeEvent.coordinate, title: 'Selected location' }) : undefined}
        style={{ width: '100%', height: '100%' }}
      >
        {route && route.length > 1 ? (
          <Polyline coordinates={route} strokeColor={colors.green} strokeWidth={4} />
        ) : null}
        {pickup ? <Marker coordinate={pickup} title={pickup.title ?? 'Pickup'} pinColor={colors.green} /> : null}
        {drop ? <Marker coordinate={drop} title={drop.title ?? 'Drop'} pinColor={colors.gold} /> : null}
        {selected ? <Marker coordinate={selected} title={selected.title ?? 'Selected location'} /> : null}
      </MapView>
      {!loaded ? (
        <View pointerEvents={timedOut ? 'auto' : 'none'} style={styles.overlay}>
          {timedOut ? (
            <MapFailure onRetry={onRetry} />
          ) : (
            <>
              <ActivityIndicator color={colors.green} />
              <Text style={styles.message}>Loading map…</Text>
            </>
          )}
        </View>
      ) : null}
    </>
  );
}

function MapFailure({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.overlay}>
      <Text style={styles.message}>
        Map unavailable. Check internet, then in Google Cloud enable Maps SDK for Android, turn on billing, and add this app package com.mohdanas786.eride with the EAS keystore SHA-1 to the API key.
      </Text>
      <Button label="Retry map" variant="secondary" onPress={onRetry} />
    </View>
  );
}

// JS render failures can be caught here. Native SDK authorization failures are
// not exposed as an onError event by react-native-maps; use the timeout + Logcat.
class MapBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <MapFailure onRetry={this.props.onRetry} /> : this.props.children;
  }
}

export function RealMap({ height = 180, ...props }: RealMapProps) {
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt((value) => value + 1);

  return (
    <View style={{ height, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
      {mapsUnavailable ? (
        <View style={styles.overlay}>
          <Text style={styles.message}>{mapsUnavailableMessage()}</Text>
        </View>
      ) : (
        <MapBoundary key={attempt} onRetry={retry}>
          <NativeMap {...props} onRetry={retry} />
        </MapBoundary>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  message: { color: colors.ink, textAlign: 'center', fontSize: 13 },
});
