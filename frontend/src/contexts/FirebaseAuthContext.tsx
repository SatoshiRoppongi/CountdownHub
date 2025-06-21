import React, { createContext, useContext, useEffect, useState } from 'react';
  import {
    User,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    TwitterAuthProvider,
    signOut,
    onAuthStateChanged
  } from 'firebase/auth';
  import { auth } from '../config/firebase';

  interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signInWithTwitter: () => Promise<void>;
    logout: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!auth) {
        setLoading(false);
        return;
      }
      
      const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        setUser(user);
        setLoading(false);

        // JWTトークンをバックエンドに送信してユーザー作成/更新
        if (user) {
          user.getIdToken().then((token: string) => {
            localStorage.setItem('firebase_token', token);
            // バックエンドのユーザー作成API呼び出し
            syncUserWithBackend(user, token);
          });
        } else {
          localStorage.removeItem('firebase_token');
        }
      });

      return unsubscribe;
    }, []);

    const syncUserWithBackend = async (firebaseUser: User, token: string) => {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/auth/firebase-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            provider: firebaseUser.providerData[0]?.providerId
          })
        });
      } catch (error) {
        console.error('Failed to sync user with backend:', error);
      }
    };

    const signInWithGoogle = async () => {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    };

    const signInWithGithub = async () => {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
    };

    const signInWithTwitter = async () => {
      const provider = new TwitterAuthProvider();
      await signInWithPopup(auth, provider);
    };

    const logout = async () => {
      await signOut(auth);
    };

    const value = {
      user,
      loading,
      signInWithGoogle,
      signInWithGithub,
      signInWithTwitter,
      logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };

  export const useFirebaseAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
    }
    return context;
  };