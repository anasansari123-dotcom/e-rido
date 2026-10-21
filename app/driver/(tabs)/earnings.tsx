import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { inr } from '../../../src/data';
import { useStore } from '../../../src/store';
import { colors } from '../../../src/theme';
import { AppText, Banner, Page, RideRow } from '../../../src/ui';

export default function EarningsScreen() {
  const { driverRides, refreshRides } = useStore();
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const completed = driverRides.filter((ride) => ride.status === 'completed');
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekRides = completed.filter((ride) => new Date(ride.createdAt) >= weekStart);
  const todayRides = completed.filter((ride) => new Date(ride.createdAt).toDateString() === new Date().toDateString());
  const shown = period === 'today' ? todayRides : weekRides;
  const total = shown.reduce((sum, ride) => sum + ride.fare, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const amount = completed
      .filter((ride) => new Date(ride.createdAt).toDateString() === date.toDateString())
      .reduce((sum, ride) => sum + ride.fare, 0);
    return {
      label: date.toLocaleDateString('en-IN', { weekday: 'narrow' }),
      amount,
      today: index === 6,
    };
  });
  const max = Math.max(...days.map((day) => day.amount), 1);

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
        Earnings
      </AppText>
      <AppText color={colors.muted} style={{ marginTop: 4, marginBottom: 18 }}>
        Cash collected from completed e-rickshaw trips.
      </AppText>
      {message ? <Banner message={message} /> : null}

      <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.line }}>
        {(['today', 'week'] as const).map((item) => {
          const selected = period === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setPeriod(item)}
              style={{ flex: 1, backgroundColor: selected ? colors.navy : 'transparent', borderRadius: 10, paddingVertical: 10 }}
            >
              <AppText center weight="bold" color={selected ? '#FFFFFF' : colors.inkSoft}>
                {item === 'today' ? 'Today' : 'This week'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 16, backgroundColor: colors.greenDeep, borderRadius: 22, padding: 18 }}>
        <AppText size={13} color="rgba(255,255,255,0.72)">
          {period === 'today' ? 'Today' : 'Last 7 days'}
        </AppText>
        <AppText size={36} weight="extra" color="#FFFFFF" style={{ marginTop: 4 }}>
          {inr(total)}
        </AppText>
        <AppText color="rgba(255,255,255,0.75)" style={{ marginTop: 4 }}>
          {shown.length} {shown.length === 1 ? 'trip' : 'trips'}
        </AppText>
      </View>

      {period === 'week' ? (
        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.white,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.line,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          {days.map((day, index) => (
            <View key={`${day.label}-${index}`} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ height: 120, justifyContent: 'flex-end' }}>
                <View
                  style={{
                    width: 16,
                    height: day.amount === 0 ? 6 : Math.max(12, (day.amount / max) * 120),
                    borderRadius: 6,
                    backgroundColor: day.today ? colors.gold : colors.green,
                  }}
                />
              </View>
              <AppText size={11} weight="semibold" color={colors.muted} style={{ marginTop: 8 }}>
                {day.label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <AppText size={12} weight="bold" color={colors.muted} style={{ letterSpacing: 0.8, marginTop: 20, marginBottom: 10 }}>
        TRIPS
      </AppText>
      {shown.length === 0 ? (
        <AppText color={colors.muted}>Completed trips will show up here.</AppText>
      ) : (
        shown.map((ride) => <RideRow key={ride.id} ride={ride} />)
      )}
    </Page>
  );
}
