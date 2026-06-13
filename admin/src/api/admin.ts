import { api } from './client';
import type {
  ApiEnvelope,
  AdminStats,
  AdminUser,
  AdminDocument,
  AdminVehicle,
  AdminRequest,
  PaginationMeta,
} from '../types';

interface Page<T> {
  items: T[];
  meta?: PaginationMeta;
}

async function getList<T>(url: string): Promise<Page<T>> {
  const { data } = await api.get<ApiEnvelope<T[]>>(url);
  return { items: data.data, meta: data.meta };
}

export const adminApi = {
  async login(email: string, password: string): Promise<string> {
    const { data } = await api.post<ApiEnvelope<{ tokens: { accessToken: string } }>>(
      '/admin/auth/login',
      { email, password },
    );
    return data.data.tokens.accessToken;
  },

  async stats(): Promise<AdminStats> {
    const { data } = await api.get<ApiEnvelope<AdminStats>>('/admin/stats');
    return data.data;
  },

  users(params: { search?: string; role?: string; status?: string; page?: number }) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.role) sp.set('role', params.role);
    if (params.status) sp.set('status', params.status);
    if (params.page) sp.set('page', String(params.page));
    return getList<AdminUser>(`/admin/users?${sp.toString()}`);
  },

  async setUserStatus(id: string, status: 'active' | 'suspended'): Promise<void> {
    await api.patch(`/admin/users/${id}/status`, { status });
  },

  documents(status?: string) {
    return getList<AdminDocument>(`/admin/documents${status ? `?status=${status}` : ''}`);
  },

  async verifyDocument(id: string, status: 'verified' | 'rejected', reason?: string): Promise<void> {
    await api.patch(`/admin/documents/${id}/verify`, { status, reason });
  },

  vehicles(page?: number) {
    return getList<AdminVehicle>(`/admin/vehicles${page ? `?page=${page}` : ''}`);
  },

  requests(status?: string) {
    return getList<AdminRequest>(`/admin/requests${status ? `?status=${status}` : ''}`);
  },
};
