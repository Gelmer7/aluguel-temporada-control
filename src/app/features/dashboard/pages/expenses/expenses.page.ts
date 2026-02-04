import { Component, ChangeDetectionStrategy, OnInit, signal, inject, computed } from '@angular/core';
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
import { AccordionModule } from 'primeng/accordion';
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { PageHeaderComponent } from '../../../../components/ui/page-header/page-header.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { ExpenseFormComponent } from '../../components/expense-form/expense-form.component';
import { SupabaseService, Expense } from '../../../../services/supabase.service';
import { TranslateModule } from '@ngx-translate/core';
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
    AccordionModule,
    TablePaginatorComponent,
    PageHeaderComponent,
    FilterContainerComponent,
    ExpenseFormComponent,
    TranslateModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './expenses.page.html',
})
export class ExpensesPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  expenses = signal<Expense[]>([]);
  filteredExpenses = signal<Expense[]>([]);
  loading = signal<boolean>(false);
  showExpenseForm = signal<boolean>(false);
  currentExpense = signal<Expense | null>(null);

  // Filters
  years = signal<number[]>([]);
  months = [
    { label: 'Janeiro', value: 1 },
    { label: 'Fevereiro', value: 2 },
    { label: 'Março', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Maio', value: 5 },
    { label: 'Junho', value: 6 },
    { label: 'Julho', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Setembro', value: 9 },
    { label: 'Outubro', value: 10 },
    { label: 'Novembro', value: 11 },
    { label: 'Dezembro', value: 12 }
  ];

  expenseTypes = [
    { label: 'Eletricidade', value: 'ELECTRICITY' },
    { label: 'Água', value: 'WATER' },
    { label: 'Condomínio', value: 'CONDOMINIUM' },
    { label: 'Internet', value: 'INTERNET' },
    { label: 'Gás', value: 'GAS' },
    { label: 'Manutenção', value: 'MAINTENANCE' },
    { label: 'Limpeza', value: 'CLEANING' },
    { label: 'Outros', value: 'OTHER' }
  ];

  yearOptions = computed(() => [
    { label: 'Todos', value: null },
    ...this.years().map(y => ({ label: y.toString(), value: y }))
  ]);

  monthOptions = [
    { label: 'Todos', value: null },
    ...this.months
  ];

  typeOptions = [
    { label: 'Todos', value: null },
    ...this.expenseTypes
  ];

  selectedYear = signal<number | null>(null);
  selectedMonth = signal<number | null>(null);
  selectedType = signal<string | null>(null);
  globalFilter = signal<string>('');

  // Pagination
  first = signal<number>(0);
  rows = signal<number>(20);

  // Computed Data
  pagedExpenses = computed(() => {
    const data = this.filteredExpenses();
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

  protected getSelectedMonthLabel(): string {
    const month = this.selectedMonth();
    if (!month) return 'Todos';
    return this.months.find(m => m.value === month)?.label || 'Todos';
  }

  protected getSelectedTypeLabel(): string {
    const type = this.selectedType();
    if (!type) return 'Todos';
    return this.expenseTypes.find(t => t.value === type)?.label || 'Todos';
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

    if (this.selectedYear()) {
      filtered = filtered.filter(e => new Date(e.purchase_date).getFullYear() === this.selectedYear());
    }

    if (this.selectedMonth()) {
      filtered = filtered.filter(e => new Date(e.purchase_date).getMonth() + 1 === this.selectedMonth());
    }

    if (this.selectedType()) {
      filtered = filtered.filter(e => e.type === this.selectedType());
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

      // Normalizar os dados do formulário para o formato da interface Expense (snake_case)
      const normalizedExpense: any = {
        price: expenseData.price,
        description: expenseData.description,
        observation: expenseData.observation,
        type: expenseData.type,
        purchase_date: expenseData.purchaseDate?.toISOString() || new Date().toISOString(),
        cubic_meters: expenseData.cubicMeters,
        reserve_fund: expenseData.reserveFund,
        association: expenseData.association,
        kws: expenseData.kws,
        create_user: 'gelmer7@gmail.com'
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
