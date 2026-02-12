import { Component, ChangeDetectionStrategy, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderService } from '../../../services/header';
import { HouseService } from '../../../services/house.service';

/**
 * Componente de cabeçalho padronizado para páginas do dashboard.
 * Suporta título, ícone e um espaço para ações à direita.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    Button,
    Tooltip,
    PopoverModule,
    SelectModule,
    TranslateModule,
  ],
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent {
  private headerService = inject(HeaderService);
  private houseService = inject(HouseService);

  /** Título da página (pode ser chave de tradução) */
  titleInput = input<string>('', { alias: 'title' });

  /** Ícone decorativo (ex: pi-wallet) */
  iconInput = input<string>('', { alias: 'icon' });

  /** Ícone de imagem customizado (ex: airbnb.svg) */
  imageInput = input<string>('', { alias: 'image' });

  /** Se deve mostrar o botão de ação padrão (legado) */
  showAction = input<boolean>(false);

  /** Rótulo do botão de ação padrão */
  actionLabel = input<string>('');

  /** Ícone do botão de ação padrão */
  actionIcon = input<string>('pi pi-plus');

  /** Tooltip do botão de ação padrão */
  actionTooltip = input<string>('');

  /** Evento emitido ao clicar no botão de ação padrão */
  onAction = output<void>();

  /** Título final (input ou serviço) */
  displayTitle = computed(() => this.titleInput() || this.headerService.title());

  /** Ícone final (input ou serviço) */
  displayIcon = computed(() => this.iconInput() || this.headerService.icon());

  /** Ícone de imagem final (input ou serviço) */
  displayImage = computed(() => this.imageInput() || this.headerService.image());

  /** Template de ações do serviço */
  actionsTemplate = this.headerService.actionsTemplate;

  /** Lista de casas disponíveis */
  readonly houses = this.houseService.allHouses;

  /** Nome da casa ativa */
  activeHouseName = computed(() => this.houseService.currentHouse().name);

  /** Getter/Setter para a casa atual (usado no p-select) */
  get currentHouse() {
    return this.houseService.currentHouse();
  }

  set currentHouse(house: any) {
    if (house) {
      this.houseService.setActiveHouse(house.id);
    }
  }

  protected handleAction(): void {
    this.onAction.emit();
  }
}
