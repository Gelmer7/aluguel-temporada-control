import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

// Services
import { ColorService } from '../../../../services/color.service';
import { AppColorConfig } from '../../../../shared/design/colors';

// Components
import { PageHeaderComponent } from '../../../../components/ui/page-header/page-header.component';

@Component({
  selector: 'app-color-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    PageHeaderComponent,
  ],
  providers: [MessageService],
  templateUrl: './color-settings.page.html',
})
export class ColorSettingsPage {
  private readonly colorService = inject(ColorService);
  private readonly messageService = inject(MessageService);
  private readonly translateService = inject(TranslateService);

  protected editableColors: AppColorConfig = { ...this.colorService.colors() };
  protected colorKeys = Object.keys(this.editableColors) as (keyof AppColorConfig)[];

  getLabel(key: string): string {
    const labelKey = `SETTINGS.COLORS.LABELS.${key.toUpperCase()}`;
    return this.translateService.instant(labelKey);
  }

  save() {
    this.colorService.updateColors(this.editableColors);
    this.messageService.add({
      severity: 'success',
      summary: this.translateService.instant('ACTIONS.SAVE'),
      detail: this.translateService.instant('SETTINGS.COLORS.SUCCESS_SAVE'),
    });
  }

  resetDefaults() {
    this.colorService.resetToDefault();
    this.editableColors = { ...this.colorService.colors() };
    this.messageService.add({
      severity: 'info',
      summary: this.translateService.instant('SETTINGS.COLORS.RESET_DEFAULTS'),
      detail: this.translateService.instant('SETTINGS.COLORS.SUCCESS_RESET'),
    });
  }
}
