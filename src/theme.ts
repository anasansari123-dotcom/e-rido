import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  ink: '#12211C',
  inkSoft: '#3E534B',
  muted: '#6B7E76',
  line: '#E3EBE6',
  paper: '#F4F1EA',
  white: '#FFFFFF',
  green: '#0E6E58',
  greenDark: '#084538',
  greenDeep: '#062821',
  mint: '#E6F4EE',
  gold: '#E0A11A',
  goldSoft: '#FBF4E0',
  danger: '#C44536',
  dangerSoft: '#FDECEA',
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
    shadowColor: '#12211C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  android: {
    elevation: 3,
  },
  default: {
    shadowColor: '#12211C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
}) as ViewStyle;
