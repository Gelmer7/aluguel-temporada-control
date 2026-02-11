import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TranslateModule } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';
import { ManualRental } from '../../../../models/airbnb.model';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-manual-rental-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogComponent,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    TooltipModule,
    IftaLabelModule,
    TranslateModule,
  ],
  templateUrl: './manual-rental-form.component.html',
})
export class ManualRentalFormComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private fb = inject(FormBuilder);
  
  isMobile = false;
  isEdit = false;
  form: FormGroup;

  @Input() visible = false;
  @Input() set editData(value: ManualRental | null) {
    if (value) {
      this.isEdit = true;
      this.form.patchValue({
        ...value,
        data_pagamento: new Date(value.data_pagamento),
        data_reserva: new Date(value.data_reserva),
        data_inicio: new Date(value.data_inicio),
        data_termino: new Date(value.data_termino),
      });
    } else {
      this.isEdit = false;
      this.form.reset({
        tipo: 'Aluguel temporada',
        anuncio: 'Casa 47',
        moeda: 'BRL',
        data_pagamento: new Date(),
        data_reserva: new Date(),
        data_inicio: new Date(),
        data_termino: new Date(),
        noites: 1,
        valor_pago: 0,
        taxa_limpeza: 0
      });
    }
  }

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ManualRental>();

  constructor() {
    this.form = this.fb.group({
      data_pagamento: [new Date(), Validators.required],
      tipo: ['Aluguel temporada', Validators.required],
      data_reserva: [new Date(), Validators.required],
      data_inicio: [new Date(), Validators.required],
      data_termino: [new Date(), Validators.required],
      noites: [1, [Validators.required, Validators.min(1)]],
      hospede: ['', Validators.required],
      anuncio: ['Casa 47', Validators.required],
      informacoes: [''],
      moeda: ['BRL', Validators.required],
      valor_pago: [0, [Validators.required, Validators.min(0.01)]],
      taxa_limpeza: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe((result: BreakpointState) => {
        this.isMobile = result.matches;
      });
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      // Convert dates to ISO strings for Supabase
      const rentalData: ManualRental = {
        ...formValue,
        data_pagamento: DateUtils.toLocalISOString(formValue.data_pagamento),
        data_reserva: DateUtils.toLocalISOString(formValue.data_reserva),
        data_inicio: DateUtils.toLocalISOString(formValue.data_inicio),
        data_termino: DateUtils.toLocalISOString(formValue.data_termino),
      };
      this.save.emit(rentalData);
      this.onClose();
    } else {
      this.form.markAllAsTouched();
    }
  }
}
