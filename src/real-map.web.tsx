import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from './ui';
import { colors } from './theme';
import type { RealMapProps } from './map-types';
export type { MapPoint } from './map-types';

export function RealMap({
  current,
  pickup,
  drop,
  selected,
  height = 180,
}: RealMapProps) {
  const focus = selected ?? pickup ?? current ?? drop;
  return (
    <View
      style={{
        height,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.mint,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
    >
      <Ionicons name="location" size={30} color={colors.green} />
      <AppText weight="bold" style={{ marginTop: 8 }}>
        {focus?.title ?? 'Map preview'}
      </AppText>
      <AppText size={13} color={colors.muted} center style={{ marginTop: 4 }}>
        {focus
          ? `${focus.latitude.toFixed(5)}, ${focus.longitude.toFixed(5)}`
          : 'Allow location access to show your coordinates.'}
      </AppText>
      {drop ? (
        <AppText size={12} color={colors.inkSoft} center style={{ marginTop: 8 }}>
          Drop: {drop.title}
        </AppText>
      ) : null}
      <AppText size={12} color={colors.inkSoft} center style={{ marginTop: 8 }}>
        Open the Android app for Google Maps and tap-to-select.
      </AppText>
    </View>
  );
}
