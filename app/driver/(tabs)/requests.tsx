import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { formatWhen, inr, kmBetween } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors } from '../../../src/theme';
import type { Ride } from '../../../src/types';
import { AppText, Avatar, Banner, Button, EmptyState, Page, PulseDot, Surface } from '../../../src/ui';
import { useCurrentLocation } from '../../../src/use-current-location';

export default function RequestsScreen() {
  const router = useRouter();
  const { incoming, online, setOnline, activeDriverRide, acceptRide, declineRide, refreshRides } = useStore();
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const { place: here } = useCurrentLocation(true);

  async function onAccept(id: string) {
    if (accepting) return;
    setAccepting(id);
    setMessage('');
    const ok = await acceptRide(id);
    setAccepting(null);
    if (!ok) {
      setMessage(online ? 'That request is no longer available.' : 'Go online to accept rides.');
      return;
    }
    router.push({ pathname: '/driver/trip', params: { id } });
  }

  function awayFromPickup(ride: Ride) {
    if (!here || ride.pickupLat === undefined || ride.pickupLng === undefined) return null;
    const km = kmBetween(here, { lat: ride.pickupLat, lng: ride.pickupLng });
    return km < 1 ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m away` : `${km.toFixed(1)} km away`;
  }

  return (
    <Page
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        setMessage('');
        const result = await refreshRides();
        setRefreshing(false);
        if (!result.ok) setMessage(result.error);
      }}
    >
      <AppText size={30} weight="extra">
        Requests
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 18 }}>
        {online ? <PulseDot color={colors.green} /> : null}
        <AppText color={colors.muted}>
          {online ? 'Listening for new trips near you.' : 'Go online to see nearby requests.'}
        </AppText>
      </View>
      {message ? <Banner message={message} /> : null}
      {!online ? (
        <EmptyState
          title="You are offline"
          body="Passengers cannot request you until you go online."
          action={<Button label="Go online" onPress={() => setOnline(true)} />}
        />
      ) : incoming.length === 0 ? (
        <EmptyState title="No requests right now" body="Stay online. New trips will appear here automatically." />
      ) : (
        <View style={{ gap: 12 }}>
          {activeDriverRide ? <Banner tone="info" message="Finish the current trip before accepting another." /> : null}
          {incoming.map((ride) => {
            const away = awayFromPickup(ride);
            return (
              <Surface key={ride.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar name={ride.passengerName} size={40} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" numberOfLines={1}>
                      {ride.passengerName}
                    </AppText>
                    <AppText size={12} color={colors.muted}>
                      Requested {formatWhen(ride.createdAt).toLowerCase()}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText size={22} weight="extra">
                      {inr(ride.fare)}
                    </AppText>
                    <AppText size={12} color={colors.muted}>
                      Cash
                    </AppText>
                  </View>
                </View>

                {away ? (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 12,
                      backgroundColor: colors.mint,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Ionicons name="navigate" size={12} color={colors.greenDark} />
                    <AppText size={12} weight="bold" color={colors.greenDark}>
                      Pickup {away}
                    </AppText>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                  <View style={{ alignItems: 'center', paddingTop: 6 }}>
                    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green }} />
                    <View style={{ width: 2, flex: 1, minHeight: 22, backgroundColor: colors.line, marginVertical: 3 }} />
                    <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: colors.gold }} />
                  </View>
                  <View style={{ flex: 1, gap: 10 }}>
                    <View>
                      <AppText weight="semibold" numberOfLines={1}>
                        {ride.pickup}
                      </AppText>
                      {ride.pickupArea ? (
                        <AppText size={12} color={colors.muted} numberOfLines={1}>
                          {ride.pickupArea}
                        </AppText>
                      ) : null}
                    </View>
                    <View>
                      <AppText weight="semibold" numberOfLines={1}>
                        {ride.drop}
                      </AppText>
                      {ride.dropArea ? (
                        <AppText size={12} color={colors.muted} numberOfLines={1}>
                          {ride.dropArea}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                </View>

                <AppText size={13} color={colors.muted} style={{ marginTop: 12, marginBottom: 14 }}>
                  Trip: {ride.distanceKm.toFixed(1)} km · about {ride.minutes} min
                </AppText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Decline"
                      variant="secondary"
                      onPress={() => declineRide(ride.id)}
                      disabled={accepting === ride.id}
                    />
                  </View>
                  <View style={{ flex: 1.4 }}>
                    <Button
                      label={accepting === ride.id ? 'Accepting…' : 'Accept'}
                      onPress={() => onAccept(ride.id)}
                      loading={accepting === ride.id}
                      disabled={Boolean(activeDriverRide) || (accepting !== null && accepting !== ride.id)}
                    />
                  </View>
                </View>
              </Surface>
            );
          })}
        </View>
      )}
    </Page>
  );
}
