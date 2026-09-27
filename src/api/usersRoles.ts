import { api } from './client';
import type { RolePermissions, RoleRecord, UserRecord } from '../types/auth';

export const listUsers = () => api.get<{ data: UserRecord[] }>('/api/users');
export const createUser = (body: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}) => api.post<UserRecord>('/api/users', body);
export const updateUser = (
  id: string,
  body: { fullName?: string; role?: string; phone?: string }
) => api.patch<UserRecord>(`/api/users/${id}`, body);
export const deleteUser = (id: string) => api.del(`/api/users/${id}`);
export const resetPassword = (id: string, password: string) =>
  api.patch(`/api/users/${id}/password`, { password });

export const listRoles = () => api.get<{ data: RoleRecord[] }>('/api/roles');
export const createRole = (body: {
  name: string;
  label: string;
  permissions: RolePermissions;
}) => api.post<RoleRecord>('/api/roles', body);
export const updateRole = (
  id: string,
  body: { label?: string; permissions?: RolePermissions }
) => api.patch<RoleRecord>(`/api/roles/${id}`, body);
export const deleteRole = (id: string) => api.del(`/api/roles/${id}`);

export const getRolesConfig = () =>
  api.get<{
    roles: { id: string; label: string }[];
    modules: { id: string; label: string }[];
    actions: string[];
  }>('/api/config/roles');
