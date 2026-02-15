import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FloatLabel } from 'primeng/floatlabel';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SuggestionService } from '../../../../services/suggestion.service';
import { Suggestion, SuggestionStatus, SuggestionFilters } from '../../../../models/suggestion.model';
import { SuggestionFormComponent } from '../../components/suggestion-form/suggestion-form.component';
import { HeaderService } from '../../../../services/header';
import { SupabaseService } from '../../../../services/supabase.service';
import { DateUtils } from '../../../../shared/utils/date.utils';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';

@Component({
  selector: 'app-suggestions-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    MultiSelectModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    TranslateModule,
    FloatLabel,
    SuggestionFormComponent,
    FilterContainerComponent,
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
  isAuthenticated = signal<boolean>(true);

  // Filtros
  selectedYear = signal<(number | string)[]>(['ALL']);
  selectedMonth = signal<number[]>(Array.from({ length: 12 }, (_, i) => i));
  selectedStatus = signal<SuggestionStatus[]>(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']);

  filters = computed<SuggestionFilters>(() => ({
    status: this.selectedStatus(),
    years: this.selectedYear(),
    months: this.selectedMonth()
  }));

  isFormVisible = signal<boolean>(false);
  selectedSuggestion = signal<Suggestion | null>(null);

  statusOptions = [
    { label: 'SUGGESTIONS_FORM.STATUS.PENDING', value: 'PENDING' },
    { label: 'SUGGESTIONS_FORM.STATUS.IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'SUGGESTIONS_FORM.STATUS.COMPLETED', value: 'COMPLETED' },
    { label: 'SUGGESTIONS_FORM.STATUS.REJECTED', value: 'REJECTED' },
  ];

  yearOptions = computed(() => {
    const years = new Set(this.suggestions().map(s => new Date(s.created_at).getFullYear()));
    const options = Array.from(years).sort((a, b) => b - a).map(y => ({ label: y.toString(), value: y }));
    return [{ label: 'TERMS.ALL', value: 'ALL' }, ...options];
  });

  monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: `MONTHS.${i}`,
    value: i
  }));

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

    // Recarregar quando filtros mudarem
    effect(() => {
      this.loadSuggestions();
    });
  }

  async ngOnInit() {
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

  clearFilters() {
    this.selectedYear.set(['ALL']);
    this.selectedMonth.set(Array.from({ length: 12 }, (_, i) => i));
    this.selectedStatus.set(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']);
  }

  getYearLabel(): string {
    const selected = this.selectedYear();
    if (selected.includes('ALL')) return this.translateService.instant('TERMS.ALL');
    return selected.join(', ');
  }

  getMonthLabel(): string {
    const selected = this.selectedMonth();
    if (selected.length === 12) return this.translateService.instant('TERMS.ALL');
    if (selected.length === 0) return this.translateService.instant('TERMS.NONE');
    return `${selected.length} ${this.translateService.instant('TERMS.MONTHS')}`;
  }

  getStatusLabel(): string {
    const selected = this.selectedStatus();
    if (selected.length === 4) return this.translateService.instant('TERMS.ALL');
    return `${selected.length} ${this.translateService.instant('TERMS.STATUS')}`;
  }

  openNew() {
    this.selectedSuggestion.set(null);
    this.isFormVisible.set(true);
  }

  openEdit(suggestion: Suggestion) {
    this.selectedSuggestion.set({ ...suggestion });
    this.isFormVisible.set(true);
  }

  async onSave(suggestionData: Partial<Suggestion>) {
    const current = this.selectedSuggestion();
    let result;

    if (current) {
      result = await this.suggestionService.updateSuggestion(current.id, suggestionData);
    } else {
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
    return DateUtils.parseLocal(date).toLocaleDateString(this.translateService.currentLang === 'pt' ? 'pt-BR' :
                                            this.translateService.currentLang === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
