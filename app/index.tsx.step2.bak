import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const IS_COMPACT = height < 760;
const BOX_WIDTH = Math.min(width * 0.88, 420);
const BORDER_WIDTH = BOX_WIDTH * 0.04;
const BORDER_RADIUS = BOX_WIDTH * 0.06;

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>Welcome to Car Cab Org</Text>

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

      <TouchableOpacity style={styles.button} onPress={() => router.push('/menu')}>
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
    justifyContent: 'center',
    paddingVertical: IS_COMPACT ? 14 : 24,
  },

  title: {
    color: '#D4AF37',
    fontSize: IS_COMPACT ? 24 : 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: IS_COMPACT ? 6 : 10,
  },

  logo: {
    width: IS_COMPACT ? width * 0.48 : width * 0.55,
    height: IS_COMPACT ? width * 0.3 : width * 0.35,
    marginBottom: IS_COMPACT ? 14 : 20,
  },

  missionBox: {
    width: BOX_WIDTH,
    borderWidth: BORDER_WIDTH,
    borderColor: '#D4AF37',
    borderRadius: BORDER_RADIUS,
    padding: IS_COMPACT ? 14 : 18,
    backgroundColor: '#000',
    marginTop: IS_COMPACT ? 4 : 8,
  },

  missionText: {
    color: '#D4AF37',
    fontSize: IS_COMPACT ? 14 : 16,
    lineHeight: IS_COMPACT ? 20 : 22,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: IS_COMPACT ? 12 : 14,
    paddingHorizontal: IS_COMPACT ? 50 : 56,
    borderRadius: 10,
    marginTop: IS_COMPACT ? 18 : 30,
  },

  buttonText: {
    color: '#000',
    fontSize: IS_COMPACT ? 17 : 18,
    fontWeight: '700',
  },
});
