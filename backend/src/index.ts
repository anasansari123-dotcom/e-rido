import 'dotenv/config';
import express from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const app = express();
app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  const missing = [
    supabaseUrl ? null : 'SUPABASE_URL',
    supabasePublishableKey ? null : 'SUPABASE_PUBLISHABLE_KEY',
  ].filter((name) => name !== null);

  console.log(`API listening on 0.0.0.0:${port}`);
  if (missing.length > 0) {
    console.warn(`Supabase is not configured. Missing: ${missing.join(', ')}`);
  } else {
    console.log('Supabase URL and publishable key are set. No auth routes or database tables are implemented.');
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('SUPABASE_SERVICE_ROLE_KEY is present on the server only.');
  }
});
