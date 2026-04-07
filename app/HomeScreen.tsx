import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const BOX_WIDTH = width * 0.88;
const BORDER_WIDTH = BOX_WIDTH * 0.04;
const BORDER_RADIUS = BOX_WIDTH * 0.06;

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>Welcome to Car Cab</Text>

      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.missionBox}>
        <Text style={styles.missionText}>
          Our mission is to protect our community by preventing impaired driving, promoting responsible
          choices, and educating people about the dangers of operating a vehicle under the influence.
          Our vehicle-retrieval service provides a safe, judgment-free alternative that helps impaired
          drivers and their vehicles get home safely while keeping our roadways safer.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/tabs')}>
        <Text style={styles.buttonText}>Menu</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 30,
  },

  title: {
    color: '#D4AF37',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },

  logo: {
    width: width * 0.55,
    height: width * 0.35,
    marginBottom: 20,
  },

  missionBox: {
    width: BOX_WIDTH,
    borderWidth: BORDER_WIDTH,
    borderColor: '#D4AF37',
    borderRadius: BORDER_RADIUS,
    padding: 18,
    backgroundColor: '#000',
  },

  missionText: {
    color: '#D4AF37',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    paddingHorizontal: 56,
    borderRadius: 10,
  },

  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
});
