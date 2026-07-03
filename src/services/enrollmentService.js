// Enrollment Service - Firebase Firestore operations for student enrollments & progress
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

class EnrollmentService {
  // ========== ENROLLMENT OPERATIONS ==========

  // Enroll a student in a course
  async enrollStudent(studentId, courseId, teacherId, paymentId = null) {
    try {
      const docRef = await addDoc(collection(db, 'enrollments'), {
        studentId,
        courseId,
        teacherId,
        paymentId,
        status: 'active',
        progress: 0,
        completedLessons: [],
        enrolledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  }

  // Get all enrollments for a student
  async getEnrollmentsByStudent(studentId) {
    try {
      const q = query(
        collection(db, 'enrollments'),
        where('studentId', '==', studentId),
        orderBy('enrolledAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const enrollments = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        enrollments.push({
          id: docSnap.id,
          ...data,
          enrolledAt: data.enrolledAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      return { data: enrollments, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Get all enrollments for a specific course
  async getEnrollmentsByCourse(courseId) {
    try {
      const q = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId),
        orderBy('enrolledAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const enrollments = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        enrollments.push({
          id: docSnap.id,
          ...data,
          enrolledAt: data.enrolledAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      return { data: enrollments, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Get all enrollments for a teacher's courses
  async getEnrollmentsByTeacher(teacherId) {
    try {
      const q = query(
        collection(db, 'enrollments'),
        where('teacherId', '==', teacherId),
        orderBy('enrolledAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const enrollments = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        enrollments.push({
          id: docSnap.id,
          ...data,
          enrolledAt: data.enrolledAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      return { data: enrollments, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // ========== PROGRESS OPERATIONS ==========

  // Update lesson completion progress
  async updateProgress(enrollmentId, lessonId, completed) {
    try {
      const enrollRef = doc(db, 'enrollments', enrollmentId);
      const enrollSnap = await getDoc(enrollRef);

      if (!enrollSnap.exists()) {
        return { error: 'Enrollment not found' };
      }

      const enrollData = enrollSnap.data();
      let completedLessons = enrollData.completedLessons || [];

      if (completed && !completedLessons.includes(lessonId)) {
        completedLessons = [...completedLessons, lessonId];
      } else if (!completed) {
        completedLessons = completedLessons.filter((id) => id !== lessonId);
      }

      // Calculate progress percentage
      // We estimate total lessons from what we know, or use totalLessons if stored
      const totalLessons = enrollData.totalLessons || completedLessons.length;
      const progress = totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0;

      await updateDoc(enrollRef, {
        completedLessons,
        progress,
        updatedAt: serverTimestamp(),
      });

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get student progress for a specific enrollment
  async getStudentProgress(enrollmentId) {
    try {
      const docSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          data: {
            id: docSnap.id,
            ...data,
            enrolledAt: data.enrolledAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          },
          error: null,
        };
      }
      return { data: null, error: 'Enrollment not found' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
}

export default new EnrollmentService();
