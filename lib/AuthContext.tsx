import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { db } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { isAuthorizedAdmin } from './adminAccess';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  profileLoading: boolean;
  role: 'customer' | 'driver' | 'admin' | null;
  customerProfile: Record<string, any> | null;
  driverProfile: Record<string, any> | null;
  signUp: (email: string, password: string, role: 'customer' | 'driver') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatAuthError(err: any) {
  const code = err?.code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email address is already registered.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-up is not enabled in Firebase Authentication.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase. Check internet connection and try again.';
    case 'auth/user-not-found':
      return 'No account found for that email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    default:
      return err?.message || 'Authentication failed';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'driver' | 'admin' | null>(null);
  const [customerProfile, setCustomerProfile] = useState<Record<string, any> | null>(null);
  const [driverProfile, setDriverProfile] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setCustomerProfile(null);
      setDriverProfile(null);
      setProfileLoading(false);
      return;
    }

    let customerReady = false;
    let driverReady = false;

    const finishLoading = () => {
      if (customerReady && driverReady) {
        setProfileLoading(false);
      }
    };

    setProfileLoading(true);

    const unsubscribeCustomer = onSnapshot(
      doc(db, 'customerCompliance', user.uid),
      (snapshot) => {
        setCustomerProfile(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        customerReady = true;
        finishLoading();
      },
      () => {
        setCustomerProfile(null);
        customerReady = true;
        finishLoading();
      }
    );

    const unsubscribeDriver = onSnapshot(
      doc(db, 'drivers', user.uid),
      (snapshot) => {
        setDriverProfile(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        driverReady = true;
        finishLoading();
      },
      () => {
        setDriverProfile(null);
        driverReady = true;
        finishLoading();
      }
    );

    return () => {
      unsubscribeCustomer();
      unsubscribeDriver();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }

    if (isAuthorizedAdmin(user)) {
      setRole('admin');
      return;
    }

    if (driverProfile) {
      setRole('driver');
      return;
    }

    if (customerProfile) {
      setRole('customer');
      return;
    }

    setRole(null);
  }, [customerProfile, driverProfile, user]);

  const signUp = async (email: string, password: string, userRole: 'customer' | 'driver') => {
    try {
      setError(null);
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      setUser(newUser);
      setRole(userRole);
    } catch (err: any) {
      const message = formatAuthError(err);
      setError(message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { user: signedInUser } = await signInWithEmailAndPassword(auth, email, password);
      setUser(signedInUser);
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setCustomerProfile(null);
      setDriverProfile(null);
      setRole(null);
    } catch (err: any) {
      setError(formatAuthError(err));
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, profileLoading, role, customerProfile, driverProfile, signUp, signIn, resetPassword, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
