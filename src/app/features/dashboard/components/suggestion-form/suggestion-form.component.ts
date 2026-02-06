import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { TranslateModule } from '@ngx-translate/core';
import { Suggestion, SuggestionStatus } from '../../../../models/suggestion.model';

@Component({
  selector: 'app-suggestion-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    InputText,
    Textarea,
    Select,
    TranslateModule
  ],
  templateUrl: './suggestion-form.component.html',
})
export class SuggestionFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() suggestion: Suggestion | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Omit<Suggestion, 'id' | 'created_at'>>();

  // Simulating admin for parity with React demo
  isAdmin = signal<boolean>(true);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    status: ['PENDING' as SuggestionStatus, Validators.required],
    answer: [''],
  });

  statusOptions = [
    { label: 'PENDING', value: 'PENDING' },
    { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'COMPLETED', value: 'COMPLETED' },
    { label: 'REJECTED', value: 'REJECTED' },
  ];

  ngOnInit() {
    this.updateForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['suggestion'] && !changes['suggestion'].firstChange) {
      this.updateForm();
    }
  }

  private updateForm() {
    if (this.suggestion) {
      this.form.patchValue({
        title: this.suggestion.title,
        description: this.suggestion.description,
        status: this.suggestion.status,
        answer: this.suggestion.answer || ''
      });
    } else {
      this.form.reset({
        title: '',
        description: '',
        status: 'PENDING',
        answer: ''
      });
    }
  }

  onHide() {
    this.visibleChange.emit(false);
  }

  save() {
    if (this.form.valid) {
      const formValue = this.form.value;
      // Se não for admin, não enviar status e answer para não sobrescrever se estiver editando
      const payload = {
        title: formValue.title,
        description: formValue.description,
        ...(this.isAdmin() ? { status: formValue.status, answer: formValue.answer } : {})
      };
      this.saved.emit(payload as any);
      this.onHide();
    }
  }
}
