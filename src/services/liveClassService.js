// Live Class Service - Firebase Firestore operations for live classes
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';

class LiveClassService {
  // ========== CLASS MANAGEMENT ==========

  // Create a new live class
  async createLiveClass(teacherId, classData) {
    try {
      const docRef = await addDoc(collection(db, 'live_classes'), {
        ...classData,
        teacherId,
        status: 'scheduled',
        registeredStudents: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  }

  // Update a live class
  async updateLiveClass(classId, updates) {
    try {
      await updateDoc(doc(db, 'live_classes', classId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Cancel a live class
  async cancelLiveClass(classId) {
    try {
      await updateDoc(doc(db, 'live_classes', classId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get all live classes for a teacher
  async getLiveClassesByTeacher(teacherId) {
    try {
      const q = query(
        collection(db, 'live_classes'),
        where('teacherId', '==', teacherId),
        orderBy('scheduledAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const classes = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        classes.push({
          id: docSnap.id,
          ...data,
          scheduledAt: data.scheduledAt?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      return { data: classes, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Get all upcoming live classes (scheduled, date >= now)
  async getUpcomingLiveClasses() {
    try {
      const q = query(
        collection(db, 'live_classes'),
        where('status', '==', 'scheduled'),
        orderBy('scheduledAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const now = new Date();
      const classes = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const scheduledAt = data.scheduledAt?.toDate?.() || new Date(data.scheduledAt);
        // Only include future classes
        if (scheduledAt >= now) {
          classes.push({
            id: docSnap.id,
            ...data,
            scheduledAt,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          });
        }
      });
      return { data: classes, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // ========== STUDENT REGISTRATION ==========

  // Register a student for a live class
  async registerForClass(studentId, classId) {
    try {
      await updateDoc(doc(db, 'live_classes', classId), {
        registeredStudents: arrayUnion(studentId),
        updatedAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Unregister a student from a live class
  async unregisterFromClass(studentId, classId) {
    try {
      await updateDoc(doc(db, 'live_classes', classId), {
        registeredStudents: arrayRemove(studentId),
        updatedAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get class data with registered students
  async getClassRegistrations(classId) {
    try {
      const docSnap = await getDoc(doc(db, 'live_classes', classId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          data: {
            id: docSnap.id,
            ...data,
            scheduledAt: data.scheduledAt?.toDate?.() || new Date(),
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          },
          error: null,
        };
      }
      return { data: null, error: 'Live class not found' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
}

export default new LiveClassService();
