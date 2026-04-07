import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA5I8W821O2wqJPxlz-Aa8ZDSDYzOoD77I",
  authDomain: "carcaborgapp.firebaseapp.com",
  projectId: "carcaborgapp",
  storageBucket: "carcaborgapp.firebasestorage.app",
  messagingSenderId: "86096437498",
  appId: "1:86096437498:web:13f03cb0341a3e6f6da943"
};

const app = initializeApp(firebaseConfig);

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);
