import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  acceptOpenRide,
  advanceServerRide,
  cancelServerRide,
  createRide,
  listMyRides,
  listOpenRides,
  getProvider,
  savePassenger,
  saveProvider,
  type BookedRide,
} from '../utils/api';
import { supabase } from '../utils/supabase';
import { isDriverOpen, isPassengerOpen, normalizePhone } from './data';
import type { Account, PublicAccount, Ride, RideStatus, Role, SignupInput } from './types';

// v2: earlier builds cached sample accounts and rides under eride.v1; a new key leaves them behind.
const STORAGE_KEY = 'eride.v2';

type Persisted = {
  version: 1;
  accounts: Account[];
  sessionId: string | null;
  rides: Ride[];
  dismissed: Record<string, string[]>;
  online: boolean;
};

type State = Persisted & { ready: boolean };

type Result = { ok: true } | { ok: false; error: string };

type RideBooking = {
  pickup: string;
  pickupArea: string;
  pickupLat: number;
  pickupLng: number;
  drop: string;
  dropArea: string;
  dropLat: number;
  dropLng: number;
};

type StoreValue = {
  ready: boolean;
  user: PublicAccount | null;
  online: boolean;
  passengerRides: Ride[];
  activePassengerRide: Ride | null;
  incoming: Ride[];
  activeDriverRide: Ride | null;
  driverRides: Ride[];
  rideById: (id: string) => Ride | null;
  login: (email: string, password: string, role: Role) => Promise<Result>;
  sendEmailOtp: (email: string) => Promise<Result>;
  verifyEmailOtp: (email: string, code: string, role: Role) => Promise<Result>;
  signup: (input: SignupInput) => Promise<Result>;
  logout: () => void;
  bookRide: (input: RideBooking) => Promise<{ ok: true; ride: Ride } | { ok: false; error: string }>;
  acceptRide: (id: string) => Promise<boolean>;
  declineRide: (id: string) => void;
  advanceRide: (id: string, otp?: string) => Promise<Result>;
  cancelRide: (id: string) => Promise<Result>;
  refreshRides: () => Promise<Result>;
  setOnline: (value: boolean) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function fresh(): Persisted {
  return {
    version: 1,
    accounts: [],
    sessionId: null,
    rides: [],
    dismissed: {},
    online: true,
  };
}

function toPublic(account: Account): PublicAccount {
  const { password: _password, ...rest } = account;
  return rest;
}

function textMeta(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function profileFromUser(user: User): Account {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: textMeta(meta.name) || 'MTUK user',
    phone: textMeta(meta.phone),
    email: user.email ?? '',
    password: '',
    role: meta.role === 'driver' ? 'driver' : 'passenger',
    vehicleNumber: textMeta(meta.vehicle_number) || undefined,
    vehicleModel: textMeta(meta.vehicle_model) || undefined,
    verified: meta.verified === true,
  };
}

function bookedToRide(ride: BookedRide): Ride {
  return {
    id: ride.id,
    passengerId: ride.passengerId,
    passengerName: ride.passengerName,
    passengerPhone: ride.passengerPhone,
    driverId: ride.driverId,
    driverName: ride.driverName,
    driverPhone: ride.driverPhone,
    vehicleNumber: ride.vehicleNumber,
    vehicleModel: ride.vehicleModel,
    pickup: ride.pickup,
    pickupArea: ride.pickupArea,
    pickupLat: ride.pickupLat,
    pickupLng: ride.pickupLng,
    drop: ride.drop,
    dropArea: ride.dropArea,
    dropLat: ride.dropLat,
    dropLng: ride.dropLng,
    fare: ride.fare,
    distanceKm: ride.distanceKm,
    minutes: ride.minutes,
    status: ride.status as RideStatus,
    otp: ride.otp,
    createdAt: ride.createdAt,
    acceptedAt: ride.acceptedAt,
    arrivedAt: ride.arrivedAt,
    startedAt: ride.startedAt,
    completedAt: ride.completedAt,
    cancelledAt: ride.cancelledAt,
    updatedAt: ride.updatedAt,
  };
}

function mergeRides(local: Ride[], server: Ride[]) {
  if (server.length === 0) return local;
  const serverIds = new Set(server.map((ride) => ride.id));
  return [...server, ...local.filter((ride) => !serverIds.has(ride.id))];
}

async function withProviderStatus(account: Account): Promise<Account> {
  if (account.role !== 'driver') return account;
  const result = await getProvider();
  if (!result.ok || !result.data.provider) return { ...account, verified: false };
  const provider = result.data.provider;
  return {
    ...account,
    name: provider.name || account.name,
    phone: provider.phone || account.phone,
    vehicleNumber: provider.vehicle_number || account.vehicleNumber,
    vehicleModel: provider.vehicle_model || account.vehicleModel,
    verified: provider.verification_status === 'approved',
  };
}

function upsertAccount(accounts: Account[], account: Account) {
  const index = accounts.findIndex(
    (item) => item.id === account.id || item.email.toLowerCase() === account.email.toLowerCase(),
  );
  if (index === -1) return [...accounts, account];
  const next = accounts.slice();
  next[index] = { ...accounts[index], ...account, password: '' };
  return next;
}

function authError(message: string) {
  const text = message.toLowerCase();
  if (text.includes('invalid login')) return 'Email or password does not match.';
  if (text.includes('email not confirmed')) return 'Confirm your email first, then sign in.';
  if (text.includes('already registered')) return 'This email is already registered. Try signing in.';
  if (text.includes('rate limit')) {
    return 'Too many attempts. Please wait a while and try again.';
  }
  if (text.includes('signups not allowed')) {
    return 'No account found for this email. Create one first.';
  }
  if (text.includes('expired') || text.includes('otp') || text.includes('token')) {
    return 'That code is invalid or expired. Send a new one.';
  }
  if (text.includes('password')) return 'Use at least 6 characters.';
  return message;
}

function isPersisted(value: unknown): value is Persisted {
  if (!value || typeof value !== 'object') return false;
  const record = value as Persisted;
  return record.version === 1 && Array.isArray(record.accounts) && Array.isArray(record.rides);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ ...fresh(), ready: false });
  const [openRequests, setOpenRequests] = useState<Ride[]>([]);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let alive = true;
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), supabase.auth.getSession()])
      .then(([raw, sessionResult]) => {
        if (!alive) return;
        let base = fresh();
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isPersisted(parsed)) {
            base = {
              ...parsed,
              dismissed: parsed.dismissed ?? {},
              online: parsed.online ?? true,
            };
          }
        }
        const sessionUser = sessionResult.data.session?.user;
        if (!sessionUser) {
          setState({ ...base, sessionId: null, ready: true });
          return;
        }
        const account = profileFromUser(sessionUser);
        setState({
          ...base,
          accounts: upsertAccount(base.accounts, account),
          sessionId: account.id,
          ready: true,
        });
        if (account.role === 'passenger') {
          savePassenger({ name: account.name, phone: account.phone, email: account.email }).catch(() => {});
        }
        if (account.role === 'driver') {
          const persist = account.vehicleNumber
            ? saveProvider({
                name: account.name,
                phone: account.phone,
                email: account.email,
                vehicleNumber: account.vehicleNumber,
                vehicleModel: account.vehicleModel,
              })
            : Promise.resolve();
          persist
            .then(() => withProviderStatus(account))
            .then((next) => {
              if (!alive) return;
              setState((current) => ({
                ...current,
                accounts: upsertAccount(current.accounts, next),
                online: next.verified ? current.online : false,
              }));
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (alive) setState({ ...fresh(), ready: true });
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    const { ready: _ready, ...persisted } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(() => {});
  }, [state]);

  const user = useMemo(() => {
    const account = state.accounts.find((item) => item.id === state.sessionId);
    return account ? toPublic(account) : null;
  }, [state.accounts, state.sessionId]);

  const passengerRides = useMemo(() => {
    if (!user || user.role !== 'passenger') return [];
    return state.rides
      .filter((ride) => ride.passengerId === user.id || (!ride.passengerId && ride.passengerPhone === user.phone))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [state.rides, user]);

  const activePassengerRide = passengerRides.find((ride) => isPassengerOpen(ride.status)) ?? null;

  const driverRides = useMemo(() => {
    if (!user || user.role !== 'driver') return [];
    return state.rides
      .filter((ride) => ride.driverId === user.id || (!ride.driverId && ride.driverPhone === user.phone))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [state.rides, user]);

  const activeDriverRide = driverRides.find((ride) => isDriverOpen(ride.status)) ?? null;

  const incoming = useMemo(() => {
    if (!user || user.role !== 'driver' || !user.verified || !state.online) return [];
    const hidden = new Set(state.dismissed[user.phone] ?? []);
    return openRequests
      .filter((ride) => ride.status === 'requested' && !hidden.has(ride.id))
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [openRequests, state.dismissed, state.online, user]);

  useEffect(() => {
    if (!user || user.role !== 'driver' || !user.verified || !state.online) return;
    let stop = false;
    const load = () => {
      listOpenRides().then((result) => {
        if (stop || !result.ok) return;
        setOpenRequests(result.data.rides.map(bookedToRide));
      });
    };
    load();
    const timer = setInterval(load, 4000);
    const channel = supabase
      .channel(`open-rides-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, load)
      .subscribe();
    return () => {
      stop = true;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [state.online, user]);

  useEffect(() => {
    if (!user) return;
    let stop = false;
    const load = () => {
      listMyRides().then((result) => {
        if (stop || !result.ok) return;
        const rides = result.data.rides.map(bookedToRide);
        setState((current) => ({ ...current, rides: mergeRides(current.rides, rides) }));
      });
    };
    load();
    const timer = setInterval(load, 4000);
    const channel = supabase
      .channel(`my-rides-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, load)
      .subscribe();
    return () => {
      stop = true;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const rememberAccount = useCallback(async (account: Account) => {
    if (account.role === 'passenger') {
      await savePassenger({ name: account.name, phone: account.phone, email: account.email });
      return;
    }
    if (!account.vehicleNumber) return;
    await saveProvider({
      name: account.name,
      phone: account.phone,
      email: account.email,
      vehicleNumber: account.vehicleNumber,
      vehicleModel: account.vehicleModel,
    });
  }, []);

  const startSession = useCallback(async (user: User, role: Role): Promise<Result> => {
    const account = profileFromUser(user);
    if (account.role !== role) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error:
          account.role === 'driver'
            ? 'This email is registered as a service provider. Switch role and try again.'
            : 'This email is registered as a passenger. Switch role and try again.',
      };
    }
    await rememberAccount(account);
    const next = await withProviderStatus(account);
    setState((current) => ({
      ...current,
      accounts: upsertAccount(current.accounts, next),
      sessionId: next.id,
      online: next.role === 'driver' && !next.verified ? false : current.online,
    }));
    return { ok: true };
  }, [rememberAccount]);

  const login = useCallback(async (email: string, password: string, role: Role): Promise<Result> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.user) {
      return { ok: false, error: authError(error?.message ?? 'Could not sign in.') };
    }
    return startSession(data.user, role);
  }, [startSession]);

  const sendEmailOtp = useCallback(async (email: string): Promise<Result> => {
    const cleaned = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleaned)) {
      return { ok: false, error: 'Enter a valid email.' };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: cleaned,
      options: { shouldCreateUser: false },
    });
    if (error) return { ok: false, error: authError(error.message) };
    return { ok: true };
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, code: string, role: Role): Promise<Result> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    if (error || !data.user) {
      return { ok: false, error: authError(error?.message ?? 'Could not verify the code.') };
    }
    return startSession(data.user, role);
  }, [startSession]);

  const signup = useCallback(async (input: SignupInput): Promise<Result> => {
    const phone = normalizePhone(input.phone);
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password.trim(),
      options: {
        data: {
          name: input.name.trim().replace(/\s+/g, ' '),
          phone,
          role: input.role,
          vehicle_number: input.vehicleNumber?.trim().toUpperCase() ?? '',
          vehicle_model: input.vehicleModel?.trim() ?? '',
        },
      },
    });
    if (error || !data.user) {
      return { ok: false, error: authError(error?.message ?? 'Could not create the account.') };
    }
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { ok: false, error: 'This email is already registered. Try signing in.' };
    }
    if (!data.session) {
      return { ok: false, error: 'Account created. Check your email to confirm it, then sign in.' };
    }
    const account = profileFromUser(data.user);
    setState((current) => ({
      ...current,
      accounts: upsertAccount(current.accounts, account),
      sessionId: account.id,
    }));
    await rememberAccount(account);
    return { ok: true };
  }, [rememberAccount]);

  const logout = useCallback(() => {
    supabase.auth.signOut().catch(() => {});
    // Drop this account's cached rides so the next person on the device starts clean.
    setState((current) => ({ ...current, sessionId: null, rides: [], dismissed: {} }));
    setOpenRequests([]);
  }, []);

  const bookRide = useCallback(async (input: RideBooking) => {
    const session = stateRef.current.accounts.find((item) => item.id === stateRef.current.sessionId);
    if (!session || session.role !== 'passenger') {
      return { ok: false as const, error: 'Sign in as a passenger to book.' };
    }
    const alreadyActive = stateRef.current.rides.some(
      (ride) => ride.passengerPhone === session.phone && isPassengerOpen(ride.status),
    );
    if (alreadyActive) return { ok: false as const, error: 'You already have a ride in progress.' };
    const result = await createRide(input);
    if (!result.ok) return { ok: false as const, error: result.error };
    const ride = bookedToRide(result.data.ride);
    setState((current) => ({ ...current, rides: [ride, ...current.rides] }));
    return { ok: true as const, ride };
  }, []);

  const acceptRide = useCallback(async (id: string) => {
    const session = stateRef.current.accounts.find((item) => item.id === stateRef.current.sessionId);
    if (!session || session.role !== 'driver' || !session.verified || !stateRef.current.online) return false;
    const busy = stateRef.current.rides.some(
      (ride) => ride.driverPhone === session.phone && isDriverOpen(ride.status),
    );
    if (busy) return false;
    const result = await acceptOpenRide(id);
    if (!result.ok) return false;
    const ride = bookedToRide(result.data.ride);
    setState((current) => ({
      ...current,
      rides: [ride, ...current.rides.filter((item) => item.id !== id)],
    }));
    setOpenRequests((current) => current.filter((item) => item.id !== id));
    return true;
  }, []);

  const declineRide = useCallback((id: string) => {
    const session = stateRef.current.accounts.find((item) => item.id === stateRef.current.sessionId);
    if (!session || session.role !== 'driver') return;
    setState((current) => {
      const existing = current.dismissed[session.phone] ?? [];
      return {
        ...current,
        dismissed: {
          ...current.dismissed,
          [session.phone]: existing.includes(id) ? existing : [...existing, id],
        },
      };
    });
  }, []);

  const advanceRide = useCallback(async (id: string, otp?: string): Promise<Result> => {
    const result = await advanceServerRide(id, otp);
    if (!result.ok) return { ok: false, error: result.error };
    const ride = bookedToRide(result.data.ride);
    setState((current) => ({ ...current, rides: mergeRides(current.rides, [ride]) }));
    return { ok: true };
  }, []);

  const cancelRide = useCallback(async (id: string): Promise<Result> => {
    const session = stateRef.current.accounts.find((item) => item.id === stateRef.current.sessionId);
    if (!session || session.role !== 'passenger') {
      return { ok: false, error: 'Sign in as a passenger.' };
    }
    const result = await cancelServerRide(id);
    if (!result.ok) return { ok: false, error: result.error };
    const ride = bookedToRide(result.data.ride);
    setState((current) => ({ ...current, rides: mergeRides(current.rides, [ride]) }));
    return { ok: true };
  }, []);

  const refreshRides = useCallback(async (): Promise<Result> => {
    const session = stateRef.current.accounts.find((item) => item.id === stateRef.current.sessionId);
    if (!session) return { ok: false, error: 'Sign in required.' };

    const mine = await listMyRides();
    if (!mine.ok) return { ok: false, error: mine.error };
    const myRides = mine.data.rides.map(bookedToRide);
    setState((current) => ({ ...current, rides: mergeRides(current.rides, myRides) }));

    if (session.role === 'driver') {
      const next = await withProviderStatus(session);
      setState((current) => ({
        ...current,
        accounts: upsertAccount(current.accounts, next),
        online: next.verified ? current.online : false,
      }));
      if (next.verified && stateRef.current.online) {
        const open = await listOpenRides();
        if (!open.ok) return { ok: false, error: open.error };
        setOpenRequests(open.data.rides.map(bookedToRide));
      } else {
        setOpenRequests([]);
      }
    }
    return { ok: true };
  }, []);

  const setOnline = useCallback((value: boolean) => {
    const session = stateRef.current.accounts.find((item) => item.id === stateRef.current.sessionId);
    if (value && session?.role === 'driver' && !session.verified) return;
    setState((current) => ({ ...current, online: value }));
  }, []);

  const rideById = useCallback(
    (id: string) => state.rides.find((ride) => ride.id === id) ?? null,
    [state.rides],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready: state.ready,
      user,
      online: state.online,
      passengerRides,
      activePassengerRide,
      incoming,
      activeDriverRide,
      driverRides,
      rideById,
      login,
      sendEmailOtp,
      verifyEmailOtp,
      signup,
      logout,
      bookRide,
      acceptRide,
      declineRide,
      advanceRide,
      cancelRide,
      refreshRides,
      setOnline,
    }),
    [
      acceptRide,
      activeDriverRide,
      activePassengerRide,
      advanceRide,
      bookRide,
      cancelRide,
      declineRide,
      driverRides,
      incoming,
      login,
      logout,
      sendEmailOtp,
      verifyEmailOtp,
      passengerRides,
      refreshRides,
      rideById,
      setOnline,
      signup,
      state.online,
      state.ready,
      user,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
