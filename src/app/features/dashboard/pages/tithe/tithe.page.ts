import { Component, ChangeDetectionStrategy, signal, inject, computed, OnInit, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';


// Components
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';

// Services & Models
import { SupabaseService, Expense, Tithe } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';

@Component({
  selector: 'app-tithe-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
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
    ToastModule,
    DialogComponent,
    FilterContainerComponent,
    IftaLabelModule,
    TextareaModule
  ],
  templateUrl: './tithe.page.html',
})
export class TithePage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly translate = inject(TranslateService);
  private readonly houseService = inject(HouseService);
  private readonly messageService = inject(MessageService);
  private readonly headerService = inject(HeaderService);

  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

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

    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'TERMS.TITHE',
          icon: 'pi-heart',
          actions: actions
        });
      }
    });
  }

  // Dados
  protected readonly loading = signal<boolean>(true);
  protected readonly saving = signal<boolean>(false);
  protected readonly payments = signal<any[]>([]);
  protected readonly expenses = signal<Expense[]>([]);
  protected readonly titheHistory = signal<Tithe[]>([]);

  // Modal
  protected readonly showAddDialog = signal<boolean>(false);
  protected readonly titheValueToPay = signal<number>(0);
  protected readonly offerValueToPay = signal<number>(0);
  protected readonly titheObservation = signal<string>('');

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
      const date = new Date(e.purchaseDate);
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
      const [earningsRes, expensesRes, tithesRes] = await Promise.all([
        this.supabase.getUnifiedEarnings(),
        this.supabase.getExpenses(),
        this.supabase.getTithes(),
      ]);

      if (earningsRes.data) this.payments.set(earningsRes.data);
      if (expensesRes.data) this.expenses.set(expensesRes.data);
      if (tithesRes.data) this.titheHistory.set(tithesRes.data);
    } finally {
      this.loading.set(false);
    }
  }

  protected onAddTithe() {
    this.titheValueToPay.set(this.titheValue());
    this.offerValueToPay.set(this.offerValue());
    this.titheObservation.set('');
    this.showAddDialog.set(true);
  }

  protected async onSaveTithe() {
    const month = this.selectedMonth() + 1;
    const monthStr = month < 10 ? `0${month}` : month;
    const monthYear = `${this.selectedYear()}-${monthStr}-01`;

    const titheData: Omit<Tithe, 'id' | 'createDate'> = {
      monthYear: monthYear,
      airbnbGross: this.totalAirbnb(),
      titheValue: this.titheValueToPay(),
      offerValue: this.offerValueToPay(),
      totalPaid: this.titheValueToPay() + this.offerValueToPay(),
      observation: this.titheObservation(),
    };

    this.saving.set(true);
    try {
      const { error } = await this.supabase.addTithe(titheData);

      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('COMMON.ERROR'),
          detail: error.message
        });
      } else {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('COMMON.SUCCESS'),
          detail: this.translate.instant('TITHE_MANAGEMENT.SAVE_SUCCESS')
        });
        this.showAddDialog.set(false);
        await this.loadData();
      }
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: err.message
      });
    } finally {
      this.saving.set(false);
    }
  }

  protected async onDeleteTithe(id: string) {
    try {
      const { error } = await this.supabase.deleteTithe(id);
      if (!error) {
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('COMMON.SUCCESS'),
          detail: this.translate.instant('COMMON.DELETE_SUCCESS')
        });
        await this.loadData();
      }
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('COMMON.ERROR'),
        detail: err.message
      });
    }
  }
}
