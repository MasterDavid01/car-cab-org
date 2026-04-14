import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/AuthContext';

export default function Layout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }} />
    </AuthProvider>
  );
}
