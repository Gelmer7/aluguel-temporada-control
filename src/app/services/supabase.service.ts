import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  get client() {
    return this.supabase;
  }

  // Check connection by getting the current session (doesn't require tables)
  async checkConnection() {
    return await this.supabase.auth.getSession();
  }

  // Example method to test connection
  async getProperties() {
    return await this.supabase.from('properties').select('*');
  }

  async getExpenses() {
    return await this.supabase.from('expenses').select('*').order('date', { ascending: false });
  }

  async addExpense(expense: Omit<Expense, 'id' | 'created_at'>) {
    return await this.supabase.from('expenses').insert(expense).select();
  }
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  created_at: string;
}
