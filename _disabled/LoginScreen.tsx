import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { login } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function LoginScreen() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    const result = await login(email, password);

    if (!result.success) {
      setError(result.message || 'Login failed');
      return;
    }

    setUser({ email, role: result.role });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Car Cab Login</Text>

      <TextInput
        style={styles.input}
        placeholder='Email'
        placeholderTextColor='#888'
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder='Password'
        placeholderTextColor='#888'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 28, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#222', color: '#fff', padding: 12, marginBottom: 12, borderRadius: 8 },
  button: { backgroundColor: '#ff6600', padding: 15, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' }
});
