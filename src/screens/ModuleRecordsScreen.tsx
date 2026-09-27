import { useCallback, useEffect, useState } from 'react';
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
import { canPerform, MODULE_LABELS } from '../config/roles';
import {
  createModuleRecord,
  deleteModuleRecord,
  listModuleRecords,
  updateModuleRecord,
  type ModuleRecord,
} from '../api/modules';
import { ApiError } from '../api/client';

export function ModuleRecordsScreen({ moduleId }: { moduleId: string }) {
  const { user } = useAuth();
  const label = MODULE_LABELS[moduleId] ?? moduleId;
  const canCreate = canPerform(user?.role, moduleId, 'create', user?.rolePermissions);
  const canUpdate = canPerform(user?.role, moduleId, 'update', user?.rolePermissions);
  const canDelete = canPerform(user?.role, moduleId, 'delete', user?.rolePermissions);

  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState<ModuleRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listModuleRecords(moduleId);
      setRecords(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate() {
    setError(null);
    try {
      await createModuleRecord(moduleId, {
        title: title.trim(),
        notes: notes.trim() || undefined,
      });
      setTitle('');
      setNotes('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  async function onSaveEdit() {
    if (!editing) return;
    setError(null);
    try {
      await updateModuleRecord(moduleId, editing.id, {
        title: title.trim(),
        notes: notes.trim(),
      });
      setEditing(null);
      setTitle('');
      setNotes('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
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
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.hint}>
        {[
          canCreate ? 'create' : null,
          canUpdate ? 'edit' : null,
          canDelete ? 'delete' : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'view only'}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {canCreate || (canUpdate && editing) ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#8fa3b8"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Notes"
            placeholderTextColor="#8fa3b8"
            value={notes}
            onChangeText={setNotes}
          />
          {editing && canUpdate ? (
            <View style={styles.row}>
              <Pressable style={styles.btn} onPress={onSaveEdit}>
                <Text style={styles.btnText}>Save</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.secondary]}
                onPress={() => {
                  setEditing(null);
                  setTitle('');
                  setNotes('');
                }}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
            </View>
          ) : canCreate ? (
            <Pressable style={styles.btn} onPress={onCreate}>
              <Text style={styles.btnText}>Create</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.hint}>No {label.toLowerCase()} yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.status || 'open'}
              {item.notes ? ` · ${item.notes}` : ''}
            </Text>
            <View style={styles.row}>
              {canUpdate ? (
                <Pressable
                  onPress={() => {
                    setEditing(item);
                    setTitle(item.title);
                    setNotes(item.notes || '');
                  }}
                >
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
              ) : null}
              {canDelete ? (
                <Pressable
                  onPress={async () => {
                    try {
                      await deleteModuleRecord(moduleId, item.id);
                      await load();
                    } catch (err) {
                      setError(err instanceof ApiError ? err.message : 'Delete failed');
                    }
                  }}
                >
                  <Text style={styles.danger}>Delete</Text>
                </Pressable>
              ) : null}
              {!canUpdate && !canDelete ? (
                <Text style={styles.meta}>View only</Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419', padding: 16 },
  center: { flex: 1, backgroundColor: '#0f1419', justifyContent: 'center' },
  title: { fontSize: 28, color: '#e8eef4', fontWeight: '600' },
  hint: { color: '#8fa3b8', marginTop: 4, marginBottom: 12 },
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
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 },
  btn: {
    backgroundColor: '#3d9a7a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondary: { backgroundColor: '#243040' },
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
  link: { color: '#3d9a7a', fontWeight: '600' },
  danger: { color: '#d45d5d', fontWeight: '600' },
  error: { color: '#d45d5d', marginBottom: 8 },
});
