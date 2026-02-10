import { Component, ChangeDetectionStrategy, inject, viewChild, TemplateRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Button, ButtonModule } from 'primeng/button';
import { Tooltip, TooltipModule } from 'primeng/tooltip';
import { HeaderService } from '../../../../services/header';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule, TooltipModule],
  templateUrl: './home.page.html',
})
export class HomePage {
  private headerService = inject(HeaderService);
  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  constructor() {
    effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'Home',
          icon: 'pi-home',
          actions: actions,
        });
      }
    });
  }

  onRefresh() {
    // Lógica para atualizar os dados da home
    console.log('Refreshing home data...');
  }
}
