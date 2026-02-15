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

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    const { data, error } = await query;
    let filteredData = (data as Reminder[]) || [];

    // Filtro de Ano e Mês no Frontend (remind_at é ISO string)
    if (filters.years && filters.years.length > 0 && !filters.years.includes('ALL')) {
      filteredData = filteredData.filter((r) => {
        const year = new Date(r.remind_at).getFullYear();
        return filters.years.includes(year);
      });
    }

    if (filters.months && filters.months.length > 0 && filters.months.length < 12) {
      filteredData = filteredData.filter((r) => {
        const month = new Date(r.remind_at).getMonth();
        return filters.months.includes(month);
      });
    }

    return { data: filteredData, error };
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
