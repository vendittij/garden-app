import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


export default function GardenScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Garden</Text>
      <Text style={styles.sub}>GARDEN-006 · Bed list + 3D entry</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117' },
  text: { fontSize: 22, fontWeight: '700', color: '#e6edf3' },
  sub: { fontSize: 12, color: '#8b949e', marginTop: 6 },
});
