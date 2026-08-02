// Firebase Configuration
// Skyora - Connected to Firebase project: skyora-yoga-trainer-8df26
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyC1f6Ft4R-4BnVQPkPy18WeX2CX7yUE0IY",
  authDomain: "skyora-yoga-trainer-8df26.firebaseapp.com",
  projectId: "skyora-yoga-trainer-8df26",
  storageBucket: "skyora-yoga-trainer-8df26.firebasestorage.app",
  messagingSenderId: "588165867994",
  appId: "1:588165867994:web:e5bee1a643d8e4b6cf38e3",
  measurementId: "G-0DZ2RBJJQ6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
// getReactNativePersistence doesn't exist in the browser build of firebase/auth
let auth;
if (Platform.OS === 'web') {
  auth = initializeAuth(app, { persistence: browserLocalPersistence });
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    auth = getAuth(app);
  }
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
