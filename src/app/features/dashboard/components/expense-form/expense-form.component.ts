import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    TextareaModule,
    SelectButtonModule
  ],
  templateUrl: './expense-form.component.html',
})
export class ExpenseFormComponent implements OnInit {
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
    { label: 'Eletricidade', value: 'ELECTRICITY', icon: 'pi pi-bolt' },
    { label: 'Água', value: 'WATER', icon: 'pi pi-tint' },
    { label: 'Condomínio', value: 'CONDOMINIUM', icon: 'pi pi-building' },
    { label: 'Internet', value: 'INTERNET', icon: 'pi pi-wifi' },
    { label: 'Gás', value: 'GAS', icon: 'pi pi-fire' },
    { label: 'Manutenção', value: 'MAINTENANCE', icon: 'pi pi-wrench' },
    { label: 'Limpeza', value: 'CLEANING', icon: 'pi pi-trash' },
    { label: 'Outros', value: 'OTHER', icon: 'pi pi-box' }
  ];

  quickExpenseTypes = [
    { label: 'Luz', value: 'ELECTRICITY', description: 'Conta de Luz', icon: 'pi pi-bolt' },
    { label: 'Água', value: 'WATER', description: 'Conta de Água', icon: 'pi pi-tint' },
    { label: 'Condomínio', value: 'CONDOMINIUM', description: 'Condomínio Mensal', icon: 'pi pi-building' },
    { label: 'Internet', value: 'INTERNET', description: 'Internet Fibra', icon: 'pi pi-wifi' }
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
      description: quickType.description,
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
