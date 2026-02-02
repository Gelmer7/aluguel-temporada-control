import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarMenuComponent } from '../../../../components/ui/sidebar-menu/sidebar-menu.component';
import { NavItem } from '../../../../components/ui/types';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { DASHBOARD_MENU_ITEMS } from '../../dashboard.config';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    SidebarMenuComponent,
    Button,
    Tooltip,
  ],
  templateUrl: './dashboard-layout.page.html',
})
export class DashboardLayoutPage {
  protected readonly menuVisible = signal(false);
  protected readonly navItems: NavItem[] = DASHBOARD_MENU_ITEMS;
}
