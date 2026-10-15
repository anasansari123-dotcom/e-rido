import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatWhen, initials, inr, statusMeta } from './data';
import { colors, font, shadow } from './theme';
import type { Ride, RideStatus } from './types';

type Weight = keyof typeof font;

export function AppText({
  children,
  size = 15,
  weight = 'regular',
  color = colors.ink,
  style,
  numberOfLines,
  center,
}: {
  children: React.ReactNode;
  size?: number;
  weight?: Weight;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  center?: boolean;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.25}
      style={[
        {
          fontFamily: font[weight],
          fontSize: size,
          color,
          lineHeight: Math.round(size * 1.35),
          textAlign: center ? 'center' : 'auto',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Mark({ size = 56 }: { size?: number }) {
  const wheel = size * 0.15;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: size * 0.5,
            height: size * 0.26,
            backgroundColor: colors.greenDeep,
            borderTopLeftRadius: size * 0.16,
            borderTopRightRadius: size * 0.16,
          }}
        />
        <View
          style={{
            width: size * 0.56,
            height: size * 0.07,
            backgroundColor: colors.greenDeep,
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            width: size * 0.48,
            justifyContent: 'space-between',
            marginTop: size * 0.06,
          }}
        >
          <View style={{ width: wheel, height: wheel, borderRadius: wheel, backgroundColor: colors.greenDeep }} />
          <View style={{ width: wheel, height: wheel, borderRadius: wheel, backgroundColor: colors.greenDeep }} />
        </View>
      </View>
    </View>
  );
}

export function Wordmark({ light = false, size = 26 }: { light?: boolean; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Mark size={size + 8} />
      <AppText size={size} weight="extra" color={light ? '#FFFFFF' : colors.ink} style={{ letterSpacing: -0.6 }}>
        eRide
      </AppText>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const palette = {
    primary: { bg: colors.green, border: colors.green, text: '#FFFFFF' },
    secondary: { bg: colors.white, border: colors.line, text: colors.ink },
    ghost: { bg: 'transparent', border: 'transparent', text: colors.green },
    danger: { bg: colors.dangerSoft, border: colors.dangerSoft, text: colors.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
        },
      ]}
    >
      {icon}
      <Text
        maxFontSizeMultiplier={1.2}
        style={{ fontFamily: font.bold, fontSize: 16, color: palette.text, lineHeight: 20 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secure,
  keyboardType,
  autoCapitalize = 'none',
  prefix,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  prefix?: string;
  maxLength?: number;
}) {
  const [concealed, setConcealed] = useState(Boolean(secure));

  return (
    <View style={{ marginBottom: 14 }}>
      <AppText size={13} weight="semibold" color={colors.inkSoft} style={{ marginBottom: 6 }}>
        {label}
      </AppText>
      <View style={[styles.field, error ? { borderColor: colors.danger } : null]}>
        {prefix ? (
          <>
            <AppText weight="semibold" color={colors.inkSoft}>
              {prefix}
            </AppText>
            <View style={styles.prefixRule} />
          </>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={concealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          selectionColor={colors.green}
          style={styles.input}
        />
        {secure ? (
          <Pressable accessibilityRole="button" onPress={() => setConcealed((current) => !current)} hitSlop={8}>
            <Ionicons name={concealed ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText size={12} color={colors.danger} style={{ marginTop: 6 }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function Banner({ message, tone = 'danger' }: { message: string; tone?: 'danger' | 'info' }) {
  const palette =
    tone === 'info'
      ? { bg: colors.mint, fg: colors.greenDark }
      : { bg: colors.dangerSoft, fg: colors.danger };
  return (
    <View style={{ backgroundColor: palette.bg, borderRadius: 14, padding: 12, marginBottom: 14 }}>
      <AppText size={13} weight="medium" color={palette.fg}>
        {message}
      </AppText>
    </View>
  );
}

export function Page({
  children,
  footer,
  bottomInset = false,
  refreshing = false,
  onRefresh,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  bottomInset?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const edges = bottomInset
    ? (['top', 'left', 'right', 'bottom'] as const)
    : (['top', 'left', 'right'] as const);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.green]}
                tintColor={colors.green}
                progressBackgroundColor={colors.white}
              />
            ) : undefined
          }
          contentContainerStyle={{ padding: 20, paddingBottom: footer ? 20 : 28 }}
        >
          {children}
        </ScrollView>
        {footer ? (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: colors.white,
              borderTopWidth: 1,
              borderTopColor: colors.line,
              gap: 10,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function BackButton({ fallback }: { fallback?: string }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => {
        if (router.canGoBack()) router.back();
        else if (fallback) router.replace(fallback);
      }}
      style={styles.back}
    >
      <Ionicons name="arrow-back" size={20} color={colors.ink} />
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  fallback,
}: {
  title: string;
  subtitle?: string;
  fallback?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <BackButton fallback={fallback} />
      <View style={{ flex: 1 }}>
        <AppText size={22} weight="extra">
          {title}
        </AppText>
        {subtitle ? (
          <AppText size={13} color={colors.muted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export function Avatar({ name, size = 44, light = false }: { name: string; size?: number; light?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: light ? 'rgba(255,255,255,0.16)' : colors.mint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText weight="bold" size={Math.round(size * 0.34)} color={light ? '#FFFFFF' : colors.greenDark}>
        {initials(name)}
      </AppText>
    </View>
  );
}

export function StatusPill({ status }: { status: RideStatus }) {
  const meta = statusMeta[status];
  return (
    <View style={{ backgroundColor: meta.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
      <AppText size={11} weight="bold" color={meta.fg}>
        {meta.label}
      </AppText>
    </View>
  );
}

export function Surface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText color={colors.muted}>{label}</AppText>
      <AppText weight="semibold" style={{ flex: 1, textAlign: 'right' }} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export function RouteSummary({ ride }: { ride: Ride }) {
  return (
    <Surface>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          <View style={styles.stopDot} />
          <View style={styles.stopLine} />
          <View style={styles.stopSquare} />
        </View>
        <View style={{ flex: 1, gap: 16 }}>
          <View>
            <AppText size={12} color={colors.muted}>
              Pickup
            </AppText>
            <AppText weight="semibold">{ride.pickup}</AppText>
          </View>
          <View>
            <AppText size={12} color={colors.muted}>
              Drop
            </AppText>
            <AppText weight="semibold">{ride.drop}</AppText>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText color={colors.muted}>
          {ride.distanceKm.toFixed(1)} km · {ride.minutes} min
        </AppText>
        <AppText size={18} weight="extra">
          {inr(ride.fare)}
        </AppText>
      </View>
    </Surface>
  );
}

export function RideRow({ ride, onPress }: { ride: Ride; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress}>
      <Surface style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" numberOfLines={1}>
              {ride.pickup}
            </AppText>
            <AppText size={13} color={colors.muted} numberOfLines={1}>
              to {ride.drop}
            </AppText>
          </View>
          <AppText weight="extra">{inr(ride.fare)}</AppText>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <AppText size={12} color={colors.muted}>
            {formatWhen(ride.createdAt)}
          </AppText>
          <StatusPill status={ride.status} />
        </View>
      </Surface>
    </Pressable>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 8 }}>
      <View style={styles.emptyMark}>
        <MaterialCommunityIcons name="rickshaw" size={30} color={colors.green} />
      </View>
      <AppText weight="bold" size={18} center>
        {title}
      </AppText>
      <AppText color={colors.muted} center style={{ marginTop: 6 }}>
        {body}
      </AppText>
      {action ? <View style={{ marginTop: 16, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function CityMap() {
  return (
    <View style={styles.map}>
      <View style={[styles.block, { top: 12, left: 12, width: 78, height: 40 }]} />
      <View style={[styles.block, { top: 12, left: 118, width: 64, height: 40 }]} />
      <View style={[styles.block, { top: 12, right: 12, width: 52, height: 40 }]} />
      <View style={[styles.block, { bottom: 12, left: 12, width: 58, height: 34 }]} />
      <View style={[styles.block, { bottom: 12, left: 96, width: 88, height: 34 }]} />
      <View style={[styles.block, { bottom: 12, right: 12, width: 46, height: 34 }]} />
      <View style={styles.roadH} />
      <View style={styles.roadV} />
      <View style={styles.pinWrap}>
        <View style={styles.pinHalo} />
        <View style={styles.pin} />
      </View>
      <View style={[styles.chip, { top: 20, right: 24 }]}>
        <MaterialCommunityIcons name="rickshaw" size={13} color={colors.greenDeep} />
      </View>
      <View style={[styles.chip, { bottom: 20, left: 28 }]}>
        <MaterialCommunityIcons name="rickshaw" size={13} color={colors.greenDeep} />
      </View>
    </View>
  );
}

export function PulseDot({ color = colors.gold }: { color?: string }) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.25, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity }} />;
}

export function SessionActions({ onLogout, onReset }: { onLogout: () => void; onReset: () => void }) {
  return (
    <View style={{ marginTop: 8, gap: 4 }}>
      <Button
        label="Log out"
        variant="secondary"
        onPress={onLogout}
        icon={<Ionicons name="log-out-outline" size={18} color={colors.ink} />}
      />
      <Pressable accessibilityRole="button" onPress={onReset} style={{ paddingVertical: 12 }}>
        <AppText center size={13} weight="semibold" color={colors.muted}>
          Reset demo data
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  field: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefixRule: {
    width: 1,
    height: 18,
    backgroundColor: colors.line,
  },
  input: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    ...shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 14,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  stopLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: colors.line,
    marginVertical: 4,
  },
  stopSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  emptyMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  map: {
    height: 156,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  block: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '46%',
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '40%',
    width: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  pinWrap: {
    position: 'absolute',
    left: '40%',
    top: '46%',
    width: 28,
    height: 28,
    marginLeft: -6,
    marginTop: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHalo: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  chip: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
