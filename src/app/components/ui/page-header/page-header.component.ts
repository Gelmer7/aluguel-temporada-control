import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de cabeçalho padronizado para páginas do dashboard.
 * Suporta título, ícone e um botão de ação opcional à direita.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Button, Tooltip, TranslateModule],
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent {
  /** Título da página (pode ser chave de tradução) */
  title = input.required<string>();

  /** Ícone decorativo (ex: pi-wallet) */
  icon = input.required<string>();

  /** Se deve mostrar o botão de ação à direita */
  showAction = input<boolean>(false);

  /** Rótulo do botão de ação */
  actionLabel = input<string>('');

  /** Ícone do botão de ação */
  actionIcon = input<string>('pi pi-plus');

  /** Tooltip do botão de ação */
  actionTooltip = input<string>('');

  /** Evento emitido ao clicar no botão de ação */
  onAction = output<void>();

  protected handleAction(): void {
    this.onAction.emit();
  }
}
