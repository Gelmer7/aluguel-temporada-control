import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
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
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Papa from 'papaparse';
import { AirbnbNormalizedRow, normalizeAirbnbRow } from '../../../../models/airbnb.model';
import { ViewerRow, getCellValue as gv, renderDerived as rd, isDerived as idv, isPessoa as ip, colTooltip as ct, tipoHighlight as th } from './csv-viewer.helpers';
import { AppColors } from '../../../../shared/design/colors';

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
    HttpClientModule,
  ],
  templateUrl: './csv-viewer.page.html',
})
export class CsvViewerPage {
  private readonly http = inject(HttpClient);
  protected readonly headers = signal<string[]>([]);
  protected readonly rows = signal<ViewerRow[]>([]);
  protected readonly cols = signal<{ field: string; headerFull: string; headerAbbr: string }[]>([]);
  protected readonly selectedColumns = signal<{ field: string; headerFull: string; headerAbbr: string }[]>([]);
  protected globalQuery = '';
  public readonly groupIndexMap = signal<Record<string, number>>({});
  public readonly columnMinWidth = signal<Record<string, string>>({ Noites: '6rem' });
  public readonly columnMaxWidth = signal<Record<string, string>>({ Noites: '10rem' });
  protected readonly expandedRowGroups = signal<string[]>([]);
  protected readonly hidePayout = signal<boolean>(true);
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
    this.loadFromAssets('/airbnb_12_2024-11_2025.csv');
  }

  private loadFromAssets(url: string): void {
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (text) => this.applyCsvText(text),
      error: () => {
        const fallback = '/assets/airbnb_12_2024-11_2025.csv';
        this.http.get(fallback, { responseType: 'text' }).subscribe((text) => this.applyCsvText(text));
      },
    });
  }

  protected readonly rowTrackBy = (_: number, r: { __id: number }) => r.__id;

  protected onColumnsChange(cols: { field: string; headerFull: string; headerAbbr: string }[]) {
    this.selectedColumns.set(cols || []);
  }

  protected calculateDateTotal(date: string): number {
    const data = this.visibleRows();
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i].__norm.data === date) count++;
    }
    return count;
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

  protected isGroupExpanded(date: string): boolean {
    return this.expandedRowGroups().includes(date);
  }

  protected toggleGroup(date: string): void {
    const current = this.expandedRowGroups();
    const next = current.includes(date) ? current.filter((d) => d !== date) : [...current, date];
    this.expandedRowGroups.set(next);
  }

  public tipoHighlight(row: ViewerRow): string | undefined { return th(row); }

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
    return c ? `https://www.airbnb.com.br/hosting/reservations/details/${encodeURIComponent(c)}` : '';
  }

  public colTooltip(row: ViewerRow, field: string): string { return ct(row, field, this.inicioFimField, this.pessoaField); }

  public isDerived(field: string): boolean { return idv(field, this.inicioFimField, this.pessoaField); }

  public isPessoa(field: string): boolean { return ip(field, this.pessoaField); }

  public renderDerived(row: ViewerRow, field: string): string { return rd(row, field, this.inicioFimField, this.pessoaField); }

  public getCellValue(row: ViewerRow, field: string): string { return this.isDerived(field) ? this.renderDerived(row, field) : gv(row, field); }

  


  public visibleRows(): ViewerRow[] {
    const data = this.rows();
    return this.hidePayout()
      ? data.filter((r) => (r.__norm.tipo ?? '').trim() !== 'Payout')
      : data;
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
    const derivedInicioFim = { field: this.inicioFimField, headerFull: this.inicioFimHeader, headerAbbr: this.inicioFimHeader };
    const derivedPessoa = { field: this.pessoaField, headerFull: this.pessoaHeader, headerAbbr: this.pessoaHeader };
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
