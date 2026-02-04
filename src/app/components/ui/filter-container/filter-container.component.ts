import { Component, ChangeDetectionStrategy, signal, input, contentChild, TemplateRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-filter-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AccordionModule],
  templateUrl: './filter-container.component.html',
})
export class FilterContainerComponent {
  /**
   * Identificador do painel (padrão '0')
   */
  value = input<string>('0');

  /**
   * Se o painel deve começar expandido
   */
  expanded = input<boolean>(true);

  /**
   * Estado interno de expansão do accordion
   */
  protected readonly filtersExpanded = signal<any>('0');

  /**
   * Verifica se o painel está colapsado
   */
  protected readonly isFiltersCollapsed = computed(() => {
    const val = this.filtersExpanded();
    if (Array.isArray(val)) return val.length === 0;
    return val !== '0';
  });

  /**
   * Template opcional para exibir informações quando colapsado
   */
  filterSummaryTemplate = contentChild<TemplateRef<any>>('filterSummary');

  constructor() {
    // Inicializa o estado de expansão baseado no input 'expanded'
    if (!this.expanded()) {
      this.filtersExpanded.set(undefined);
    }
  }
}
