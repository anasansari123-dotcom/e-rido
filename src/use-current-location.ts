import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { Place } from './types';

function addressParts(address: Location.LocationGeocodedAddress | undefined) {
  if (!address) return { name: 'Current location', area: 'GPS location' };
  const name = address.name || address.street || address.district || 'Current location';
  const area =
    [address.district, address.city, address.subregion, address.region]
      .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
      .join(', ') || 'GPS location';
  return { name, area };
}

async function withTimeout<T>(request: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Location request timed out')), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function useCurrentLocation(auto = false) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const inFlight = useRef(false);

  const locate = useCallback(async () => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setLoading(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setCanAskAgain(permission.canAskAgain);
      if (permission.status !== 'granted') {
        setPlace(null);
        setError(permission.canAskAgain
          ? 'Location access was declined. You can still browse the map without your position.'
          : 'Location access is disabled. Enable it in app settings to show your position.');
        return null;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setPlace(null);
        setError('Location services are off. Turn them on and try again. The map is still available.');
        return null;
      }

      const position = await withTimeout(Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }), 20000);
      let address: Location.LocationGeocodedAddress | undefined;
      if (Platform.OS !== 'web') {
        try {
          [address] = await withTimeout(Location.reverseGeocodeAsync(position.coords), 5000);
        } catch {
          address = undefined;
        }
      }
      const label = addressParts(address);
      const current: Place = {
        id: 'current-location',
        name: label.name,
        area: label.area,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setPlace(current);
      return current;
    } catch {
      setPlace(null);
      setError('Could not get your GPS location. Turn on location services and try again.');
      return null;
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(() => {
      void locate();
    }, 0);
    return () => clearTimeout(timer);
  }, [auto, locate]);

  return { place, loading, error, canAskAgain, locate };
}
