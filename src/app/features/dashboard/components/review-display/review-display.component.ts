import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { RatingModule } from 'primeng/rating';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { AirbnbReview } from '../../../../models/review.model';

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
export class ReviewDisplayComponent {
  @Input() review!: AirbnbReview;
}
