import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AirbnbNormalizedRow } from '../models/airbnb.model';
import { HouseService } from './house.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private houseService = inject(HouseService);

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
      .eq('house_code', this.houseService.currentHouseCode())
      .order('data', { ascending: false });

    return { data, error };
  }

  /**
   * Realiza o Upsert (Insert ou Update) de registros do Airbnb.
   * Usa a coluna 'unique_key' para identificar duplicatas.
   */
  async upsertAirbnbRecords(records: any[]) {
    // Adicionar metadados a cada registro
    const recordsWithMetadata = records.map(record => ({
      ...record,
      house_code: this.houseService.currentHouseCode(),
      created_by: 'admin' // Temporário até ter login
    }));

    return await this.supabase
      .from('airbnb_logs')
      .upsert(recordsWithMetadata, {
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
      .eq('house_code', this.houseService.currentHouseCode())
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
    const payload = {
      ...expense,
      house_code: this.houseService.currentHouseCode(),
      created_by: 'admin' // Temporário até ter login
    };
    const dbPayload = this.mapToDb(payload);
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
    const payloads = expenses.map(e => ({
      ...e,
      house_code: this.houseService.currentHouseCode(),
      created_by: 'admin' // Temporário até ter login
    }));
    const dbPayloads = payloads.map(p => this.mapToDb(p));
    return await this.supabase.from('expenses').insert(dbPayloads).select();
  }

  // --- Tithe Methods ---

  async getTithes() {
    const { data, error } = await this.supabase
      .from('tithes')
      .select('*')
      .eq('house_code', this.houseService.currentHouseCode())
      .order('month_year', { ascending: false });

    return { data, error };
  }

  async addTithe(tithe: Omit<Tithe, 'id' | 'created_at'>) {
    const payload = {
      ...tithe,
      house_code: this.houseService.currentHouseCode(),
      created_by: 'admin' // Temporário até ter login
    };
    return await this.supabase.from('tithes').insert(payload).select();
  }

  async updateTithe(id: string, tithe: Partial<Tithe>) {
    return await this.supabase.from('tithes').update(tithe).eq('id', id).select();
  }

  async deleteTithe(id: string) {
    return await this.supabase.from('tithes').delete().eq('id', id);
  }

  private mapToDb(expense: any) {
    const mapped: any = {};
    if (expense.price !== undefined) mapped.amount = expense.price;
    if (expense.description !== undefined) mapped.description = expense.description;
    if (expense.type !== undefined) mapped.category = expense.type;
    if (expense.purchase_date !== undefined) mapped.date = expense.purchase_date;

    // Campos opcionais de auditoria e controle
    if (expense.observation !== undefined) mapped.observation = expense.observation;
    if (expense.cubic_meters !== undefined) mapped.cubic_meters = expense.cubic_meters;
    if (expense.reserve_fund !== undefined) mapped.reserve_fund = expense.reserve_fund;
    if (expense.kws !== undefined) mapped.kws = expense.kws;
    if (expense.house_code !== undefined) mapped.house_code = expense.house_code;
    if (expense.created_by !== undefined) mapped.created_by = expense.created_by;

    return mapped;
  }
}

export interface Tithe {
  id: string;
  month_year: string; // ISO format YYYY-MM-01
  airbnb_gross: number;
  tithe_value: number;
  offer_value: number;
  total_paid: number;
  observation?: string;
  created_at?: string;
  house_code?: string;
  created_by?: string;
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
  kws?: number;
  created_at?: string;
  house_code?: string;
  created_by?: string;
}
