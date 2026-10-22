import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { firstParam, normalizePhone } from '../../src/data';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import { AppText, Banner, Button, Field, Page, ScreenHeader, Surface } from '../../src/ui';
import type { Role } from '../../src/types';

type Step = 'email' | 'otp' | 'profile';

function Steps({ current }: { current: Step }) {
  const items: { id: Step; label: string }[] = [
    { id: 'email', label: 'Email' },
    { id: 'otp', label: 'Verify' },
    { id: 'profile', label: 'Account' },
  ];
  const index = items.findIndex((item) => item.id === current);

  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
      {items.map((item, itemIndex) => {
        const active = itemIndex <= index;
        return (
          <View key={item.id} style={{ flex: 1 }}>
            <View
              style={{
                height: 4,
                borderRadius: 4,
                backgroundColor: active ? colors.green : colors.line,
              }}
            />
            <AppText size={11} weight="semibold" color={active ? colors.green : colors.muted} style={{ marginTop: 6 }}>
              {item.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const roleParam = firstParam(params.role);
  const role: Role | null = roleParam === 'driver' || roleParam === 'passenger' ? roleParam : null;
  const { signup, sendEmailOtp, verifyEmailOtp } = useStore();
  const [step, setStep] = useState<Step>('email');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!role) return <Redirect href={{ pathname: '/role', params: { intent: 'signup' } }} />;

  const accountRole = role;
  const cleanedEmail = email.trim().toLowerCase();

  function resetMessages() {
    setFormError('');
    setNotice('');
    setErrors({});
  }

  async function sendCode() {
    if (!/^\S+@\S+\.\S+$/.test(cleanedEmail)) {
      setErrors({ email: 'Enter a valid email.' });
      return;
    }
    resetMessages();
    setSubmitting(true);
    const result = await sendEmailOtp(cleanedEmail, 'signup', accountRole);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setStep('otp');
    setNotice(`An OTP is on its way to ${cleanedEmail}.`);
  }

  async function confirmCode() {
    resetMessages();
    setSubmitting(true);
    const result = await verifyEmailOtp(cleanedEmail, code, accountRole, 'signup');
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setStep('profile');
    setNotice('Email verified. Now add your name and password.');
  }

  async function createAccount() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (normalizePhone(phone).length !== 10) next.phone = 'Enter a 10-digit mobile number.';
    if (password.trim().length < 6) next.password = 'Use at least 6 characters.';
    if (accountRole === 'driver' && vehicleNumber.trim().length < 4) next.vehicleNumber = 'Enter the vehicle number.';
    if (accountRole === 'driver' && vehicleModel.trim().length < 2) next.vehicleModel = 'Enter the vehicle model.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const result = await signup({
      name,
      phone,
      email: cleanedEmail,
      password,
      role: accountRole,
      vehicleNumber: accountRole === 'driver' ? vehicleNumber : undefined,
      vehicleModel: accountRole === 'driver' ? vehicleModel : undefined,
    });
    setSubmitting(false);
    if (!result.ok) setFormError(result.error);
  }

  const titles = {
    email: { title: 'Verify your email', subtitle: 'We will send an OTP. After that you can create the account.' },
    otp: { title: 'Enter OTP', subtitle: `Enter the OTP sent to ${cleanedEmail}.` },
    profile: {
      title: 'Create your account',
      subtitle: accountRole === 'driver' ? 'Add your name, password and e-rickshaw details.' : 'Add your name and a password to finish.',
    },
  }[step];

  return (
    <Page bottomInset>
      <ScreenHeader title={titles.title} subtitle={titles.subtitle} fallback="/role" />
      <AppText size={12} weight="bold" color={colors.green} style={{ letterSpacing: 0.8, marginBottom: 14 }}>
        {role === 'driver' ? 'SERVICE PROVIDER' : 'PASSENGER'}
      </AppText>
      <Steps current={step} />
      {formError ? <Banner message={formError} /> : null}
      {notice ? <Banner message={notice} tone="info" /> : null}

      {step === 'email' ? (
        <>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            error={errors.email}
          />
          <Button label={submitting ? 'Sending code…' : 'Verify your email'} onPress={sendCode} loading={submitting} />
        </>
      ) : null}

      {step === 'otp' ? (
        <>
          <Field
            label="OTP"
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Enter OTP"
            keyboardType="number-pad"
            maxLength={8}
          />
          <Button label={submitting ? 'Please wait' : 'Verify OTP'} onPress={confirmCode} loading={submitting} />
          <Pressable accessibilityRole="button" onPress={sendCode} style={{ marginTop: 12 }}>
            <AppText center weight="bold" color={colors.green}>
              Send a new code
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              resetMessages();
              setCode('');
              setStep('email');
            }}
            style={{ marginTop: 10 }}
          >
            <AppText center size={13} color={colors.muted}>
              Use a different email
            </AppText>
          </Pressable>
        </>
      ) : null}

      {step === 'profile' ? (
        <>
          <Field label="Full name" value={name} onChangeText={setName} placeholder="Aisha Khan" autoCapitalize="words" error={errors.name} />
          <Field
            label="Mobile number"
            value={phone}
            onChangeText={setPhone}
            placeholder="98765 43210"
            keyboardType="phone-pad"
            prefix="+91"
            maxLength={14}
            error={errors.phone}
          />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secure error={errors.password} />
          {role === 'driver' ? (
            <Surface style={{ marginBottom: 14 }}>
              <AppText weight="bold" style={{ marginBottom: 12 }}>
                Vehicle
              </AppText>
              <Field
                label="Registration number"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="DL 1E 4821"
                autoCapitalize="characters"
                error={errors.vehicleNumber}
              />
              <Field
                label="Model"
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="Piaggio Ape E-City"
                autoCapitalize="words"
                error={errors.vehicleModel}
              />
            </Surface>
          ) : null}
          <Button label={submitting ? 'Creating account…' : 'Create account'} onPress={createAccount} loading={submitting} />
        </>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/login', params: { role } })} style={{ marginTop: 16 }}>
        <AppText center color={colors.inkSoft}>
          Already registered? <AppText weight="bold" color={colors.green}>Sign in</AppText>
        </AppText>
      </Pressable>
    </Page>
  );
}
