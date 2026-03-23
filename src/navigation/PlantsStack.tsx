import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PlantsStackParamList } from '../types/navigation';
import PlantBrowserScreen from '../screens/plants/PlantBrowserScreen';
import PlantReferenceDetailScreen from '../screens/plants/PlantReferenceDetailScreen';

const Stack = createNativeStackNavigator<PlantsStackParamList>();

export default function PlantsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0d1117' },
        headerTintColor: '#e6edf3',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0d1117' },
      }}
    >
      <Stack.Screen name="PlantBrowser" component={PlantBrowserScreen} options={{ title: 'Plant Database' }} />
      <Stack.Screen name="PlantReferenceDetail" component={PlantReferenceDetailScreen} options={{ title: 'Plant Info' }} />
    </Stack.Navigator>
  );
}
