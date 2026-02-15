import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Suggestion, SuggestionFilters } from '../models/suggestion.model';

@Injectable({
  providedIn: 'root',
})
export class SuggestionService {
  private supabase = inject(SupabaseService);

  async getSuggestions(filters: SuggestionFilters) {
    let query = this.supabase.client
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    const { data, error } = await query;
    let filteredData = (data as Suggestion[]) || [];

    // Filtro de Ano e Mês no Frontend (created_at é ISO string)
    if (filters.years && filters.years.length > 0 && !filters.years.includes('ALL')) {
      filteredData = filteredData.filter((s) => {
        const year = new Date(s.created_at).getFullYear();
        return filters.years.includes(year);
      });
    }

    if (filters.months && filters.months.length > 0 && filters.months.length < 12) {
      filteredData = filteredData.filter((s) => {
        const month = new Date(s.created_at).getMonth();
        return filters.months.includes(month);
      });
    }

    return { data: filteredData, error };
  }

  async addSuggestion(suggestion: Omit<Suggestion, 'id' | 'created_at'>) {
    console.log('Adding suggestion:', suggestion);
    return await this.supabase.client
      .from('suggestions')
      .insert(suggestion)
      .select()
      .single();
  }

  async updateSuggestion(id: string, suggestion: Partial<Suggestion>) {
    console.log('Updating suggestion:', id, suggestion);
    return await this.supabase.client
      .from('suggestions')
      .update(suggestion)
      .eq('id', id)
      .select()
      .single();
  }

  async deleteSuggestion(id: string) {
    console.log('Deleting suggestion:', id);
    return await this.supabase.client
      .from('suggestions')
      .delete()
      .eq('id', id);
  }
}
