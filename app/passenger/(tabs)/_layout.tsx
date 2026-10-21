import { Tabs } from 'expo-router';

import { useTabOptions } from '../../../src/tab-options';
import { TabItem } from '../../../src/ui';

export default function PassengerTabs() {
  const screenOptions = useTabOptions();
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabItem icon="home-outline" activeIcon="home" label="Home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'Rides',
          tabBarIcon: ({ color, focused }) => (
            <TabItem icon="time-outline" activeIcon="time" label="Rides" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabItem icon="person-outline" activeIcon="person" label="Profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
