import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { canAccessModule, MODULE_LABELS } from '../config/roles';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { UserManagementScreen } from '../screens/UserManagementScreen';
import { RoleManagementScreen } from '../screens/RoleManagementScreen';
import { ModuleRecordsScreen } from '../screens/ModuleRecordsScreen';

const BUSINESS_MODULES = [
  'leads',
  'customers',
  'products',
  'orders',
  'invoices',
  'expenses',
  'documents',
] as const;

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Users: undefined;
  Roles: undefined;
  ModuleRecords: { moduleId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0f1419',
    card: '#1a222c',
    text: '#e8eef4',
    border: '#2e3d4f',
    primary: '#3d9a7a',
  },
};

function HeaderLinks({
  navigation,
}: {
  navigation: {
    navigate: (name: keyof RootStackParamList, params?: object) => void;
  };
}) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 12, marginRight: 8, alignItems: 'center' }}>
        {canAccessModule(user.role, 'users', user.rolePermissions) ? (
          <Pressable onPress={() => navigation.navigate('Users')}>
            <Text style={{ color: '#3d9a7a' }}>Users</Text>
          </Pressable>
        ) : null}
        {canAccessModule(user.role, 'roles', user.rolePermissions) ? (
          <Pressable onPress={() => navigation.navigate('Roles')}>
            <Text style={{ color: '#3d9a7a' }}>Roles</Text>
          </Pressable>
        ) : null}
        {BUSINESS_MODULES.filter((id) =>
          canAccessModule(user.role, id, user.rolePermissions)
        ).map((id) => (
          <Pressable
            key={id}
            onPress={() => navigation.navigate('ModuleRecords', { moduleId: id })}
          >
            <Text style={{ color: '#3d9a7a' }}>{MODULE_LABELS[id] ?? id}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function ModuleRecordsRoute({
  route,
}: {
  route: { params: { moduleId: string } };
}) {
  return <ModuleRecordsScreen moduleId={route.params.moduleId} />;
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1419', justifyContent: 'center' }}>
        <ActivityIndicator color="#3d9a7a" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: 'CRM',
                headerRight: () => <HeaderLinks navigation={navigation} />,
              })}
            />
            {canAccessModule(user.role, 'users', user.rolePermissions) ? (
              <Stack.Screen
                name="Users"
                component={UserManagementScreen}
                options={{ title: 'Users' }}
              />
            ) : null}
            {canAccessModule(user.role, 'roles', user.rolePermissions) ? (
              <Stack.Screen
                name="Roles"
                component={RoleManagementScreen}
                options={{ title: 'Roles' }}
              />
            ) : null}
            <Stack.Screen
              name="ModuleRecords"
              component={ModuleRecordsRoute}
              options={({ route }) => ({
                title: MODULE_LABELS[route.params.moduleId] ?? route.params.moduleId,
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
