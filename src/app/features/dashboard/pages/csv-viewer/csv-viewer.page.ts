import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Components
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { MultiSelect } from 'primeng/multiselect';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { Popover } from 'primeng/popover';
import { Toast } from 'primeng/toast';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { AccordionModule } from 'primeng/accordion';
import { MessageService } from 'primeng/api';

// Services & Utils
import { SupabaseService } from '../../../../services/supabase.service';
import { StringUtils } from '../../../../shared/utils/string.utils';
import { AirbnbUtils } from '../../../../shared/utils/airbnb.utils';
import Papa from 'papaparse';

// Models & Helpers
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

// Shared Components
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { PageHeaderComponent } from '../../../../components/ui/page-header/page-header.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { AppColors } from '../../../../shared/design/colors';

@Component({
  selector: 'app-csv-viewer-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    TranslateModule,
    // PrimeNG
    TableModule,
    Button,
    Select,
    Checkbox,
    MultiSelect,
    Tag,
    Tooltip,
    Popover,
    Toast,
    InputText,
    IconField,
    InputIcon,
    AccordionModule,
    // Shared
    TablePaginatorComponent,
    PageHeaderComponent,
    FilterContainerComponent,
  ],
  providers: [MessageService],
  host: {
    class: 'block h-full overflow-hidden',
  },
  templateUrl: './csv-viewer.page.html',
})
export class CsvViewerPage {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly messageService = inject(MessageService);

  protected readonly syncing = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);
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
    const query = StringUtils.normalize(this.filterQuery());
    if (query) {
      data = data.filter((row) => {
        // Search in raw data values
        const rawValues = row.__raw ? Object.values(row.__raw) : [];
        return rawValues.some((val) => StringUtils.normalize(val).includes(query));
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

  protected getSelectedMonthLabel(): string {
    const month = this.selectedMonth();
    if (!month) return 'Todos';
    return this.months.find(m => m.value === month)?.label || 'Todos';
  }

  // Summary Totals
  protected readonly dateRange = computed(() => {
    const data = this.rows();
    if (data.length === 0) return { first: '', last: '' };

    const dates = data
      .map((r) => this.parseAirbnbDate(r.__norm.data))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return { first: '', last: '' };

    const format = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return {
      first: format(dates[0]),
      last: format(dates[dates.length - 1]),
    };
  });

  protected readonly summary = computed(() => {
    const data = this.visibleRows();
    let luizaValor = 0;
    let gelmerValor = 0;

    // Totais financeiros (soma tudo por pessoa)
    data.forEach((row) => {
      const valor = AirbnbUtils.parseCurrency(row.__norm.valor);
      const person = personFromTipo(row.__norm.tipo);

      if (person === 'Luiza') {
        luizaValor += valor;
      } else if (person === 'Gelmer') {
        gelmerValor += valor;
      }
    });

    // Totais agrupados (Noites e Limpeza) usando utilitário global
    const normalizedRows = data.map((r) => r.__norm);
    const { totalNoites, totalLimpeza } = AirbnbUtils.calculateGroupedTotals(normalizedRows);

    return {
      luizaValor,
      gelmerValor,
      totalLimpeza,
      totalNoites,
    };
  });

  private parseCurrency(val: string | undefined): number {
    return AirbnbUtils.parseCurrency(val);
  }

  private parseNumber(val: string | undefined): number {
    return AirbnbUtils.parseNumber(val);
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
    this.loadFromDatabase();
  }

  protected async syncDatabase() {
    if (this.rows().length === 0) return;

    this.syncing.set(true);
    try {
      // Criar os registros para o banco
      const allRecords = this.rows().map((row) => ({
        unique_key: `${row.__norm.codigoConfirmacao || 'N/A'}_${row.__norm.data}_${row.__norm.tipo}_${
          row.__norm.valor
        }`,
        data: row.__norm.data,
        tipo: row.__norm.tipo,
        codigo_confirmacao: row.__norm.codigoConfirmacao,
        noites: AirbnbUtils.parseNumber(row.__norm.noites),
        hospede: row.__norm.hospede,
        anuncio: row.__norm.anuncio,
        valor: AirbnbUtils.parseCurrency(row.__norm.valor),
        taxa_limpeza: AirbnbUtils.parseCurrency(row.__norm.taxaLimpeza),
        raw_data: row.__raw,
      }));

      // Deduplicar no frontend antes de enviar para o Supabase
      // O erro "ON CONFLICT DO UPDATE command cannot affect row a second time" ocorre
      // quando o mesmo unique_key aparece múltiplas vezes no mesmo lote de inserção.
      const uniqueRecordsMap = new Map();
      allRecords.forEach((record) => {
        uniqueRecordsMap.set(record.unique_key, record);
      });

      const uniqueRecords = Array.from(uniqueRecordsMap.values());

      const { error } = await this.supabase.upsertAirbnbRecords(uniqueRecords);

      if (error) throw error;

      this.messageService.add({
        severity: 'success',
        summary: 'Sincronizado',
        detail: `Dados sincronizados! (${uniqueRecords.length} registros únicos)`,
      });

      // Recarregar do banco para garantir consistência
      await this.loadFromDatabase();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro na Sincronização',
        detail: error.message,
      });
    } finally {
      this.syncing.set(false);
    }
  }

  protected async loadFromDatabase() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase.getAirbnbRecords();
      if (error) throw error;

      if (data && data.length > 0) {
        const rows: ViewerRow[] = data.map((item: any, index: number) => ({
          __id: index,
          __raw: item.raw_data,
          __norm: normalizeAirbnbRow(item.raw_data),
        }));

        this.rows.set(rows);
        this.recomputeGroupIndexMap(rows);

        if (rows.length > 0 && rows[0].__raw) {
          this.setupColumns(Object.keys(rows[0].__raw));
        }
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Banco de Dados Vazio',
          detail: 'Nenhum registro encontrado. Por favor, suba um arquivo CSV para começar.',
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar do banco:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro de Carregamento',
        detail: 'Não foi possível carregar os dados do banco.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  private loadFromAssets(url: string): void {
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (text) => this.applyCsvText(text),
      error: () => {
        console.error('Erro ao carregar asset:', url);
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

  protected onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const text = e.target.result;
        this.applyCsvText(text);
        this.messageService.add({
          severity: 'info',
          summary: 'CSV Carregado',
          detail: 'Clique em "Sincronizar" para salvar estes dados no banco.',
        });
      };
      reader.readAsText(file);
    }
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

  private setupColumns(fields: string[]): void {
    this.headers.set(fields);
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
    this.rows.set(enriched);
    this.recomputeGroupIndexMap(enriched);
    this.setupColumns(fields);
  }
}
