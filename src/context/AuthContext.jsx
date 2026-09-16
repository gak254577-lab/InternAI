import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  onAuthStateChanged,
  fbUpdateProfile,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  isFirebaseConfigured
} from '../services/firebase';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const { showToast } = useToast();

  // Helper to map Firebase error codes to clean, user-friendly messages
  const getFriendlyErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completion.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/api-key-not-valid':
        return 'Firebase API key is invalid. Please check your .env configuration.';
      default:
        return error.message || 'An authentication error occurred. Please try again.';
    }
  };

  // Fetch or create user document in Firestore: users/{userId}
  const syncUserProfile = async (user, additionalData = {}) => {
    if (!user) {
      setUserProfile(null);
      return null;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserProfile(data);
        return data;
      } else {
        // Initial user document creation as required in Task 4
        const newProfile = {
          uid: user.uid,
          name: additionalData.name || user.displayName || 'Student Candidate',
          email: user.email,
          photoURL: user.photoURL || '/images/student_avatar.png',
          phone: additionalData.phone || '+91 98765 43210',
          college: 'Indian Institute of Technology, Roorkee',
          degree: 'B.Tech Computer Science & Engineering',
          branch: 'Computer Science',
          year: '3rd Year',
          graduationYear: '2027',
          cgpa: '9.12',
          skills: ['React.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
          interests: ['Full Stack', 'Distributed Systems', 'Cloud Infrastructure'],
          github: 'https://github.com/',
          linkedin: 'https://linkedin.com/in/',
          projects: [
            {
              id: 'p1',
              title: 'SyncFlow — Real-Time Collaborative Whiteboard',
              desc: 'Low-latency WebSockets drawing canvas with CRDT conflict-free resolution and Redis pub/sub.',
              tags: ['React', 'TypeScript', 'WebSockets', 'Redis'],
              stars: 142
            }
          ],
          certifications: [
            {
              name: 'AWS Certified Cloud Practitioner',
              issuer: 'Amazon Web Services',
              date: '2026'
            }
          ],
          resumeMetadata: {
            resumeName: 'Student_Resume_2026.pdf',
            updatedAt: new Date().toISOString()
          },
          readinessScore: 86,
          status: 'Ready to Apply',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('Firestore sync note:', err);
      // Fallback local profile if Firestore is offline or permissions pending
      const fallback = {
        uid: user.uid,
        name: user.displayName || additionalData.name || 'Student Candidate',
        email: user.email,
        photoURL: user.photoURL || '/images/student_avatar.png',
        phone: '+91 98765 43210',
        college: 'Indian Institute of Technology, Roorkee',
        degree: 'B.Tech Computer Science & Engineering',
        branch: 'Computer Science',
        year: '3rd Year',
        graduationYear: '2027',
        cgpa: '9.12',
        skills: ['React.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
        interests: ['Full Stack', 'Distributed Systems'],
        github: 'https://github.com/',
        linkedin: 'https://linkedin.com/in/',
        projects: [],
        certifications: [],
        readinessScore: 86,
        status: 'Ready to Apply'
      };
      setUserProfile(fallback);
      return fallback;
    }
  };

  // Subscribe to Firebase Auth state
  useEffect(() => {
    // Check if dev user was previously authenticated
    const saved = localStorage.getItem('internai_auth_user');
    if (saved && !currentUser) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        syncUserProfile(u);
      } catch (e) {
        console.warn('Error parsing cached user:', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        await syncUserProfile(user);
      } else if (!saved) {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register with Email & Password
  const registerWithEmail = async (name, email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (!isFirebaseConfigured) {
        // Development mode fallback when real Firebase project is not yet provisioned in .env
        const devUser = {
          uid: 'dev_user_' + Date.now(),
          email,
          displayName: name || 'Student Candidate',
          photoURL: '/images/student_avatar.png'
        };
        localStorage.setItem('internai_auth_user', JSON.stringify(devUser));
        setCurrentUser(devUser);
        await syncUserProfile(devUser, { name });
        showToast(`Account registered in dev mode! Welcome, ${name || email}!`, 'success');
        return devUser;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (name) {
        await fbUpdateProfile(user, { displayName: name });
      }

      await syncUserProfile(user, { name });
      showToast(`Account created successfully! Welcome, ${name || email}!`, 'success');
      return user;
    } catch (err) {
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
        const devUser = {
          uid: 'dev_user_' + Date.now(),
          email,
          displayName: name || 'Student Candidate',
          photoURL: '/images/student_avatar.png'
        };
        localStorage.setItem('internai_auth_user', JSON.stringify(devUser));
        setCurrentUser(devUser);
        await syncUserProfile(devUser, { name });
        showToast(`Signed up (Dev Fallback: configure live keys in .env)`, 'success');
        return devUser;
      }
      const msg = getFriendlyErrorMessage(err);
      setAuthError(msg);
      showToast(msg, 'error');
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Login with Email & Password
  const loginWithEmail = async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (!isFirebaseConfigured) {
        const saved = localStorage.getItem('internai_auth_user');
        const devUser = saved
          ? JSON.parse(saved)
          : {
              uid: 'dev_student_001',
              email,
              displayName: email.split('@')[0],
              photoURL: '/images/student_avatar.png'
            };
        localStorage.setItem('internai_auth_user', JSON.stringify(devUser));
        setCurrentUser(devUser);
        await syncUserProfile(devUser);
        showToast(`Signed in as ${devUser.displayName || devUser.email}!`, 'success');
        return devUser;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await syncUserProfile(user);
      showToast(`Welcome back, ${user.displayName || user.email}!`, 'success');
      return user;
    } catch (err) {
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
        const devUser = {
          uid: 'dev_student_001',
          email,
          displayName: email.split('@')[0],
          photoURL: '/images/student_avatar.png'
        };
        localStorage.setItem('internai_auth_user', JSON.stringify(devUser));
        setCurrentUser(devUser);
        await syncUserProfile(devUser);
        showToast(`Signed in (Dev Fallback: configure live keys in .env)`, 'success');
        return devUser;
      }
      const msg = getFriendlyErrorMessage(err);
      setAuthError(msg);
      showToast(msg, 'error');
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Google Sign-In
  const loginWithGoogle = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (!isFirebaseConfigured) {
        const devUser = {
          uid: 'dev_google_student',
          email: 'student.google@iitr.ac.in',
          displayName: 'Aanya Sharma',
          photoURL: '/images/student_avatar.png'
        };
        localStorage.setItem('internai_auth_user', JSON.stringify(devUser));
        setCurrentUser(devUser);
        await syncUserProfile(devUser, { name: devUser.displayName });
        showToast(`Google Sign-In successful (Dev Mode)!`, 'success');
        return devUser;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await syncUserProfile(user, { name: user.displayName });
      showToast(`Signed in with Google as ${user.displayName || user.email}!`, 'success');
      return user;
    } catch (err) {
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
        const devUser = {
          uid: 'dev_google_student',
          email: 'student.google@iitr.ac.in',
          displayName: 'Aanya Sharma',
          photoURL: '/images/student_avatar.png'
        };
        localStorage.setItem('internai_auth_user', JSON.stringify(devUser));
        setCurrentUser(devUser);
        await syncUserProfile(devUser, { name: devUser.displayName });
        showToast(`Google Sign-In simulated (Dev Mode)`, 'success');
        return devUser;
      }
      const msg = getFriendlyErrorMessage(err);
      setAuthError(msg);
      showToast(msg, 'error');
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setAuthLoading(true);
    try {
      localStorage.removeItem('internai_auth_user');
      if (isFirebaseConfigured) {
        await fbSignOut(auth);
      }
      setCurrentUser(null);
      setUserProfile(null);
      showToast('You have been signed out.', 'info');
    } catch (err) {
      showToast('Error signing out. Please try again.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Update Profile in Firestore: users/{userId}
  const updateUserProfile = async (updatedData) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const payload = {
        ...updatedData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, payload);
      setUserProfile((prev) => ({ ...prev, ...updatedData }));
      showToast('Profile updated and saved to Firestore!', 'success');
    } catch (err) {
      console.warn('Firestore update error:', err);
      // Update local state even if offline
      setUserProfile((prev) => ({ ...prev, ...updatedData }));
      showToast('Profile saved locally.', 'info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        authLoading,
        authError,
        setAuthError,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        updateUserProfile,
        isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
