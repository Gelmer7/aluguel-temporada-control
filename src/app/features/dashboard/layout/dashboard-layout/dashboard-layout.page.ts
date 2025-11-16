import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppToolbarComponent } from '../../../../components/ui/app-toolbar/app-toolbar.component';
import { SidebarMenuComponent } from '../../../../components/ui/sidebar-menu/sidebar-menu.component';
import { NavItem } from '../../../../components/ui/types';
import { PanelModule } from 'primeng/panel';
import { StatusBarComponent } from '../../../../components/ui/status-bar/status-bar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    AppToolbarComponent,
    SidebarMenuComponent,
    PanelModule,
    StatusBarComponent,
  ],
  templateUrl: './dashboard-layout.page.html',
})
export class DashboardLayoutPage {
  protected readonly collapsed = signal(false);

  protected readonly navItems: NavItem[] = [
    {
      id: 'upload',
      label: 'Upload de CSV',
      icon: 'pi-file',
      route: '/dashboard/csv-reports/upload',
    },
    {
      id: 'csv-viewer',
      label: 'Visualizador CSV',
      icon: 'pi-table',
      route: '/dashboard/csv-reports/viewer',
    },
    { id: 'entries', label: 'Entradas', icon: 'pi-download', route: '/dashboard/airbnb-payments' },
    { id: 'csv-list', label: "Lista de CSV's", icon: 'pi-list', route: '/dashboard/csv-reports' },
    { id: 'expenses', label: 'Gastos', icon: 'pi-arrow-up', route: '/dashboard/expenses' },
    { id: 'earnings', label: 'Ganhos', icon: 'pi-dollar', route: '/dashboard/earnings' },
    { id: 'carne', label: 'Carnê-Leão', icon: 'pi-wallet', route: '/dashboard/carne-leao' },
    { id: 'tithe', label: 'Dízimo', icon: 'pi-heart', route: '/dashboard/tithe' },
    { id: 'contracts', label: 'Contratos', icon: 'pi-file-edit', route: '/dashboard/contracts' },
    { id: 'charts', label: 'Gráficos', icon: 'pi-chart-pie', route: '/dashboard/charts' },
    { id: 'reports', label: 'Relatórios', icon: 'pi-chart-bar', route: '/dashboard/reports' },
    { id: 'suggestions', label: 'Sugestões', icon: 'pi-comment', route: '/dashboard/suggestions' },
  ];

  protected toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }
}
