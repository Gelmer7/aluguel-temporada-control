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
import { DatePicker } from 'primeng/datepicker';
import { Popover } from 'primeng/popover';
import { FloatLabel } from 'primeng/floatlabel';
import { AccordionModule } from 'primeng/accordion';
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { ExpenseFormComponent } from '../../components/expense-form/expense-form.component';
import { ExpenseChartsComponent } from '../../components/charts/expense-charts/expense-charts.component';
import { Expense, EXPENSE_TYPES, ExpenseTypeValue } from '../../../../models/expense.model';
import { SupabaseService } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StringUtils } from '../../../../shared/utils/string.utils';
import { DateUtils } from '../../../../shared/utils/date.utils';
import { PdfService } from '../../../../services/pdf.service';

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
    DatePicker,
    Popover,
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
  private pdfService = inject(PdfService);

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

  expenseTypes = EXPENSE_TYPES;

  yearOptions = computed(() => [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...this.years().map(y => ({ label: y.toString(), value: y }))
  ]);

  monthOptions = this.months;

  typeOptions = [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...this.expenseTypes
  ];

  selectedYear = signal<number | string>('ALL');
  selectedMonth = signal<number[]>(this.months.map(m => m.value));
  selectedTypes = signal<string[]>(this.expenseTypes.map(t => t.value));
  filterDateRange = signal<Date[] | null>(null);
  globalFilter = signal<string>('');

  // Pagination
  first = signal<number>(0);
  rows = signal<number>(20);

  // Computed Data
  pagedExpenses = computed(() => {
    const data = [...this.filteredExpenses()];

    // Sort by purchaseDate descending
    data.sort((a, b) => {
      const dateA = DateUtils.parseLocal(a.purchaseDate).getTime();
      const dateB = DateUtils.parseLocal(b.purchaseDate).getTime();
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
    const months = this.selectedMonth();
    if (months.length === 0 || months.length === this.months.length) return 'TERMS.ALL';
    if (months.length === 1) {
      return this.months.find(m => m.value === months[0])?.label || 'TERMS.ALL';
    }
    return `${months.length} ${this.translateService.instant('TERMS.SELECTED')}`;
  }

  protected getSelectedTypeLabel(): string {
    const types = this.selectedTypes();
    if (types.length === 0 || types.length === this.expenseTypes.length) return 'TERMS.ALL';
    if (types.length === 1) {
      return this.expenseTypes.find(t => t.value === types[0])?.label || 'TERMS.ALL';
    }
    return `${types.length} ${this.translateService.instant('TERMS.SELECTED')}`;
  }

  protected getFormattedDateRange(): string {
    const range = this.filterDateRange();
    if (!range || !range[0]) return '';

    const format = (d: Date) => d.toLocaleDateString('pt-BR');
    if (range[1]) {
      return `${format(range[0])} - ${format(range[1])}`;
    }
    return format(range[0]);
  }

  onDateRangeChange(range: Date[] | null) {
    this.filterDateRange.set(range);
    // Só aplica o filtro se tivermos um range completo (duas datas) ou se estiver limpando (null)
    if (!range || (range[0] && range[1])) {
      this.onFilterChange();
    }
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
      filtered = filtered.filter(e => {
        const date = DateUtils.parseLocal(e.purchaseDate);
        return date.getFullYear() === year;
      });
    }

    const months = this.selectedMonth();
    if (months.length > 0 && months.length < this.months.length) {
      filtered = filtered.filter(e => {
        const date = DateUtils.parseLocal(e.purchaseDate);
        return months.includes(date.getMonth() + 1);
      });
    }

    const types = this.selectedTypes();
    // Se types.length === 0 ou se todos estão selecionados, não filtramos (mostra tudo)
    if (types.length > 0 && types.length < this.expenseTypes.length) {
      filtered = filtered.filter(e => types.includes(e.type));
    }

    // Filter by Date Range
    const range = this.filterDateRange();
    if (range && range[0] && range[1]) {
      const start = range[0];
      const end = range[1];
      // Reset hours to compare only dates
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((e) => {
        const date = DateUtils.parseLocal(e.purchaseDate);
        return date >= start && date <= end;
      });
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
    this.selectedMonth.set(this.months.map(m => m.value));
    this.selectedTypes.set(this.expenseTypes.map(t => t.value));
    this.filterDateRange.set(null);
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
      // Enviamos apenas os campos necessários de acordo com o tipo de gasto
      const normalizedExpense: any = {
        price: expenseData.price || 0,
        description: expenseData.description || '',
        observation: expenseData.observation || '',
        type: expenseData.type || 'OTHER',
        purchaseDate: DateUtils.toLocalISOString(expenseData.purchaseDate),
      };

      // Adicionar campos condicionais apenas se necessário
      if (expenseData.type === 'ELECTRICITY') {
        normalizedExpense.kws = expenseData.kws || 0;
      } else if (expenseData.type === 'WATER') {
        normalizedExpense.cubicMeters = expenseData.cubicMeters || 0;
      } else if (expenseData.type === 'CONDOMINIUM') {
        normalizedExpense.reserveFund = expenseData.reserveFund || 0;
        normalizedExpense.association = expenseData.association || 0;
      }

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
        // Garantir que campos não aplicáveis sejam nulos ou 0 para novos registros
        if (expenseData.type !== 'ELECTRICITY') normalizedExpense.kws = 0;
        if (expenseData.type !== 'WATER') normalizedExpense.cubicMeters = 0;
        if (expenseData.type !== 'CONDOMINIUM') {
          normalizedExpense.reserveFund = 0;
          normalizedExpense.association = 0;
        }

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

  protected onDownloadPDF() {
    this.pdfService.generateExpensesPdf({
      year: this.selectedYear(),
      months: this.selectedMonth(),
      types: this.selectedTypes(),
      houseCode: this.houseService.currentHouseCode() || undefined,
      expenses: this.filteredExpenses(),
      total: this.totalExpenses()
    });
  }

  getSeverity(type: string): "success" | "secondary" | "info" | "warn" | "danger" | undefined {
    const typeValue = type as ExpenseTypeValue;
    switch (typeValue) {
      case 'ELECTRICITY': return 'warn';
      case 'WATER': return 'info';
      case 'CONDOMINIUM': return 'success';
      case 'INTERNET': return 'secondary';
      case 'GAS': return 'warn';
      case 'MAINTENANCE': return 'danger';
      case 'CLEANING': return 'info';
      case 'CARNE_LEAO': return 'danger';
      default: return 'secondary';
    }
  }
}
