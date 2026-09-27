import { api } from './client';

export interface ModuleRecord {
  id: string;
  moduleId: string;
  title: string;
  notes?: string;
  status?: string;
}

export const listModuleRecords = (moduleId: string) =>
  api.get<{ data: ModuleRecord[] }>(`/api/${moduleId}`);

export const createModuleRecord = (
  moduleId: string,
  body: { title: string; notes?: string; status?: string }
) => api.post<ModuleRecord>(`/api/${moduleId}`, body);

export const updateModuleRecord = (
  moduleId: string,
  id: string,
  body: { title?: string; notes?: string; status?: string }
) => api.patch<ModuleRecord>(`/api/${moduleId}/${id}`, body);

export const deleteModuleRecord = (moduleId: string, id: string) =>
  api.del(`/api/${moduleId}/${id}`);
