import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from './theme';

// Floating tab bar that sits above the home indicator instead of overriding the safe area.
export function useTabOptions() {
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.navy,
    tabBarActiveBackgroundColor: colors.blueSoft,
    tabBarInactiveTintColor: colors.muted,
    tabBarAllowFontScaling: false,
    tabBarShowLabel: false,
    sceneStyle: { backgroundColor: colors.paper },
    tabBarStyle: {
      height: 72,
      marginHorizontal: 14,
      marginBottom: Math.max(insets.bottom + 4, 12),
      paddingTop: 5,
      paddingBottom: 5,
      borderRadius: 22,
      borderTopWidth: 0,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.white,
      ...shadow,
    },
    tabBarItemStyle: {
      borderRadius: 15,
      marginHorizontal: 4,
      marginVertical: 5,
    },
    tabBarIconStyle: { width: '100%' as const, height: 52, flex: 1 },
  };
}
