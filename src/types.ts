export type Role = 'passenger' | 'driver';

export type Account = {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
  vehicleNumber?: string;
  vehicleModel?: string;
  verified?: boolean;
};

export type PublicAccount = Omit<Account, 'password'>;

export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arriving'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type Ride = {
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
  pickupArea?: string;
  pickupLat?: number;
  pickupLng?: number;
  drop: string;
  dropArea?: string;
  dropLat?: number;
  dropLng?: number;
  fare: number;
  distanceKm: number;
  minutes: number;
  status: RideStatus;
  otp: string;
  createdAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  updatedAt?: string;
};

export type SignupInput = {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
  vehicleNumber?: string;
  vehicleModel?: string;
};

export type Place = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
};
