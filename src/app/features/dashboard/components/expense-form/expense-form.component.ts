import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';
import { Expense, EXPENSE_TYPES, QUICK_EXPENSE_TYPES } from '../../../../models/expense.model';
import { SupabaseService } from '../../../../services/supabase.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogComponent,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    TextareaModule,
    TooltipModule,
    ToolbarModule,
    IftaLabelModule,
    TranslateModule,
  ],
  templateUrl: './expense-form.component.html',
})
export class ExpenseFormComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private translate = inject(TranslateService);
  isMobile = false;

  @Input() visible: boolean = false;
  @Input() set editData(value: any | null) {
    if (value) {
      this.isEdit = true;
      this.form.patchValue({
        description: value.description,
        price: value.price,
        type: value.type,
        purchaseDate: new Date(value.purchaseDate),
        observation: value.observation,
        kws: value.kws,
        cubicMeters: value.cubicMeters,
        reserveFund: value.reserveFund,
        association: value.association
      });
    } else {
      this.isEdit = false;
      this.form.reset({
        type: 'OTHER',
        purchaseDate: new Date(),
        price: 0,
        kws: 0,
        cubicMeters: 0,
        reserveFund: 0,
        association: 0
      });
    }
  }
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<any>();

  form: FormGroup;
  isEdit: boolean = false;

  expenseTypes = EXPENSE_TYPES;
  quickExpenseTypes = QUICK_EXPENSE_TYPES;

  condominiumDefaults = {
    price: 300.00,
    reserveFund: 15.00,
    association: 130.00
  };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      type: ['OTHER', Validators.required],
      purchaseDate: [new Date(), Validators.required],
      observation: [''],
      kws: [0],
      cubicMeters: [0],
      reserveFund: [0],
      association: [0]
    });
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe((result: BreakpointState) => {
        this.isMobile = result.matches;
      });

    this.form.get('type')?.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });
  }

  updateValidators(type: string) {
    // Reset conditional fields
    // Logic to clear or set validators if needed
  }

  applyQuickExpense(quickType: any) {
    const patchData: any = {
      description: this.translate.instant(quickType.description),
      type: quickType.value,
      price: 0,
      kws: 0,
      cubicMeters: 0,
      reserveFund: 0,
      association: 0
    };

    if (quickType.value === 'CONDOMINIUM') {
      patchData.price = this.condominiumDefaults.price;
      patchData.reserveFund = this.condominiumDefaults.reserveFund;
      patchData.association = this.condominiumDefaults.association;
    }

    this.form.patchValue(patchData);
  }

  clearForm() {
    this.form.reset({
      type: 'OTHER',
      purchaseDate: new Date(),
      price: 0,
      kws: 0,
      cubicMeters: 0,
      reserveFund: 0,
      association: 0
    });
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.form.reset({
        type: 'OTHER',
        purchaseDate: new Date(),
        price: 0
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
      this.onClose();
    } else {
        this.form.markAllAsTouched();
    }
  }
}
