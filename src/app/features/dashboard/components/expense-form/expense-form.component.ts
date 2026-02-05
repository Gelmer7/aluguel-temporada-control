import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    InputText,
    InputNumber,
    DatePicker,
    Select,
    Textarea,
    ToolbarModule,
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
        purchaseDate: new Date(value.purchase_date),
        observation: value.observation,
        kws: value.kws,
        cubicMeters: value.cubic_meters,
        association: value.association,
        reserveFund: value.reserve_fund
      });
    } else {
      this.isEdit = false;
      this.form.reset({
        type: 'OTHER',
        purchaseDate: new Date(),
        price: 0
      });
    }
  }
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<any>();

  form: FormGroup;
  isEdit: boolean = false;

  expenseTypes = [
    { label: 'EXPENSES_FORM.TYPES.ELECTRICITY', value: 'ELECTRICITY', icon: 'pi pi-bolt' },
    { label: 'EXPENSES_FORM.TYPES.WATER', value: 'WATER', icon: 'pi pi-tint' },
    { label: 'EXPENSES_FORM.TYPES.CONDOMINIUM', value: 'CONDOMINIUM', icon: 'pi pi-building' },
    { label: 'EXPENSES_FORM.TYPES.INTERNET', value: 'INTERNET', icon: 'pi pi-wifi' },
    { label: 'EXPENSES_FORM.TYPES.GAS', value: 'GAS', icon: 'pi pi-fire' },
    { label: 'EXPENSES_FORM.TYPES.MAINTENANCE', value: 'MAINTENANCE', icon: 'pi pi-wrench' },
    { label: 'EXPENSES_FORM.TYPES.CLEANING', value: 'CLEANING', icon: 'pi pi-trash' },
    { label: 'EXPENSES_FORM.TYPES.OTHER', value: 'OTHER', icon: 'pi pi-box' }
  ];

  quickExpenseTypes = [
    { label: 'EXPENSES_FORM.QUICK.ELECTRICITY', value: 'ELECTRICITY', description: 'EXPENSES_FORM.QUICK.DESC_ELECTRICITY', icon: 'pi pi-bolt' },
    { label: 'EXPENSES_FORM.QUICK.WATER', value: 'WATER', description: 'EXPENSES_FORM.QUICK.DESC_WATER', icon: 'pi pi-tint' },
    { label: 'EXPENSES_FORM.QUICK.CONDOMINIUM', value: 'CONDOMINIUM', description: 'EXPENSES_FORM.QUICK.DESC_CONDOMINIUM', icon: 'pi pi-building' },
    { label: 'EXPENSES_FORM.QUICK.INTERNET', value: 'INTERNET', description: 'EXPENSES_FORM.QUICK.DESC_INTERNET', icon: 'pi pi-wifi' }
  ];

  condominiumDefaults = {
    price: 235.59,
    reserveFund: 11.78,
    association: 64.26
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
      association: [0],
      reserveFund: [0]
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
      association: 0,
      reserveFund: 0
    };

    if (quickType.value === 'CONDOMINIUM') {
      patchData.price = this.condominiumDefaults.price;
      patchData.association = this.condominiumDefaults.association;
      patchData.reserveFund = this.condominiumDefaults.reserveFund;
    }

    this.form.patchValue(patchData);
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
