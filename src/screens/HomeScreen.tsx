import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function HomeScreen() {
  const { user, logout, refresh } = useAuth();
  const modules =
    user?.rolePermissions === '*'
      ? 'Full access (*)'
      : (user?.roleModules ?? []).join(', ') || 'None';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.meta}>
        {user?.fullName} · {user?.role}
      </Text>
      <Text style={styles.meta}>Modules: {modules}</Text>
      <Text style={styles.note}>
        Leads, orders, and stock live on the web CRM. This app is for sign-in, users, and roles until typed field screens ship.
      </Text>
      <Pressable style={styles.btn} onPress={() => refresh()}>
        <Text style={styles.btnText}>Refresh /me</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.secondary]} onPress={() => logout()}>
        <Text style={styles.btnText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419', padding: 20 },
  title: { fontSize: 28, color: '#e8eef4', fontWeight: '600', marginBottom: 8 },
  meta: { color: '#8fa3b8', marginBottom: 6 },
  note: { color: '#8fa3b8', marginTop: 12, lineHeight: 20 },
  btn: {
    marginTop: 16,
    backgroundColor: '#3d9a7a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondary: { backgroundColor: '#243040' },
  btnText: { color: '#fff', fontWeight: '600' },
});
