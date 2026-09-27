import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { canPerform } from '../config/roles';
import {
  createUser,
  deleteUser,
  getRolesConfig,
  listUsers,
} from '../api/usersRoles';
import type { UserRecord } from '../types/auth';
import { ApiError } from '../api/client';

export function UserManagementScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const canCreate = canPerform(user?.role, 'users', 'create', user?.rolePermissions);
  const isAdmin = user?.role === 'admin';

  async function load() {
    setLoading(true);
    try {
      const [u, cfg] = await Promise.all([listUsers(), getRolesConfig()]);
      setUsers(u.data);
      setRoles(cfg.roles);
      if (cfg.roles[0]) setRole(cfg.roles[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate() {
    setError(null);
    try {
      await createUser({ fullName, email, password, role });
      setFullName('');
      setEmail('');
      setPassword('');
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
      <Text style={styles.title}>Users</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {canCreate ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor="#8fa3b8"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8fa3b8"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8fa3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Text style={styles.hint}>Role: {role}</Text>
          <View style={styles.row}>
            {roles.map((r) => (
              <Pressable
                key={r.id}
                style={[styles.chip, role === r.id && styles.chipOn]}
                onPress={() => setRole(r.id)}
              >
                <Text style={styles.chipText}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.btn} onPress={onCreate}>
            <Text style={styles.btnText}>Create user</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.fullName}</Text>
            <Text style={styles.meta}>
              {item.email} · {item.role}
            </Text>
            {isAdmin ? (
              <Pressable
                onPress={async () => {
                  try {
                    await deleteUser(item.id);
                    await load();
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : 'Delete failed');
                  }
                }}
              >
                <Text style={styles.danger}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
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
  hint: { color: '#8fa3b8', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#2e3d4f',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: '#3d9a7a', borderColor: '#3d9a7a' },
  chipText: { color: '#e8eef4', fontSize: 12 },
  btn: {
    backgroundColor: '#3d9a7a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
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
