// Teacher Service - Firebase Firestore operations for teacher workflows
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

class TeacherService {
  // ========== TEACHER PROFILE ==========

  // Get teacher profile by ID
  async getTeacherProfile(teacherId) {
    try {
      const docSnap = await getDoc(doc(db, 'teachers', teacherId));
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
      }
      return { data: null, error: 'Teacher not found' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Update teacher profile (merge)
  async updateTeacherProfile(teacherId, updates) {
    try {
      await setDoc(doc(db, 'teachers', teacherId), {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get all teachers
  async getAllTeachers() {
    try {
      const querySnapshot = await getDocs(collection(db, 'teachers'));
      const teachers = [];
      querySnapshot.forEach((docSnap) => {
        teachers.push({ id: docSnap.id, ...docSnap.data() });
      });
      return { data: teachers, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // ========== DASHBOARD STATS ==========

  // Aggregate dashboard statistics for a teacher
  async getTeacherDashboardStats(teacherId) {
    try {
      let totalStudents = 0;
      let activeStudents = 0;
      let totalCourses = 0;
      let totalRevenue = 0;
      let attendancePercentage = 0;
      let upcomingClasses = 0;

      // Count courses
      try {
        const coursesQuery = query(
          collection(db, 'courses'),
          where('teacherId', '==', teacherId)
        );
        const coursesSnap = await getDocs(coursesQuery);
        totalCourses = coursesSnap.size;
      } catch (e) {
        // Collection may not exist yet
      }

      // Count enrollments & unique students
      try {
        const enrollQuery = query(
          collection(db, 'enrollments'),
          where('teacherId', '==', teacherId)
        );
        const enrollSnap = await getDocs(enrollQuery);
        const studentIds = new Set();
        const activeStudentIds = new Set();
        enrollSnap.forEach((docSnap) => {
          const data = docSnap.data();
          studentIds.add(data.studentId);
          if (data.status === 'active') {
            activeStudentIds.add(data.studentId);
          }
        });
        totalStudents = studentIds.size;
        activeStudents = activeStudentIds.size;
      } catch (e) {
        // Collection may not exist yet
      }

      // Sum payments / revenue
      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('teacherId', '==', teacherId),
          where('status', '==', 'completed')
        );
        const paymentsSnap = await getDocs(paymentsQuery);
        paymentsSnap.forEach((docSnap) => {
          totalRevenue += docSnap.data().amount || 0;
        });
      } catch (e) {
        // Collection may not exist yet
      }

      // Calculate attendance percentage
      try {
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('teacherId', '==', teacherId)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        if (attendanceSnap.size > 0) {
          let present = 0;
          attendanceSnap.forEach((docSnap) => {
            if (docSnap.data().status === 'present') present++;
          });
          attendancePercentage = Math.round((present / attendanceSnap.size) * 100);
        }
      } catch (e) {
        // Collection may not exist yet
      }

      // Count upcoming live classes
      try {
        const now = new Date();
        const classesQuery = query(
          collection(db, 'live_classes'),
          where('teacherId', '==', teacherId),
          where('status', '==', 'scheduled')
        );
        const classesSnap = await getDocs(classesQuery);
        classesSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const classDate = data.scheduledAt?.toDate?.() || new Date(data.scheduledAt);
          if (classDate >= now) {
            upcomingClasses++;
          }
        });
      } catch (e) {
        // Collection may not exist yet
      }

      return {
        data: {
          totalStudents,
          activeStudents,
          totalCourses,
          totalRevenue,
          attendancePercentage,
          upcomingClasses,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: {
          totalStudents: 0,
          activeStudents: 0,
          totalCourses: 0,
          totalRevenue: 0,
          attendancePercentage: 0,
          upcomingClasses: 0,
        },
        error: error.message,
      };
    }
  }

  // ========== TEACHER'S STUDENTS ==========

  // Get all unique students enrolled in teacher's courses
  async getTeacherStudents(teacherId) {
    try {
      const enrollQuery = query(
        collection(db, 'enrollments'),
        where('teacherId', '==', teacherId)
      );
      const enrollSnap = await getDocs(enrollQuery);

      // Collect unique student IDs
      const studentIds = new Set();
      enrollSnap.forEach((docSnap) => {
        studentIds.add(docSnap.data().studentId);
      });

      if (studentIds.size === 0) {
        return { data: [], error: null };
      }

      // Fetch each student's profile
      const students = [];
      for (const studentId of studentIds) {
        try {
          const studentDoc = await getDoc(doc(db, 'users', studentId));
          if (studentDoc.exists()) {
            students.push({ id: studentDoc.id, ...studentDoc.data() });
          }
        } catch (e) {
          // Skip students whose profiles can't be fetched
        }
      }

      return { data: students, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }
}

export default new TeacherService();
