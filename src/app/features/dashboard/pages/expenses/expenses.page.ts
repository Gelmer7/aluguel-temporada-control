import { Component, ChangeDetectionStrategy, OnInit, signal, inject, computed, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Select } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabel } from 'primeng/floatlabel';
import { AccordionModule } from 'primeng/accordion';
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { ExpenseFormComponent } from '../../components/expense-form/expense-form.component';
import { ExpenseChartsComponent } from '../../components/expense-charts/expense-charts.component';
import { SupabaseService, Expense } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StringUtils } from '../../../../shared/utils/string.utils';

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 flex flex-col min-h-0'
  },
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Tooltip,
    Tag,
    InputText,
    IconField,
    InputIcon,
    ConfirmDialog,
    Toast,
    Select,
    MultiSelectModule,
    FloatLabel,
    AccordionModule,
    TablePaginatorComponent,
    FilterContainerComponent,
    ExpenseFormComponent,
    ExpenseChartsComponent,
    TranslateModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './expenses.page.html',
})
export class ExpensesPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private houseService = inject(HouseService);
  private headerService = inject(HeaderService);

  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  expenses = signal<Expense[]>([]);
  filteredExpenses = signal<Expense[]>([]);
  loading = signal<boolean>(false);
  showExpenseForm = signal<boolean>(false);
  showCharts = signal<boolean>(false);
  currentExpense = signal<Expense | null>(null);

  constructor() {
    // Reload expenses when house changes
    effect(() => {
      this.houseService.currentHouseCode();
      this.loadExpenses();
    });

    // Configura o header assim que o template estiver disponível
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'TERMS.EXPENSES',
          icon: 'pi-wallet',
          actions: actions
        });
      }
    });
  }

  // Filters
  years = signal<number[]>([]);
  months = [
    { label: 'MONTHS.0', value: 1 },
    { label: 'MONTHS.1', value: 2 },
    { label: 'MONTHS.2', value: 3 },
    { label: 'MONTHS.3', value: 4 },
    { label: 'MONTHS.4', value: 5 },
    { label: 'MONTHS.5', value: 6 },
    { label: 'MONTHS.6', value: 7 },
    { label: 'MONTHS.7', value: 8 },
    { label: 'MONTHS.8', value: 9 },
    { label: 'MONTHS.9', value: 10 },
    { label: 'MONTHS.10', value: 11 },
    { label: 'MONTHS.11', value: 12 }
  ];

  expenseTypes = [
    { label: 'EXPENSES_FORM.TYPES.ELECTRICITY', value: 'ELECTRICITY' },
    { label: 'EXPENSES_FORM.TYPES.WATER', value: 'WATER' },
    { label: 'EXPENSES_FORM.TYPES.CONDOMINIUM', value: 'CONDOMINIUM' },
    { label: 'EXPENSES_FORM.TYPES.INTERNET', value: 'INTERNET' },
    { label: 'EXPENSES_FORM.TYPES.GAS', value: 'GAS' },
    { label: 'EXPENSES_FORM.TYPES.MAINTENANCE', value: 'MAINTENANCE' },
    { label: 'EXPENSES_FORM.TYPES.CLEANING', value: 'CLEANING' },
    { label: 'EXPENSES_FORM.TYPES.OTHER', value: 'OTHER' }
  ];

  yearOptions = computed(() => [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...this.years().map(y => ({ label: y.toString(), value: y }))
  ]);

  monthOptions = [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...this.months
  ];

  typeOptions = [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...this.expenseTypes
  ];

  selectedYear = signal<number | string>('ALL');
  selectedMonth = signal<number | string>('ALL');
  selectedTypes = signal<string[]>(this.expenseTypes.map(t => t.value));
  globalFilter = signal<string>('');

  // Pagination
  first = signal<number>(0);
  rows = signal<number>(20);

  // Computed Data
  pagedExpenses = computed(() => {
    const data = [...this.filteredExpenses()];

    // Sort by purchaseDate descending
    data.sort((a, b) => {
      const dateA = new Date(a.purchaseDate).getTime();
      const dateB = new Date(b.purchaseDate).getTime();
      return dateB - dateA;
    });

    const start = this.first();
    const end = start + this.rows();
    return data.slice(start, end);
  });

  onPageChange(event: any) {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  onFilterGlobal(query: string) {
    this.globalFilter.set(query);
    this.first.set(0); // Reset to first page on search
    this.applyFilters();
  }

  onFilterChange() {
    this.first.set(0); // Reset to first page on filter change
    this.applyFilters();
  }

  protected getSelectedYearLabel(): string {
    const year = this.selectedYear();
    return year === 'ALL' ? 'TERMS.ALL' : year.toString();
  }

  protected getSelectedMonthLabel(): string {
    const month = this.selectedMonth();
    if (month === 'ALL') return 'TERMS.ALL';
    return this.months.find(m => m.value === month)?.label || 'TERMS.ALL';
  }

  protected getSelectedTypeLabel(): string {
    const types = this.selectedTypes();
    if (types.length === 0 || types.length === this.expenseTypes.length) return 'TERMS.ALL';
    if (types.length === 1) {
      return this.expenseTypes.find(t => t.value === types[0])?.label || 'TERMS.ALL';
    }
    return `${types.length} ${this.translateService.instant('TERMS.SELECTED')}`;
  }

  totalExpenses = computed(() => {
    return this.filteredExpenses().reduce((acc, curr) => acc + (curr.price || 0), 0);
  });

  async ngOnInit() {
    this.generateYears();
    await this.loadExpenses();
  }

  generateYears() {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let i = 0; i < 6; i++) {
      yearsList.push(currentYear - i);
    }
    this.years.set(yearsList);
  }

  async loadExpenses() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.getExpenses();
      if (error) throw error;
      this.expenses.set(data || []);
      this.applyFilters();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao carregar gastos: ' + error.message
      });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    let filtered = [...this.expenses()];

    const year = this.selectedYear();
    if (year !== 'ALL') {
      filtered = filtered.filter(e => new Date(e.purchaseDate).getFullYear() === year);
    }

    const month = this.selectedMonth();
    if (month !== 'ALL') {
      filtered = filtered.filter(e => new Date(e.purchaseDate).getMonth() + 1 === month);
    }

    const types = this.selectedTypes();
    // Se types.length === 0 ou se todos estão selecionados, não filtramos (mostra tudo)
    if (types.length > 0 && types.length < this.expenseTypes.length) {
      filtered = filtered.filter(e => types.includes(e.type));
    }

    const query = StringUtils.normalize(this.globalFilter());
    if (query) {
      filtered = filtered.filter(e =>
        StringUtils.normalize(e.description).includes(query) ||
        StringUtils.normalize(e.type).includes(query) ||
        StringUtils.normalize(e.observation).includes(query)
      );
    }

    this.filteredExpenses.set(filtered);
  }

  clearFilters() {
    this.selectedYear.set('ALL');
    this.selectedMonth.set('ALL');
    this.selectedTypes.set(this.expenseTypes.map(t => t.value));
    this.onFilterChange();
  }

  onAddExpense() {
    this.currentExpense.set(null);
    this.showExpenseForm.set(true);
  }

  onEditExpense(expense: Expense) {
    this.currentExpense.set(expense);
    this.showExpenseForm.set(true);
  }

  onDeleteExpense(event: Event, expense: Expense) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Tem certeza que deseja excluir este gasto?',
      header: 'Confirmação de Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: async () => {
        try {
          const { error } = await this.supabaseService.deleteExpense(expense.id);
          if (error) throw error;
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Gasto excluído com sucesso!'
          });
          await this.loadExpenses();
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao excluir gasto: ' + error.message
          });
        }
      }
    });
  }

  async onSaveExpense(expenseData: any) {
    try {
      const current = this.currentExpense();

      // Normalizar os dados do formulário para o formato da interface Expense (camelCase)
      const normalizedExpense: Omit<Expense, 'id' | 'createDate'> = {
        price: expenseData.price || 0,
        description: expenseData.description || '',
        observation: expenseData.observation || '',
        type: expenseData.type || 'OTHER',
        purchaseDate: expenseData.purchaseDate?.toISOString() || new Date().toISOString(),
        cubicMeters: expenseData.cubicMeters,
        reserveFund: expenseData.reserveFund,
        association: expenseData.association,
        kws: expenseData.kws
      };

      if (current) {
        // Update
        const { error } = await this.supabaseService.updateExpense(current.id, normalizedExpense);
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Gasto atualizado com sucesso!'
        });
      } else {
        // Create
        const { error } = await this.supabaseService.addExpense(normalizedExpense);
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Gasto adicionado com sucesso!'
        });
      }

      await this.loadExpenses();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao salvar gasto: ' + error.message
      });
    }
  }

  getSeverity(type: string): "success" | "secondary" | "info" | "warn" | "danger" | undefined {
    switch (type) {
      case 'ELECTRICITY': return 'warn';
      case 'WATER': return 'info';
      case 'CONDOMINIUM': return 'success';
      case 'INTERNET': return 'secondary';
      case 'MAINTENANCE': return 'danger';
      default: return 'secondary';
    }
  }
}
