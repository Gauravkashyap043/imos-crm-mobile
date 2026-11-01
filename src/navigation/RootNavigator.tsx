import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { canAccessModule } from '../config/roles';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { UserManagementScreen } from '../screens/UserManagementScreen';
import { RoleManagementScreen } from '../screens/RoleManagementScreen';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Users: undefined;
  Roles: undefined;
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
      </View>
    </ScrollView>
  );
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
