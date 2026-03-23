import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


export default function PlantReferenceDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Plant Reference</Text>
      <Text style={styles.sub}>GARDEN-005 · Days, spacing, companions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117' },
  text: { fontSize: 22, fontWeight: '700', color: '#e6edf3' },
  sub: { fontSize: 12, color: '#8b949e', marginTop: 6 },
});
