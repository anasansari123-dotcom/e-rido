import { Redirect, Stack } from 'expo-router';

import { useStore } from '../../src/store';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  const { user, ready } = useStore();
  if (!ready) return null;
  if (user) return <Redirect href={user.role === 'driver' ? '/driver' : '/passenger'} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.paper },
      }}
    />
  );
}
