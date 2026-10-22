import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { firstParam } from '../../src/data';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import { AppText, Banner, Button, Field, Page, ScreenHeader } from '../../src/ui';
import type { Role } from '../../src/types';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const roleParam = firstParam(params.role);
  const role: Role | null = roleParam === 'driver' || roleParam === 'passenger' ? roleParam : null;
  const { login, sendEmailOtp, verifyEmailOtp } = useStore();
  const [method, setMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setEmail('');
      setPassword('');
      setCode('');
      setCodeSent(false);
      setNotice('');
      setError('');
    }, 0);
    return () => clearTimeout(timer);
  }, [role]);

  if (!role) return <Redirect href={{ pathname: '/role', params: { intent: 'login' } }} />;

  const accountRole = role;

  async function submit() {
    setSubmitting(true);
    setNotice('');
    const result = await login(email, password, accountRole);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  }

  async function sendCode() {
    setSubmitting(true);
    setError('');
    setNotice('');
    const result = await sendEmailOtp(email);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCodeSent(true);
    setNotice('An OTP is on its way to your email.');
  }

  async function verifyCode() {
    setSubmitting(true);
    setError('');
    const result = await verifyEmailOtp(email, code, accountRole);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <Page bottomInset>
      <ScreenHeader
        title="Welcome back"
        subtitle={role === 'driver' ? 'Sign in to your service provider account.' : 'Sign in to book an e-rickshaw.'}
        fallback="/role"
      />
      <AppText size={12} weight="bold" color={colors.green} style={{ letterSpacing: 0.8, marginBottom: 14 }}>
        {role === 'driver' ? 'SERVICE PROVIDER' : 'PASSENGER'}
      </AppText>
      <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.line, marginBottom: 16 }}>
        {([
          ['password', 'Password'],
          ['otp', 'Email OTP'],
        ] as const).map(([value, label]) => {
          const selected = method === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              onPress={() => {
                setMethod(value);
                setError('');
                setNotice('');
              }}
              style={{ flex: 1, backgroundColor: selected ? colors.navy : 'transparent', borderRadius: 10, paddingVertical: 10 }}
            >
              <AppText center weight="bold" color={selected ? '#FFFFFF' : colors.inkSoft}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? <Banner message={error} /> : null}
      {notice ? <Banner message={notice} tone="info" /> : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
      />
      {method === 'password' ? (
        <>
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secure
          />
          <Button label={submitting ? 'Signing in…' : 'Sign in'} onPress={submit} loading={submitting} />
        </>
      ) : (
        <>
          {codeSent ? (
            <Field
              label="OTP"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 8))}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              maxLength={8}
            />
          ) : null}
          <Button
            label={submitting ? 'Please wait' : codeSent ? 'Verify OTP' : 'Send OTP'}
            onPress={codeSent ? verifyCode : sendCode}
            loading={submitting}
          />
          {codeSent ? (
            <Pressable accessibilityRole="button" onPress={sendCode} style={{ marginTop: 12 }}>
              <AppText center weight="bold" color={colors.green}>
                Send a new code
              </AppText>
            </Pressable>
          ) : (
            <AppText center size={12} color={colors.muted} style={{ marginTop: 12 }}>
              We will email you an OTP to sign in.
            </AppText>
          )}
        </>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace({ pathname: '/signup', params: { role } })}
        style={{ marginTop: 18 }}
      >
        <AppText center color={colors.inkSoft}>
          New to MTUK Nagar Ride? <AppText weight="bold" color={colors.green}>Create an account</AppText>
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.replace({
            pathname: '/login',
            params: { role: role === 'driver' ? 'passenger' : 'driver' },
          })
        }
        style={{ marginTop: 8 }}
      >
        <AppText center size={13} color={colors.muted}>
          {role === 'driver' ? 'Want to book a ride instead?' : 'Drive an e-rickshaw instead?'}
        </AppText>
      </Pressable>
    </Page>
  );
}
