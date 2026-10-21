import { Tabs } from 'expo-router';

import { useStore } from '../../../src/store';
import { useTabOptions } from '../../../src/tab-options';
import { colors } from '../../../src/theme';
import { TabItem } from '../../../src/ui';

export default function DriverTabs() {
  const { incoming, online } = useStore();
  const screenOptions = useTabOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabItem
              icon="speedometer-outline"
              activeIcon="speedometer"
              label="Home"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarBadge: online && incoming.length > 0 ? incoming.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.gold, color: colors.greenDeep },
          tabBarIcon: ({ color, focused }) => (
            <TabItem icon="list-outline" activeIcon="list" label="Requests" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <TabItem icon="wallet-outline" activeIcon="wallet" label="Earnings" color={color} focused={focused} />
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
