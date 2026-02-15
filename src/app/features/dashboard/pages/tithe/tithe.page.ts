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
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';


// Components
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';

// Services & Models
import { SupabaseService, Tithe } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';
import { PdfService } from '../../../../services/pdf.service';
import { Expense } from '../../../../models/expense.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

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
    MultiSelectModule,
    InputNumberModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    FloatLabel,
    ToastModule,
    DialogComponent,
    FilterContainerComponent,
    TablePaginatorComponent,
    IftaLabelModule,
    TextareaModule,
    CheckboxModule
  ],
  templateUrl: './tithe.page.html',
})
export class TithePage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly translate = inject(TranslateService);
  private readonly houseService = inject(HouseService);
  private readonly messageService = inject(MessageService);
  private readonly headerService = inject(HeaderService);
  private readonly pdfService = inject(PdfService);

  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  // Filtros
  protected readonly selectedYear = signal<number>(new Date().getFullYear());
  protected readonly selectedMonths = signal<number[]>([new Date().getMonth()]);
  protected readonly tithePercentage = signal<number>(10);
  protected readonly offerPercentage = signal<number>(5);
  protected readonly includeCarneLeao = signal<boolean>(false);

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

  // Pagination
  protected readonly firstPayment = signal(0);
  protected readonly rowsPayment = signal(10);
  protected readonly firstExpense = signal(0);
  protected readonly rowsExpense = signal(10);
  protected readonly firstHistory = signal(0);
  protected readonly rowsHistory = signal(10);

  protected onPaymentPageChange(event: any) {
    this.firstPayment.set(event.first);
    this.rowsPayment.set(event.rows);
  }

  protected onExpensePageChange(event: any) {
    this.firstExpense.set(event.first);
    this.rowsExpense.set(event.rows);
  }

  protected onHistoryPageChange(event: any) {
    this.firstHistory.set(event.first);
    this.rowsHistory.set(event.rows);
  }

  protected readonly pagedPayments = computed(() => {
    const data = this.filteredPayments();
    const start = this.firstPayment();
    const end = start + this.rowsPayment();
    return data.slice(start, end);
  });

  protected readonly pagedExpenses = computed(() => {
    const data = this.filteredExpenses();
    const start = this.firstExpense();
    const end = start + this.rowsExpense();
    return data.slice(start, end);
  });

  protected readonly pagedHistory = computed(() => {
    const data = this.titheHistory();
    const start = this.firstHistory();
    const end = start + this.rowsHistory();
    return data.slice(start, end);
  });

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
    const months = this.selectedMonths();
    return this.payments().filter((p) => {
      const date = DateUtils.parseLocal(p.data);
      // Usar fuso horário local para filtrar corretamente
      return date.getFullYear() === year && months.includes(date.getMonth());
    });
  });

  protected readonly filteredExpenses = computed(() => {
    const year = this.selectedYear();
    const months = this.selectedMonths();

    return this.expenses().filter((e) => {
      const date = DateUtils.parseLocal(e.purchaseDate);
      return date.getFullYear() === year && months.includes(date.getMonth());
    });
  });

  protected readonly totalAirbnb = computed(() => {
    return this.filteredPayments().reduce((acc, p) => acc + (p.pago || 0), 0);
  });

  protected readonly totalExpenses = computed(() => {
    const includeCarneLeao = this.includeCarneLeao();
    return this.filteredExpenses()
      .filter((e) => includeCarneLeao || e.type !== 'CARNE_LEAO')
      .reduce((acc, e) => acc + (e.price || 0), 0);
  });

  protected readonly totalEarnings = computed(() => {
    return this.totalAirbnb() - this.totalExpenses();
  });

  protected readonly titheValue = computed(() => {
    return (this.totalEarnings() * this.tithePercentage()) / 100;
  });

  protected readonly offerValue = computed(() => {
    return (this.totalEarnings() * this.offerPercentage()) / 100;
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
    const selectedMonths = this.selectedMonths();
    if (selectedMonths.length === 0) return;

    // Se múltiplos meses selecionados, salvar para o primeiro (ou poderíamos fazer um loop, mas dízimo costuma ser por mês)
    // Para manter a simplicidade e consistência, usaremos o primeiro mês selecionado para a data de referência
    const month = selectedMonths[0] + 1;
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

  protected onDownloadPDF() {
    this.pdfService.generateTithePdf({
      year: this.selectedYear(),
      months: this.selectedMonths(),
      tithePercentage: this.tithePercentage(),
      offerPercentage: this.offerPercentage(),
      houseCode: this.houseService.currentHouseCode() || undefined,
      includeCarneLeao: this.includeCarneLeao(),
      payments: this.filteredPayments(),
      expenses: this.filteredExpenses(),
      history: this.titheHistory(),
      totals: {
        airbnb: this.totalAirbnb(),
        expenses: this.totalExpenses(),
        earnings: this.totalEarnings(),
        tithe: this.titheValue(),
        offer: this.offerValue(),
        total: this.totalToPay()
      }
    });
  }
}
