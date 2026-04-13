// Firebase Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

class AuthService {
  // Sign up with email and password
  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      await updateProfile(userCredential.user, { displayName });
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: this._getErrorMessage(error.code) };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: this._getErrorMessage(error.code) };
    }
  }

  // Sign out
  async logout() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Send password reset email
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error) {
      return { error: this._getErrorMessage(error.code) };
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Map Firebase error codes to friendly messages
  _getErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please check your email and password.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

export default new AuthService();
