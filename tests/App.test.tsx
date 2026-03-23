import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import GardenScreen from '../src/screens/garden/GardenScreen';

// React Navigation's native-stack and bottom-tabs rely on react-native-screens
// native modules that cannot run in Jest. We mock the navigators so individual
// screens can be tested in isolation without the full native stack.
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactModule = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: View,
    SafeAreaInsetsContext: ReactModule.createContext(insets),
    SafeAreaFrameContext: ReactModule.createContext(frame),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { frame, insets },
  };
});

// Minimal navigation mock — enough to satisfy useNavigation/useRoute calls
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
  };
});

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as never;

const mockRoute = { key: 'GardenScreen', name: 'GardenScreen', params: undefined } as never;

describe('GardenScreen', () => {
  it('renders without crashing', () => {
    render(
      <NavigationContainer>
        <GardenScreen navigation={mockNavigation} route={mockRoute} />
      </NavigationContainer>,
    );
  });

  it('displays the screen title', () => {
    render(
      <NavigationContainer>
        <GardenScreen navigation={mockNavigation} route={mockRoute} />
      </NavigationContainer>,
    );
    expect(screen.getByText('Garden')).toBeTruthy();
  });

  it('displays the ticket reference', () => {
    render(
      <NavigationContainer>
        <GardenScreen navigation={mockNavigation} route={mockRoute} />
      </NavigationContainer>,
    );
    expect(screen.getByText('GARDEN-006 · Bed list + 3D entry')).toBeTruthy();
  });
});
