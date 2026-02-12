/**
 * Habit Reminder Notifications
 * Scheduling handled via Firebase Cloud Functions.
 */

import { Habit } from '@/types/habit';
import { scheduleReminder, cancelReminder } from './firebaseApi';

export const scheduleHabitReminder = async (habit: Habit): Promise<number[]> => {
  if (!habit.reminder?.enabled || !habit.reminder?.time) {
    console.log('[FCM] No reminder configured for habit:', habit.name);
    return [];
  }

  // Build a full date from HH:mm time string for today
  const [hours, minutes] = habit.reminder.time.split(':').map(Number);
  const scheduledDate = new Date();
  scheduledDate.setHours(hours, minutes, 0, 0);
  if (scheduledDate <= new Date()) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  const reminderId = await scheduleReminder({
    title: 'Habit Reminder',
    body: habit.name,
    scheduledAt: scheduledDate.toISOString(),
    data: { habitId: habit.id, type: 'habit' as string },
    repeatType: 'daily',
  });

  console.log('[FCM] Habit reminder scheduled:', habit.name, reminderId);
  return [];
};

export const cancelHabitReminder = async (habit: Habit): Promise<void> => {
  await cancelReminder({ taskId: habit.id });
  console.log('[FCM] Habit reminder cancelled:', habit.name);
};

export const rescheduleAllHabitReminders = async (habits: Habit[]): Promise<void> => {
  for (const habit of habits) {
    if (habit.reminder?.enabled) {
      await scheduleHabitReminder(habit);
    }
  }
  console.log('[FCM] All habit reminders rescheduled');
};
