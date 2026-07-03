// Notification Service - Firebase Firestore operations for in-app notifications
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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

class NotificationService {
  // Create a notification for a user
  async createNotification(userId, type, title, message, data = {}) {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  }

  // Get notifications for a user, ordered by most recent
  async getNotifications(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const notifications = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notifications.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          readAt: data.readAt?.toDate?.() || null,
        });
      });
      return { data: notifications, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  // Get count of unread notifications
  async getUnreadCount(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return { count: querySnapshot.size, error: null };
    } catch (error) {
      return { count: 0, error: error.message };
    }
  }

  // Mark a single notification as read
  async markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Mark all unread notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { error: null };
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          read: true,
          readAt: serverTimestamp(),
        });
      });
      await batch.commit();

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }
}

export default new NotificationService();
