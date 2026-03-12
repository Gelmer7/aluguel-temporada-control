import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { BasicInfoStepComponent } from '../steps/basic-info-step.component';
import { PricingStepComponent } from '../steps/pricing-step.component';
import { RulesStepComponent } from '../steps/rules-step.component';
import { PhotoStepComponent } from '../steps/photo-step.component';
import { House, HousePhoto } from '../../../../../../models/house.model';

@Component({
  selector: 'app-house-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    StepsModule,
    ButtonModule,
    TranslateModule,
    BasicInfoStepComponent,
    PricingStepComponent,
    RulesStepComponent,
    PhotoStepComponent
  ],
  templateUrl: './house-wizard.component.html',
  styles: [`
    :host ::ng-deep .p-steps .p-steps-item:before {
      border-color: var(--p-surface-200);
    }
    :host-context(.dark) ::ng-deep .p-steps .p-steps-item:before {
      border-color: var(--p-surface-700);
    }
  `]
})
export class HouseWizardComponent {
  @Input() house: House | null = null;
  @Output() onSave = new EventEmitter<{ house: House, photos: HousePhoto[] }>();
  @Output() onCancel = new EventEmitter<void>();

  activeIndex: number = 0;
  stepData: any = {};

  items: MenuItem[] = [
    { label: 'Básico', icon: 'pi pi-info-circle' },
    { label: 'Fotos', icon: 'pi pi-image' },
    { label: 'Preços', icon: 'pi pi-dollar' },
    { label: 'Regras', icon: 'pi pi-list' }
  ];

  updateStepData(step: number, data: any) {
    this.stepData[step] = data;
  }

  nextStep() {
    if (this.activeIndex < this.items.length - 1) {
      this.activeIndex++;
    }
  }

  prevStep() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  save() {
    const basic = this.stepData[0] || {};
    const photos = this.stepData[1] || [];
    const pricing = this.stepData[2] || {};
    const rules = this.stepData[3] || {};

    const finalHouse: House = {
      id: this.house?.id,
      code: basic.code || this.house?.code,
      name: basic.name || this.house?.name,
      address: basic.address || this.house?.address,
      status: basic.status || this.house?.status || 'active',
      content: {
        property_title: basic.property_title,
        description: basic.description,
        guests_max: basic.guests_max,
        bedrooms: basic.bedrooms,
        bathrooms: basic.bathrooms,
        amenities: rules.amenities || [],
        safety_features: this.house?.content?.safety_features || [],
        house_rules: {
          pets_allowed: rules.pets_allowed,
          smoking_allowed: rules.smoking_allowed,
          quiet_hours: rules.quiet_hours,
          additional_rules: rules.additional_rules
        },
        cancellation_policy: this.house?.content?.cancellation_policy || 'Moderad'
      },
      pricing: {
        base_night: pricing.base_night,
        weekend_night: pricing.weekend_night,
        currency: 'BRL',
        discounts: {
          weekly_7_nights: pricing.weekly_7_nights,
          monthly_28_nights: pricing.monthly_28_nights
        },
        stay_limits: {
          min_nights: pricing.min_nights,
          max_nights: pricing.max_nights
        }
      },
      check_info: {
        checkin_method: rules.checkin_method || 'lockbox',
        wifi_name: rules.wifi_name,
        wifi_password: rules.wifi_password,
        arrival_instructions: rules.arrival_instructions,
        checkout_instructions: rules.checkout_instructions || '',
        how_to_get_there: rules.how_to_get_there || ''
      }
    };

    this.onSave.emit({ house: finalHouse, photos });
  }
}
