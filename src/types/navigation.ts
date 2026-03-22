import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ---------------------------------------------------------------------------
// Root stack — auth gate
// ---------------------------------------------------------------------------
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

// ---------------------------------------------------------------------------
// Bottom tab navigator
// ---------------------------------------------------------------------------
export type TabParamList = {
  GardenTab: undefined;
  PlannerTab: undefined;
  PlantsTab: undefined;
  CameraTab: undefined;
  SettingsTab: undefined;
};

// ---------------------------------------------------------------------------
// Garden stack  (GARDEN-006, 007, 012)
// ---------------------------------------------------------------------------
export type GardenStackParamList = {
  GardenScreen: undefined;
  BedDetail: { bedId: string };
  GardenVisualization: undefined;
};

// ---------------------------------------------------------------------------
// Planner stack  (GARDEN-008, 009, 010, 013)
// ---------------------------------------------------------------------------
export type PlannerStackParamList = {
  PlannerScreen: undefined;
  WateringDetail: { plantingId: string };
  HarvestDetail: { plantingId: string };
};

// ---------------------------------------------------------------------------
// Plants stack  (GARDEN-005, 007)
// ---------------------------------------------------------------------------
export type PlantsStackParamList = {
  PlantBrowser: undefined;
  PlantReferenceDetail: { plantId: string };
};

// ---------------------------------------------------------------------------
// Settings stack  (GARDEN-008 zone, GARDEN-014 auth)
// ---------------------------------------------------------------------------
export type SettingsStackParamList = {
  SettingsScreen: undefined;
  ZoneSettings: undefined;
};

// ---------------------------------------------------------------------------
// Convenience screen prop types
// ---------------------------------------------------------------------------
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type GardenStackScreenProps<T extends keyof GardenStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<GardenStackParamList, T>,
    BottomTabScreenProps<TabParamList>
  >;

export type PlannerStackScreenProps<T extends keyof PlannerStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<PlannerStackParamList, T>,
    BottomTabScreenProps<TabParamList>
  >;

export type PlantsStackScreenProps<T extends keyof PlantsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<PlantsStackParamList, T>,
    BottomTabScreenProps<TabParamList>
  >;

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<SettingsStackParamList, T>,
    BottomTabScreenProps<TabParamList>
  >;
