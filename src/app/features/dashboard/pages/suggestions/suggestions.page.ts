import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { Button, ButtonModule } from 'primeng/button';
import { Select, SelectModule } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Toast, ToastModule } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SuggestionService } from '../../../../services/suggestion.service';
import { Suggestion, SuggestionStatus, SuggestionFilters } from '../../../../models/suggestion.model';
import { SuggestionFormComponent } from '../../components/suggestion-form/suggestion-form.component';
import { HeaderService } from '../../../../services/header';
import { SupabaseService } from '../../../../services/supabase.service';

@Component({
  selector: 'app-suggestions-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    Tag,
    ToastModule ,
    Tooltip,
    ConfirmDialog,
    TranslateModule,
    SuggestionFormComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './suggestions.page.html',
})
export class SuggestionsPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private suggestionService = inject(SuggestionService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private headerService = inject(HeaderService);

  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  suggestions = signal<Suggestion[]>([]);
  loading = signal<boolean>(false);
  isAuthenticated = signal<boolean>(true); // Permitir acesso público conforme solicitado
  filters = signal<SuggestionFilters>({ status: 'all' });

  isFormVisible = signal<boolean>(false);
  selectedSuggestion = signal<Suggestion | null>(null);

  statusOptions = [
    { label: 'TERMS.ALL', value: 'all' },
    { label: 'SUGGESTIONS_FORM.STATUS.PENDING', value: 'PENDING' },
    { label: 'SUGGESTIONS_FORM.STATUS.IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'SUGGESTIONS_FORM.STATUS.COMPLETED', value: 'COMPLETED' },
    { label: 'SUGGESTIONS_FORM.STATUS.REJECTED', value: 'REJECTED' },
  ];

  constructor() {
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'TERMS.SUGGESTIONS',
          icon: 'pi-comment',
          actions: actions
        });
      }
    });
  }

  async ngOnInit() {
    // Carregar sugestões diretamente, sem verificar autenticação
    this.loadSuggestions();
  }

  async loadSuggestions() {
    this.loading.set(true);
    const { data, error } = await this.suggestionService.getSuggestions(this.filters());

    if (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message
      });
    } else {
      this.suggestions.set(data || []);
    }
    this.loading.set(false);
  }

  onFilterChange(status: SuggestionStatus | 'all') {
    this.filters.update(f => ({ ...f, status }));
    this.loadSuggestions();
  }

  openNew() {
    this.selectedSuggestion.set(null);
    this.isFormVisible.set(true);
  }

  openEdit(suggestion: Suggestion) {
    console.log('Opening edit for:', suggestion);
    this.selectedSuggestion.set({ ...suggestion });
    this.isFormVisible.set(true);
  }

  async onSave(suggestionData: Partial<Suggestion>) {
    const current = this.selectedSuggestion();
    let result;

    if (current) {
      result = await this.suggestionService.updateSuggestion(current.id, suggestionData);
    } else {
      // Para novas sugestões, garantir status PENDING se não for admin
      const newSuggestion = {
        status: 'PENDING' as SuggestionStatus,
        ...suggestionData
      } as Omit<Suggestion, 'id' | 'created_at'>;
      result = await this.suggestionService.addSuggestion(newSuggestion);
    }

    if (result.error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error.message
      });
    } else {
      const detailKey = current ? 'SUGGESTIONS_FORM.SUCCESS_UPDATE' : 'SUGGESTIONS_FORM.SUCCESS_CREATE';
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('ACTIONS.SUCCESS'),
        detail: this.translateService.instant(detailKey)
      });
      this.loadSuggestions();
    }
  }

  confirmDelete(suggestion: Suggestion) {
    this.confirmationService.confirm({
      message: this.translateService.instant('SUGGESTIONS_FORM.CONFIRM_DELETE'),
      header: this.translateService.instant('ACTIONS.CONFIRM'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteSuggestion(suggestion.id)
    });
  }

  async deleteSuggestion(id: string) {
    const { error } = await this.suggestionService.deleteSuggestion(id);
    if (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message
      });
    } else {
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('ACTIONS.SUCCESS'),
        detail: this.translateService.instant('SUGGESTIONS_FORM.SUCCESS_DELETE')
      });
      this.loadSuggestions();
    }
  }

  getStatusSeverity(status: SuggestionStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'PENDING': return 'warn';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString(this.translateService.currentLang === 'pt' ? 'pt-BR' :
                                            this.translateService.currentLang === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
