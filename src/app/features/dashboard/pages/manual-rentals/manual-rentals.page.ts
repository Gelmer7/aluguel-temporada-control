import { Component, ChangeDetectionStrategy, OnInit, signal, inject, computed, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TablePaginatorComponent } from '../../../../components/ui/table-paginator/table-paginator.component';
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';
import { ManualRentalFormComponent } from '../../components/manual-rental-form/manual-rental-form.component';
import { SupabaseService } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';
import { ManualRental } from '../../../../models/airbnb.model';

@Component({
  selector: 'app-manual-rentals-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 flex flex-col min-h-0'
  },
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    ToastModule,
    TablePaginatorComponent,
    FilterContainerComponent,
    ManualRentalFormComponent,
    TranslateModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manual-rentals.page.html',
})
export class ManualRentalsPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private houseService = inject(HouseService);
  private headerService = inject(HeaderService);

  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  rentals = signal<ManualRental[]>([]);
  filteredRentals = signal<ManualRental[]>([]);
  loading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  currentRental = signal<ManualRental | null>(null);

  // Pagination
  first = signal<number>(0);
  rows = signal<number>(20);
  globalFilter = signal<string>('');

  constructor() {
    // Reload when house changes
    effect(() => {
      this.houseService.currentHouseCode();
      this.loadRentals();
    });

    // Configura o header
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'TERMS.MANUAL_RENTALS',
          icon: 'pi-home',
          actions: actions
        });
      }
    });
  }

  ngOnInit() {
    this.loadRentals();
  }

  async loadRentals() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.getManualRentals();
      if (error) throw error;
      this.rentals.set(data || []);
      this.applyFilters();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('COMMON.ERROR'),
        detail: error.message
      });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    let result = [...this.rentals()];
    const filter = this.globalFilter().toLowerCase();

    if (filter) {
      result = result.filter(r => 
        r.hospede.toLowerCase().includes(filter) || 
        r.anuncio.toLowerCase().includes(filter) ||
        r.informacoes?.toLowerCase().includes(filter)
      );
    }

    this.filteredRentals.set(result);
  }

  onFilterGlobal(query: string) {
    this.globalFilter.set(query);
    this.first.set(0);
    this.applyFilters();
  }

  pagedRentals = computed(() => {
    const start = this.first();
    const end = start + this.rows();
    return this.filteredRentals().slice(start, end);
  });

  onPageChange(event: any) {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  openNew() {
    this.currentRental.set(null);
    this.showForm.set(true);
  }

  editRental(rental: ManualRental) {
    this.currentRental.set(rental);
    this.showForm.set(true);
  }

  async saveRental(rental: ManualRental) {
    try {
      const { error } = await this.supabaseService.upsertManualRental({
        ...rental,
        id: this.currentRental()?.id
      });
      if (error) throw error;

      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('ACTIONS.SUCCESS'),
        detail: this.translateService.instant(
          this.currentRental() ? 'MANUAL_RENTALS_FORM.SUCCESS_UPDATE' : 'MANUAL_RENTALS_FORM.SUCCESS_CREATE'
        )
      });
      this.loadRentals();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('COMMON.ERROR'),
        detail: error.message
      });
    }
  }

  confirmDelete(rental: ManualRental) {
    this.confirmationService.confirm({
      message: this.translateService.instant('MANUAL_RENTALS_FORM.CONFIRM_DELETE'),
      header: this.translateService.instant('ACTIONS.CONFIRM'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteRental(rental.id!)
    });
  }

  async deleteRental(id: string) {
    try {
      const { error } = await this.supabaseService.deleteManualRental(id);
      if (error) throw error;

      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('ACTIONS.SUCCESS'),
        detail: this.translateService.instant('COMMON.DELETE_SUCCESS')
      });
      this.loadRentals();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('COMMON.ERROR'),
        detail: error.message
      });
    }
  }
}
