import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TranslateModule } from '@ngx-translate/core';
import { House } from '../../../../../../models/house.model';

@Component({
  selector: 'app-pricing-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputNumberModule,
    InputTextModule,
    TranslateModule
  ],
  templateUrl: './pricing-step.component.html'
})
export class PricingStepComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() house: House | null = null;
  @Output() onFormChange = new EventEmitter<any>();

  form: FormGroup = this.fb.group({
    base_night: [0, Validators.required],
    weekend_night: [0],
    min_nights: [1],
    max_nights: [30],
    weekly_7_nights: [0],
    monthly_28_nights: [0]
  });

  ngOnInit() {
    if (this.house && this.house.pricing) {
      this.form.patchValue({
        base_night: this.house.pricing.base_night || 0,
        weekend_night: this.house.pricing.weekend_night || 0,
        min_nights: this.house.pricing.stay_limits?.min_nights || 1,
        max_nights: this.house.pricing.stay_limits?.max_nights || 30,
        weekly_7_nights: this.house.pricing.discounts?.weekly_7_nights || 0,
        monthly_28_nights: this.house.pricing.discounts?.monthly_28_nights || 0
      });
    }

    this.form.valueChanges.subscribe(val => {
      this.onFormChange.emit(val);
    });
  }
}
