import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { formatWhen, inr } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors } from '../../../src/theme';
import { AppText, Banner, Button, EmptyState, Page, Surface } from '../../../src/ui';

export default function RequestsScreen() {
  const router = useRouter();
  const { incoming, online, setOnline, activeDriverRide, acceptRide, declineRide } = useStore();
  const [message, setMessage] = useState('');

  function onAccept(id: string) {
    const ok = acceptRide(id);
    if (!ok) {
      setMessage(online ? 'Finish your current trip before accepting another.' : 'Go online to accept rides.');
      return;
    }
    router.push({ pathname: '/driver/trip', params: { id } });
  }

  return (
    <Page>
      <AppText size={30} weight="extra">
        Requests
      </AppText>
      <AppText color={colors.muted} style={{ marginTop: 4, marginBottom: 18 }}>
        {online ? 'New e-rickshaw trips near you.' : 'Go online to see nearby requests.'}
      </AppText>
      {message ? <Banner message={message} /> : null}
      {!online ? (
        <EmptyState
          title="You are offline"
          body="Passengers cannot request you until you go online."
          action={<Button label="Go online" onPress={() => setOnline(true)} />}
        />
      ) : incoming.length === 0 ? (
        <EmptyState title="No requests right now" body="Stay online. New trips will appear here." />
      ) : (
        <View style={{ gap: 12 }}>
          {activeDriverRide ? <Banner tone="info" message="Finish the current trip before accepting another." /> : null}
          {incoming.map((ride) => (
            <Surface key={ride.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <AppText weight="bold">{ride.passengerName}</AppText>
                  <AppText size={12} color={colors.muted}>
                    {formatWhen(ride.createdAt)}
                  </AppText>
                </View>
                <AppText size={22} weight="extra">
                  {inr(ride.fare)}
                </AppText>
              </View>
              <View style={{ marginTop: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green, marginTop: 6 }} />
                  <AppText style={{ flex: 1 }}>{ride.pickup}</AppText>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.gold, marginTop: 6 }} />
                  <AppText style={{ flex: 1 }}>{ride.drop}</AppText>
                </View>
              </View>
              <AppText size={13} color={colors.muted} style={{ marginTop: 10, marginBottom: 14 }}>
                {ride.distanceKm.toFixed(1)} km · {ride.minutes} min
              </AppText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Decline" variant="secondary" onPress={() => declineRide(ride.id)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Accept" onPress={() => onAccept(ride.id)} disabled={Boolean(activeDriverRide)} />
                </View>
              </View>
            </Surface>
          ))}
        </View>
      )}
    </Page>
  );
}
