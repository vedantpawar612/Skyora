// Course Service - Firebase Firestore CRUD for courses, modules, and lessons
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

class CourseService {
  // ========== COURSE OPERATIONS ==========

  // Create a new course
  async createCourse(teacherId, courseData) {
    try {
      const docRef = await addDoc(collection(db, 'courses'), {
        ...courseData,
        teacherId,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  }

  // Update an existing course
  async updateCourse(courseId, updates) {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Delete a course
  async deleteCourse(courseId) {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get all courses by a specific teacher
  async getCoursesByTeacher(teacherId) {
    try {
      const q = query(
        collection(db, 'courses'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const courses = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        courses.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      return { data: courses, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Get a single course by ID
  async getCourseById(courseId) {
    try {
      const docSnap = await getDoc(doc(db, 'courses', courseId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          data: {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          },
          error: null,
        };
      }
      return { data: null, error: 'Course not found' };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Get all published courses with optional filters
  async getAllCourses(filters = {}) {
    try {
      let q;
      const constraints = [where('status', '==', 'published')];

      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.level) {
        constraints.push(where('level', '==', filters.level));
      }

      q = query(collection(db, 'courses'), ...constraints);
      const querySnapshot = await getDocs(q);
      let courses = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        courses.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });

      // Client-side search filter (Firestore doesn't support full-text search)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        courses = courses.filter(
          (course) =>
            (course.title || '').toLowerCase().includes(searchLower) ||
            (course.description || '').toLowerCase().includes(searchLower)
        );
      }

      return { data: courses, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // ========== MODULE OPERATIONS ==========

  // Create a module within a course
  async createModule(courseId, moduleData) {
    try {
      const modulesRef = collection(db, 'courses', courseId, 'modules');
      const docRef = await addDoc(modulesRef, {
        ...moduleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  }

  // Update a module
  async updateModule(courseId, moduleId, updates) {
    try {
      await updateDoc(doc(db, 'courses', courseId, 'modules', moduleId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Delete a module
  async deleteModule(courseId, moduleId) {
    try {
      await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId));
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get all modules for a course, ordered by 'order' field
  async getModules(courseId) {
    try {
      const q = query(
        collection(db, 'courses', courseId, 'modules'),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const modules = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        modules.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      return { data: modules, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // ========== LESSON OPERATIONS ==========

  // Create a lesson within a module
  async createLesson(courseId, moduleId, lessonData) {
    try {
      const lessonsRef = collection(
        db, 'courses', courseId, 'modules', moduleId, 'lessons'
      );
      const docRef = await addDoc(lessonsRef, {
        ...lessonData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  }

  // Update a lesson
  async updateLesson(courseId, moduleId, lessonId, updates) {
    try {
      await updateDoc(
        doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId),
        {
          ...updates,
          updatedAt: serverTimestamp(),
        }
      );
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Delete a lesson
  async deleteLesson(courseId, moduleId, lessonId) {
    try {
      await deleteDoc(
        doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId)
      );
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get all lessons for a module, ordered by 'order' field
  async getLessons(courseId, moduleId) {
    try {
      const q = query(
        collection(db, 'courses', courseId, 'modules', moduleId, 'lessons'),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const lessons = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        lessons.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      return { data: lessons, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }
}

export default new CourseService();
