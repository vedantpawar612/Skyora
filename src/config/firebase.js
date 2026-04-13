// Firebase Configuration
// AI Yoga Trainer - Connected to Firebase project: ai-yoga-trainer-b6cad
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBVkKR9jEZ-XXu5muENV-6ejTU2iMHQrYY",
  authDomain: "ai-yoga-trainer-b6cad.firebaseapp.com",
  projectId: "ai-yoga-trainer-b6cad",
  storageBucket: "ai-yoga-trainer-b6cad.firebasestorage.app",
  messagingSenderId: "275724266609",
  appId: "1:275724266609:web:da34838b2d6e30e40e7fd0",
  measurementId: "G-YLQ5JL4GZ7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
