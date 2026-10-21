import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors } from './theme';

export type MapPoint = {
  latitude: number;
  longitude: number;
  title?: string;
};

// iOS falls back to Apple Maps unless the build was configured with a Maps SDK for iOS key.
const googleProvider =
  Platform.OS === 'android' || (Platform.OS === 'ios' && Constants.expoConfig?.extra?.iosGoogleMaps === true);

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

export function RealMap({
  current,
  pickup,
  drop,
  route,
  height = 180,
}: {
  current?: MapPoint;
  pickup?: MapPoint;
  drop?: MapPoint;
  route?: MapPoint[];
  height?: number;
}) {
  const mapRef = useRef<MapView>(null);
  const points = [pickup, drop, current, ...(route ?? [])].filter((point): point is MapPoint => Boolean(point));
  const region = regionFor(points);
  const regionKey = `${region.latitude.toFixed(5)},${region.longitude.toFixed(5)},${region.latitudeDelta.toFixed(4)}`;
  const [initialRegion] = useState(region);

  // Move the existing map instead of remounting it whenever the stops change.
  useEffect(() => {
    mapRef.current?.animateToRegion(region, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey]);

  return (
    <View style={{ height, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
      <MapView
        ref={mapRef}
        provider={googleProvider ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={Boolean(current)}
        showsMyLocationButton={Boolean(current)}
        style={{ width: '100%', height: '100%' }}
      >
        {route && route.length > 1 ? (
          <Polyline coordinates={route} strokeColor={colors.green} strokeWidth={4} />
        ) : null}
        {pickup ? <Marker coordinate={pickup} title={pickup.title ?? 'Pickup'} pinColor={colors.green} /> : null}
        {drop ? <Marker coordinate={drop} title={drop.title ?? 'Drop'} pinColor={colors.gold} /> : null}
      </MapView>
    </View>
  );
}
