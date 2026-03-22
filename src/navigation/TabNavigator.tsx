import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import type { TabParamList } from '../types/navigation';
import GardenStack from './GardenStack';
import PlannerStack from './PlannerStack';
import PlantsStack from './PlantsStack';
import CameraScreen from '../screens/camera/CameraScreen';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d1117',
          borderTopColor: '#21262d',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#3fb950',
        tabBarInactiveTintColor: '#8b949e',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="GardenTab"
        component={GardenStack}
        options={{
          tabBarLabel: 'Garden',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌿" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PlannerTab"
        component={PlannerStack}
        options={{
          tabBarLabel: 'Planner',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PlantsTab"
        component={PlantsStack}
        options={{
          tabBarLabel: 'Plants',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="CameraTab"
        component={CameraScreen}
        options={{
          tabBarLabel: 'Camera',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📷" focused={focused} />,
          headerShown: true,
          headerTitle: 'AI Camera',
          headerStyle: { backgroundColor: '#0d1117' },
          headerTintColor: '#e6edf3',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
