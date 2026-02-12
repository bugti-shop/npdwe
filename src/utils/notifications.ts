import { Capacitor } from '@capacitor/core';
import { TodoItem, Note, Priority } from '@/types/note';
import { RepeatSettings, RepeatFrequency } from '@/components/TaskDateTimePage';
import { addMinutes, addHours, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { triggerTripleHeavyHaptic } from './haptics';
import { getSetting, setSetting } from './settingsStorage';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDeviceToken, scheduleReminder, cancelReminder } from './firebaseApi';

const DEFAULT_NOTIFICATION_ICON = 'npd_notification_icon';

export interface NotificationData {
  taskId?: string;
  noteId?: string;
  type: 'task' | 'note' | 'budget' | 'bill';
  recurring?: boolean;
  recurringType?: string;
  originalTitle?: string;
  originalBody?: string;
  category?: string;
  percentage?: number;
  billId?: string;
  dueDate?: string;
  priority?: Priority;
}

export type SnoozeOption = '5min' | '15min' | '1hour' | '3hours' | 'tomorrow';

export const TASK_REMINDER_ACTION_TYPE_ID = 'TASK_REMINDER_ACTION_TYPE';
export const SNOOZE_ACTION_TYPE_ID = 'SNOOZE_ACTION_TYPE';

/**
 * NotificationManager - FCM only (local notifications removed)
 * All scheduling is now handled by your external backend via FCM.
 * Methods are kept as no-ops to avoid breaking callers.
 */
export class NotificationManager {
  private static instance: NotificationManager;
  private permissionGranted = false;
  private initialized = false;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Register for FCM push notifications
        const permResult = await PushNotifications.requestPermissions();
        this.permissionGranted = permResult.receive === 'granted';
        if (this.permissionGranted) {
          await PushNotifications.register();
        }

        // Listen for FCM push events
        await PushNotifications.addListener('registration', async (token) => {
          console.log('FCM token:', token.value);
          await setSetting('pushToken', token.value);
          // Register token with Firebase backend
          await registerDeviceToken(token.value);
        });

        await PushNotifications.addListener('registrationError', (err) => {
          console.error('FCM registration error:', err.error);
        });

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('FCM push received:', notification);
          triggerTripleHeavyHaptic();

          // Store in notification history
          getSetting<any[]>('notificationHistory', []).then(history => {
            history.unshift({
              id: Date.now(),
              title: notification.title,
              body: notification.body,
              timestamp: new Date().toISOString(),
              read: false,
              extra: notification.data,
            });
            setSetting('notificationHistory', history.slice(0, 100));
          });

          window.dispatchEvent(new CustomEvent('notificationReceived', { detail: notification }));
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('FCM action performed:', action.actionId);
          const data = action.notification.data as NotificationData | undefined;

          if (data?.taskId) {
            if (action.actionId === 'complete') {
              window.dispatchEvent(new CustomEvent('completeTaskFromNotification', {
                detail: { taskId: data.taskId }
              }));
            } else {
              window.dispatchEvent(new CustomEvent('taskNotificationTapped', {
                detail: { taskId: data.taskId }
              }));
            }
          } else if (data?.noteId) {
            window.dispatchEvent(new CustomEvent('noteNotificationTapped', {
              detail: { noteId: data.noteId }
            }));
          }
        });
      }

      this.initialized = true;
      console.log('NotificationManager initialized (FCM only)');
    } catch (error) {
      console.error('Failed to initialize NotificationManager:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const result = await PushNotifications.requestPermissions();
      this.permissionGranted = result.receive === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const result = await PushNotifications.checkPermissions();
      this.permissionGranted = result.receive === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // === All scheduling methods are now no-ops (handled by your FCM backend) ===

  async scheduleTaskReminder(
    task: TodoItem,
    reminderOffset?: string,
    repeatSettings?: RepeatSettings
  ): Promise<number[]> {
    const scheduledAt = task.reminderTime || task.dueDate;
    if (!scheduledAt) {
      console.log('[FCM] No reminder time set for task:', task.text);
      return [];
    }

    const reminderId = await scheduleReminder({
      title: 'Task Reminder',
      body: task.text,
      scheduledAt: new Date(scheduledAt).toISOString(),
      data: { taskId: task.id, type: 'task', priority: task.priority || 'medium' },
      repeatType: repeatSettings?.frequency as any || null,
    });

    console.log('[FCM] Task reminder scheduled:', task.text, reminderId);
    return [];
  }

  async scheduleNoteReminder(note: Note): Promise<number[]> {
    if (!note.reminderTime) {
      console.log('[FCM] No reminder date set for note:', note.title);
      return [];
    }

    const reminderId = await scheduleReminder({
      title: 'Note Reminder',
      body: note.title,
      scheduledAt: new Date(note.reminderTime).toISOString(),
      data: { noteId: note.id, type: 'note' },
      repeatType: note.reminderRecurring && note.reminderRecurring !== 'none' ? note.reminderRecurring as any : null,
    });

    console.log('[FCM] Note reminder scheduled:', note.title, reminderId);
    return [];
  }

  async cancelTaskReminder(taskId: string, notificationIds?: number[]): Promise<void> {
    await cancelReminder({ taskId });
    console.log('[FCM] Task reminder cancelled for:', taskId);
  }

  async cancelNoteReminder(noteId: string, notificationIds?: number[]): Promise<void> {
    await cancelReminder({ noteId });
    console.log('[FCM] Note reminder cancelled for:', noteId);
  }

  async snoozeNotification(notification: any, snoozeOption: SnoozeOption): Promise<void> {
    const snoozeMinutes: Record<SnoozeOption, number> = {
      '5min': 5, '15min': 15, '1hour': 60, '3hours': 180, 'tomorrow': 1440,
    };
    const minutes = snoozeMinutes[snoozeOption] || 15;
    const snoozeAt = addMinutes(new Date(), minutes);

    const data = notification.data || notification.extra || {};
    await scheduleReminder({
      title: notification.title || 'Snoozed Reminder',
      body: notification.body || '',
      scheduledAt: snoozeAt.toISOString(),
      data: {
        ...(data.taskId ? { taskId: data.taskId } : {}),
        ...(data.noteId ? { noteId: data.noteId } : {}),
        type: data.type || 'task',
        snoozed: 'true',
      },
    });
    console.log('[FCM] Snoozed notification for', snoozeOption);
  }

  async getAutoReminderTimes(): Promise<{ morning: number; afternoon: number; evening: number }> {
    try {
      const saved = await getSetting<{ morning: number; afternoon: number; evening: number } | null>('autoReminderTimes', null);
      if (saved) return saved;
    } catch (e) {
      console.error('Error loading auto-reminder times:', e);
    }
    return { morning: 9, afternoon: 14, evening: 19 };
  }

  async scheduleAutoReminders(task: TodoItem): Promise<number[]> {
    const times = await this.getAutoReminderTimes();
    const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();

    for (const [label, hour] of Object.entries(times)) {
      const reminderDate = new Date(dueDate);
      reminderDate.setHours(hour, 0, 0, 0);
      if (reminderDate > new Date()) {
        await scheduleReminder({
          title: `${label.charAt(0).toUpperCase() + label.slice(1)} Reminder`,
          body: task.text,
          scheduledAt: reminderDate.toISOString(),
          data: { taskId: task.id, type: 'task', autoReminder: label },
        });
      }
    }
    console.log('[FCM] Auto-reminders scheduled for:', task.text);
    return [];
  }

  async cancelAutoReminders(taskId: string): Promise<void> {
    await cancelReminder({ taskId });
    console.log('[FCM] Auto-reminders cancelled for:', taskId);
  }

  async cancelAllReminders(): Promise<void> {
    console.log('[FCM] Cancel all reminders — clear from backend if needed');
  }

  async getPendingNotifications(): Promise<any[]> {
    return [];
  }

  async rescheduleAllTasks(tasks: TodoItem[]): Promise<void> {
    for (const task of tasks) {
      if (task.reminderTime || task.dueDate) {
        await this.scheduleTaskReminder(task);
      }
    }
    console.log('[FCM] All tasks rescheduled');
  }

  async getNotificationHistory(): Promise<any[]> {
    return getSetting<any[]>('notificationHistory', []);
  }

  async clearNotificationHistory(): Promise<void> {
    await setSetting('notificationHistory', []);
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    const history = await getSetting<any[]>('notificationHistory', []);
    const updatedHistory = history.map((item: any) =>
      item.id === notificationId ? { ...item, read: true } : item
    );
    await setSetting('notificationHistory', updatedHistory);
  }

  async scheduleBudgetAlert(
    category: string,
    spent: number,
    budget: number,
    currencySymbol: string
  ): Promise<number | null> {
    const percentage = Math.round((spent / budget) * 100);
    await scheduleReminder({
      title: `Budget Alert: ${category}`,
      body: `You've spent ${currencySymbol}${spent.toFixed(2)} of ${currencySymbol}${budget.toFixed(2)} (${percentage}%)`,
      scheduledAt: new Date().toISOString(),
      data: { type: 'budget', category, percentage: String(percentage) },
    });
    console.log('[FCM] Budget alert sent for:', category);
    return null;
  }

  async checkBudgetAlerts(
    categorySpending: { [key: string]: number },
    budgets: { [key: string]: number },
    currencySymbol: string
  ): Promise<void> {
    for (const [category, budget] of Object.entries(budgets)) {
      const spent = categorySpending[category] || 0;
      const percentage = (spent / budget) * 100;
      if (percentage >= 80) {
        await this.scheduleBudgetAlert(category, spent, budget, currencySymbol);
      }
    }
  }

  async clearBudgetAlertHistory(): Promise<void> {
    console.log('Budget alert history cleared');
  }

  async scheduleBillReminder(
    billId: string,
    description: string,
    amount: number,
    dueDate: Date,
    reminderDays: number,
    currencySymbol: string
  ): Promise<number | null> {
    const reminderDate = addDays(dueDate, -reminderDays);
    if (reminderDate > new Date()) {
      await scheduleReminder({
        title: 'Bill Due Soon',
        body: `${description} — ${currencySymbol}${amount.toFixed(2)} due ${dueDate.toLocaleDateString()}`,
        scheduledAt: reminderDate.toISOString(),
        data: { type: 'bill', billId, dueDate: dueDate.toISOString() },
      });
    }
    console.log('[FCM] Bill reminder scheduled for:', description);
    return null;
  }

  async checkBillReminders(
    recurringExpenses: Array<{
      id: string;
      description: string;
      amount: number;
      dayOfMonth: number;
      enabled: boolean;
      reminderDays?: number;
    }>,
    currencySymbol: string
  ): Promise<void> {
    for (const expense of recurringExpenses) {
      if (!expense.enabled) continue;
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), expense.dayOfMonth);
      if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
      await this.scheduleBillReminder(
        expense.id, expense.description, expense.amount,
        dueDate, expense.reminderDays || 3, currencySymbol
      );
    }
  }

  async clearBillReminderHistory(): Promise<void> {
    console.log('Bill reminder history cleared');
  }

  async schedulePersonalizedNotifications(): Promise<void> {
    console.log('[FCM] Personalized notifications delegated to backend');
  }

  async scheduleDailyMotivation(): Promise<void> {
    console.log('[FCM] Daily motivation delegated to backend');
  }
}

export const notificationManager = NotificationManager.getInstance();
