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
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

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
import { AirbnbReview, AirbnbReviewJSON } from '../../../../models/review.model';
import {
  ViewerRow,
  getCellValue as getCellValueHelper,
} from '../csv-viewer/csv-viewer.helpers';
import { Dialog } from 'primeng/dialog';
import { Textarea, TextareaModule } from 'primeng/textarea';

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
    Dialog,
    TextareaModule,
  ],
  providers: [MessageService],
  host: {
    class: 'block h-full overflow-hidden',
  },
  templateUrl: './payouts-reservas.page.html',
})
export class PayoutsReservasPage {
  private readonly supabase = inject(SupabaseService);
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);
  private readonly headerService = inject(HeaderService);
  protected readonly colorService = inject(ColorService);

  headerActions = viewChild<TemplateRef<any>>('headerActions');

  constructor() {
    this.loadFromDatabase();
    this.loadReviews();
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'Payouts / Reservas',
          icon: 'pi pi-calendar-clock',
          actions: actions,
        });
      } else {
         this.headerService.setHeader({
          title: 'Payouts / Reservas',
          icon: 'pi pi-calendar-clock',
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
    { field: 'Feedback', headerFull: 'Feedback', headerAbbr: 'Feedback' },
    { field: 'Tipo', headerFull: 'Tipo', headerAbbr: 'Tipo' },
    { field: 'Código de Confirmação', headerFull: 'Código Conf.', headerAbbr: 'Cód. Conf.' },
    { field: 'Inicio-Fim', headerFull: 'Início - Fim', headerAbbr: 'Início - Fim' },
    { field: 'Noites', headerFull: 'Noites', headerAbbr: 'Noites' },
    { field: 'Valor', headerFull: 'Valor', headerAbbr: 'Valor' },
  ];

  protected readonly filterQuery = signal<string>('');
  protected readonly selectedYear = signal<number | string | null>('Todos');
  protected readonly selectedMonth = signal<number[]>(this.months.map((m) => m.value));
  protected readonly filterDateRange = signal<Date[] | null>(null);

  protected readonly reviewsMap = computed(() => {
    const map = new Map<string, AirbnbReview>();
    const rows = this.rows();
    const supReviews = this.supabaseReviews();
    const locReviews = this.localReviews();

    // 1. Adicionar reviews do Supabase (já têm reservationCode)
    supReviews.forEach((r) => {
        if (r.reservationCode) {
            map.set(r.reservationCode, r);
        }
    });

    // 2. Mesclar reviews locais
    locReviews.forEach((localReview) => {
        let code = localReview.reservationCode;

        // Se não tiver código (comum no scraping), tentar encontrar pelo nome do hóspede
        if (!code || !map.has(code)) {
             // Tenta encontrar um row correspondente
             // Normaliza o nome do hóspede do review
             const guestNameNorm = StringUtils.normalize(localReview.guestName || '').toLowerCase();

             // Procura na tabela
             const match = rows.find(r => {
                 const rowGuest = StringUtils.normalize(this.getCellValue(r, 'Hóspede')).toLowerCase();
                 // Verifica se contém o nome (ex: "Gabriela" em "Gabriela Silva")
                 return rowGuest.includes(guestNameNorm) || guestNameNorm.includes(rowGuest);
             });

             if (match) {
                 code = this.getCellValue(match, 'Código de Confirmação');
             }
        }

        // Se encontrou um código, adiciona/sobrescreve
        if (code) {
            // Preserva o ID do supabase se já existir, mas atualiza detalhes se o local for mais rico?
            // Por enquanto, vamos assumir que o local (scraped) tem detalhes que o supabase pode não ter (ex: ratings detalhados)
            const existing = map.get(code);
            map.set(code, {
                ...existing, // Mantém dados existentes (como IDs de banco)
                ...localReview, // Sobrescreve com dados do JSON (detalhes)
                reservationCode: code // Garante o código correto
            });
        }
    });

    return map;
  });

  protected readonly supabaseReviews = signal<AirbnbReview[]>([]);
  protected readonly localReviews = signal<AirbnbReview[]>([]);

  protected readonly selectedReview = signal<AirbnbReview | null>(null);
  protected showReviewDialog = false;
  protected selectedReservationCode = '';
  protected jsonInput = '';
  protected isSavingReview = false;

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

  protected async loadReviews() {
    const { data, error } = await this.supabase.getReviews();

    if (error) {
      console.error('Erro ao carregar reviews do Supabase:', error);
    }

    if (data) {
      const reviews: AirbnbReview[] = data.map((r: any) => ({
            id: r.id,
            reviewId: r.review_id,
            reservationCode: r.reservation_code,
            guestName: r.guest_name,
            reviewUrl: r.review_url,
            createdAt: new Date(r.created_at),
            overallRating: r.overall_rating,
            publicComment: r.public_comment,
            hostResponse: r.host_response,
            privateFeedback: r.private_feedback,
            cleanlinessRating: r.cleanliness_rating,
            accuracyRating: r.accuracy_rating,
            checkinRating: r.checkin_rating,
            communicationRating: r.communication_rating,
            locationRating: r.location_rating,
            valueRating: r.value_rating,
      }));
      this.supabaseReviews.set(reviews);
    }

    // Carregar JSON local (se existir)
    try {
        const localData = await firstValueFrom(this.http.get<any[]>('assets/data/reviews-detailed.json'));
        if (localData) {
            const reviews: AirbnbReview[] = localData.map((json: any) => ({
                reviewId: json.id,
                reservationCode: '', // Será resolvido no computed
                guestName: json.nomeHospede,
                reviewUrl: json.url,
                overallRating: json.avaliacaoGeral?.estrelasAvaliacaoGeral,
                publicComment: json.avaliacaoGeral?.avaliacaoPublica,
                hostResponse: json.avaliacaoGeral?.suaRespostaPublica,
                privateFeedback: json.avaliacaoGeral?.mensagemPrivada,

                cleanlinessRating: this.parseRating(json.feedbackDetalhado?.limpeza),
                accuracyRating: this.parseRating(json.feedbackDetalhado?.exatidaoDoAnuncio),
                checkinRating: this.parseRating(json.feedbackDetalhado?.checkIn),
                communicationRating: this.parseRating(json.feedbackDetalhado?.comunicacao),
                locationRating: this.parseRating(json.feedbackDetalhado?.localizacao),
                valueRating: this.parseRating(json.feedbackDetalhado?.custoBeneficio)
            }));
            this.localReviews.set(reviews);
        }
    } catch (e) {
        console.warn('Nenhum dado local de reviews encontrado ou erro ao carregar.', e);
    }
  }

  private parseRating(val: any): number {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
          return parseFloat(val.replace(',', '.'));
      }
      return 0;
  }

  protected openReviewPopover(event: Event, review: AirbnbReview | undefined, popover: Popover) {
      if (!review) return;
      this.selectedReview.set(review);
      popover.toggle(event);
  }

  protected openReviewDialog(row: ViewerRow) {
      const code = this.getCellValue(row, 'Código de Confirmação');
      if (!code) {
          this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Esta linha não possui código de reserva.' });
          return;
      }
      this.selectedReservationCode = code;
      this.jsonInput = '';
      this.showReviewDialog = true;
  }

  protected async saveReviewJson() {
      if (!this.jsonInput || !this.jsonInput.trim()) {
          this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Cole o JSON do review.' });
          return;
      }

      try {
          this.isSavingReview = true;
          const json: AirbnbReviewJSON = JSON.parse(this.jsonInput);

          // Converter JSON para Modelo
          const review: AirbnbReview = {
              reviewId: json.id,
              reservationCode: this.selectedReservationCode,
              guestName: json.nomeHospede,
              reviewUrl: json.url,
              overallRating: json.avaliacaoGeral.estrelasAvaliacaoGeral,
              publicComment: json.avaliacaoGeral.avaliacaoPublica,
              hostResponse: json.avaliacaoGeral.suaRespostaPublica,
              privateFeedback: json.avaliacaoGeral.mensagemPrivada,

              cleanlinessRating: json.feedbackDetalhado.limpeza,
              checkinRating: json.feedbackDetalhado.checkIn,
              communicationRating: json.feedbackDetalhado.comunicacao,
              locationRating: json.feedbackDetalhado.localizacao,
              valueRating: json.feedbackDetalhado.custoBeneficio
          };

          const { error } = await this.supabase.saveReview(review);
          if (error) throw error;

          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Review salvo com sucesso!' });
          this.showReviewDialog = false;
          await this.loadReviews(); // Recarregar para atualizar a tabela

      } catch (e: any) {
          console.error('Erro ao salvar review:', e);
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao processar ou salvar o JSON.' });
      } finally {
          this.isSavingReview = false;
      }
  }

  protected cancelReview() {
      this.showReviewDialog = false;
      this.jsonInput = '';
  }

  isCurrencyField(field: string): boolean {
      return field === 'Valor';
  }

  protected getReviewStatus(row: ViewerRow): 'REVIEWED' | 'EXPIRED' | 'WINDOW_OPEN' | 'FUTURE' | 'UNKNOWN' {
      const code = this.getCellValue(row, 'Código de Confirmação');
      if (this.reviewsMap().has(code)) {
          return 'REVIEWED';
      }

      const endDateStr = row.__norm?.dataTermino;
      if (!endDateStr) return 'UNKNOWN';

      const endDate = this.parseAirbnbDate(endDateStr);
      if (!endDate) return 'UNKNOWN';

      const now = new Date();
      // Zerar horas para comparação de datas
      now.setHours(0, 0, 0, 0);

      const diffTime = now.getTime() - endDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (diffDays < 0) {
          return 'FUTURE'; // Ainda não acabou
      } else if (diffDays <= 14) {
          return 'WINDOW_OPEN'; // Período de avaliação aberto (14 dias)
      } else {
          return 'EXPIRED'; // Passou do prazo e não tem review
      }
  }
}
