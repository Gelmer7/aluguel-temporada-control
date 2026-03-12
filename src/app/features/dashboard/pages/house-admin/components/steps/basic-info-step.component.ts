import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TranslateModule } from '@ngx-translate/core';
import { House, HouseStatus } from '../../../../../../models/house.model';

@Component({
  selector: 'app-basic-info-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    TranslateModule
  ],
  templateUrl: './basic-info-step.component.html'
})
export class BasicInfoStepComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() house: House | null = null;
  @Output() onFormChange = new EventEmitter<any>();

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    status: ['active' as HouseStatus],
    property_title: [''],
    description: [''],
    guests_max: [1],
    bedrooms: [1],
    bathrooms: [1],
    address: ['']
  });

  isEdit = false;

  statusOptions = [
    { label: 'Ativo', value: 'active' },
    { label: 'Inativo', value: 'inactive' },
    { label: 'Rascunho', value: 'draft' }
  ];

  ngOnInit() {
    if (this.house) {
      this.isEdit = true;
      this.form.patchValue({
        name: this.house.name,
        code: this.house.code,
        status: this.house.status,
        property_title: this.house.content?.property_title || '',
        description: this.house.content?.description || '',
        guests_max: this.house.content?.guests_max || 1,
        bedrooms: this.house.content?.bedrooms || 1,
        bathrooms: this.house.content?.bathrooms || 1,
        address: this.house.address || ''
      });
    }

    this.form.valueChanges.subscribe(val => {
      this.onFormChange.emit(val);
    });
  }

  get isValid() {
    return this.form.valid;
  }
}
