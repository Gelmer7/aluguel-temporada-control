import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

/**
 * Componente reutilizável de paginação para tabelas.
 * Segue os padrões do sistema e utiliza PrimeNG Paginator.
 */
@Component({
  selector: 'app-table-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaginatorModule],
  templateUrl: './table-paginator.component.html',
  styles: [`
    :host ::ng-deep .p-paginator {
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    :host ::ng-deep .p-paginator .p-paginator-pages .p-paginator-page,
    :host ::ng-deep .p-paginator .p-paginator-first,
    :host ::ng-deep .p-paginator .p-paginator-prev,
    :host ::ng-deep .p-paginator .p-paginator-next,
    :host ::ng-deep .p-paginator .p-paginator-last {
      min-width: 2rem;
      height: 2rem;
      font-size: 0.875rem;
    }
    :host ::ng-deep .p-paginator .p-paginator-current {
      font-size: 0.75rem;
      padding: 0 0.5rem;
      height: auto;
      order: -1;
      width: 100%;
      text-align: center;
    }
    :host ::ng-deep .p-select {
      height: 2rem;
    }
    :host ::ng-deep .p-select .p-select-label {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }

    @media (min-width: 640px) {
      :host ::ng-deep .p-paginator .p-paginator-current {
        width: auto;
        order: 0;
      }
    }
  `]
})
export class TablePaginatorComponent {
  @Input() first: number = 0;
  @Input() rows: number = 10;
  @Input() totalRecords: number = 0;
  @Input() rowsPerPageOptions: number[] = [10, 25, 50];
  @Input() currentPageReportTemplate: string = '{first} a {last} de {totalRecords} registros';

  @Output() onPageChange = new EventEmitter<PaginatorState>();
}
