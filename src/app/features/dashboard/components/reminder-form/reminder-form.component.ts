import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { Reminder, ReminderStatus } from '../../../../models/reminder.model';
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-reminder-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogComponent,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    TranslateModule
  ],
  templateUrl: './reminder-form.component.html',
})
export class ReminderFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() reminder: Reminder | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Omit<Reminder, 'id' | 'created_at'>>();

  minDate: Date = new Date();

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    remind_at: [null, [Validators.required]],
    status: ['PENDING' as ReminderStatus, Validators.required],
  });

  statusOptions = [
    { label: 'REMINDERS_FORM.STATUS.PENDING', value: 'PENDING' },
    { label: 'REMINDERS_FORM.STATUS.IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'REMINDERS_FORM.STATUS.COMPLETED', value: 'COMPLETED' },
    { label: 'REMINDERS_FORM.STATUS.REJECTED', value: 'REJECTED' },
  ];

  ngOnInit() {
    this.updateForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reminder'] && !changes['reminder'].firstChange) {
      this.updateForm();
    }
  }

  private updateForm() {
    if (this.reminder) {
      this.form.patchValue({
        title: this.reminder.title,
        description: this.reminder.description,
        remind_at: DateUtils.parseLocal(this.reminder.remind_at),
        status: this.reminder.status,
      });
    } else {
      this.form.reset({
        title: '',
        description: '',
        remind_at: null,
        status: 'PENDING',
      });
    }
  }

  onHide() {
    this.visibleChange.emit(false);
  }

  save() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const payload = {
        ...formValue,
        remind_at: DateUtils.toLocalISOString(formValue.remind_at)
      };
      this.saved.emit(payload);
      this.onHide();
    }
  }
}
