import { Component, ChangeDetectionStrategy, signal, inject, computed, OnInit, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

// Components
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { EarningsPaymentsChartsComponent } from '../../components/charts/earnings-payments-charts/earnings-payments-charts.component';
import { EarningsExpenseChartsComponent } from '../../components/charts/earnings-expense-charts/earnings-expense-charts.component';
import { EarningsSummaryChartsComponent } from '../../components/charts/earnings-summary-charts/earnings-summary-charts.component';

// Services & Models
import { SupabaseService, Expense } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';
import { UnifiedEarning } from '../../../../models/airbnb.model';

@Component({
  selector: 'app-earnings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    SelectModule,
    MultiSelectModule,
    InputNumberModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    FloatLabel,
    ToastModule,
    FilterContainerComponent,
    EarningsPaymentsChartsComponent,
    EarningsExpenseChartsComponent,
    EarningsSummaryChartsComponent,
  ],
  templateUrl: './earnings.page.html',
})
export class EarningsPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly translate = inject(TranslateService);
  private readonly houseService = inject(HouseService);
  private readonly messageService = inject(MessageService);
  private readonly headerService = inject(HeaderService);

  // Filtros
  protected readonly selectedYear = signal<number | string>('ALL');
  protected readonly selectedMonth = signal<number | string>('ALL');
  protected readonly selectedTypes = signal<string[]>([]);

  // Gráfico
  protected readonly showChart = signal<boolean>(false);
  protected readonly showExpenseChart = signal<boolean>(false);
  protected readonly showSummaryChart = signal<boolean>(false);

  // Dados
  protected readonly loading = signal<boolean>(true);
  protected readonly payments = signal<UnifiedEarning[]>([]);
  protected readonly expenses = signal<Expense[]>([]);

  // Opções de Filtro
  protected readonly years = signal<number[]>([]);
  protected readonly yearOptions = computed(() => [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...this.years().map((y) => ({ label: y.toString(), value: y })),
  ]);

  protected readonly monthOptions = computed(() => [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...Array.from({ length: 12 }, (_, i) => ({
      label: this.translate.instant(`MONTHS.${i}`),
      value: i,
    })),
  ]);

  protected readonly availableTypes = computed(() => {
    const types = new Set(this.payments().map((p) => p.tipo).filter(Boolean));
    return Array.from(types)
      .sort()
      .map((type) => ({
        label: type,
        value: type,
      }));
  });

  constructor() {
    // Reload data when house changes
    effect(() => {
      this.houseService.currentHouseCode();
      this.loadData();
    });

    this.headerService.setHeader({
      title: 'TERMS.EARNINGS',
      icon: 'pi-dollar',
    });
  }

  // Cálculos
  protected readonly filteredPayments = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const types = this.selectedTypes();

    return this.payments().filter((p) => {
      const date = new Date(p.data);
      const matchesYear = year === 'ALL' || date.getUTCFullYear() === year;
      const matchesMonth = month === 'ALL' || date.getUTCMonth() === month;
      const matchesType = types.length === 0 || types.includes(p.tipo);
      return matchesYear && matchesMonth && matchesType;
    });
  });

  protected readonly filteredExpenses = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    return this.expenses().filter((e) => {
      const date = new Date(e.purchaseDate);
      const matchesYear = year === 'ALL' || date.getUTCFullYear() === year;
      const matchesMonth = month === 'ALL' || date.getUTCMonth() === month;
      return matchesYear && matchesMonth;
    });
  });

  protected readonly totalReceived = computed(() => {
    return this.filteredPayments().reduce((acc, p) => acc + (p.valor || 0), 0);
  });

  protected readonly totalExpenses = computed(() => {
    return this.filteredExpenses().reduce((acc, e) => acc + (e.price || 0), 0);
  });

  protected readonly totalEarnings = computed(() => {
    return this.totalReceived() - this.totalExpenses();
  });

  async ngOnInit() {
    this.initYears();
    await this.loadData();
  }

  private initYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    this.years.set(years.sort((a, b) => b - a));
  }

  private async loadData() {
    this.loading.set(true);
    try {
      const [earningsRes, expensesRes] = await Promise.all([
        this.supabase.getUnifiedEarnings(),
        this.supabase.getExpenses(),
      ]);

      if (earningsRes.data) {
        this.payments.set(earningsRes.data);
        // Selecionar todos os tipos por padrão após carregar os dados
        const types = Array.from(new Set(earningsRes.data.map((p) => p.tipo).filter(Boolean)));
        this.selectedTypes.set(types);
      }
      if (expensesRes.data) this.expenses.set(expensesRes.data);
    } finally {
      this.loading.set(false);
    }
  }
}
