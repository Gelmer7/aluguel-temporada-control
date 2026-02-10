import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Reminder, ReminderFilters } from '../models/reminder.model';

@Injectable({
  providedIn: 'root',
})
export class ReminderService {
  private supabase = inject(SupabaseService);

  async getReminders(filters: ReminderFilters) {
    let query = this.supabase.client
      .from('reminders')
      .select('*')
      .order('remind_at', { ascending: true });

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    return { data: data as Reminder[], error };
  }

  async addReminder(reminder: Omit<Reminder, 'id' | 'created_at'>) {
    console.log('Adding reminder:', reminder);
    return await this.supabase.client
      .from('reminders')
      .insert(reminder)
      .select()
      .single();
  }

  async updateReminder(id: string, reminder: Partial<Reminder>) {
    console.log('Updating reminder:', id, reminder);
    return await this.supabase.client
      .from('reminders')
      .update(reminder)
      .eq('id', id)
      .select()
      .single();
  }

  async deleteReminder(id: string) {
    console.log('Deleting reminder:', id);
    return await this.supabase.client
      .from('reminders')
      .delete()
      .eq('id', id);
  }
}
