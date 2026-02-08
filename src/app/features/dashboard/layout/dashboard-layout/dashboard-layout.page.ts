import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarMenuComponent } from '../../../../components/ui/sidebar-menu/sidebar-menu.component';
import { PageHeaderComponent } from '../../../../components/ui/page-header/page-header.component';
import { NavItem } from '../../../../components/ui/types';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { DASHBOARD_MENU_ITEMS } from '../../dashboard.config';
import { HouseService } from '../../../../services/house.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    SidebarMenuComponent,
    PageHeaderComponent,
    Button,
    Tooltip,
  ],
  templateUrl: './dashboard-layout.page.html',
})
export class DashboardLayoutPage {
  private houseService = inject(HouseService);

  protected readonly menuVisible = signal(false);
  protected readonly navItems: NavItem[] = DASHBOARD_MENU_ITEMS;
  
  readonly activeHouseName = computed(() => this.houseService.currentHouse().name);
}
