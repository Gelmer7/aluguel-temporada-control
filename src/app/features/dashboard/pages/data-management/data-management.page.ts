import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { SupabaseService } from '../../../../services/supabase.service';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../../components/ui/page-header/page-header.component';

@Component({
  selector: 'app-data-management-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Button, Card, Toast, TranslateModule, PageHeaderComponent],
  providers: [MessageService],
  templateUrl: './data-management.page.html',
})
export class DataManagementPage {
  private supabaseService = inject(SupabaseService);
  private messageService = inject(MessageService);

  loading = signal<boolean>(false);

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
        const transformedData = jsonData.map((item: any) => ({
          price: item.price,
          description: item.description,
          observation: item.observation,
          type: item.type,
          purchase_date: item.purchaseDate?.$date || item.purchase_date,
          cubic_meters: item.cubicMeters || item.cubic_meters,
          reserve_fund: item.reserveFund || item.reserve_fund,
          association: item.association,
          kws: item.kws,
          create_user: item.createUser || item.create_user || 'gelmer7@gmail.com'
        }));

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
