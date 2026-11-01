import type { AuthUser, CrudAction, RolePermissions } from '../types/auth';

export const CRUD_ACTIONS: CrudAction[] = [
  'create',
  'read',
  'update',
  'delete',
  'approve',
  'release',
  'execute',
  'export',
];

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  roles: 'Roles',
  leads: 'Leads',
  customers: 'Customers',
  products: 'Products',
  orders: 'Orders',
  invoices: 'Invoices',
  expenses: 'Expenses',
  documents: 'Documents',
};

export const NAV_MODULES = [
  { moduleId: 'dashboard', label: 'Home', screen: 'Home' },
  { moduleId: 'users', label: 'Users', screen: 'Users' },
  { moduleId: 'roles', label: 'Roles', screen: 'Roles' },
] as const;

export function getModuleActions(
  permissions: RolePermissions | undefined | null,
  moduleId: string
): CrudAction[] | 'all' {
  if (permissions === '*') return 'all';
  if (!permissions) return [];
  return permissions.find((p) => p.moduleId === moduleId)?.actions ?? [];
}

export function canAccessModule(
  role: string | undefined,
  moduleId: string,
  rolePermissions?: RolePermissions | null
): boolean {
  if (role === 'admin') return true;
  if (rolePermissions == null) return false;
  const actions = getModuleActions(rolePermissions, moduleId);
  return actions === 'all' || (Array.isArray(actions) && actions.includes('read'));
}

export function canPerform(
  role: string | undefined,
  moduleId: string,
  action: CrudAction,
  rolePermissions?: RolePermissions | null
): boolean {
  if (role === 'admin') return true;
  if (rolePermissions == null) return false;
  const actions = getModuleActions(rolePermissions, moduleId);
  return actions === 'all' || (Array.isArray(actions) && actions.includes(action));
}

export function filterNav(user: AuthUser | null) {
  if (!user) return [];
  return NAV_MODULES.filter((m) =>
    canAccessModule(user.role, m.moduleId, user.rolePermissions)
  );
}
