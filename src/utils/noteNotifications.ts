import { Note } from '@/types/note';
import { Capacitor } from '@capacitor/core';
import { scheduleReminder, cancelReminder } from './firebaseApi';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
  return true;
};

export const scheduleNoteReminder = async (note: Note): Promise<number | number[] | null> => {
  if (!note.reminderTime) return null;

  const reminderId = await scheduleReminder({
    title: 'Note Reminder',
    body: note.title,
    scheduledAt: new Date(note.reminderTime).toISOString(),
    data: { noteId: note.id, type: 'note' },
    repeatType: note.reminderRecurring && note.reminderRecurring !== 'none' ? note.reminderRecurring as any : null,
  });

  console.log('[FCM] Note reminder scheduled:', note.title, reminderId);
  return null;
};

export const cancelNoteReminder = async (notificationId: number | number[]): Promise<void> => {
  console.log('[FCM] Cancel note reminder delegated to backend:', notificationId);
};

export const updateNoteReminder = async (note: Note): Promise<number | number[] | null> => {
  if (note.id) {
    await cancelReminder({ noteId: note.id });
  }
  return scheduleNoteReminder(note);
};

export const getAllUpcomingReminders = async (): Promise<Array<{
  id: number;
  noteId: string;
  title: string;
  body: string;
  schedule: Date;
  recurring?: string;
}>> => {
  return [];
};

export const initializeNotificationListener = () => {
  console.log('Notification listener initialized (FCM mode)');
};
