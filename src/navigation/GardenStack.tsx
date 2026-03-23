import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GardenStackParamList } from '../types/navigation';
import GardenScreen from '../screens/garden/GardenScreen';
import BedDetailScreen from '../screens/garden/BedDetailScreen';
import GardenVisualizationScreen from '../screens/garden/GardenVisualizationScreen';

const Stack = createNativeStackNavigator<GardenStackParamList>();

export default function GardenStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0d1117' },
        headerTintColor: '#e6edf3',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0d1117' },
      }}
    >
      <Stack.Screen name="GardenScreen" component={GardenScreen} options={{ title: 'My Garden' }} />
      <Stack.Screen name="BedDetail" component={BedDetailScreen} options={{ title: 'Bed Detail' }} />
      <Stack.Screen name="GardenVisualization" component={GardenVisualizationScreen} options={{ title: '3D View' }} />
    </Stack.Navigator>
  );
}
