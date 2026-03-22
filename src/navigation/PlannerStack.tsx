import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../types/navigation';
import PlannerScreen from '../screens/planner/PlannerScreen';
import WateringDetailScreen from '../screens/planner/WateringDetailScreen';
import HarvestDetailScreen from '../screens/planner/HarvestDetailScreen';

const Stack = createNativeStackNavigator<PlannerStackParamList>();

export default function PlannerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0d1117' },
        headerTintColor: '#e6edf3',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0d1117' },
      }}
    >
      <Stack.Screen name="PlannerScreen" component={PlannerScreen} options={{ title: 'Planner' }} />
      <Stack.Screen name="WateringDetail" component={WateringDetailScreen} options={{ title: 'Watering' }} />
      <Stack.Screen name="HarvestDetail" component={HarvestDetailScreen} options={{ title: 'Harvest' }} />
    </Stack.Navigator>
  );
}
