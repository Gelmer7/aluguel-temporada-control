export type ReminderStatus = 'COMPLETED' | 'PENDING' | 'REJECTED' | 'IN_PROGRESS';

export interface Reminder {
  id: string;
  created_at: string;
  title: string;
  description: string;
  remind_at: string;
  status: ReminderStatus;
}

export interface ReminderFilters {
  status: ReminderStatus | 'all';
}
