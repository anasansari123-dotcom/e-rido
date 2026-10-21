import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  ink: '#082846',
  inkSoft: '#34516B',
  muted: '#71869A',
  line: '#DCE7F0',
  paper: '#F4F8FC',
  white: '#FFFFFF',
  navy: '#063F78',
  navyDark: '#042D58',
  blue: '#079BE5',
  blueSoft: '#E7F5FD',
  green: '#00A84F',
  greenDark: '#063F78',
  greenDeep: '#042D58',
  mint: '#E7F8EE',
  gold: '#FFAA00',
  goldDark: '#8A5A00',
  goldSoft: '#FFF4D9',
  danger: '#EF2435',
  dangerSoft: '#FDEBED',
};

export const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extra: 'PlusJakartaSans_800ExtraBold',
};

export const shadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#063F78',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  android: {
    elevation: 4,
  },
  default: {
    shadowColor: '#063F78',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
}) as ViewStyle;
