import { colors } from './theme';
import type { Place, RideStatus } from './types';

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

export const rideSteps: { status: RideStatus; title: string; body: string }[] = [
  { status: 'requested', title: 'Request sent', body: 'Looking for a nearby e-rickshaw.' },
  { status: 'accepted', title: 'Driver on the way', body: 'They are heading to your pickup.' },
  { status: 'arriving', title: 'Driver has arrived', body: 'Meet them and share the OTP.' },
  { status: 'ongoing', title: 'Ride started', body: 'The fare stays the same until you drop.' },
];

export const statusMeta: Record<RideStatus, { label: string; bg: string; fg: string }> = {
  requested: { label: 'Finding driver', bg: colors.goldSoft, fg: colors.goldDark },
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

// Straight-line distance in km between two coordinates.
export function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function quoteBetween(pickup: Place, drop: Place) {
  const raw = kmBetween(pickup, drop);
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
