// Firestore Database Service
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

class FirestoreService {
  // ========== USER OPERATIONS ==========

  // Create/update user profile
  async createUserProfile(uid, userData) {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...userData,
        createdAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get user profile
  async getUserProfile(uid) {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
      }
      return { data: null, error: 'User not found' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // ========== POSE OPERATIONS ==========

  // Get all poses
  async getPoses() {
    try {
      const querySnapshot = await getDocs(collection(db, 'poses'));
      const poses = [];
      querySnapshot.forEach((doc) => {
        poses.push({ id: doc.id, ...doc.data() });
      });
      return { data: poses, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Get pose by ID
  async getPoseById(poseId) {
    try {
      const docSnap = await getDoc(doc(db, 'poses', poseId));
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
      }
      return { data: null, error: 'Pose not found' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Seed poses to Firestore (utility function)
  async seedPoses(posesArray) {
    try {
      for (const pose of posesArray) {
        await setDoc(doc(db, 'poses', pose.id), pose);
      }
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // ========== PROGRESS OPERATIONS ==========

  // Save session progress
  async saveProgress(uid, progressData) {
    try {
      const progressRef = collection(db, 'users', uid, 'progress');
      await addDoc(progressRef, {
        ...progressData,
        timestamp: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get user progress history
  async getProgressHistory(uid, limitCount = 50) {
    try {
      const progressRef = collection(db, 'users', uid, 'progress');
      const q = query(progressRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      const progress = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        progress.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(),
        });
      });
      return { data: progress, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Get user stats (aggregated)
  async getUserStats(uid) {
    try {
      const { data: progress } = await this.getProgressHistory(uid, 1000);
      
      if (!progress || progress.length === 0) {
        return {
          data: {
            totalSessions: 0,
            averageAccuracy: 0,
            totalDuration: 0,
            dailyStreak: 0,
            bestAccuracy: 0,
            recentSessions: [],
          },
          error: null,
        };
      }

      const totalSessions = progress.length;
      const averageAccuracy = progress.reduce((sum, p) => sum + (p.accuracy || 0), 0) / totalSessions;
      const totalDuration = progress.reduce((sum, p) => sum + (p.duration || 0), 0);
      const bestAccuracy = Math.max(...progress.map(p => p.accuracy || 0));

      // Calculate daily streak
      const dailyStreak = this._calculateStreak(progress);

      return {
        data: {
          totalSessions,
          averageAccuracy: Math.round(averageAccuracy),
          totalDuration,
          dailyStreak,
          bestAccuracy: Math.round(bestAccuracy),
          recentSessions: progress.slice(0, 10),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Calculate daily streak
  _calculateStreak(progress) {
    if (!progress || progress.length === 0) return 0;

    const dates = [...new Set(
      progress.map(p => {
        const d = p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp);
        return d.toISOString().split('T')[0];
      })
    )].sort().reverse();

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if there's a session today or yesterday
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let checkDate = new Date(dates[0]);
    for (const dateStr of dates) {
      const expectedDate = checkDate.toISOString().split('T')[0];
      if (dateStr === expectedDate) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return streak;
  }
}

export default new FirestoreService();
