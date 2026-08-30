import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { env } from './src/config/env';
import './src/lib/supabase';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase is configured</Text>
      <Text style={styles.subtitle}>Environment: {env.appEnvironment}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
  },
});
