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
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Papa from 'papaparse';
import { AirbnbRow } from '../../../../models/airbnb.model';
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
    HttpClientModule,
  ],
  templateUrl: './csv-viewer.page.html',
})
export class CsvViewerPage {
  private readonly http = inject(HttpClient);
  protected readonly headers = signal<string[]>([]);
  protected readonly rows = signal<(AirbnbRow & { __id: number })[]>([]);
  protected readonly cols = signal<{ field: string; header: string }[]>([]);
  protected readonly selectedColumns = signal<{ field: string; header: string }[]>([]);
  protected globalQuery = '';
  public readonly groupIndexMap = signal<Record<string, number>>({});
  public readonly columnMinWidth = signal<Record<string, string>>({ Noites: '6rem' });
  public readonly columnMaxWidth = signal<Record<string, string>>({ Noites: '10rem' });
  protected readonly expandedRowGroups = signal<string[]>([]);
  private readonly preferredInitial = [
    'Data',
    'Tipo',
    'Código de Confirmação',
    'Data de início',
    'Data de término',
    'Noites',
    'Hóspede',
    'Informações',
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

  protected readonly rowTrackBy = (_: number, r: AirbnbRow & { __id: number }) => r.__id;

  protected onColumnsChange(cols: { field: string; header: string }[]) {
    this.selectedColumns.set(cols || []);
  }

  protected calculateDateTotal(date: string): number {
    const data = this.rows();
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i]['Data'] === date) count++;
    }
    return count;
  }

  private recomputeGroupIndexMap(data: (AirbnbRow & { __id: number })[]) {
    const dates = Array.from(new Set(data.map((d) => d['Data']))).sort();
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
      'Hóspede',
      'Valor',
      'Informações',
    ];
    const large = ['Tipo'];

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

  public tipoHighlight(row: AirbnbRow & { __id: number }): string | undefined {
    const tipo = (row['Tipo'] ?? '').trim();
    if (tipo === 'Recebimento do coanfitrião') return AppColors.coHost;
    if (tipo === 'Reserva') return AppColors.host;
    if (tipo === 'Pagamento da Resolução') return AppColors.damage;
    return undefined;
  }

  public rowClass(row: AirbnbRow & { __id: number }): string {
    const base = this.groupClass(row['Data']);
    const extra = this.tipoHighlight(row);
    return extra ? base + ' ' + extra : base;
  }

  public colClass(field: string): string {
    return field === 'Valor' ? AppColors.pagamentos : '';
  }

  public colHeaderClass(field: string): string {
    return field === 'Valor' ? AppColors.pagamentos : '';
  }

  public tdClass(row: AirbnbRow & { __id: number }, field: string): string {
    return field === 'Valor' ? this.colClass(field) : this.rowClass(row);
  }

  private applyCsvText(text: string): void {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    const fields = (result.meta as any).fields || [];
    const data = Array.isArray(result.data) ? (result.data as any[]) : [];
    for (let i = 0; i < data.length; i++) data[i] = { __id: i + 1, ...data[i] };
    this.headers.set(fields);
    this.rows.set(data as (AirbnbRow & { __id: number })[]);
    this.recomputeGroupIndexMap(this.rows());
    this.applyColumnSizes(fields);
    const mapped = fields.map((f: string) => ({ field: f, header: f }));
    this.cols.set(mapped);
    const initialSelected = this.preferredInitial
      .filter((n) => fields.includes(n))
      .map((n) => ({ field: n, header: n }));
    this.selectedColumns.set(
      initialSelected.length ? initialSelected : mapped.slice(0, Math.min(8, mapped.length))
    );
  }
}
