import { Component, ChangeDetectionStrategy, input, output, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavItem } from '../types';
import { Badge } from 'primeng/badge';
import { Ripple } from 'primeng/ripple';
import { Avatar } from 'primeng/avatar';
import { Button, ButtonModule } from 'primeng/button';
import { Tooltip, TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Drawer } from 'primeng/drawer';
import { TieredMenu } from 'primeng/tieredmenu';
import { LanguageService } from '../../../services/language.service';
import { ThemeService } from '../../../services/theme.service';
import { HouseService } from '../../../services/house.service';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    Badge,
    Ripple,
    Avatar,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    Drawer,
    TieredMenu,
  ],
  templateUrl: './sidebar-menu.component.html',
})
export class SidebarMenuComponent {
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);
  private translateService = inject(TranslateService);
  private houseService = inject(HouseService);

  readonly activeHouseName = computed(() => this.houseService.currentHouse().name);

  items = input.required<{
    id: string;
    label: string;
    icon: string;
    route: string;
    badge?: string | number;
    shortcut?: string;
  }[]>();

  visible = input.required<boolean>();
  onVisibleChange = output<boolean>();

  themeOptions = this.themeService.themes;
  languages = this.languageService.languages;
  userMenuItems = signal<MenuItem[]>([]);

  constructor() {
    effect(() => {
      const lang = this.languageService.currentLang();
      this.updateUserMenu(lang);
    });
  }

  protected trackById = (_: number, item: NavItem) => item.id;

  protected menuModel = computed<(MenuItem & { badge?: string | number; shortcut?: string })[]>(() => {
    return this.items().map((i) => ({
      label: i.label,
      icon: `pi ${i.icon}`,
      routerLink: i.route,
      badge: i.badge?.toString(),
      shortcut: i.shortcut,
    }));
  });

  get currentTheme() {
    const code = this.themeService.currentTheme();
    return this.themeOptions.find((t) => t.code === code) || this.themeOptions[0];
  }

  toggleTheme() {
    const nextCode = this.currentTheme.code === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(nextCode);
  }

  private updateUserMenu(currentLangCode: string) {
    const currentLangObj = this.languages.find((l) => l.code === currentLangCode);
    const theme = this.currentTheme;

    this.userMenuItems.set([
      {
        label: this.translateService.instant('TERMS.SETTINGS'),
        icon: 'pi pi-cog',
        items: [
          {
            label: this.translateService.instant('TERMS.DATA_MANAGEMENT'),
            icon: 'pi pi-database',
            routerLink: '/dashboard/data-management',
            command: () => this.closeDrawer(),
          },
          {
            label: this.translateService.instant('TERMS.CUSTOM_COLORS'),
            icon: 'pi pi-palette',
            routerLink: '/dashboard/color-settings',
            command: () => this.closeDrawer(),
          },
        ],
      },
      {
        label: 'Appearance',
        icon: theme.icon,
        data: { isTheme: true, currentTheme: theme },
        command: () => this.toggleTheme(),
      },
      {
        label: 'Language',
        icon: 'pi pi-globe',
        data: { isLanguage: true, currentLang: currentLangObj },
        items: this.languages.map((l) => ({
          label: l.name,
          data: { isLanguageOption: true, lang: l },
          command: () => this.languageService.setLanguage(l.code),
        })),
      },
      { separator: true },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        data: { isLogout: true },
        command: () => console.log('Logout clicked'),
      },
    ]);
  }

  protected closeDrawer(): void {
    this.onVisibleChange.emit(false);
  }
}
