import { Component, ChangeDetectionStrategy, input, computed, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UnifiedEarning } from '../../../../../models/airbnb.model';
import { Expense } from '../../../../../models/expense.model';
import { DialogComponent } from '../../../../../components/ui/dialog/dialog.component';
import { StackedBarChartComponent, StackedBarSeries } from '../../../../../components/ui/charts/stacked-bar-chart/stacked-bar-chart.component';

@Component({
  selector: 'app-earnings-summary-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, DialogComponent, StackedBarChartComponent],
  templateUrl: './earnings-summary-charts.component.html',
})
export class EarningsSummaryChartsComponent {
  private translate = inject(TranslateService);

  /** Visibility of the dialog */
  visible = model<boolean>(false);

  /** All payments to process for charts */
  payments = input.required<UnifiedEarning[]>();

  /** All expenses to process for charts */
  expenses = input.required<Expense[]>();

  /** Processed chart data */
  chartData = computed(() => {
    const paymentsData = this.payments();
    const expensesData = this.expenses();

    if (!paymentsData.length && !expensesData.length) return null;

    // 1. Group by Year and Month
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    paymentsData.forEach((p) => {
      const date = new Date(p.data);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      monthlyData[key].income += (p.valor || 0);
    });

    expensesData.forEach((e) => {
      const date = new Date(e.purchaseDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      monthlyData[key].expense += (e.price || 0);
    });

    // 2. Sort timeline
    const sortedKeys = Object.keys(monthlyData).sort();

    // 3. Prepare labels and year markers
    const labels = sortedKeys.map((key) => {
      const [year, monthStr] = key.split('-');
      const month = parseInt(monthStr, 10);
      return this.translate.instant(`MONTHS.${month}`).substring(0, 3);
    });

    const years = sortedKeys.map((key) => key.split('-')[0]);

    // 4. Create series
    const series: StackedBarSeries[] = [
      {
        name: this.translate.instant('TERMS.EARNINGS'),
        data: sortedKeys.map((key) => monthlyData[key].income),
      },
      {
        name: this.translate.instant('TERMS.EXPENSES'),
        data: sortedKeys.map((key) => -Math.abs(monthlyData[key].expense)),
      }
    ];

    return {
      labels,
      years,
      series
    };
  });
}
