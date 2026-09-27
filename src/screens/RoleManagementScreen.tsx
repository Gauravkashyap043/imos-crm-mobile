import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CRUD_ACTIONS, canPerform } from '../config/roles';
import {
  createRole,
  deleteRole,
  getRolesConfig,
  listRoles,
  updateRole,
} from '../api/usersRoles';
import type { CrudAction, ModulePermission, RolePermissions, RoleRecord } from '../types/auth';
import { ApiError } from '../api/client';

function isFullAccess(p: RolePermissions) {
  return p === '*';
}

export function RoleManagementScreen() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [modules, setModules] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [fullAccess, setFullAccess] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, Set<CrudAction>>>({});

  const canCreate = canPerform(user?.role, 'roles', 'create', user?.rolePermissions);
  const canUpdate = canPerform(user?.role, 'roles', 'update', user?.rolePermissions);
  const isAdmin = user?.role === 'admin';

  const moduleIds = useMemo(() => modules.map((m) => m.id), [modules]);

  async function load() {
    setLoading(true);
    try {
      const [r, cfg] = await Promise.all([listRoles(), getRolesConfig()]);
      setRoles(r.data);
      setModules(cfg.modules);
      const empty: Record<string, Set<CrudAction>> = {};
      for (const m of cfg.modules) empty[m.id] = new Set();
      setMatrix(empty);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(moduleId: string, action: CrudAction) {
    setMatrix((prev) => {
      const next = { ...prev, [moduleId]: new Set(prev[moduleId] ?? []) };
      const set = next[moduleId];
      if (set.has(action)) {
        set.delete(action);
        if (action === 'read') set.clear();
      } else {
        set.add(action);
        if (action !== 'read') set.add('read');
      }
      return next;
    });
  }

  function toPermissions(): RolePermissions {
    if (fullAccess) return '*';
    const result: ModulePermission[] = [];
    for (const id of moduleIds) {
      const actions = Array.from(matrix[id] ?? []);
      if (actions.includes('read')) result.push({ moduleId: id, actions });
    }
    return result;
  }

  async function onCreate() {
    setError(null);
    try {
      await createRole({
        name: name.trim().toLowerCase(),
        label: label.trim(),
        permissions: toPermissions(),
      });
      setCreating(false);
      setName('');
      setLabel('');
      setFullAccess(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3d9a7a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Roles</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {canCreate ? (
        <Pressable style={styles.btn} onPress={() => setCreating((v) => !v)}>
          <Text style={styles.btnText}>{creating ? 'Cancel' : 'Create role'}</Text>
        </Pressable>
      ) : null}
      {creating ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="slug name"
            placeholderTextColor="#8fa3b8"
            autoCapitalize="none"
            value={name}
            onChangeText={(t) => setName(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          />
          <TextInput
            style={styles.input}
            placeholder="Label"
            placeholderTextColor="#8fa3b8"
            value={label}
            onChangeText={setLabel}
          />
          <View style={styles.switchRow}>
            <Text style={styles.meta}>Full access (*)</Text>
            <Switch value={fullAccess} onValueChange={setFullAccess} />
          </View>
          {!fullAccess
            ? modules.map((mod) => (
                <View key={mod.id} style={styles.moduleBlock}>
                  <Text style={styles.cardTitle}>{mod.label}</Text>
                  <View style={styles.row}>
                    {CRUD_ACTIONS.map((action) => {
                      const on = matrix[mod.id]?.has(action) ?? false;
                      return (
                        <Pressable
                          key={action}
                          style={[styles.chip, on && styles.chipOn]}
                          onPress={() => toggle(mod.id, action)}
                        >
                          <Text style={styles.chipText}>{action}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))
            : null}
          <Pressable style={styles.btn} onPress={onCreate}>
            <Text style={styles.btnText}>Save role</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={roles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const open = expanded === item.id;
          return (
            <View style={styles.card}>
              <Pressable onPress={() => setExpanded(open ? null : item.id)}>
                <Text style={styles.cardTitle}>
                  {item.label}{' '}
                  <Text style={styles.meta}>({item.name})</Text>
                </Text>
                <Text style={styles.meta}>
                  {isFullAccess(item.permissions)
                    ? 'Full access (*)'
                    : `${item.permissions.length} module(s)`}
                </Text>
              </Pressable>
              {open ? (
                <RoleEditBlock
                  role={item}
                  modules={modules}
                  canUpdate={canUpdate}
                  isAdmin={isAdmin}
                  onSaved={load}
                  onError={setError}
                />
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

function RoleEditBlock({
  role,
  modules,
  canUpdate,
  isAdmin,
  onSaved,
  onError,
}: {
  role: RoleRecord;
  modules: { id: string; label: string }[];
  canUpdate: boolean;
  isAdmin: boolean;
  onSaved: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [fullAccess, setFullAccess] = useState(isFullAccess(role.permissions));
  const [label, setLabel] = useState(role.label);
  const [matrix, setMatrix] = useState<Record<string, Set<CrudAction>>>(() => {
    const init: Record<string, Set<CrudAction>> = {};
    for (const m of modules) {
      if (role.permissions === '*') {
        init[m.id] = new Set();
      } else {
        const entry = role.permissions.find((p) => p.moduleId === m.id);
        init[m.id] = new Set(entry?.actions ?? []);
      }
    }
    return init;
  });

  function toggle(moduleId: string, action: CrudAction) {
    setMatrix((prev) => {
      const next = { ...prev, [moduleId]: new Set(prev[moduleId] ?? []) };
      const set = next[moduleId];
      if (set.has(action)) {
        set.delete(action);
        if (action === 'read') set.clear();
      } else {
        set.add(action);
        if (action !== 'read') set.add('read');
      }
      return next;
    });
  }

  function toPermissions(): RolePermissions {
    if (fullAccess || role.name === 'admin') return '*';
    const result: ModulePermission[] = [];
    for (const m of modules) {
      const actions = Array.from(matrix[m.id] ?? []);
      if (actions.includes('read')) result.push({ moduleId: m.id, actions });
    }
    return result;
  }

  return (
    <View style={{ marginTop: 8 }}>
      {canUpdate ? (
        <>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholderTextColor="#8fa3b8"
          />
          {role.name !== 'admin' ? (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.meta}>Full access (*)</Text>
                <Switch value={fullAccess} onValueChange={setFullAccess} />
              </View>
              {!fullAccess
                ? modules.map((mod) => (
                    <View key={mod.id} style={styles.moduleBlock}>
                      <Text style={styles.cardTitle}>{mod.label}</Text>
                      <View style={styles.row}>
                        {CRUD_ACTIONS.map((action) => {
                          const on = matrix[mod.id]?.has(action) ?? false;
                          return (
                            <Pressable
                              key={action}
                              style={[styles.chip, on && styles.chipOn]}
                              onPress={() => toggle(mod.id, action)}
                            >
                              <Text style={styles.chipText}>{action}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))
                : null}
            </>
          ) : (
            <Text style={styles.meta}>Admin always has full access.</Text>
          )}
          <Pressable
            style={[styles.btn, { marginTop: 8 }]}
            onPress={async () => {
              try {
                await updateRole(role.id, {
                  label,
                  permissions: toPermissions(),
                });
                await onSaved();
              } catch (err) {
                onError(err instanceof ApiError ? err.message : 'Update failed');
              }
            }}
          >
            <Text style={styles.btnText}>Save changes</Text>
          </Pressable>
        </>
      ) : null}
      {isAdmin && role.name !== 'admin' ? (
        <Pressable
          onPress={async () => {
            try {
              await deleteRole(role.id);
              await onSaved();
            } catch (err) {
              onError(err instanceof ApiError ? err.message : 'Delete failed');
            }
          }}
        >
          <Text style={styles.danger}>Delete</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419', padding: 16 },
  center: { flex: 1, backgroundColor: '#0f1419', justifyContent: 'center' },
  title: { fontSize: 28, color: '#e8eef4', fontWeight: '600', marginBottom: 12 },
  form: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#2e3d4f',
    borderRadius: 10,
    padding: 12,
    color: '#e8eef4',
    marginBottom: 8,
    backgroundColor: '#1a222c',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moduleBlock: { marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    borderWidth: 1,
    borderColor: '#2e3d4f',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipOn: { backgroundColor: '#3d9a7a', borderColor: '#3d9a7a' },
  chipText: { color: '#e8eef4', fontSize: 12 },
  btn: {
    backgroundColor: '#3d9a7a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  card: {
    borderWidth: 1,
    borderColor: '#2e3d4f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#1a222c',
  },
  cardTitle: { color: '#e8eef4', fontWeight: '600' },
  meta: { color: '#8fa3b8', marginTop: 4 },
  danger: { color: '#d45d5d', marginTop: 8 },
  error: { color: '#d45d5d', marginBottom: 8 },
});
