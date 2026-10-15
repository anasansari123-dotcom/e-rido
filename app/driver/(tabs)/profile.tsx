import { formatPhone } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors } from '../../../src/theme';
import { AppText, Avatar, KeyValue, Page, SessionActions, Surface } from '../../../src/ui';
import { View } from 'react-native';

export default function DriverProfile() {
  const { user, logout, resetDemo, online } = useStore();
  if (!user) return null;

  return (
    <Page>
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <Avatar name={user.name} size={72} />
        <AppText size={24} weight="extra" style={{ marginTop: 12 }}>
          {user.name}
        </AppText>
        <View style={{ marginTop: 8, backgroundColor: colors.goldSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <AppText size={12} weight="bold" color="#8A6410">
            Service provider
          </AppText>
        </View>
      </View>

      <Surface style={{ marginBottom: 12 }}>
        <KeyValue label="Phone" value={formatPhone(user.phone)} />
        <KeyValue label="Email" value={user.email} />
        <KeyValue label="Status" value={online ? 'Online' : 'Offline'} />
        <KeyValue label="Rating" value={user.verified ? '4.9' : 'New'} />
      </Surface>

      <AppText size={12} weight="bold" color={colors.muted} style={{ letterSpacing: 0.8, marginBottom: 10 }}>
        VEHICLE
      </AppText>
      <Surface style={{ marginBottom: 12 }}>
        <KeyValue label="Number" value={user.vehicleNumber ?? 'Not added'} />
        <KeyValue label="Model" value={user.vehicleModel ?? 'E-Rickshaw'} />
        <KeyValue label="Documents" value={user.verified ? 'Verified' : 'Pending review'} />
      </Surface>

      <Surface>
        <AppText weight="bold">About this demo</AppText>
        <AppText size={13} color={colors.muted} style={{ marginTop: 6 }}>
          Your name, phone, email, and vehicle are saved to your account. Requests and earnings stay on this phone.
        </AppText>
      </Surface>

      <SessionActions onLogout={logout} onReset={resetDemo} />
    </Page>
  );
}
