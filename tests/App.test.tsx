import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('displays the placeholder text', () => {
    render(<App />);
    expect(screen.getByText('Open up App.js to start working on your app!')).toBeTruthy();
  });
});
