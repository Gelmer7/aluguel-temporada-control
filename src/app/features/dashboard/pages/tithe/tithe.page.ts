import { Component, ChangeDetectionStrategy, signal, inject, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';

// Components
import { PageHeaderComponent } from '../../../../components/ui/page-header/page-header.component';
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';

// Services & Models
import { SupabaseService, Expense } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';

@Component({
  selector: 'app-tithe-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    SelectModule,
    InputNumberModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    FloatLabel,
    PageHeaderComponent,
    DialogComponent,
  ],
  templateUrl: './tithe.page.html',
})
export class TithePage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly translate = inject(TranslateService);
  private readonly houseService = inject(HouseService);

  // Filtros
  protected readonly selectedYear = signal<number>(new Date().getFullYear());
  protected readonly selectedMonth = signal<number>(new Date().getMonth());
  protected readonly tithePercentage = signal<number>(10);
  protected readonly offerPercentage = signal<number>(5);

  constructor() {
    // Reload data when house changes
    effect(() => {
      this.houseService.currentHouseCode();
      this.loadData();
    });
  }

  // Dados
  protected readonly loading = signal<boolean>(true);
  protected readonly payments = signal<any[]>([]);
  protected readonly expenses = signal<Expense[]>([]);

  // Modal
  protected readonly showAddDialog = signal<boolean>(false);
  protected readonly titheValueToPay = signal<number>(0);
  protected readonly offerValueToPay = signal<number>(0);

  // Opções de Filtro
  protected readonly years = signal<number[]>([]);
  protected readonly months = computed(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      label: this.translate.instant(`MONTHS.${i}`),
      value: i,
    }));
  });

  // Cálculos
  protected readonly filteredPayments = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    return this.payments().filter((p) => {
      const date = new Date(p.data);
      return date.getUTCFullYear() === year && date.getUTCMonth() === month;
    });
  });

  protected readonly filteredExpenses = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    return this.expenses().filter((e) => {
      const date = new Date(e.purchase_date);
      return date.getUTCFullYear() === year && date.getUTCMonth() === month;
    });
  });

  protected readonly totalAirbnb = computed(() => {
    return this.filteredPayments().reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
  });

  protected readonly totalExpenses = computed(() => {
    return this.filteredExpenses().reduce((acc, e) => acc + (e.price || 0), 0);
  });

  protected readonly titheValue = computed(() => {
    return (this.totalAirbnb() * this.tithePercentage()) / 100;
  });

  protected readonly offerValue = computed(() => {
    return (this.totalAirbnb() * this.offerPercentage()) / 100;
  });

  protected readonly totalToPay = computed(() => {
    return this.titheValue() + this.offerValue();
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
      const [paymentsRes, expensesRes] = await Promise.all([
        this.supabase.getAirbnbRecords(),
        this.supabase.getExpenses(),
      ]);

      if (paymentsRes.data) this.payments.set(paymentsRes.data);
      if (expensesRes.data) this.expenses.set(expensesRes.data);
    } finally {
      this.loading.set(false);
    }
  }

  protected onAddTithe() {
    this.titheValueToPay.set(this.titheValue());
    this.offerValueToPay.set(this.offerValue());
    this.showAddDialog.set(true);
  }

  protected onSaveTithe() {
    // Aqui implementaria a lógica de salvar se houvesse uma tabela
    // Por enquanto apenas fechamos o modal
    this.showAddDialog.set(false);
  }
}
