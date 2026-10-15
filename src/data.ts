import { colors } from './theme';
import type { Account, Place, Ride, RideStatus } from './types';

export const DEMO_PASSENGER = {
  name: 'Aisha Khan',
  phone: '9876543210',
  password: 'ride123',
  email: 'aisha@eride.app',
};

export const DEMO_DRIVER = {
  name: 'Ramesh Kumar',
  phone: '9123456780',
  password: 'drive123',
  email: 'ramesh@eride.app',
  vehicleNumber: 'DL 1E 4821',
  vehicleModel: 'Piaggio Ape E-City',
};

export const seedAccounts: Account[] = [
  {
    id: 'passenger-demo',
    name: DEMO_PASSENGER.name,
    phone: DEMO_PASSENGER.phone,
    email: DEMO_PASSENGER.email,
    password: DEMO_PASSENGER.password,
    role: 'passenger',
  },
  {
    id: 'driver-demo',
    name: DEMO_DRIVER.name,
    phone: DEMO_DRIVER.phone,
    email: DEMO_DRIVER.email,
    password: DEMO_DRIVER.password,
    role: 'driver',
    vehicleNumber: DEMO_DRIVER.vehicleNumber,
    vehicleModel: DEMO_DRIVER.vehicleModel,
    verified: true,
  },
];

export const places: Place[] = [
  { id: 'cp', name: 'Connaught Place', area: 'Central Delhi', lat: 28.6315, lng: 77.2167 },
  { id: 'india-gate', name: 'India Gate', area: 'Central Delhi', lat: 28.6129, lng: 77.2295 },
  { id: 'rajiv', name: 'Rajiv Chowk Metro', area: 'Connaught Place', lat: 28.6328, lng: 77.2197 },
  { id: 'karol', name: 'Karol Bagh', area: 'West Delhi', lat: 28.6517, lng: 77.1907 },
  { id: 'chandni', name: 'Chandni Chowk', area: 'Old Delhi', lat: 28.6506, lng: 77.2303 },
  { id: 'khan', name: 'Khan Market', area: 'Central Delhi', lat: 28.6002, lng: 77.2269 },
  { id: 'nehru', name: 'Nehru Place', area: 'South Delhi', lat: 28.5494, lng: 77.2501 },
  { id: 'aiims', name: 'AIIMS', area: 'South Delhi', lat: 28.5672, lng: 77.21 },
  { id: 'lajpat', name: 'Lajpat Nagar', area: 'South Delhi', lat: 28.5677, lng: 77.2433 },
  { id: 'sarojini', name: 'Sarojini Nagar', area: 'South Delhi', lat: 28.5742, lng: 77.1954 },
];

export const nearbyDrivers = [
  { id: 'n1', name: 'Imran Qureshi', rating: 4.92, vehicle: 'DL 5E 2208', eta: 2, trips: 1840 },
  { id: 'n2', name: 'Suresh Pal', rating: 4.86, vehicle: 'DL 8E 1194', eta: 4, trips: 960 },
  { id: 'n3', name: 'Harpreet Singh', rating: 4.78, vehicle: 'DL 3E 7702', eta: 6, trips: 640 },
];

export const rideSteps: { status: RideStatus; title: string; body: string }[] = [
  { status: 'requested', title: 'Request sent', body: 'Looking for a nearby e-rickshaw.' },
  { status: 'accepted', title: 'Driver on the way', body: 'They are heading to your pickup.' },
  { status: 'arriving', title: 'Driver has arrived', body: 'Meet them and share the OTP.' },
  { status: 'ongoing', title: 'Ride started', body: 'The fare stays the same until you drop.' },
];

export const statusMeta: Record<RideStatus, { label: string; bg: string; fg: string }> = {
  requested: { label: 'Finding driver', bg: colors.goldSoft, fg: '#8A6410' },
  accepted: { label: 'On the way', bg: colors.mint, fg: colors.greenDark },
  arriving: { label: 'Arrived', bg: colors.mint, fg: colors.greenDark },
  ongoing: { label: 'On ride', bg: colors.mint, fg: colors.greenDark },
  completed: { label: 'Completed', bg: '#EEF2EF', fg: colors.inkSoft },
  cancelled: { label: 'Cancelled', bg: colors.dangerSoft, fg: colors.danger },
};

const PASSENGER_OPEN = new Set<RideStatus>(['requested', 'accepted', 'arriving', 'ongoing']);
const DRIVER_OPEN = new Set<RideStatus>(['accepted', 'arriving', 'ongoing']);

export function isPassengerOpen(status: RideStatus) {
  return PASSENGER_OPEN.has(status);
}

export function isDriverOpen(status: RideStatus) {
  return DRIVER_OPEN.has(status);
}

export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function formatPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function inr(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (diff >= 0 && diff < 60_000) return 'Just now';
  if (diff >= 0 && diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;

  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
}

export function quoteBetween(pickup: Place, drop: Place) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(drop.lat - pickup.lat);
  const dLng = toRad(drop.lng - pickup.lng);
  const lat1 = toRad(pickup.lat);
  const lat2 = toRad(drop.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const raw = earth * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  const distanceKm = Math.round(Math.max(raw, 0.8) * 10) / 10;
  const minutes = Math.max(6, Math.round(distanceKm * 4 + 3));
  const fare = Math.max(30, Math.round(25 + distanceKm * 12));
  return { distanceKm, minutes, fare };
}

export function passengerHeadline(status: RideStatus) {
  switch (status) {
    case 'requested':
      return 'Finding your e-rickshaw';
    case 'accepted':
      return 'Your driver is on the way';
    case 'arriving':
      return 'Your driver has arrived';
    case 'ongoing':
      return 'You are on the ride';
    case 'completed':
      return 'Ride completed';
    case 'cancelled':
      return 'Ride cancelled';
  }
}

export function driverHeadline(status: RideStatus) {
  switch (status) {
    case 'accepted':
      return 'Head to the pickup';
    case 'arriving':
      return 'Waiting at the pickup';
    case 'ongoing':
      return 'Ride in progress';
    case 'completed':
      return 'Trip completed';
    case 'cancelled':
      return 'Trip cancelled';
    default:
      return 'New request';
  }
}

export function driverActionLabel(status: RideStatus) {
  if (status === 'accepted') return 'I have arrived';
  if (status === 'arriving') return 'Start ride';
  if (status === 'ongoing') return 'Complete ride';
  return null;
}

export function createSeedRides(): Ride[] {
  const driver = {
    driverName: DEMO_DRIVER.name,
    driverPhone: DEMO_DRIVER.phone,
    vehicleNumber: DEMO_DRIVER.vehicleNumber,
    vehicleModel: DEMO_DRIVER.vehicleModel,
  };

  const drafts: {
    daysAgo: number;
    hour: number;
    passengerName: string;
    passengerPhone: string;
    pickup: string;
    drop: string;
    fare: number;
    distanceKm: number;
    minutes: number;
    status: RideStatus;
  }[] = [
    { daysAgo: 0, hour: 8, passengerName: 'Aisha Khan', passengerPhone: DEMO_PASSENGER.phone, pickup: 'Connaught Place', drop: 'India Gate', fare: 68, distanceKm: 2.6, minutes: 14, status: 'completed' },
    { daysAgo: 0, hour: 11, passengerName: 'Neha Gupta', passengerPhone: '9810011100', pickup: 'Lajpat Nagar', drop: 'AIIMS', fare: 54, distanceKm: 2.2, minutes: 12, status: 'completed' },
    { daysAgo: 1, hour: 9, passengerName: 'Aisha Khan', passengerPhone: DEMO_PASSENGER.phone, pickup: 'Khan Market', drop: 'Nehru Place', fare: 92, distanceKm: 5.4, minutes: 26, status: 'completed' },
    { daysAgo: 1, hour: 13, passengerName: 'Vikram Seth', passengerPhone: '9810012200', pickup: 'Chandni Chowk', drop: 'Rajiv Chowk Metro', fare: 48, distanceKm: 1.8, minutes: 11, status: 'completed' },
    { daysAgo: 1, hour: 18, passengerName: 'Meera Iyer', passengerPhone: '9810013300', pickup: 'Sarojini Nagar', drop: 'Lajpat Nagar', fare: 40, distanceKm: 1.5, minutes: 10, status: 'completed' },
    { daysAgo: 2, hour: 10, passengerName: 'Aisha Khan', passengerPhone: DEMO_PASSENGER.phone, pickup: 'Connaught Place', drop: 'Karol Bagh', fare: 62, distanceKm: 2.8, minutes: 15, status: 'completed' },
    { daysAgo: 2, hour: 16, passengerName: 'Rahul Verma', passengerPhone: '9810014400', pickup: 'India Gate', drop: 'Khan Market', fare: 58, distanceKm: 2.4, minutes: 13, status: 'completed' },
    { daysAgo: 3, hour: 9, passengerName: 'Sana Ali', passengerPhone: '9810015500', pickup: 'AIIMS', drop: 'Nehru Place', fare: 56, distanceKm: 2.5, minutes: 14, status: 'completed' },
    { daysAgo: 3, hour: 12, passengerName: 'Imran Qureshi', passengerPhone: '9810016600', pickup: 'Rajiv Chowk Metro', drop: 'Chandni Chowk', fare: 50, distanceKm: 2, minutes: 12, status: 'completed' },
    { daysAgo: 3, hour: 15, passengerName: 'Aisha Khan', passengerPhone: DEMO_PASSENGER.phone, pickup: 'Lajpat Nagar', drop: 'Sarojini Nagar', fare: 44, distanceKm: 1.7, minutes: 11, status: 'completed' },
    { daysAgo: 3, hour: 19, passengerName: 'Neha Gupta', passengerPhone: '9810011100', pickup: 'Connaught Place', drop: 'India Gate', fare: 68, distanceKm: 2.6, minutes: 14, status: 'completed' },
    { daysAgo: 4, hour: 10, passengerName: 'Vikram Seth', passengerPhone: '9810012200', pickup: 'Karol Bagh', drop: 'Connaught Place', fare: 60, distanceKm: 2.7, minutes: 15, status: 'completed' },
    { daysAgo: 5, hour: 9, passengerName: 'Meera Iyer', passengerPhone: '9810013300', pickup: 'Khan Market', drop: 'India Gate', fare: 64, distanceKm: 2.9, minutes: 16, status: 'completed' },
    { daysAgo: 5, hour: 14, passengerName: 'Rahul Verma', passengerPhone: '9810014400', pickup: 'Nehru Place', drop: 'AIIMS', fare: 52, distanceKm: 2.3, minutes: 13, status: 'completed' },
    { daysAgo: 5, hour: 18, passengerName: 'Sana Ali', passengerPhone: '9810015500', pickup: 'Chandni Chowk', drop: 'Karol Bagh', fare: 78, distanceKm: 4.1, minutes: 20, status: 'completed' },
    { daysAgo: 6, hour: 11, passengerName: 'Imran Qureshi', passengerPhone: '9810016600', pickup: 'Sarojini Nagar', drop: 'Khan Market', fare: 70, distanceKm: 3.6, minutes: 18, status: 'completed' },
    { daysAgo: 6, hour: 17, passengerName: 'Aisha Khan', passengerPhone: DEMO_PASSENGER.phone, pickup: 'Rajiv Chowk Metro', drop: 'India Gate', fare: 52, distanceKm: 2.1, minutes: 12, status: 'completed' },
    { daysAgo: 0, hour: 12, passengerName: 'Neha Gupta', passengerPhone: '9810011100', pickup: 'Lajpat Nagar', drop: 'Sarojini Nagar', fare: 44, distanceKm: 1.7, minutes: 11, status: 'requested' },
    { daysAgo: 0, hour: 12, passengerName: 'Vikram Seth', passengerPhone: '9810012200', pickup: 'Chandni Chowk', drop: 'Connaught Place', fare: 58, distanceKm: 2.5, minutes: 14, status: 'requested' },
  ];

  return drafts.map((draft, index) => {
    const created = new Date();
    if (draft.status === 'requested') {
      created.setTime(Date.now() - (index + 1) * 60_000);
    } else {
      created.setDate(created.getDate() - draft.daysAgo);
      created.setHours(draft.hour, 12, 0, 0);
      if (created.getTime() > Date.now()) created.setTime(Date.now() - 45 * 60_000);
    }

    return {
      id: `seed-${index + 1}`,
      passengerName: draft.passengerName,
      passengerPhone: draft.passengerPhone,
      pickup: draft.pickup,
      drop: draft.drop,
      fare: draft.fare,
      distanceKm: draft.distanceKm,
      minutes: draft.minutes,
      status: draft.status,
      otp: String(4300 + index),
      createdAt: created.toISOString(),
      ...(draft.status === 'requested' ? {} : driver),
    };
  });
}
