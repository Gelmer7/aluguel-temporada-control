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
    Button
  ],
  templateUrl: './feedback-analytics.page.html'
})
export class FeedbackAnalyticsPage {
  private headerService = inject(HeaderService);
  private supabaseService = inject(SupabaseService);

  loading = signal(true);
  reviews = signal<AirbnbReview[]>([]);

  // Filtros (Pilar 3)
  selectedProperties = signal<string[]>([]);
  selectedSentiments = signal<string[]>([]);
  selectedRatings = signal<number[]>([]);
  selectedTags = signal<string[]>([]);
  dateRange = signal<Date[] | null>(null);

  // Opções de Filtro
  uniqueProperties = computed(() => {
    const reviews = this.reviews();
    const props = new Set<string>();
    reviews.forEach(r => {
        if (r.houseCode) props.add(r.houseCode);
    });
    return Array.from(props).map(p => ({ label: p, value: p }));
  });

  uniqueTags = computed(() => {
    const reviews = this.reviews();
    const tags = new Set<string>();
    reviews.forEach(r => {
        if (r.positiveFeedbackTags) r.positiveFeedbackTags.forEach(t => tags.add(t));
        if (r.improvementFeedbackTags) r.improvementFeedbackTags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort().map(t => ({ label: t, value: t }));
  });

  sentimentOptions = [
    { label: 'Positivo', value: 'POSITIVE' },
    { label: 'Neutro', value: 'NEUTRAL' },
    { label: 'Negativo', value: 'NEGATIVE' }
  ];

  ratingOptions = [
    { label: '5 Estrelas', value: 5 },
    { label: '4 Estrelas', value: 4 },
    { label: '3 Estrelas', value: 3 },
    { label: '2 Estrelas', value: 2 },
    { label: '1 Estrela', value: 1 }
  ];

  // Reviews Filtrados
  filteredReviews = computed(() => {
      let data = this.reviews();
      const properties = this.selectedProperties();
      const sentiments = this.selectedSentiments();
      const ratings = this.selectedRatings();
      const tags = this.selectedTags();
      const range = this.dateRange();

      // Filtro por Propriedade
      if (properties.length > 0) {
          data = data.filter(r => r.houseCode && properties.includes(r.houseCode));
      }

      // Filtro por Sentimento
      if (sentiments.length > 0) {
          data = data.filter(r => r.sentiment && sentiments.includes(r.sentiment));
      }

      // Filtro por Avaliação
      if (ratings.length > 0) {
          data = data.filter(r => {
             const val = Math.floor(r.overallRating || 0);
             return ratings.includes(val);
          });
      }

      // Filtro por Tags
      if (tags.length > 0) {
          data = data.filter(r => {
              const reviewTags = [...(r.positiveFeedbackTags || []), ...(r.improvementFeedbackTags || [])];
              return tags.some(t => reviewTags.includes(t));
          });
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

  highlights = computed(() => {
      const stats = this.categoryStats();
      if (!stats.length) return { best: null, worst: null };

      // Ordenar por média
      const sorted = [...stats].sort((a, b) => b.average - a.average);

      return {
          best: sorted[0],
          worst: sorted[sorted.length - 1]
      };
  });

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
      this.selectedSentiments.set([]);
      this.selectedRatings.set([]);
      this.selectedTags.set([]);
      this.dateRange.set(null);
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

                  // Fallback para tags se vazio
                  if ((!review.positiveFeedbackTags?.length && !review.improvementFeedbackTags?.length) && (review.publicComment || review.privateFeedback)) {
                       const text = (review.publicComment || '') + ' ' + (review.privateFeedback || '');
                       const { positive, improvement } = extractTags(text);
                       review.positiveFeedbackTags = positive;
                       review.improvementFeedbackTags = improvement;
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
