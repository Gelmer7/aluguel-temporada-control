import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../services/supabase.service';
import { MessageService } from 'primeng/api';
import { House, HousePhoto } from '../../../../models/house.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TranslateModule } from '@ngx-translate/core';
import { HouseWizardComponent } from './components/house-wizard/house-wizard.component';
import { HeaderService } from '../../../../services/header';

@Component({
  selector: 'app-house-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    TranslateModule,
    HouseWizardComponent
  ],
  providers: [MessageService],
  templateUrl: './house-admin.page.html',
  styles: []
})
export class HouseAdminPage {
  private supabaseService = inject(SupabaseService);
  private headerService = inject(HeaderService);
  private messageService = inject(MessageService);

  houses = signal<House[]>([]);
  loading = signal(false);
  displayWizard = false;
  selectedHouse = signal<House | null>(null);

  wizardHeader = computed(() => {
    return this.selectedHouse()
      ? `Editar: ${this.selectedHouse()?.name}`
      : 'Cadastrar Nova Casa';
  });

  constructor() {
    this.headerService.setHeader({
      title: 'HOUSE_ADMIN.TITLE',
      icon: 'pi-home'
    });
    this.loadHouses();
  }

  async loadHouses() {
    this.loading.set(true);
    const { data, error } = await this.supabaseService.getHouses();
    if (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível carregar as casas.'
      });
    } else {
      this.houses.set(data || []);
    }
    this.loading.set(false);
  }

  onAddHouse() {
    this.selectedHouse.set(null);
    this.displayWizard = true;
  }

  onEditHouse(house: House) {
    this.selectedHouse.set(house);
    this.displayWizard = true;
  }

  onWizardClose() {
    this.displayWizard = false;
    this.selectedHouse.set(null);
  }

  async onSaveHouse(data: { house: House, photos: HousePhoto[] }) {
    this.loading.set(true);
    const { house, photos } = data;

    // 1. Salvar ou atualizar a casa
    const { data: savedHouse, error: houseError } = await this.supabaseService.upsertHouse(house);

    if (houseError) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao salvar os dados da casa.'
      });
      this.loading.set(false);
      return;
    }

    // 2. Salvar as fotos se houver novas
    const newPhotos = photos.filter(p => !p.id).map(p => ({
      ...p,
      house_code: house.code // Garante que as fotos novas usem o código da casa
    }));

    if (newPhotos.length > 0) {
      const { error: photoError } = await this.supabaseService.addHousePhotos(newPhotos);
      if (photoError) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Casa salva, mas houve erro ao salvar algumas fotos.'
        });
      }
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Casa salva com sucesso.'
    });

    this.displayWizard = false;
    this.selectedHouse.set(null);
    this.loadHouses();
    this.loading.set(false);
  }

  async onDeleteHouse(house: House) {
    // Aqui deveria ter um confirmDialog
    if (confirm(`Deseja realmente excluir a casa ${house.name}?`)) {
      const { error } = await this.supabaseService.deleteHouse(house.code);
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao excluir a casa.'
        });
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Casa excluída com sucesso.'
        });
        this.loadHouses();
      }
    }
  }

  getStatusClass(status: string) {
    const base = 'px-2 py-1 rounded-full text-[10px] font-bold ';
    switch (status) {
      case 'active': return base + 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return base + 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return base + 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400';
    }
  }
}
