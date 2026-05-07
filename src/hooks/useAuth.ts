import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, signOut, isFirebaseReady } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady()) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (!isFirebaseReady()) {
      alert("Firebase is not configured yet. Please check back later.");
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        // Persist briefly for session
        sessionStorage.setItem('google_drive_token', credential.accessToken);
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAccessToken(null);
      sessionStorage.removeItem('google_drive_token');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return { user, loading, login, logout, accessToken: accessToken || (typeof window !== 'undefined' ? sessionStorage.getItem('google_drive_token') : null), isConfigured: isFirebaseReady() };
}
