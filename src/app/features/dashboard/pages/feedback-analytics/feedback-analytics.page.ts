import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { Card } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';
import { HeaderService } from '../../../../services/header';
import { AirbnbReview } from '../../../../models/review.model';

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
    ChartModule,
    Card,
    TagModule,
    TooltipModule,
    Skeleton
  ],
  templateUrl: './feedback-analytics.page.html'
})
export class FeedbackAnalyticsPage {
  private http = inject(HttpClient);
  private headerService = inject(HeaderService);

  loading = signal(true);
  reviews = signal<AirbnbReview[]>([]);

  // Dados computados
  overallStats = computed(() => {
    const reviews = this.reviews();
    if (!reviews.length) return { average: 0, count: 0 };

    const total = reviews.reduce((sum, r) => sum + (Number(r.overallRating) || 0), 0);
    return {
        average: total / reviews.length,
        count: reviews.length
    };
  });

  categoryStats = computed(() => {
      const reviews = this.reviews();
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

  radarData = computed(() => {
      const stats = this.categoryStats();
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');
      // const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color'); // Unused

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
          const localData = await firstValueFrom(this.http.get<any[]>('assets/data/reviews-detailed.json'));

          if (localData) {
              const reviews: AirbnbReview[] = localData.map((json: any) => ({
                reviewId: json.id,
                reservationCode: json.id,
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
              this.reviews.set(reviews);
          }
      } catch (e) {
          console.error('Erro ao carregar dados', e);
      } finally {
          this.loading.set(false);
      }
  }

  private parseRating(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        return parseFloat(val.replace(',', '.'));
    }
    return 0;
  }
}
