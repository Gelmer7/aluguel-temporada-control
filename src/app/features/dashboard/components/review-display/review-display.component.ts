import { Component, Input, ChangeDetectionStrategy, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { RatingModule } from 'primeng/rating';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { AirbnbReview } from '../../../../models/review.model';
import { extractTags } from '../../../../utils/review-analysis';

@Component({
  selector: 'app-review-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    RatingModule,
    AvatarModule,
    ChipModule,
    TagModule,
    FormsModule
  ],
  templateUrl: './review-display.component.html'
})
export class ReviewDisplayComponent implements OnChanges {
  @Input() review!: AirbnbReview;

  processedReview = signal<AirbnbReview | null>(null);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['review'] && this.review) {
      const r = { ...this.review };

      // Se não tiver tags, gera automaticamente
      if (!r.positiveFeedbackTags || !r.improvementFeedbackTags) {
        const text = (r.publicComment || '') + ' ' + (r.privateFeedback || '');
        const { positive, improvement } = extractTags(text);

        if (!r.positiveFeedbackTags) r.positiveFeedbackTags = positive;
        if (!r.improvementFeedbackTags) r.improvementFeedbackTags = improvement;
      }

      // Se não tiver sentimento, define baseado na nota (simples)
      if (!r.sentiment) {
         if (r.overallRating >= 5) r.sentiment = 'POSITIVE';
         else if (r.overallRating <= 3) r.sentiment = 'NEGATIVE';
         else r.sentiment = 'NEUTRAL';
      }

      this.processedReview.set(r);
    }
  }

  getSentimentSeverity(sentiment?: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (sentiment) {
      case 'POSITIVE': return 'success';
      case 'NEGATIVE': return 'danger';
      default: return 'info';
    }
  }

  getSentimentLabel(sentiment?: string): string {
    switch (sentiment) {
      case 'POSITIVE': return 'Positivo';
      case 'NEGATIVE': return 'Negativo';
      default: return 'Neutro';
    }
  }
}
