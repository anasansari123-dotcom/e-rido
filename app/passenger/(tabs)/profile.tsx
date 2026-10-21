import { View } from 'react-native';

import { formatPhone } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors } from '../../../src/theme';
import { AppText, Avatar, KeyValue, Page, SessionActions, Surface } from '../../../src/ui';

export default function PassengerProfile() {
  const { user, logout } = useStore();
  if (!user) return null;

  return (
    <Page>
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <Avatar name={user.name} size={72} />
        <AppText size={24} weight="extra" style={{ marginTop: 12 }}>
          {user.name}
        </AppText>
        <View style={{ marginTop: 8, backgroundColor: colors.mint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <AppText size={12} weight="bold" color={colors.greenDark}>
            Passenger
          </AppText>
        </View>
      </View>

      <Surface style={{ marginBottom: 12 }}>
        <KeyValue label="Phone" value={user.phone ? formatPhone(user.phone) : 'Not added'} />
        <KeyValue label="Email" value={user.email} />
        <KeyValue label="Payment" value="Cash" />
      </Surface>

      <SessionActions onLogout={logout} />
    </Page>
  );
}
