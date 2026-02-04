import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AirbnbNormalizedRow } from '../models/airbnb.model';

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

  /**
   * Verifica a conexão com o Supabase
   */
  async checkConnection() {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // --- Airbnb Methods ---

  /**
   * Busca todos os registros do Airbnb do banco de dados
   */
  async getAirbnbRecords() {
    const { data, error } = await this.supabase
      .from('airbnb_logs')
      .select('*')
      .order('data', { ascending: false });

    return { data, error };
  }

  /**
   * Realiza o Upsert (Insert ou Update) de registros do Airbnb.
   * Usa a coluna 'unique_key' para identificar duplicatas.
   */
  async upsertAirbnbRecords(records: any[]) {
    return await this.supabase
      .from('airbnb_logs')
      .upsert(records, {
        onConflict: 'unique_key',
        ignoreDuplicates: false
      })
      .select();
  }

  // --- Expense Methods ---

  async getExpenses() {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) return { data: null, error };

    const mappedData = data.map((item) => ({
      ...item,
      price: item.amount,
      type: item.category,
      purchase_date: item.date,
    })) as Expense[];

    return { data: mappedData, error: null };
  }

  async addExpense(expense: Omit<Expense, 'id' | 'created_at'>) {
    const dbPayload = this.mapToDb(expense);
    return await this.supabase.from('expenses').insert(dbPayload).select();
  }

  async updateExpense(id: string, expense: Partial<Expense>) {
    const dbPayload = this.mapToDb(expense);
    return await this.supabase.from('expenses').update(dbPayload).eq('id', id).select();
  }

  async deleteExpense(id: string) {
    return await this.supabase.from('expenses').delete().eq('id', id);
  }

  async bulkUploadExpenses(expenses: Omit<Expense, 'id' | 'created_at'>[]) {
    const dbPayloads = expenses.map(e => this.mapToDb(e));
    return await this.supabase.from('expenses').insert(dbPayloads).select();
  }

  private mapToDb(expense: any) {
    const mapped: any = {};
    if (expense.price !== undefined) mapped.amount = expense.price;
    if (expense.description !== undefined) mapped.description = expense.description;
    if (expense.type !== undefined) mapped.category = expense.type;
    if (expense.purchase_date !== undefined) mapped.date = expense.purchase_date;

    // These might fail if columns don't exist, but we keep them for parity
    if (expense.observation !== undefined) mapped.observation = expense.observation;
    if (expense.cubic_meters !== undefined) mapped.cubic_meters = expense.cubic_meters;
    if (expense.reserve_fund !== undefined) mapped.reserve_fund = expense.reserve_fund;
    if (expense.association !== undefined) mapped.association = expense.association;
    if (expense.kws !== undefined) mapped.kws = expense.kws;
    if (expense.create_user !== undefined) mapped.create_user = expense.create_user;

    return mapped;
  }
}

export interface Expense {
  id: string;
  price: number; // Maps to 'amount' in DB
  amount?: number; // DB field
  description: string;
  observation?: string;
  type: string; // Maps to 'category' in DB
  category?: string; // DB field
  purchase_date: string; // Maps to 'date' in DB
  date?: string; // DB field
  cubic_meters?: number;
  reserve_fund?: number;
  association?: number;
  kws?: number;
  create_user?: string;
  created_at?: string;
}
