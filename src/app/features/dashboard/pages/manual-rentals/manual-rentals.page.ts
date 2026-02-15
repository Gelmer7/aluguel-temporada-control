import { Component, ChangeDetectionStrategy, OnInit, signal, inject, computed, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { Tag, TagModule } from 'primeng/tag';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { ManualRentalFormComponent } from '../../components/manual-rental-form/manual-rental-form.component';
import { ManualRentalChartsComponent } from '../../components/charts/manual-rental-charts/manual-rental-charts.component';
import { SupabaseService } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';
import { PdfService } from '../../../../services/pdf.service';
import { ManualRental } from '../../../../models/airbnb.model';
import { StringUtils } from '../../../../shared/utils/string.utils';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-manual-rentals-page',
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
    TagModule,
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
    TablePaginatorComponent,
    FilterContainerComponent,
    ManualRentalFormComponent,
    ManualRentalChartsComponent,
    TranslateModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manual-rentals.page.html',
})
export class ManualRentalsPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private houseService = inject(HouseService);
  private headerService = inject(HeaderService);
  private pdfService = inject(PdfService);

  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  rentals = signal<ManualRental[]>([]);
  filteredRentals = signal<ManualRental[]>([]);
  loading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  showCharts = signal<boolean>(false);
  currentRental = signal<ManualRental | null>(null);

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

  yearOptions = computed(() => [
    { label: 'TERMS.ALL', value: 'ALL' },
    ...this.years().map(y => ({ label: y.toString(), value: y }))
  ]);

  monthOptions = this.months;

  selectedYear = signal<number | string>('ALL');
  selectedMonth = signal<number[]>(this.months.map(m => m.value));
  filterDateRange = signal<Date[] | null>(null);
  globalFilter = signal<string>('');

  // Pagination
  first = signal<number>(0);
  rows = signal<number>(20);

  constructor() {
    // Reload when house changes
    effect(() => {
      this.houseService.currentHouseCode();
      this.loadRentals();
    });

    // Configura o header
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'TERMS.MANUAL_RENTALS',
          icon: 'pi-warehouse',
          actions: actions
        });
      }
    });
  }

  async ngOnInit() {
    this.generateYears();
    await this.loadRentals();
  }

  generateYears() {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let i = 0; i < 6; i++) {
      yearsList.push(currentYear - i);
    }
    this.years.set(yearsList);
  }

  async loadRentals() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.getManualRentals();
      if (error) throw error;
      this.rentals.set(data || []);
      this.applyFilters();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('COMMON.ERROR'),
        detail: error.message
      });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    let filtered = [...this.rentals()];

    const year = this.selectedYear();
    if (year !== 'ALL') {
      filtered = filtered.filter(r => {
        const date = DateUtils.parseLocal(r.data_pagamento);
        return date.getFullYear() === year;
      });
    }

    const months = this.selectedMonth();
    if (months.length > 0 && months.length < this.months.length) {
      filtered = filtered.filter(r => {
        const date = DateUtils.parseLocal(r.data_pagamento);
        return months.includes(date.getMonth() + 1);
      });
    }

    // Filter by Date Range
    const range = this.filterDateRange();
    if (range && range[0] && range[1]) {
      const start = new Date(range[0]);
      const end = new Date(range[1]);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((r) => {
        const date = DateUtils.parseLocal(r.data_pagamento);
        return date >= start && date <= end;
      });
    }

    const query = StringUtils.normalize(this.globalFilter());
    if (query) {
      filtered = filtered.filter(r =>
        StringUtils.normalize(r.hospede).includes(query) ||
        StringUtils.normalize(r.anuncio).includes(query) ||
        StringUtils.normalize(r.informacoes || '').includes(query)
      );
    }

    this.filteredRentals.set(filtered);
  }

  onFilterGlobal(query: string) {
    this.globalFilter.set(query);
    this.first.set(0);
    this.applyFilters();
  }

  onFilterChange() {
    this.first.set(0);
    this.applyFilters();
  }

  clearFilters() {
    this.selectedYear.set('ALL');
    this.selectedMonth.set(this.months.map(m => m.value));
    this.filterDateRange.set(null);
    this.onFilterChange();
  }

  pagedRentals = computed(() => {
    const data = [...this.filteredRentals()];

    // Sort by data_pagamento descending
    data.sort((a, b) => {
      const dateA = DateUtils.parseLocal(a.data_pagamento).getTime();
      const dateB = DateUtils.parseLocal(b.data_pagamento).getTime();
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

  totalRentals = computed(() => {
    return this.filteredRentals().reduce((acc, curr) => acc + (curr.valor_pago || 0), 0);
  });

  openNew() {
    this.currentRental.set(null);
    this.showForm.set(true);
  }

  editRental(rental: ManualRental) {
    this.currentRental.set(rental);
    this.showForm.set(true);
  }

  async saveRental(rental: ManualRental) {
    try {
      const { error } = await this.supabaseService.upsertManualRental({
        ...rental,
        id: this.currentRental()?.id
      });
      if (error) throw error;

      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('ACTIONS.SUCCESS'),
        detail: this.translateService.instant(
          this.currentRental() ? 'MANUAL_RENTALS_FORM.SUCCESS_UPDATE' : 'MANUAL_RENTALS_FORM.SUCCESS_CREATE'
        )
      });
      this.loadRentals();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('COMMON.ERROR'),
        detail: error.message
      });
    }
  }

  confirmDelete(rental: ManualRental) {
    this.confirmationService.confirm({
      message: this.translateService.instant('MANUAL_RENTALS_FORM.CONFIRM_DELETE'),
      header: this.translateService.instant('ACTIONS.CONFIRM'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translateService.instant('COMMON.YES'),
      rejectLabel: this.translateService.instant('COMMON.NO'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.deleteRental(rental.id!)
    });
  }

  async deleteRental(id: string) {
    try {
      const { error } = await this.supabaseService.deleteManualRental(id);
      if (error) throw error;

      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('ACTIONS.SUCCESS'),
        detail: this.translateService.instant('COMMON.DELETE_SUCCESS')
      });
      this.loadRentals();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('COMMON.ERROR'),
        detail: error.message
      });
    }
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
    if (!range || (range[0] && range[1])) {
      this.onFilterChange();
    }
  }

  onDownloadPDF() {
    this.pdfService.generateManualRentalsPdf({
      year: this.selectedYear(),
      months: this.selectedMonth(),
      houseCode: this.houseService.currentHouseCode() || undefined,
      rentals: this.filteredRentals(),
      total: this.totalRentals()
    });
  }
}
