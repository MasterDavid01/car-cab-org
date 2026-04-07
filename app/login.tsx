import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Select Login</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/driver-login')}
        >
          <Text style={styles.text}>Driver Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/customer-login')}
        >
          <Text style={styles.text}>Customer Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: { 
    color: '#D4AF37', 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 40 
  },
  button: { 
    backgroundColor: '#D4AF37', 
    padding: 20, 
    borderRadius: 10, 
    marginBottom: 20 
  },
  text: { 
    color: '#000', 
    fontSize: 20, 
    fontWeight: '700', 
    textAlign: 'center' 
  },
});
