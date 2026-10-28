import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Platform, useWindowDimensions } from 'react-native';

import { RealMap } from '../../src/real-map';
import type { MapPoint } from '../../src/map-types';
import { colors } from '../../src/theme';
import { AppText, Banner, Button, Page, ScreenHeader } from '../../src/ui';
import { useCurrentLocation } from '../../src/use-current-location';

export default function PassengerMap() {
  const { height } = useWindowDimensions();
  const { place, loading, error, canAskAgain, locate } = useCurrentLocation();
  const [selected, setSelected] = useState<MapPoint>();
  const [settingsError, setSettingsError] = useState('');

  return (
    <Page>
      <ScreenHeader title="Map" subtitle="Explore the map and select a location." fallback="/passenger" />
      {error ? <Banner message={error} /> : null}
      {settingsError ? <Banner message={settingsError} /> : null}
      <RealMap
        current={place ? { latitude: place.lat, longitude: place.lng, title: place.name } : undefined}
        selected={selected}
        onSelect={setSelected}
        height={Math.max(320, Math.round(height * 0.55))}
      />
      <AppText size={13} color={colors.inkSoft} style={{ marginTop: 12, marginBottom: 16 }}>
        {selected
          ? `Selected: ${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`
          : Platform.OS === 'web' ? 'Use the Android app to select a point on Google Maps.' : 'Tap the map to place a marker. Location access is optional.'}
      </AppText>
      <AppText size={13} color={colors.inkSoft} style={{ marginBottom: 16 }}>
        {place ? `${place.name} · ${place.area}` : loading ? 'Finding your location…' : 'Use my location requests foreground permission to show your position. This screen does not share it with a driver.'}
      </AppText>
      <Button
        label={place ? 'Refresh location' : 'Use my location'}
        variant="secondary"
        loading={loading}
        onPress={() => void locate()}
        icon={<Ionicons name="locate" size={18} color={colors.ink} />}
      />
      {!canAskAgain && Platform.OS !== 'web' ? (
        <Button
          label="Open app settings"
          variant="ghost"
          onPress={() => {
            setSettingsError('');
            void Linking.openSettings().catch(() => setSettingsError('Open your device settings, select this app, then enable Location permission.'));
          }}
        />
      ) : null}
    </Page>
  );
}
