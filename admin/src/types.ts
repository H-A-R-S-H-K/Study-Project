export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'vehicle_owner' | 'driver' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  ratingSummary: { average: number; count: number };
  createdAt: string;
}

export interface AdminStats {
  users: {
    total: number;
    customers: number;
    vehicleOwners: number;
    drivers: number;
    suspended: number;
  };
  requests: { total: number; open: number; matched: number; completed: number; cancelled: number };
  offers: { total: number };
  vehicles: { total: number };
  documents: { pending: number };
}

export interface AdminDocument {
  id: string;
  type: 'driving_license' | 'vehicle_registration' | 'identity';
  fileUrl: string;
  number?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  owner: { id: string; name: string; phone: string; role: string };
}

export interface AdminVehicle {
  id: string;
  type: string;
  title: string;
  registrationNumber: string;
  verifiedRegistration: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export interface AdminRequest {
  id: string;
  serviceType: string;
  vehicleType?: string;
  status: string;
  offersCount: number;
  pickup: { address: string };
  destination: { address: string };
  scheduledAt: string;
  createdAt: string;
}
