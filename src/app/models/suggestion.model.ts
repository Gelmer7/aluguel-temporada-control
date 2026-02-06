export interface Suggestion {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  answer?: string;
  created_at: string;
  user_id?: string;
}

export type SuggestionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface SuggestionFilters {
  status: SuggestionStatus | 'all';
}
