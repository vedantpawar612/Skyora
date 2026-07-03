// AuthContext - Global authentication and role management
// Provides user, role, and profile data to the entire app tree
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/authService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const AuthContext = createContext(null);

/**
 * Hook to access auth context from any component.
 * Returns: { user, userProfile, userRole, loading, isTeacher, isStudent,
 *            signIn, signUp, signUpTeacher, signOut, refreshProfile, updateUserProfile }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and role from Firestore
  const fetchUserProfile = useCallback(async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = { id: userDoc.id, ...userDoc.data() };
        setUserProfile(data);
        setUserRole(data.role || 'student');
        return data;
      } else {
        // User exists in Auth but not in Firestore — create a default student profile
        const defaultProfile = {
          name: user?.displayName || 'User',
          email: user?.email || '',
          role: 'student',
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', uid), defaultProfile);
        setUserProfile({ id: uid, ...defaultProfile });
        setUserRole('student');
        return defaultProfile;
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
      setUserRole('student'); // Default to student on error
      return null;
    }
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchUserProfile]);

  // Sign in (student or teacher — role auto-detected from Firestore)
  const signIn = useCallback(async (email, password) => {
    const result = await authService.signIn(email, password);
    return result;
  }, []);

  // Sign up as student
  const signUp = useCallback(async (email, password, displayName, extraData = {}) => {
    const result = await authService.signUp(email, password, displayName);
    if (result.user) {
      // Create Firestore profile with student role
      await setDoc(doc(db, 'users', result.user.uid), {
        name: displayName,
        email: email,
        role: 'student',
        mobile: extraData.mobile || '',
        age: extraData.age || null,
        profilePhoto: '',
        createdAt: serverTimestamp(),
      });
    }
    return result;
  }, []);

  // Sign up as teacher
  const signUpTeacher = useCallback(async (email, password, teacherData) => {
    const result = await authService.signUp(email, password, teacherData.name);
    if (result.user) {
      const uid = result.user.uid;

      // Create user doc with teacher role
      await setDoc(doc(db, 'users', uid), {
        name: teacherData.name,
        email: email,
        role: 'teacher',
        mobile: teacherData.mobile || '',
        profilePhoto: teacherData.profilePhoto || '',
        createdAt: serverTimestamp(),
      });

      // Create detailed teacher profile doc
      await setDoc(doc(db, 'teachers', uid), {
        name: teacherData.name,
        email: email,
        mobile: teacherData.mobile || '',
        bio: teacherData.bio || '',
        specialization: teacherData.specialization || [],
        yearsOfExperience: teacherData.yearsOfExperience || 0,
        certifications: teacherData.certifications || [],
        profilePhoto: teacherData.profilePhoto || '',
        rating: 0,
        totalStudents: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return result;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const result = await authService.logout();
    return result;
  }, []);

  // Refresh profile data from Firestore
  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      return await fetchUserProfile(user.uid);
    }
  }, [user, fetchUserProfile]);

  // Update user profile fields in Firestore
  const updateUserProfile = useCallback(async (updates) => {
    if (!user?.uid) return { error: 'Not authenticated' };
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // If teacher, also update teacher profile
      if (userRole === 'teacher') {
        await setDoc(doc(db, 'teachers', user.uid), {
          ...updates,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }, [user, userRole, refreshProfile]);

  const value = {
    // State
    user,
    userProfile,
    userRole,
    loading,

    // Computed
    isTeacher: userRole === 'teacher',
    isStudent: userRole === 'student' || userRole === null,
    isAuthenticated: !!user,

    // Actions
    signIn,
    signUp,
    signUpTeacher,
    signOut,
    refreshProfile,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
