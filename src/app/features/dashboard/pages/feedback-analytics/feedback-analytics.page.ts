import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { Card } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';
import { Button } from 'primeng/button';
import { HeaderService } from '../../../../services/header';
import { SupabaseService } from '../../../../services/supabase.service';
import { AirbnbReview } from '../../../../models/review.model';
import { extractTags } from '../../../../utils/review-analysis';

interface RatingCategory {
  name: string;
  key: keyof AirbnbReview;
  label: string;
  total: number;
  count: number;
  average: number;
}

import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';

@Component({
  selector: 'app-feedback-analytics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ChartModule,
    Card,
    TagModule,
    TooltipModule,
    Skeleton,
    MultiSelectModule,
    SelectModule,
    DatePicker,
    FloatLabel,
    Button,
    TableModule,
    DialogComponent,
    TablePaginatorComponent
  ],
  templateUrl: './feedback-analytics.page.html'
})
export class FeedbackAnalyticsPage {
  private headerService = inject(HeaderService);
  private supabaseService = inject(SupabaseService);

  loading = signal(true);
  reviews = signal<AirbnbReview[]>([]);

  // Dialog de Detalhes
  detailsVisible = signal(false);
  detailsHeader = signal('');
  detailsReviews = signal<AirbnbReview[]>([]);
  detailsCategory = signal<RatingCategory | null>(null);
  dialogFirst = signal(0);
  dialogRows = signal(5);
  detailsReviewsPaged = computed(() => {
      const list = this.detailsReviews();
      const start = this.dialogFirst();
      const end = start + this.dialogRows();
      return list.slice(start, end);
  });

  // Filtros (Pilar 3)
  selectedProperties = signal<string[]>([]);
  dateRange = signal<Date[] | null>(null);

  // Mensagens privadas
  privateCountAll = computed(() => this.reviews().filter(r => !!r.privateFeedback).length);
  privateCountFiltered = computed(() => this.filteredReviews().filter(r => !!r.privateFeedback).length);

  // Lógica de cor da borda por média
  readonly greenThreshold = 5;
  readonly orangeThreshold = 4.9;
  readonly redThreshold = 4.8;

  getBorderClass(avg: number): string {
      if (avg >= this.greenThreshold) return 'border-l-4 border-green-500 shadow-sm';
      if (avg >= this.orangeThreshold && avg < this.greenThreshold) return 'border-l-4 border-orange-500 shadow-sm';
      if (avg < this.redThreshold) return 'border-l-4 border-red-500 shadow-sm';
      return 'border-l-4 border-surface-200 dark:border-surface-700 shadow-sm';
  }

  // Opções de Filtro
  uniqueProperties = computed(() => {
    const reviews = this.reviews();
    const props = new Set<string>();
    reviews.forEach(r => {
        if (r.houseCode) props.add(r.houseCode);
    });
    return Array.from(props).map(p => ({ label: p, value: p }));
  });


  // Reviews Filtrados
  filteredReviews = computed(() => {
      let data = this.reviews();
      const properties = this.selectedProperties();
      const range = this.dateRange();

      // Filtro por Propriedade
      if (properties.length > 0) {
          data = data.filter(r => r.houseCode && properties.includes(r.houseCode));
      }


      // Filtro por Data
      if (range && range.length === 2 && range[0] && range[1]) {
          const start = range[0];
          const end = range[1];
          // Ajustar horas para garantir cobertura total do dia
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          data = data.filter(r => {
              if (!r.createdAt) return false;
              const date = new Date(r.createdAt);
              return date >= start && date <= end;
          });
      }

      return data;
  });

  // Dados computados (Baseados em filteredReviews agora)
  overallStats = computed(() => {
    const reviews = this.filteredReviews();
    if (!reviews.length) return { average: 0, count: 0 };

    const total = reviews.reduce((sum, r) => sum + (Number(r.overallRating) || 0), 0);
    return {
        average: total / reviews.length,
        count: reviews.length
    };
  });

  categoryStats = computed(() => {
      const reviews = this.filteredReviews();
      const categories: Record<string, RatingCategory> = {
          cleanliness: { name: 'cleanliness', key: 'cleanlinessRating', label: 'Limpeza', total: 0, count: 0, average: 0 },
          accuracy: { name: 'accuracy', key: 'accuracyRating', label: 'Veracidade', total: 0, count: 0, average: 0 },
          checkin: { name: 'checkin', key: 'checkinRating', label: 'Check-in', total: 0, count: 0, average: 0 },
          communication: { name: 'communication', key: 'communicationRating', label: 'Comunicação', total: 0, count: 0, average: 0 },
          location: { name: 'location', key: 'locationRating', label: 'Localização', total: 0, count: 0, average: 0 },
          value: { name: 'value', key: 'valueRating', label: 'Custo-Benefício', total: 0, count: 0, average: 0 },
      };

      if (!reviews.length) return Object.values(categories);

      reviews.forEach(r => {
          Object.values(categories).forEach(cat => {
              const val = Number(r[cat.key]);
              if (!isNaN(val) && val > 0) {
                  cat.total += val;
                  cat.count++;
              }
          });
      });

      Object.values(categories).forEach(cat => {
          cat.average = cat.count > 0 ? cat.total / cat.count : 0;
      });

      return Object.values(categories);
  });

  // Removido: highlights (não há mais cards de KPI dependentes)

  tagStats = computed(() => {
    const reviews = this.filteredReviews();
    const positiveCounts: Record<string, number> = {};
    const improvementCounts: Record<string, number> = {};

    reviews.forEach(r => {
        const posTags = r.positiveFeedbackTags || [];
        const impTags = r.improvementFeedbackTags || [];

        posTags.forEach(t => positiveCounts[t] = (positiveCounts[t] || 0) + 1);
        impTags.forEach(t => improvementCounts[t] = (improvementCounts[t] || 0) + 1);
    });

    const sortTags = (counts: Record<string, number>) => Object.entries(counts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

    return {
        positive: sortTags(positiveCounts),
        improvement: sortTags(improvementCounts)
    };
  });

  radarData = computed(() => {
      const stats = this.categoryStats();
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');

      return {
          labels: stats.map(s => s.label),
          datasets: [
              {
                  label: 'Média de Avaliação',
                  borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                  pointBackgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                  pointBorderColor: documentStyle.getPropertyValue('--p-primary-500'),
                  pointHoverBackgroundColor: textColor,
                  pointHoverBorderColor: documentStyle.getPropertyValue('--p-primary-500'),
                  data: stats.map(s => s.average),
                  fill: true,
                  backgroundColor: 'rgba(var(--p-primary-500-rgb), 0.2)'
              }
          ]
      };
  });

  radarOptions = {
      plugins: {
          legend: {
              labels: {
                  color: 'var(--p-text-color)'
              }
          }
      },
      scales: {
          r: {
              grid: {
                  color: 'var(--p-content-border-color)'
              },
              pointLabels: {
                  color: 'var(--p-text-muted-color)',
                  font: {
                    size: 14 // Aumenta o tamanho da fonte dos labels (Limpeza, Check-in...)
                  }
              },
              ticks: {
                  color: 'var(--p-text-muted-color)',
                  backdropColor: 'transparent',
                  stepSize: 1, // Passos de 1 em 1
                  min: 0,
                  max: 5 // Escala fixa de 0 a 5
              },
              suggestedMin: 0,
              suggestedMax: 5
          }
      },
      maintainAspectRatio: false
  };

  clearFilters() {
      this.selectedProperties.set([]);
      this.dateRange.set(null);
  }

  // Removido: showCategoryDetails (não há mais cliques em KPI)
  showCategoryDetails(category: RatingCategory) {
      if (!category) return;
      this.detailsCategory.set(category);
      this.detailsHeader.set(`Detalhes: ${category.label}`);

      const reviews = this.filteredReviews().filter(r => {
          const val = Number(r[category.key]);
          return !isNaN(val) && val > 0;
      });

      const sorted = reviews.sort((a, b) => {
          return (Number(a[category.key]) || 0) - (Number(b[category.key]) || 0);
      });

      this.detailsReviews.set(sorted);
      this.detailsVisible.set(true);
  }

  getCategoryRating(review: AirbnbReview): number {
      const cat = this.detailsCategory();
      if (!cat) return 0;
      const val = Number(review[cat.key]);
      return isNaN(val) ? 0 : val;
  }

  onDialogPageChange(event: any) {
      this.dialogFirst.set(event.first ?? 0);
      this.dialogRows.set(event.rows ?? 5);
  }

  showTagDetails(tag: string, type: 'POSITIVE' | 'IMPROVEMENT') {
      this.detailsHeader.set(`Detalhes: ${tag} (${type === 'POSITIVE' ? 'Elogios' : 'Pontos de Atenção'})`);

      const reviews = this.filteredReviews().filter(r => {
          const tags = type === 'POSITIVE' ? r.positiveFeedbackTags : r.improvementFeedbackTags;
          return tags?.includes(tag);
      });

      // Ordenar por data (mais recente primeiro)
      const sorted = reviews.sort((a, b) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      this.detailsReviews.set(sorted);
      this.detailsVisible.set(true);
  }

  private buildPrivateMessages(list: AirbnbReview[]): string {
      const rows = list.filter(r => !!r.privateFeedback);
      return rows.map(r => {
          const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-BR') : '';
          const header = `${date} - ${r.guestName} (${r.houseCode || ''})`;
          return `${header}\n${r.privateFeedback}`;
      }).join('\n\n');
  }

  async copyPrivateMessages(scope: 'all' | 'filtered' = 'all') {
      const list = scope === 'all' ? this.reviews() : this.filteredReviews();
      const text = this.buildPrivateMessages(list);
      if (!text.trim().length) return;
      await navigator.clipboard.writeText(text);
  }

  constructor() {
      this.headerService.setHeader({
          title: 'Análise de Feedback',
          icon: 'pi pi-chart-pie'
      });
      this.loadData();
  }

  async loadData() {
      this.loading.set(true);
      try {
          const { data, error } = await this.supabaseService.getReviews();

          if (error) {
              console.error('Erro ao carregar dados do Supabase', error);
              return;
          }

          if (data) {
              const reviews: AirbnbReview[] = data.map((r: any) => {
                  const review: AirbnbReview = {
                    id: r.id,
                    reviewId: r.review_id,
                    reservationCode: r.reservation_code,
                    guestName: r.guest_name,
                    reviewUrl: r.review_url,
                    createdAt: new Date(r.created_at),
                    houseCode: r.house_code,
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

                    sentiment: r.sentiment,
                    positiveFeedbackTags: r.positive_feedback_tags || [],
                    improvementFeedbackTags: r.improvement_feedback_tags || []
                  };

                  // Enriquecimento/Correção de tags com base no texto (evita falsos positivos como "cheirosa" vs "cheiro")
                  const text = (review.publicComment || '') + ' ' + (review.privateFeedback || '');
                  if (text.trim().length > 0) {
                       const { positive, improvement } = extractTags(text);
                       const posSet = new Set([...(review.positiveFeedbackTags || []), ...positive]);
                       const impSet = new Set([...(review.improvementFeedbackTags || []), ...improvement]);
                       const duplicates = [...posSet].filter(t => impSet.has(t));
                       if (duplicates.length) {
                         if ((review.overallRating || 0) >= 4) {
                           duplicates.forEach(t => impSet.delete(t));
                         } else if ((review.overallRating || 0) <= 3) {
                           duplicates.forEach(t => posSet.delete(t));
                         } else {
                           duplicates.forEach(t => impSet.delete(t));
                         }
                       }
                       review.positiveFeedbackTags = Array.from(posSet);
                       review.improvementFeedbackTags = Array.from(impSet);
                  }

                  return review;
              });
              this.reviews.set(reviews);
          }
      } catch (e) {
          console.error('Erro inesperado ao carregar dados', e);
      } finally {
          this.loading.set(false);
      }
  }
}
