import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../types/navigation';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ZoneSettingsScreen from '../screens/settings/ZoneSettingsScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0d1117' },
        headerTintColor: '#e6edf3',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0d1117' },
      }}
    >
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="ZoneSettings" component={ZoneSettingsScreen} options={{ title: 'Growing Zone' }} />
    </Stack.Navigator>
  );
}
