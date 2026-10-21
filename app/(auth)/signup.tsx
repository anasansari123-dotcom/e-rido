import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { firstParam, normalizePhone } from '../../src/data';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import { AppText, Banner, Button, Field, Page, ScreenHeader, Surface } from '../../src/ui';
import type { Role } from '../../src/types';

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const roleParam = firstParam(params.role);
  const role: Role | null = roleParam === 'driver' || roleParam === 'passenger' ? roleParam : null;
  const { signup } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!role) return <Redirect href={{ pathname: '/role', params: { intent: 'signup' } }} />;

  const accountRole = role;

  async function submit() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (normalizePhone(phone).length !== 10) next.phone = 'Enter a 10-digit mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email.';
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
      email,
      password,
      role: accountRole,
      vehicleNumber: accountRole === 'driver' ? vehicleNumber : undefined,
      vehicleModel: accountRole === 'driver' ? vehicleModel : undefined,
    });
    setSubmitting(false);
    if (!result.ok) setFormError(result.error);
  }

  return (
    <Page bottomInset>
      <ScreenHeader
        title="Create your account"
        subtitle={role === 'driver' ? 'Tell us about you and your e-rickshaw.' : 'Use your email to sign in.'}
        fallback="/role"
      />
      <AppText size={12} weight="bold" color={colors.green} style={{ letterSpacing: 0.8, marginBottom: 14 }}>
        {role === 'driver' ? 'SERVICE PROVIDER' : 'PASSENGER'}
      </AppText>
      {formError ? (
        <Banner message={formError} tone={formError.startsWith('Account created') ? 'info' : 'danger'} />
      ) : null}
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
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        error={errors.email}
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
      <Button label={submitting ? 'Creating account…' : 'Create account'} onPress={submit} loading={submitting} />
      <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/login', params: { role } })} style={{ marginTop: 16 }}>
        <AppText center color={colors.inkSoft}>
          Already registered? <AppText weight="bold" color={colors.green}>Sign in</AppText>
        </AppText>
      </Pressable>
    </Page>
  );
}
