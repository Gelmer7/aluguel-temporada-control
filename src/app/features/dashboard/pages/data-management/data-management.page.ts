import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { SupabaseService } from '../../../../services/supabase.service';
import { HeaderService } from '../../../../services/header';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-data-management-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Button, Card, Toast, TranslateModule],
  providers: [MessageService],
  templateUrl: './data-management.page.html',
})
export class DataManagementPage {
  private supabaseService = inject(SupabaseService);
  private messageService = inject(MessageService);
  private headerService = inject(HeaderService);

  loading = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.headerService.setHeader({
        title: 'TERMS.DATA_MANAGEMENT',
        icon: 'pi-database'
      });
    });
  }

  async onDownloadExpenses() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.getExpenses();
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gastos-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Exportação concluída!'
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao exportar: ' + error.message
      });
    } finally {
      this.loading.set(false);
    }
  }

  async onUploadExpenses(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.loading.set(true);
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const transformedData = jsonData.map((item: any) => {
          const expense: any = {
            price: item.price || 0,
            description: item.description || '',
            observation: item.observation || '',
            type: item.type || 'OTHER',
            purchaseDate: item.purchaseDate?.$date || item.purchaseDate || item.purchase_date || new Date().toISOString(),
            createUser: item.createUser || item.create_user || 'gelmer7@gmail.com'
          };

          // Adicionar campos opcionais apenas se existirem no item original
          if (item.cubicMeters !== undefined || item.cubic_meters !== undefined) {
            expense.cubicMeters = item.cubicMeters || item.cubic_meters;
          }
          if (item.reserveFund !== undefined || item.reserve_fund !== undefined) {
            expense.reserveFund = item.reserveFund || item.reserve_fund;
          }
          if (item.association !== undefined) {
            expense.association = item.association;
          }
          if (item.kws !== undefined) {
            expense.kws = item.kws;
          }

          return expense;
        });

        const { error } = await this.supabaseService.bulkUploadExpenses(transformedData);
        if (error) throw error;

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Dados importados com sucesso!'
        });
      } catch (error: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao importar JSON: ' + error.message
        });
      } finally {
        this.loading.set(false);
        // Clear input
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }
}
