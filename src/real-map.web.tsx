import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from './ui';
import { colors } from './theme';

type MapPoint = {
  latitude: number;
  longitude: number;
  title?: string;
};

export function RealMap({
  current,
  pickup,
  drop,
  height = 180,
}: {
  current?: MapPoint;
  pickup?: MapPoint;
  drop?: MapPoint;
  route?: MapPoint[];
  height?: number;
}) {
  const focus = pickup ?? current ?? drop;
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
        {pickup?.title ?? current?.title ?? 'Live location'}
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
    </View>
  );
}
