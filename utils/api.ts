import { supabase } from './supabase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

export type ApiFailure = {
  ok: false;
  error: string;
  status?: number;
};

export type ApiSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

export function getApiBaseUrl() {
  return apiUrl;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  if (!apiUrl) {
    return { ok: false, error: 'EXPO_PUBLIC_API_URL is not set.' };
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  if (options.auth) {
    const { data, error } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (error || !token) {
      return { ok: false, status: 401, error: 'Sign in required.' };
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const route = path.startsWith('/') ? path : `/${path}`;
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${route}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' };
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const fallback = response.status === 401 || response.status === 403
      ? 'You are not authorized.'
      : response.status >= 500
        ? 'The server had a problem. Try again.'
        : 'The request was rejected.';
    return { ok: false, status: response.status, error: messageFromPayload(payload, fallback) };
  }

  return { ok: true, status: response.status, data: payload as T };
}

export function checkApiHealth() {
  return apiRequest<{ status: string }>('/health');
}

export type PassengerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export function savePassenger(passenger: { name: string; phone: string; email: string }) {
  return apiRequest<{ passenger: PassengerProfile }>('/passengers/me', {
    method: 'PUT',
    auth: true,
    body: {
      name: passenger.name,
      phone: passenger.phone,
      email: passenger.email,
    },
  });
}

export type ProviderProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_number: string;
  vehicle_model: string;
};

export type BookedRide = {
  id: string;
  passengerName: string;
  passengerPhone: string;
  pickup: string;
  pickupArea: string;
  pickupLat: number;
  pickupLng: number;
  drop: string;
  dropArea: string;
  dropLat: number;
  dropLng: number;
  fare: number;
  distanceKm: number;
  minutes: number;
  status: string;
  otp: string;
  createdAt: string;
};

export function createRide(input: {
  pickup: string;
  pickupArea: string;
  pickupLat: number;
  pickupLng: number;
  drop: string;
  dropArea: string;
  dropLat: number;
  dropLng: number;
  fare: number;
  distanceKm: number;
  minutes: number;
}) {
  return apiRequest<{ ride: BookedRide }>('/rides', {
    method: 'POST',
    auth: true,
    body: input,
  });
}

export function listOpenRides() {
  return apiRequest<{ rides: BookedRide[] }>('/rides/open', { auth: true });
}

export function acceptOpenRide(id: string) {
  return apiRequest<{ ride: BookedRide }>(`/rides/${id}/accept`, { method: 'POST', auth: true });
}

export function saveProvider(provider: {
  name: string;
  phone: string;
  email: string;
  vehicleNumber: string;
  vehicleModel?: string;
}) {
  return apiRequest<{ provider: ProviderProfile }>('/providers/me', {
    method: 'PUT',
    auth: true,
    body: {
      name: provider.name,
      phone: provider.phone,
      email: provider.email,
      vehicleNumber: provider.vehicleNumber,
      vehicleModel: provider.vehicleModel ?? 'E-Rickshaw',
    },
  });
}

function messageFromPayload(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return fallback;
  const error = (payload as { error?: unknown }).error;
  return typeof error === 'string' && error.trim() ? error : fallback;
}
