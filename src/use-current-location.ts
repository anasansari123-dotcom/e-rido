import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
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

export function useCurrentLocation(auto = false) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const locate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Location permission is required to use your current pickup.');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      let address: Location.LocationGeocodedAddress | undefined;
      if (Platform.OS !== 'web') {
        try {
          [address] = await Location.reverseGeocodeAsync(position.coords);
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
      setError('Could not get your GPS location. Turn on location services and try again.');
      return null;
    } finally {
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

  return { place, loading, error, locate };
}
