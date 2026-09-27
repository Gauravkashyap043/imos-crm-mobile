import { api } from './client';
import type { AuthUser } from '../types/auth';

export function login(email: string, password: string) {
  return api.post<{ token: string; user: AuthUser }>('/api/auth/login', {
    email,
    password,
  });
}

export function fetchMe() {
  return api.get<{ user: AuthUser }>('/api/auth/me');
}
