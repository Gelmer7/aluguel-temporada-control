import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface IrBracket {
  id?: number;
  min_value: number;
  max_value: number | null; // null significa infinito
  rate: number;
  deduction: number;
  year: number;
}

@Injectable({
  providedIn: 'root'
})
export class IrTaxService {
  private supabase = inject(SupabaseService);

  async getBrackets(year: number = new Date().getFullYear()): Promise<IrBracket[]> {
    const { data, error } = await this.supabase.client
      .from('ir_brackets')
      .select('*')
      .eq('year', year)
      .order('min_value', { ascending: true });

    if (error) {
      console.error('Error fetching IR brackets:', error);
      return [];
    }

    return data || [];
  }

  async updateBracket(bracket: IrBracket): Promise<IrBracket | null> {
    if (!bracket.id) return null;

    const { data, error } = await this.supabase.client
      .from('ir_brackets')
      .update({
        min_value: bracket.min_value,
        max_value: bracket.max_value,
        rate: bracket.rate,
        deduction: bracket.deduction
      })
      .eq('id', bracket.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating IR bracket:', error);
      throw error;
    }

    return data;
  }
}
