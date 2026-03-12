import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';
import { House } from '../../../../../../models/house.model';

@Component({
  selector: 'app-rules-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    MultiSelectModule,
    TranslateModule
  ],
  templateUrl: './rules-step.component.html'
})
export class RulesStepComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() house: House | null = null;
  @Output() onFormChange = new EventEmitter<any>();

  form: FormGroup = this.fb.group({
    pets_allowed: [false],
    smoking_allowed: [false],
    quiet_hours: ['22:00 - 08:00'],
    additional_rules: [''],
    amenities: [[]],
    wifi_name: [''],
    wifi_password: [''],
    arrival_instructions: ['']
  });

  amenityOptions = [
    { label: 'Wi-Fi', value: 'Wifi' },
    { label: 'Ar Condicionado', value: 'AC' },
    { label: 'Cozinha', value: 'Kitchen' },
    { label: 'Estacionamento', value: 'Parking' },
    { label: 'Piscina', value: 'Pool' },
    { label: 'TV', value: 'TV' },
    { label: 'Máquina de Lavar', value: 'Washer' },
    { label: 'Ferro de Passar', value: 'Iron' },
    { label: 'Secador de Cabelo', value: 'Hair Dryer' },
    { label: 'Área de Trabalho', value: 'Workspace' }
  ];

  ngOnInit() {
    if (this.house) {
      this.form.patchValue({
        pets_allowed: this.house.content?.house_rules?.pets_allowed || false,
        smoking_allowed: this.house.content?.house_rules?.smoking_allowed || false,
        quiet_hours: this.house.content?.house_rules?.quiet_hours || '22:00 - 08:00',
        additional_rules: this.house.content?.house_rules?.additional_rules || '',
        amenities: this.house.content?.amenities || [],
        wifi_name: this.house.check_info?.wifi_name || '',
        wifi_password: this.house.check_info?.wifi_password || '',
        arrival_instructions: this.house.check_info?.arrival_instructions || ''
      });
    }

    this.form.valueChanges.subscribe(val => {
      this.onFormChange.emit(val);
    });
  }
}
