import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ReminderService } from '../../../../services/reminder.service';
import { Reminder, ReminderStatus, ReminderFilters } from '../../../../models/reminder.model';
import { ReminderFormComponent } from '../../components/reminder-form/reminder-form.component';
import { HeaderService } from '../../../../services/header';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-reminders-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    TranslateModule,
    ReminderFormComponent,
    CardModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './reminders.page.html',
})
export class RemindersPage implements OnInit {
  private reminderService = inject(ReminderService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private headerService = inject(HeaderService);

  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  reminders = signal<Reminder[]>([]);
  loading = signal<boolean>(false);
  filters = signal<ReminderFilters>({ status: 'all' });

  isFormVisible = signal<boolean>(false);
  selectedReminder = signal<Reminder | null>(null);

  statusOptions = [
    { label: 'TERMS.ALL', value: 'all' },
    { label: 'REMINDERS_FORM.STATUS.PENDING', value: 'PENDING' },
    { label: 'REMINDERS_FORM.STATUS.IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'REMINDERS_FORM.STATUS.COMPLETED', value: 'COMPLETED' },
    { label: 'REMINDERS_FORM.STATUS.REJECTED', value: 'REJECTED' },
  ];

  constructor() {
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'TERMS.REMINDERS',
          icon: 'pi-bell',
          actions: actions
        });
      }
    });
  }

  async ngOnInit() {
    this.loadReminders();
  }

  async loadReminders() {
    this.loading.set(true);
    const { data, error } = await this.reminderService.getReminders(this.filters());

    if (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message
      });
    } else {
      this.reminders.set(data || []);
    }
    this.loading.set(false);
  }

  onFilterChange(status: ReminderStatus | 'all') {
    this.filters.update(f => ({ ...f, status }));
    this.loadReminders();
  }

  openNew() {
    this.selectedReminder.set(null);
    this.isFormVisible.set(true);
  }

  openEdit(reminder: Reminder) {
    this.selectedReminder.set({ ...reminder });
    this.isFormVisible.set(true);
  }

  async onSave(reminderData: Omit<Reminder, 'id' | 'created_at'>) {
    const current = this.selectedReminder();
    let result;

    if (current) {
      result = await this.reminderService.updateReminder(current.id, reminderData);
    } else {
      result = await this.reminderService.addReminder(reminderData);
    }

    if (result.error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error.message
      });
    } else {
      const detailKey = current ? 'REMINDERS_FORM.SUCCESS_UPDATE' : 'REMINDERS_FORM.SUCCESS_CREATE';
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('ACTIONS.SUCCESS'),
        detail: this.translateService.instant(detailKey)
      });
      this.loadReminders();
    }
  }

  confirmDelete(reminder: Reminder) {
    this.confirmationService.confirm({
      message: this.translateService.instant('REMINDERS_FORM.CONFIRM_DELETE'),
      header: this.translateService.instant('ACTIONS.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteReminder(reminder.id)
    });
  }

  async deleteReminder(id: string) {
    const { error } = await this.reminderService.deleteReminder(id);
    if (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message
      });
    } else {
      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('ACTIONS.SUCCESS'),
        detail: this.translateService.instant('REMINDERS_FORM.SUCCESS_DELETE')
      });
      this.loadReminders();
    }
  }

  getStatusSeverity(status: ReminderStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'PENDING': return 'warn';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  }

  formatDate(date: string) {
    const d = DateUtils.parseLocal(date);
    return d.toLocaleDateString(this.translateService.currentLang === 'pt' ? 'pt-BR' :
                                            this.translateService.currentLang === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
