export type CrudAction = 'create' | 'read' | 'update' | 'delete';

export interface ModulePermission {
  moduleId: string;
  actions: CrudAction[];
}

export type RolePermissions = ModulePermission[] | '*';

export interface AuthUser {
  id: string;
  fullName?: string;
  email: string;
  phone?: string;
  role?: string;
  rolePermissions?: RolePermissions;
  roleModules?: string[];
}

export interface RoleRecord {
  id: string;
  name: string;
  label: string;
  permissions: RolePermissions;
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
}
