import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

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
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json());

type AuthedRequest = Request & { authUser?: User; accessToken?: string };

function userClient(token: string) {
  return createClient(supabaseUrl ?? '', supabasePublishableKey ?? '', {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!supabase || !supabaseUrl || !supabasePublishableKey) {
    res.status(503).json({ error: 'Supabase is not configured on the server.' });
    return;
  }
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  req.authUser = data.user;
  req.accessToken = token;
  next();
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/passengers/me', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  if (!user || !token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  const { data, error } = await userClient(token).from('passengers').select('id, name, phone, email').eq('id', user.id).maybeSingle();
  if (error) {
    res.status(503).json({ error: passengerSaveError(error.message, error.code) });
    return;
  }
  res.json({ passenger: data });
});

app.put('/passengers/me', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  if (!user || !token || !user.email) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  const name = cleanText(req.body?.name);
  const phone = cleanText(req.body?.phone);
  const email = cleanText(req.body?.email).toLowerCase();
  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required.' });
    return;
  }
  if (email !== user.email.toLowerCase()) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const row = {
    id: user.id,
    name,
    phone,
    email,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await userClient(token).from('passengers').upsert(row, { onConflict: 'id' }).select('id, name, phone, email').single();
  if (error || !data) {
    res.status(503).json({ error: passengerSaveError(error?.message ?? '', error?.code) });
    return;
  }
  res.json({ passenger: data });
});

app.get('/providers/me', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  if (!user || !token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  if (!isDriver(user)) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const { data, error } = await userClient(token)
    .from('providers')
    .select('id, name, phone, email, vehicle_number, vehicle_model')
    .eq('id', user.id)
    .maybeSingle();
  if (error) {
    res.status(503).json({ error: tableSaveError('providers', error.message, error.code) });
    return;
  }
  res.json({ provider: data });
});

app.put('/providers/me', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  if (!user || !token || !user.email) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  if (!isDriver(user)) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const name = cleanText(req.body?.name);
  const phone = cleanText(req.body?.phone);
  const email = cleanText(req.body?.email).toLowerCase();
  const vehicleNumber = cleanText(req.body?.vehicleNumber).toUpperCase();
  const vehicleModel = cleanText(req.body?.vehicleModel) || 'E-Rickshaw';
  if (!name || !email || !vehicleNumber) {
    res.status(400).json({ error: 'Name, email, and vehicle number are required.' });
    return;
  }
  if (email !== user.email.toLowerCase()) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const row = {
    id: user.id,
    name,
    phone,
    email,
    vehicle_number: vehicleNumber,
    vehicle_model: vehicleModel,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await userClient(token)
    .from('providers')
    .upsert(row, { onConflict: 'id' })
    .select('id, name, phone, email, vehicle_number, vehicle_model')
    .single();
  if (error || !data) {
    res.status(503).json({ error: tableSaveError('providers', error?.message ?? '', error?.code) });
    return;
  }
  res.json({ provider: data });
});

function isDriver(user: User) {
  return user.user_metadata?.role === 'driver';
}

function passengerSaveError(message: string, code?: string) {
  return tableSaveError('passengers', message, code);
}

function tableSaveError(table: 'passengers' | 'providers' | 'rides', message: string, code?: string) {
  const text = `${code ?? ''} ${message}`.toLowerCase();
  if (text.includes(table) || text.includes('pgrst205')) {
    return `The ${table} table is missing. Run backend/sql/${table}.sql in the Supabase SQL editor.`;
  }
  if (table === 'providers') return 'Could not save the service provider.';
  if (table === 'rides') return 'Could not save the ride.';
  return 'Could not save the passenger.';
}

app.post('/rides', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  if (!user || !token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  if (isDriver(user)) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const pickup = readStop(req.body, 'pickup');
  const drop = readStop(req.body, 'drop');
  const fare = readNumber(req.body?.fare);
  const distanceKm = readNumber(req.body?.distanceKm);
  const minutes = readNumber(req.body?.minutes);
  if (!pickup || !drop || fare === null || distanceKm === null || minutes === null) {
    res.status(400).json({ error: 'Pickup, drop, and fare are required.' });
    return;
  }
  const meta = user.user_metadata ?? {};
  const name = cleanText(meta.name) || 'Passenger';
  const phone = cleanText(meta.phone);
  const row = {
    passenger_id: user.id,
    passenger_name: name,
    passenger_phone: phone,
    pickup: pickup.name,
    pickup_area: pickup.area,
    pickup_lat: pickup.lat,
    pickup_lng: pickup.lng,
    dropoff: drop.name,
    drop_area: drop.area,
    drop_lat: drop.lat,
    drop_lng: drop.lng,
    fare: Math.round(fare),
    distance_km: distanceKm,
    minutes: Math.round(minutes),
    status: 'requested',
    otp: String(Math.floor(1000 + Math.random() * 9000)),
  };
  const { data, error } = await userClient(token).from('rides').insert(row).select(rideColumns).single();
  if (error || !data) {
    res.status(503).json({ error: tableSaveError('rides', error?.message ?? '', error?.code) });
    return;
  }
  res.status(201).json({ ride: toRide(data) });
});

app.get('/rides/open', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  if (!user || !token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  if (!isDriver(user)) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const { data, error } = await userClient(token)
    .from('rides')
    .select(rideColumns)
    .eq('status', 'requested')
    .order('created_at', { ascending: true });
  if (error) {
    res.status(503).json({ error: tableSaveError('rides', error.message, error.code) });
    return;
  }
  res.json({ rides: (data ?? []).map((row) => toRide(row, false)) });
});

app.get('/rides/mine', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  if (!user || !token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  const column = isDriver(user) ? 'driver_id' : 'passenger_id';
  const { data, error } = await userClient(token)
    .from('rides')
    .select(rideColumns)
    .eq(column, user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    res.status(503).json({ error: tableSaveError('rides', error.message, error.code) });
    return;
  }
  res.json({ rides: (data ?? []).map((row) => toRide(row, !isDriver(user))) });
});

app.get('/rides/:id', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  const id = req.params.id;
  if (!user || !token || typeof id !== 'string') {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  const { data, error } = await userClient(token)
    .from('rides')
    .select(rideColumns)
    .eq('id', id)
    .maybeSingle();
  if (error) {
    res.status(503).json({ error: tableSaveError('rides', error.message, error.code) });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Ride not found.' });
    return;
  }
  res.json({ ride: toRide(data, !isDriver(user)) });
});

app.post('/rides/:id/accept', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  const id = req.params.id;
  if (!user || !token || typeof id !== 'string') {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  if (!isDriver(user)) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const { data: provider } = await userClient(token)
    .from('providers')
    .select('name, phone, vehicle_number, vehicle_model')
    .eq('id', user.id)
    .maybeSingle();
  const metadata = user.user_metadata ?? {};
  const driverName = cleanText(provider?.name) || cleanText(metadata.name) || 'Service provider';
  const driverPhone = cleanText(provider?.phone) || cleanText(metadata.phone);
  const vehicleNumber = cleanText(provider?.vehicle_number) || cleanText(metadata.vehicle_number);
  const vehicleModel = cleanText(provider?.vehicle_model) || cleanText(metadata.vehicle_model) || 'E-Rickshaw';
  if (!vehicleNumber) {
    res.status(400).json({ error: 'Add your vehicle number before accepting rides.' });
    return;
  }
  const now = new Date().toISOString();
  const { data, error } = await userClient(token)
    .from('rides')
    .update({
      driver_id: user.id,
      driver_name: driverName,
      driver_phone: driverPhone,
      vehicle_number: vehicleNumber,
      vehicle_model: vehicleModel,
      status: 'accepted',
      accepted_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .eq('status', 'requested')
    .is('driver_id', null)
    .select(rideColumns)
    .maybeSingle();
  if (error) {
    res.status(503).json({ error: tableSaveError('rides', error.message, error.code) });
    return;
  }
  if (!data) {
    res.status(409).json({ error: 'This request is no longer available.' });
    return;
  }
  res.json({ ride: toRide(data, false) });
});

app.patch('/rides/:id/status', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  const id = req.params.id;
  if (!user || !token || typeof id !== 'string') {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  if (!isDriver(user)) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const { data: current, error: readError } = await userClient(token)
    .from('rides')
    .select('id, status, otp')
    .eq('id', id)
    .eq('driver_id', user.id)
    .maybeSingle();
  if (readError) {
    res.status(503).json({ error: tableSaveError('rides', readError.message, readError.code) });
    return;
  }
  if (!current) {
    res.status(404).json({ error: 'Ride not found.' });
    return;
  }
  const transitions: Record<string, string> = {
    accepted: 'arriving',
    arriving: 'ongoing',
    ongoing: 'completed',
  };
  const nextStatus = transitions[current.status];
  if (!nextStatus) {
    res.status(409).json({ error: 'This ride cannot be updated.' });
    return;
  }
  if (nextStatus === 'ongoing' && cleanText(req.body?.otp) !== current.otp) {
    res.status(400).json({ error: 'The trip OTP is incorrect.' });
    return;
  }
  const now = new Date().toISOString();
  const timestampColumn =
    nextStatus === 'arriving' ? 'arrived_at' : nextStatus === 'ongoing' ? 'started_at' : 'completed_at';
  const { data, error } = await userClient(token)
    .from('rides')
    .update({ status: nextStatus, [timestampColumn]: now, updated_at: now })
    .eq('id', id)
    .eq('driver_id', user.id)
    .eq('status', current.status)
    .select(rideColumns)
    .maybeSingle();
  if (error) {
    res.status(503).json({ error: tableSaveError('rides', error.message, error.code) });
    return;
  }
  if (!data) {
    res.status(409).json({ error: 'The ride changed. Refresh and try again.' });
    return;
  }
  res.json({ ride: toRide(data, false) });
});

app.post('/rides/:id/cancel', requireUser, async (req: AuthedRequest, res) => {
  const user = req.authUser;
  const token = req.accessToken;
  const id = req.params.id;
  if (!user || !token || typeof id !== 'string') {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  if (isDriver(user)) {
    res.status(403).json({ error: 'You are not authorized.' });
    return;
  }
  const now = new Date().toISOString();
  const { data, error } = await userClient(token)
    .from('rides')
    .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
    .eq('id', id)
    .eq('passenger_id', user.id)
    .in('status', ['requested', 'accepted'])
    .select(rideColumns)
    .maybeSingle();
  if (error) {
    res.status(503).json({ error: tableSaveError('rides', error.message, error.code) });
    return;
  }
  if (!data) {
    res.status(409).json({ error: 'This ride can no longer be cancelled.' });
    return;
  }
  res.json({ ride: toRide(data, true) });
});

const rideColumns =
  'id, passenger_id, passenger_name, passenger_phone, driver_id, driver_name, driver_phone, vehicle_number, vehicle_model, pickup, pickup_area, pickup_lat, pickup_lng, dropoff, drop_area, drop_lat, drop_lng, fare, distance_km, minutes, status, otp, created_at, accepted_at, arrived_at, started_at, completed_at, cancelled_at, updated_at';

function readNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function readStop(body: unknown, key: 'pickup' | 'drop') {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const name = cleanText(record[key]);
  const area = cleanText(record[`${key}Area`]);
  const lat = readNumber(record[`${key}Lat`]);
  const lng = readNumber(record[`${key}Lng`]);
  if (!name || lat === null || lng === null) return null;
  return { name, area, lat, lng };
}

function toRide(row: Record<string, unknown>, includeOtp = true) {
  return {
    id: row.id,
    passengerId: row.passenger_id,
    passengerName: row.passenger_name,
    passengerPhone: row.passenger_phone,
    driverId: row.driver_id,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    vehicleNumber: row.vehicle_number,
    vehicleModel: row.vehicle_model,
    pickup: row.pickup,
    pickupArea: row.pickup_area,
    pickupLat: row.pickup_lat,
    pickupLng: row.pickup_lng,
    drop: row.dropoff,
    dropArea: row.drop_area,
    dropLat: row.drop_lat,
    dropLng: row.drop_lng,
    fare: row.fare,
    distanceKm: Number(row.distance_km),
    minutes: row.minutes,
    status: row.status,
    otp: includeOtp ? row.otp : '',
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    arrivedAt: row.arrived_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    updatedAt: row.updated_at,
  };
}

app.listen(port, '0.0.0.0', () => {
  const missing = [
    supabaseUrl ? null : 'SUPABASE_URL',
    supabasePublishableKey ? null : 'SUPABASE_PUBLISHABLE_KEY',
  ].filter((name) => name !== null);

  console.log(`API listening on 0.0.0.0:${port}`);
  if (missing.length > 0) {
    console.warn(`Supabase is not configured. Missing: ${missing.join(', ')}`);
  } else {
    console.log('Supabase URL and publishable key are set. Profiles use public.passengers and public.providers.');
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('SUPABASE_SERVICE_ROLE_KEY is present on the server only.');
  }
});
