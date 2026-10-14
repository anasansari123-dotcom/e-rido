import { Redirect, Stack } from 'expo-router';

import { useStore } from '../../src/store';
import { colors } from '../../src/theme';

export default function DriverLayout() {
  const { user, ready } = useStore();
  if (!ready) return null;
  if (!user) return <Redirect href="/welcome" />;
  if (user.role !== 'driver') return <Redirect href="/passenger" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />;
}
