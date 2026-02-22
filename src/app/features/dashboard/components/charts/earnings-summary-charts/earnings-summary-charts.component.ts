import { Component, ChangeDetectionStrategy, input, computed, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UnifiedEarning } from '../../../../../models/airbnb.model';
import { Expense } from '../../../../../models/expense.model';
import { DialogComponent } from '../../../../../components/ui/dialog/dialog.component';
import { StackedBarChartComponent } from '../../../../../components/ui/charts/stacked-bar-chart/stacked-bar-chart.component';
import { GlobalColors } from '../../../../../shared/design/colors';
import { calculateEarningsChartData } from '../../../../../shared/utils/chart.utils';

@Component({
  selector: 'app-earnings-summary-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, DialogComponent, StackedBarChartComponent],
  templateUrl: './earnings-summary-charts.component.html',
})
export class EarningsSummaryChartsComponent {
  private translate = inject(TranslateService);

  protected readonly chartColors = [GlobalColors.revenue, GlobalColors.expense, GlobalColors.average];

  /** Visibility of the dialog */
  visible = model<boolean>(false);

  /** All payments to process for charts */
  payments = input.required<UnifiedEarning[]>();

  /** All expenses to process for charts */
  expenses = input.required<Expense[]>();

  /** Processed chart data */
  chartData = computed(() => {
    return calculateEarningsChartData(
      this.payments(),
      this.expenses(),
      this.translate
    );
  });
}
