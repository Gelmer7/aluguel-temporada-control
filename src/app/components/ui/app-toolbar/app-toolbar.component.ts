import { Component, ChangeDetectionStrategy, inject, signal, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { MenuItem } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { ThemeService } from '../../../services/theme.service';

/**
 * Toolbar do app (apresentação)
 * Exibe botão de colapso da sidebar, logo "airbnb" e ação "login".
 */
@Component({
  selector: 'app-app-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    SelectModule,
    TranslateModule,
    TooltipModule,
    TieredMenuModule,
  ],
  templateUrl: './app-toolbar.component.html',
})
export class AppToolbarComponent {
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);

  toggleMenu = output<void>();

  themeOptions = this.themeService.themes;
  languages = this.languageService.languages;

  // User menu items
  userMenuItems = signal<MenuItem[]>([]);

  constructor() {
    this.buildMenu();
  }

  get currentTheme() {
    const code = this.themeService.currentTheme();
    return this.themeOptions.find((t) => t.code === code) || this.themeOptions[0];
  }

  set currentTheme(val: { name: string; code: string; icon: string }) {
    if (val && val.code) {
      this.themeService.setTheme(val.code);
    }
  }

  toggleTheme() {
    const nextCode = this.currentTheme.code === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(nextCode);
  }

  // Getter for two-way binding: returns the full Language Object matched by code
  get currentLang() {
    const code = this.languageService.currentLang();
    return this.languages.find((l) => l.code === code) || this.languages[0];
  }

  private buildMenu() {
    // Effect to react to language changes
    effect(() => {
      const lang = this.languageService.currentLang();
      this.updateMenu(lang);
    });
  }

  private updateMenu(currentLangCode: string) {
    const currentLangObj = this.languages.find((l) => l.code === currentLangCode);

    this.userMenuItems.set([
      {
        label: 'Setings',
        icon: 'pi pi-cog',
      },
      {
        label: 'Language',
        styleClass: 'language-root-item',
        data: {
          isLanguage: true,
          currentLang: currentLangObj,
        },
        items: this.languages.map((l) => ({
          label: l.name,
          data: {
            isLanguageOption: true,
            lang: l,
          },
          command: () => this.languageService.setLanguage(l.code),
        })),
      },
      {
        separator: true,
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        data: { isLogout: true },
        command: () => {
          console.log('Logout clicked');
        },
      },
    ]);
  }
}
