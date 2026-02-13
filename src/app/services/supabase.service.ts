import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AirbnbNormalizedRow, ManualRental, UnifiedEarning } from '../models/airbnb.model';
import { Expense } from '../models/expense.model';
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
      createUser: 'gelmer7@gmail.com' // Temporário até ter login
    }));

    return await this.supabase
      .from('airbnb_logs')
      .upsert(recordsWithMetadata, {
        onConflict: 'unique_key',
        ignoreDuplicates: false
      })
      .select();
  }

  // --- Manual Rental Methods ---

  /**
   * Busca todos os registros de aluguéis manuais
   */
  async getManualRentals() {
    const { data, error } = await this.supabase
      .from('manual_rentals')
      .select('*')
      .eq('house_code', this.houseService.currentHouseCode())
      .order('data_pagamento', { ascending: false });

    return { data, error };
  }

  /**
   * Salva ou atualiza um aluguel manual
   */
  async upsertManualRental(rental: ManualRental) {
    const rentalWithMetadata = {
      ...rental,
      house_code: this.houseService.currentHouseCode(),
      create_user: 'gelmer7@gmail.com'
    };

    return await this.supabase
      .from('manual_rentals')
      .upsert(rentalWithMetadata)
      .select();
  }

  /**
   * Remove um aluguel manual
   */
  async deleteManualRental(id: string) {
    return await this.supabase
      .from('manual_rentals')
      .delete()
      .eq('id', id);
  }

  // --- Unified Earnings Methods ---

  /**
   * Busca os ganhos unificados (Airbnb + Manual) através da View
   */
  async getUnifiedEarnings() {
    const { data, error } = await this.supabase
      .from('v_unified_earnings')
      .select('*')
      .eq('house_code', this.houseService.currentHouseCode())
      .order('data', { ascending: false });

    return { data: data as UnifiedEarning[], error };
  }

  // --- Expense Methods ---

  async getExpenses() {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('house_code', this.houseService.currentHouseCode())
      .order('purchaseDate', { ascending: false });

    return { data, error };
  }

  async addExpense(expense: Omit<Expense, 'id' | 'createDate'>) {
    const payload = {
      ...expense,
      house_code: this.houseService.currentHouseCode(),
      createUser: 'gelmer7@gmail.com' // Temporário até ter login
    };
    return await this.supabase.from('expenses').insert(payload).select();
  }

  async updateExpense(id: string, expense: Partial<Expense>) {
    return await this.supabase.from('expenses').update(expense).eq('id', id).select();
  }

  async deleteExpense(id: string) {
    return await this.supabase.from('expenses').delete().eq('id', id);
  }

  async bulkUploadExpenses(expenses: Omit<Expense, 'id' | 'createDate'>[]) {
    const payloads = expenses.map(e => ({
      ...e,
      house_code: this.houseService.currentHouseCode(),
      createUser: 'gelmer7@gmail.com' // Temporário até ter login
    }));
    return await this.supabase.from('expenses').insert(payloads).select();
  }

  // --- Tithe Methods ---

  async getTithes() {
    const { data, error } = await this.supabase
      .from('tithes')
      .select('*')
      .eq('house_code', this.houseService.currentHouseCode())
      .order('monthYear', { ascending: false });

    return { data, error };
  }

  async addTithe(tithe: Omit<Tithe, 'id' | 'createDate'>) {
    const payload = {
      ...tithe,
      house_code: this.houseService.currentHouseCode(),
      createUser: 'gelmer7@gmail.com' // Temporário até ter login
    };
    return await this.supabase.from('tithes').insert(payload).select();
  }

  async updateTithe(id: string, tithe: Partial<Tithe>) {
    return await this.supabase.from('tithes').update(tithe).eq('id', id).select();
  }

  async deleteTithe(id: string) {
    return await this.supabase.from('tithes').delete().eq('id', id);
  }
}

export interface Tithe {
  id: string;
  monthYear: string; // ISO format YYYY-MM-01
  airbnbGross: number;
  titheValue: number;
  offerValue: number;
  totalPaid: number;
  observation?: string;
  createDate?: string;
  house_code?: string;
  createUser?: string;
}
