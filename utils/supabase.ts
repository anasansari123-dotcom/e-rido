import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabaseConfigError =
  supabaseUrl && supabaseKey
    ? null
    : 'MTUK Nagar Ride is not set up correctly. Please update the app or try again later.';

export const supabase = createClient(supabaseUrl ?? 'https://example.supabase.co', supabaseKey ?? 'missing-publishable-key', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
