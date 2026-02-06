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

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    return { data: data as Suggestion[], error };
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
