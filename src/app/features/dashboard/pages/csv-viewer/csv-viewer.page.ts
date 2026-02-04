import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { AccordionModule } from 'primeng/accordion';
import { Card } from 'primeng/card';
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { PageHeaderComponent } from '../../../../components/ui/page-header/page-header.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Papa from 'papaparse';
import { AirbnbNormalizedRow, normalizeAirbnbRow } from '../../../../models/airbnb.model';
import {
  ViewerRow,
  getCellValue as gv,
  renderDerived as rd,
  isDerived as idv,
  isPessoa as ip,
  colTooltip as ct,
  tipoHighlight as th,
  personFromTipo,
} from './csv-viewer.helpers';
import { AppColors } from '../../../../shared/design/colors';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-csv-viewer-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TooltipModule,
    MultiSelectModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    RippleModule,
    TagModule,
    CheckboxModule,
    SelectModule,
    AccordionModule,
    HttpClientModule,
    TranslateModule,
    TablePaginatorComponent,
    PageHeaderComponent,
],
  host: {
    class: 'block h-full overflow-hidden',
  },
  templateUrl: './csv-viewer.page.html',
})
export class CsvViewerPage {
  private readonly http = inject(HttpClient);
  protected readonly headers = signal<string[]>([]);
  protected readonly rows = signal<ViewerRow[]>([]);
  protected readonly cols = signal<{ field: string; headerFull: string; headerAbbr: string }[]>([]);
  protected readonly selectedColumns = signal<
    { field: string; headerFull: string; headerAbbr: string }[]
  >([]);
  public readonly groupIndexMap = signal<Record<string, number>>({});
  public readonly columnMinWidth = signal<Record<string, string>>({ Noites: '6rem' });
  public readonly columnMaxWidth = signal<Record<string, string>>({ Noites: '10rem' });
  protected readonly expandedRowGroups = signal<string[]>([]);
  protected readonly hidePayout = signal<boolean>(true);
  protected readonly filterQuery = signal<string>('');
  protected readonly selectedYear = signal<number | null>(null);
  protected readonly selectedMonth = signal<number | null>(null);
  protected readonly selectedType = signal<string | null>(null);

  protected readonly years = computed(() => {
    const years = this.rows().map((r) => this.parseAirbnbDate(r.__norm.data)?.getFullYear());
    return Array.from(new Set(years.filter((y): y is number => !!y))).sort((a, b) => b - a);
  });

  protected readonly months = [
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
    { label: 'Dezembro', value: 12 },
  ];

  protected readonly types = computed(() => {
    const types = this.rows().map((r) => (r.__norm.tipo ?? '').trim());
    return Array.from(new Set(types.filter((t) => !!t))).sort();
  });

  // Pagination
  protected readonly first = signal<number>(0);
  protected readonly rowsPerPage = signal<number>(20);

  // Computed Data
  protected readonly visibleRows = computed(() => {
    let data = this.rows();

    // Filter by Payout
    if (this.hidePayout()) {
      data = data.filter((r) => (r.__norm.tipo ?? '').trim() !== 'Payout');
    }

    // Filter by Year
    const year = this.selectedYear();
    if (year) {
      data = data.filter((r) => {
        const date = this.parseAirbnbDate(r.__norm.data);
        return date ? date.getFullYear() === year : false;
      });
    }

    // Filter by Month
    const month = this.selectedMonth();
    if (month) {
      data = data.filter((r) => {
        const date = this.parseAirbnbDate(r.__norm.data);
        return date ? date.getMonth() + 1 === month : false;
      });
    }

    // Filter by Type
    const type = this.selectedType();
    if (type) {
      data = data.filter((r) => (r.__norm.tipo ?? '').trim() === type);
    }

    // Filter by Global Query
    const query = this.filterQuery().toLowerCase().trim();
    if (query) {
      data = data.filter((row) => {
        // Search in raw data values
        const rawValues = row.__raw ? Object.values(row.__raw) : [];
        return rawValues.some((val) => String(val).toLowerCase().includes(query));
      });
    }

    return data;
  });

  private parseAirbnbDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    // Airbnb standard is often "MM/DD/YYYY"
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  }

  protected formatDateBR(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = this.parseAirbnbDate(dateStr);
    if (!date) return dateStr;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  protected isDateField(field: string): boolean {
    const dateFields = ['Data', 'Data da reserva', 'Data de início', 'Data de término'];
    return dateFields.includes(field);
  }

  protected readonly pagedRows = computed(() => {
    const data = this.visibleRows();
    const start = this.first();
    const end = start + this.rowsPerPage();
    return data.slice(start, end);
  });

  // Summary Totals
  protected readonly summary = computed(() => {
    const data = this.visibleRows();
    let luizaValor = 0;
    let gelmerValor = 0;
    let totalLimpeza = 0;
    let totalNoites = 0;

    data.forEach((row) => {
      const valor = this.parseCurrency(row.__norm.valor);
      const limpeza = this.parseCurrency(row.__norm.taxaLimpeza);
      const noites = this.parseNumber(row.__norm.noites);
      const person = personFromTipo(row.__norm.tipo);

      if (person === 'Luiza') {
        luizaValor += valor;
      } else if (person === 'Gelmer') {
        gelmerValor += valor;
      }

      totalLimpeza += limpeza;
      if ((row.__norm.tipo ?? '').trim() === 'Reserva') {
        totalNoites += noites;
      }
    });

    return {
      luizaValor,
      gelmerValor,
      totalLimpeza,
      totalNoites,
    };
  });

  private parseCurrency(val: string | undefined): number {
    if (!val) return 0;
    // Remove non-numeric except comma and dot
    const clean = val.replace(/[^\d,.-]/g, '');
    if (!clean) return 0;

    // Handle Brazilian format 1.234,56
    if (clean.includes(',') && clean.includes('.')) {
      return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    }
    // Handle format 1234,56
    if (clean.includes(',')) {
      return parseFloat(clean.replace(',', '.'));
    }
    return parseFloat(clean);
  }

  private parseNumber(val: string | undefined): number {
    if (!val) return 0;
    return parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
  }

  private readonly inicioFimField = 'Data Inicio-Fim';
  private readonly inicioFimHeader = 'Inicio-Fim';
  private readonly pessoaField = 'Pessoa Pago';
  private readonly pessoaHeader = 'Pessoa Pago';
  private readonly preferredInitial = [
    'Data',
    'Tipo',
    'Código de Confirmação',
    this.pessoaHeader,
    this.inicioFimField, //coluna virtual
    // 'Data de início',
    // 'Data de término',
    'Noites',
    'Hóspede',
    //'Informações',
    // 'Taxa de serviço',
    'Taxa de limpeza',
    'Valor',
  ];

  constructor() {
    this.loadFromAssets('/airbnb_INICIO__01_2026.csv');
  }

  private loadFromAssets(url: string): void {
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (text) => this.applyCsvText(text),
      error: () => {
        const fallback = '/assets/airbnb_INICIO__01_2026.csv';
        this.http
          .get(fallback, { responseType: 'text' })
          .subscribe((text) => this.applyCsvText(text));
      },
    });
  }

  protected readonly rowTrackBy = (_: number, r: { __id: number }) => r.__id;

  protected onColumnsChange(cols: { field: string; headerFull: string; headerAbbr: string }[]) {
    this.selectedColumns.set(cols || []);
  }

  protected onHidePayoutChange(hide: boolean) {
    this.hidePayout.set(hide);
    this.first.set(0);
  }

  protected onFilter(query: string) {
    this.filterQuery.set(query);
    this.first.set(0); // Reset to first page on filter
  }

  protected onYearChange(year: number | null) {
    this.selectedYear.set(year);
    this.first.set(0);
  }

  protected onMonthChange(month: number | null) {
    this.selectedMonth.set(month);
    this.first.set(0);
  }

  protected onTypeChange(type: string | null) {
    this.selectedType.set(type);
    this.first.set(0);
  }

  protected onPageChange(event: any) {
    this.first.set(event.first);
    this.rowsPerPage.set(event.rows);
  }

  protected calculateDateTotal(date: string): number {
    return this.visibleRows().filter((r) => this.getCellValue(r, 'Data') === date).length;
  }

  protected isGroupExpanded(date: string): boolean {
    return this.expandedRowGroups().includes(date);
  }

  protected toggleGroup(date: string): void {
    const current = this.expandedRowGroups();
    const next = current.includes(date) ? current.filter((d) => d !== date) : [...current, date];
    this.expandedRowGroups.set(next);
  }

  private recomputeGroupIndexMap(data: ViewerRow[]) {
    const dates = Array.from(new Set(data.map((d) => d.__norm.data))).sort();
    const m: Record<string, number> = {};
    for (let i = 0; i < dates.length; i++) m[dates[i]] = i;
    this.groupIndexMap.set(m);
    this.expandedRowGroups.set(dates);
  }

  protected groupIndex(date: string): number {
    const m = this.groupIndexMap();
    return m[date] ?? 0;
  }

  public groupClass(date: string): string {
    return this.groupIndex(date) % 2 === 0 ? 'bg-neutral-50' : 'bg-neutral-100';
  }

  public groupHeaderClass(date: string): string {
    return this.groupClass(date) + ' !p-0';
  }

  public getColMinWidth(field: string): string {
    const map = this.columnMinWidth();
    return map[field] ?? '6rem';
  }

  public getColMaxWidth(field: string): string {
    const map = this.columnMaxWidth();
    return map[field] ?? '12rem';
  }

  public applyColumnSizes(fields: string[]): void {
    const present = new Set(fields);
    const small = [
      'Data',
      'Código de Confirmação',
      'Data de início',
      'Data de término',
      'Noites',
      'Pago',
      'Taxa de serviço',
      'Taxa de limpeza',
      'Ganhos brutos',
      // 'Hóspede',
      'Valor',
      'Informações',
      'Tipo',
      this.pessoaHeader,
      this.inicioFimField,
    ];
    const large = ['Hóspede'];

    const min: Record<string, string> = { ...this.columnMinWidth() };
    const max: Record<string, string> = { ...this.columnMaxWidth() };

    for (const f of small)
      if (present.has(f)) {
        min[f] = '3rem';
        max[f] = '8rem';
      }
    //for (const f of medium) if (present.has(f)) { min[f] = '8rem'; max[f] = '10rem'; }
    for (const f of large)
      if (present.has(f)) {
        min[f] = '10rem';
        max[f] = '16rem';
      }

    this.columnMinWidth.set(min);
    this.columnMaxWidth.set(max);
  }

  public tipoHighlight(row: ViewerRow): string | undefined {
    return th(row);
  }

  public rowClass(row: ViewerRow): string {
    const base = this.groupClass(row.__norm.data);
    const extra = this.tipoHighlight(row);
    return extra ? base + ' ' + extra : base;
  }

  public colClass(field: string): string {
    return field === 'Valor' ? AppColors.pagamentos : '';
  }

  public colHeaderClass(field: string): string {
    const base = field === 'Valor' ? AppColors.pagamentos : '';
    return (base ? base + ' ' : '') + '!p-1';
  }

  public tdClass(row: ViewerRow, field: string): string {
    const base = field === 'Valor' ? this.colClass(field) : this.rowClass(row);
    return base + ' !p-1';
  }

  public reservationUrl(code?: string): string {
    const c = (code ?? '').trim();
    return c
      ? `https://www.airbnb.com.br/hosting/reservations/details/${encodeURIComponent(c)}`
      : '';
  }

  public colTooltip(row: ViewerRow, field: string): string {
    return ct(row, field, this.inicioFimField, this.pessoaField);
  }

  public isDerived(field: string): boolean {
    return idv(field, this.inicioFimField, this.pessoaField);
  }

  public isPessoa(field: string): boolean {
    return ip(field, this.pessoaField);
  }

  public renderDerived(row: ViewerRow, field: string): string {
    return rd(row, field, this.inicioFimField, this.pessoaField);
  }

  public getCellValue(row: ViewerRow, field: string): string {
    return this.isDerived(field) ? this.renderDerived(row, field) : gv(row, field);
  }

  private applyCsvText(text: string): void {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    const fields = (result.meta as any).fields || [];
    const data = Array.isArray(result.data) ? (result.data as any[]) : [];
    const enriched: ViewerRow[] = [];
    for (let i = 0; i < data.length; i++) {
      const __raw = data[i] as Record<string, string>;
      const __norm = normalizeAirbnbRow(__raw as any);
      enriched.push({ __id: i + 1, __raw, __norm });
    }
    this.headers.set(fields);
    this.rows.set(enriched);
    this.recomputeGroupIndexMap(enriched);
    this.applyColumnSizes(fields);
    const mapped = fields.map((f: string) => ({ field: f, headerFull: f, headerAbbr: f }));
    const derivedInicioFim = {
      field: this.inicioFimField,
      headerFull: this.inicioFimHeader,
      headerAbbr: this.inicioFimHeader,
    };
    const derivedPessoa = {
      field: this.pessoaField,
      headerFull: this.pessoaHeader,
      headerAbbr: this.pessoaHeader,
    };
    const mappedWithDerived = [...mapped, derivedInicioFim, derivedPessoa];
    this.cols.set(mappedWithDerived);
    const colFields = new Set(mappedWithDerived.map((c) => c.field));
    const initialSelected = this.preferredInitial
      .filter((n) => colFields.has(n))
      .map((n) => {
        const m = mappedWithDerived.find((c) => c.field === n)!;
        return { field: m.field, headerFull: m.headerFull, headerAbbr: m.headerAbbr };
      });
    this.selectedColumns.set(
      initialSelected.length
        ? initialSelected
        : mappedWithDerived.slice(0, Math.min(8, mappedWithDerived.length))
    );
  }
}
