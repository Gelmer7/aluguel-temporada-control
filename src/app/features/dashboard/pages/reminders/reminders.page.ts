import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, viewChild, TemplateRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FloatLabel } from 'primeng/floatlabel';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ReminderService } from '../../../../services/reminder.service';
import { Reminder, ReminderStatus, ReminderFilters } from '../../../../models/reminder.model';
import { ReminderFormComponent } from '../../components/reminder-form/reminder-form.component';
import { HeaderService } from '../../../../services/header';
import { DateUtils } from '../../../../shared/utils/date.utils';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';

@Component({
  selector: 'app-reminders-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    MultiSelectModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    TranslateModule,
    ReminderFormComponent,
    CardModule,
    FloatLabel,
    FilterContainerComponent
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

  // Filtros
  selectedYear = signal<(number | string)[]>(['ALL']);
  selectedMonth = signal<number[]>(Array.from({ length: 12 }, (_, i) => i));
  selectedStatus = signal<ReminderStatus[]>(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']);

  filters = computed<ReminderFilters>(() => ({
    status: this.selectedStatus(),
    years: this.selectedYear(),
    months: this.selectedMonth()
  }));

  isFormVisible = signal<boolean>(false);
  selectedReminder = signal<Reminder | null>(null);

  statusOptions = [
    { label: 'REMINDERS_FORM.STATUS.PENDING', value: 'PENDING' },
    { label: 'REMINDERS_FORM.STATUS.IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'REMINDERS_FORM.STATUS.COMPLETED', value: 'COMPLETED' },
    { label: 'REMINDERS_FORM.STATUS.REJECTED', value: 'REJECTED' },
  ];

  yearOptions = computed(() => {
    const years = new Set(this.reminders().map(r => new Date(r.remind_at).getFullYear()));
    const options = Array.from(years).sort((a, b) => b - a).map(y => ({ label: y.toString(), value: y }));
    return [{ label: 'TERMS.ALL', value: 'ALL' }, ...options];
  });

  monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: `MONTHS.${i}`,
    value: i
  }));

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

    // Recarregar quando filtros mudarem
    effect(() => {
      this.loadReminders();
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

  clearFilters() {
    this.selectedYear.set(['ALL']);
    this.selectedMonth.set(Array.from({ length: 12 }, (_, i) => i));
    this.selectedStatus.set(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']);
  }

  getYearLabel(): string {
    const selected = this.selectedYear();
    if (selected.includes('ALL')) return this.translateService.instant('TERMS.ALL');
    return selected.join(', ');
  }

  getMonthLabel(): string {
    const selected = this.selectedMonth();
    if (selected.length === 12) return this.translateService.instant('TERMS.ALL');
    if (selected.length === 0) return this.translateService.instant('TERMS.NONE');
    return `${selected.length} ${this.translateService.instant('TERMS.MONTHS')}`;
  }

  getStatusLabel(): string {
    const selected = this.selectedStatus();
    if (selected.length === 4) return this.translateService.instant('TERMS.ALL');
    return `${selected.length} ${this.translateService.instant('TERMS.STATUS')}`;
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
      header: this.translateService.instant('ACTIONS.CONFIRM'),
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
