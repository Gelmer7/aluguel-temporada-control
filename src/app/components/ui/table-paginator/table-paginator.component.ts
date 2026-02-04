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
})
export class TablePaginatorComponent {
  @Input() first: number = 0;
  @Input() rows: number = 20;
  @Input() totalRecords: number = 0;
  @Input() pageLinkSize: number = 2;
  @Input() rowsPerPageOptions: number[] = [10, 20, 50, 100];
  @Input() currentPageReportTemplate: string = '{first} a {last} de {totalRecords}';

  @Output() onPageChange = new EventEmitter<PaginatorState>();
}
