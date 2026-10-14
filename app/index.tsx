import { Redirect } from 'expo-router';

import { useStore } from '../src/store';

export default function Index() {
  const { user, ready } = useStore();
  if (!ready) return null;
  if (!user) return <Redirect href="/welcome" />;
  return <Redirect href={user.role === 'driver' ? '/driver' : '/passenger'} />;
}
