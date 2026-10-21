import { supabase } from './supabase';
import type { Place } from '../src/types';

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

export type PlaceSuggestion = {
  id: string;
  placeId: string;
  name: string;
  area: string;
};

export type RouteQuote = {
  distanceKm: number;
  minutes: number;
  fare: number;
  polyline: string;
  source: 'route' | 'estimate';
};

// One token per search session: Google bills the typed autocomplete requests as a single
// free session when it ends with getPlaceDetails using the same token.
export function newPlacesSession() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export function searchRealPlaces(query: string, session: string, near?: { lat: number; lng: number }) {
  const params = new URLSearchParams({ query, session });
  if (near) {
    params.set('lat', String(near.lat));
    params.set('lng', String(near.lng));
  }
  return apiRequest<{ suggestions: PlaceSuggestion[] }>(`/maps/places?${params.toString()}`, { auth: true });
}

export async function getPlaceDetails(suggestion: PlaceSuggestion, session: string): Promise<ApiResult<Place>> {
  const result = await apiRequest<{ place: { id: string; area: string; lat: number; lng: number } }>(
    `/maps/places/${encodeURIComponent(suggestion.placeId)}?session=${encodeURIComponent(session)}`,
    { auth: true },
  );
  if (!result.ok) return result;
  const { place } = result.data;
  return {
    ok: true,
    status: result.status,
    data: { id: place.id, name: suggestion.name, area: suggestion.area || place.area, lat: place.lat, lng: place.lng },
  };
}

export function getRouteQuote(pickup: Place, drop: Place) {
  return apiRequest<{ quote: RouteQuote }>('/maps/quote', {
    method: 'POST',
    auth: true,
    body: { pickupLat: pickup.lat, pickupLng: pickup.lng, dropLat: drop.lat, dropLng: drop.lng },
  });
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
  verification_status?: string;
};

export function getProvider() {
  return apiRequest<{ provider: ProviderProfile | null }>('/providers/me', { auth: true });
}

export type BookedRide = {
  id: string;
  passengerId?: string;
  passengerName: string;
  passengerPhone: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
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
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  updatedAt?: string;
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
}) {
  // The server prices the ride from the route; the app never sends a fare.
  return apiRequest<{ ride: BookedRide }>('/rides', {
    method: 'POST',
    auth: true,
    body: input,
  });
}

export function listOpenRides() {
  return apiRequest<{ rides: BookedRide[] }>('/rides/open', { auth: true });
}

export function listMyRides() {
  return apiRequest<{ rides: BookedRide[] }>('/rides/mine', { auth: true });
}

export function getRide(id: string) {
  return apiRequest<{ ride: BookedRide }>(`/rides/${id}`, { auth: true });
}

export function acceptOpenRide(id: string) {
  return apiRequest<{ ride: BookedRide }>(`/rides/${id}/accept`, { method: 'POST', auth: true });
}

export function advanceServerRide(id: string, otp?: string) {
  return apiRequest<{ ride: BookedRide }>(`/rides/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: otp ? { otp } : {},
  });
}

export function cancelServerRide(id: string) {
  return apiRequest<{ ride: BookedRide }>(`/rides/${id}/cancel`, {
    method: 'POST',
    auth: true,
  });
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
