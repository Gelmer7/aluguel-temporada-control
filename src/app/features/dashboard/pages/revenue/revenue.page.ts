import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { Popover } from 'primeng/popover';

// Components
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { EarningsPaymentsChartsComponent } from '../../components/charts/earnings-payments-charts/earnings-payments-charts.component';

// Services & Models
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';
import { UnifiedEarning } from '../../../../models/airbnb.model';
import { SupabaseService } from '../../../../services/supabase.service';
import { DateUtils } from '../../../../shared/utils/date.utils';
import { PdfService } from '../../../../services/pdf.service';
import { TemplateRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-revenue-page',
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
    ButtonModule,
    TooltipModule,
    TranslateModule,
    FloatLabel,
    ToastModule,
    DatePickerModule,
    Popover,
    FilterContainerComponent,
    EarningsPaymentsChartsComponent,
  ],
  templateUrl: './revenue.page.html',
})
export class RevenuePage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly translate = inject(TranslateService);
  private readonly houseService = inject(HouseService);
  private readonly headerService = inject(HeaderService);
  private readonly pdfService = inject(PdfService);

  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  // Filtros
  protected readonly selectedYear = signal<number | string>('ALL');
  protected readonly selectedMonths = signal<(number | string)[]>([]);
  protected readonly selectedTypes = signal<string[]>([]);
  protected readonly filterDateRange = signal<Date[] | null>(null);

  // Gráfico
  protected readonly showChart = signal<boolean>(false);

  // Dados
  protected readonly loading = signal<boolean>(true);
  protected readonly payments = signal<UnifiedEarning[]>([]);

  // Opções de Filtro
  protected readonly years = signal<number[]>([]);
  protected readonly yearOptions = computed(() => [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...this.years().map((y) => ({ label: y.toString(), value: y })),
  ]);

  protected readonly monthOptions = computed(() => [
    ...Array.from({ length: 12 }, (_, i) => ({
      label: this.translate.instant(`MONTHS.${i}`),
      value: i,
    })),
  ]);

  protected readonly availableTypes = computed(() => {
    const types = new Set<string>();
    this.payments().forEach((p) => {
      if (p.fonte === 'Manual') {
        types.add(this.translate.instant('TERMS.MANUAL_RENTALS'));
      } else if (p.tipo) {
        types.add(p.tipo);
      }
    });

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

    // Configura o header assim que o template estiver disponível
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'TERMS.REVENUE',
          icon: 'pi-arrow-down',
          actions: actions,
        });
      }
    });
  }

  protected onDownloadPDF() {
    this.pdfService.generateRevenuePdf({
      year: this.selectedYear(),
      months: this.selectedMonths(),
      types: this.selectedTypes(),
      houseCode: this.houseService.currentHouseCode() || undefined,
      payments: this.filteredPayments(),
      total: this.totalReceived(),
    });
  }

  // Cálculos
  protected readonly filteredPayments = computed(() => {
    const year = this.selectedYear();
    const months = this.selectedMonths();
    const types = this.selectedTypes();
    const range = this.filterDateRange();

    return this.payments().filter((p) => {
      const date = DateUtils.parseLocal(p.data);

      // Filtro de Período (Date Range) tem precedência se definido
      if (range && range.length === 2 && range[0] && range[1]) {
        const start = new Date(range[0]);
        const end = new Date(range[1]);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      }

      const matchesYear = year === 'ALL' || date.getFullYear() === year;
      const matchesMonth = months.length === 0 || months.includes(date.getMonth());

      let matchesType = types.length === 0;
      if (!matchesType) {
        if (p.fonte === 'Manual') {
          matchesType = types.includes(this.translate.instant('TERMS.MANUAL_RENTALS'));
        } else {
          matchesType = types.includes(p.tipo);
        }
      }

      return matchesYear && matchesMonth && matchesType;
    });
  });

  protected onDateRangeChange(range: Date[] | null) {
    this.filterDateRange.set(range);
  }

  protected clearFilters() {
    this.selectedYear.set('ALL');
    this.selectedMonths.set([]);
    this.selectedTypes.set([]);
    this.filterDateRange.set(null);
  }

  protected readonly totalReceived = computed(() => {
    return this.filteredPayments().reduce((acc, p) => acc + (p.pago || 0), 0);
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
      const earningsRes = await this.supabase.getUnifiedEarnings();

      if (earningsRes.data) {
        this.payments.set(earningsRes.data);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
