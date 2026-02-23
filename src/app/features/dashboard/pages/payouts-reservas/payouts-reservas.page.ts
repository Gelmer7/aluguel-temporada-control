import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  effect,
  viewChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

import { DatePicker } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FloatLabel } from 'primeng/floatlabel';
import { MultiSelect } from 'primeng/multiselect';
import { Tooltip } from 'primeng/tooltip';
import { Popover } from 'primeng/popover';
import { Toast } from 'primeng/toast';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';

import { SupabaseService } from '../../../../services/supabase.service';
import { HeaderService } from '../../../../services/header';
import { StringUtils } from '../../../../shared/utils/string.utils';
import { AirbnbUtils } from '../../../../shared/utils/airbnb.utils';
import { normalizeAirbnbRow } from '../../../../models/airbnb.model';
import {
  ViewerRow,
  getCellValue as getCellValueHelper,
} from '../csv-viewer/csv-viewer.helpers';

import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { ColorService } from '../../../../services/color.service';

@Component({
  selector: 'app-payouts-reservas-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    TranslateModule,
    TableModule,
    Button,
    Select,
    FloatLabel,
    MultiSelect,
    Tooltip,
    Popover,
    Toast,
    InputText,
    IconField,
    InputIcon,
    DatePicker,
    TablePaginatorComponent,
    FilterContainerComponent,
  ],
  providers: [MessageService],
  host: {
    class: 'block h-full overflow-hidden',
  },
  templateUrl: './payouts-reservas.page.html',
})
export class PayoutsReservasPage {
  private readonly supabase = inject(SupabaseService);
  private readonly messageService = inject(MessageService);
  private readonly headerService = inject(HeaderService);
  protected readonly colorService = inject(ColorService);

  headerActions = viewChild<TemplateRef<any>>('headerActions');

  constructor() {
    this.loadFromDatabase();
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'Payouts / Reservas',
          icon: 'pi pi-calendar-check',
          actions: actions,
        });
      } else {
         this.headerService.setHeader({
          title: 'Payouts / Reservas',
          icon: 'pi pi-calendar-check',
        });
      }
    });
  }

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

  protected readonly loading = signal<boolean>(false);
  protected readonly rows = signal<ViewerRow[]>([]);
  
  // Columns definition
  protected readonly cols = [
    { field: 'Data', headerFull: 'Data', headerAbbr: 'Data' },
    { field: 'Hóspede', headerFull: 'Hóspede', headerAbbr: 'Hóspede' },
    { field: 'Tipo', headerFull: 'Tipo', headerAbbr: 'Tipo' },
    { field: 'Código de Confirmação', headerFull: 'Código Conf.', headerAbbr: 'Cód. Conf.' },
    { field: 'Inicio-Fim', headerFull: 'Início - Fim', headerAbbr: 'Início - Fim' },
    { field: 'Valor', headerFull: 'Valor', headerAbbr: 'Valor' },
  ];

  protected readonly filterQuery = signal<string>('');
  protected readonly selectedYear = signal<number | string | null>('Todos');
  protected readonly selectedMonth = signal<number[]>(this.months.map((m) => m.value));
  protected readonly filterDateRange = signal<Date[] | null>(null);

  protected readonly years = computed(() => {
    const years = this.rows().map((r) => this.parseAirbnbDate(r.__norm.data)?.getFullYear());
    const uniqueYears = Array.from(new Set(years.filter((y): y is number => !!y))).sort(
      (a, b) => b - a,
    );
    return ['Todos', ...uniqueYears];
  });

  // Pagination
  protected readonly first = signal<number>(0);
  protected readonly rowsPerPage = signal<number>(20);

  // Computed Data
  protected readonly visibleRows = computed(() => {
    let data = this.rows();

    // Filter strictly by "Payout/Reserva"
    // The user asked for "Payout/Reserva".
    // Assuming this matches the 'Tipo' column value.
    // Based on airbnb.utils.ts, it creates types like "Payout/Reserva".
    // I will filter for rows that CONTAIN "Payout/Reserva" or EXACTLY "Payout/Reserva".
    // Given the requirement "Todos Os itens da tabela airbnb_log que tenham o tipo: 'Payout/Reserva'",
    // I will check if __norm.tipo includes 'Payout/Reserva'.
    
    // Wait, let's just filter for everything that is related to Payouts of Reservations.
    // But user specifically said type "Payout/Reserva".
    // I'll stick to exact match or starts with "Payout/Reserva".
    data = data.filter((r) => {
        const tipo = (r.__norm.tipo ?? '').trim();
        return tipo === 'Payout/Reserva';
    });

    // Filter by Year
    const year = this.selectedYear();
    if (year && year !== 'Todos') {
      data = data.filter((r) => {
        const date = this.parseAirbnbDate(r.__norm.data);
        return date ? date.getFullYear() === year : false;
      });
    }

    // Filter by Month
    const months = this.selectedMonth();
    if (months && months.length > 0) {
      data = data.filter((r) => {
        const date = this.parseAirbnbDate(r.__norm.data);
        return date ? months.includes(date.getMonth() + 1) : false;
      });
    }

    // Filter by Date Range
    const range = this.filterDateRange();
    if (range && range.length === 2 && range[0] && range[1]) {
      const start = range[0];
      const end = range[1];
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      data = data.filter((r) => {
        const date = this.parseAirbnbDate(r.__norm.data);
        return date ? date >= start && date <= end : false;
      });
    }

    // Filter by Global Query
    const query = StringUtils.normalize(this.filterQuery());
    if (query) {
      data = data.filter((row) => {
        const rawValues = row.__raw ? Object.values(row.__raw) : [];
        // Add derived values to search
        const derived = [
             this.getCellValue(row, 'Inicio-Fim'),
        ];
        
        return [...rawValues, ...derived].some((val) => StringUtils.normalize(val).includes(query));
      });
    }

    return data;
  });

  private parseAirbnbDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  }
  
  protected getCellValue(row: ViewerRow, field: string): string {
    if (field === 'Inicio-Fim') {
        const start = row.__norm.dataInicio;
        const end = row.__norm.dataTermino;
        if (!start || !end) return '';
        
        const formatDate = (dStr: string) => {
            const d = this.parseAirbnbDate(dStr);
            if (!d) return dStr;
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
        };
        
        return `${formatDate(start)} - ${formatDate(end)}`;
    }
    return getCellValueHelper(row, field);
  }

  protected colTooltip(row: ViewerRow, field: string): string {
    return this.getCellValue(row, field);
  }

  protected readonly pagedRows = computed(() => {
    const data = [...this.visibleRows()];

    // Sort by Date Descending
    data.sort((a, b) => {
      const dateA = this.parseAirbnbDate(a.__norm.data);
      const dateB = this.parseAirbnbDate(b.__norm.data);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return timeB - timeA;
    });

    const start = this.first();
    const end = start + this.rowsPerPage();
    return data.slice(start, end);
  });

  protected getSelectedMonthLabel(): string {
    const months = this.selectedMonth();
    if (!months || months.length === 0 || months.length === this.months.length) return 'Todos';
    if (months.length === 1) {
      return this.months.find((m) => m.value === months[0])?.label || 'Todos';
    }
    return `${months.length} meses`;
  }

  protected getFormattedDateRange(): string {
    const range = this.filterDateRange();
    if (!range || range.length === 0 || !range[0]) return '';

    const format = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    if (range[1]) {
        return `${format(range[0])} - ${format(range[1])}`;
    }
    return format(range[0]);
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
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Sem dados',
          detail: 'Nenhum registro encontrado no banco de dados.',
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar do banco:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível carregar os dados.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  // Event Handlers
  onYearChange(year: number | string | null) {
    this.selectedYear.set(year);
    this.first.set(0);
  }

  onMonthChange(months: number[]) {
    this.selectedMonth.set(months);
    this.first.set(0);
  }

  onDateRangeChange(range: Date[] | null) {
    this.filterDateRange.set(range);
    this.first.set(0);
  }

  clearFilters() {
    this.selectedYear.set('Todos');
    this.selectedMonth.set(this.months.map((m) => m.value));
    this.filterDateRange.set(null);
    this.filterQuery.set('');
    this.first.set(0);
  }

  onFilter(query: string) {
    this.filterQuery.set(query);
    this.first.set(0);
  }

  onPageChange(event: any) {
    this.first.set(event.first);
    this.rowsPerPage.set(event.rows);
  }
  
  rowTrackBy(index: number, item: ViewerRow) {
    return item.__id;
  }
  
  reservationUrl(code?: string): string {
    const c = (code ?? '').trim();
    return c
      ? `https://www.airbnb.com.br/hosting/reservations/details/${encodeURIComponent(c)}`
      : '';
  }
  
  isCurrencyField(field: string): boolean {
      return field === 'Valor';
  }
}
