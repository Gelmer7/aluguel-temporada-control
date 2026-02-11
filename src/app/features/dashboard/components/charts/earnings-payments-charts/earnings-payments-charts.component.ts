import { Component, ChangeDetectionStrategy, input, computed, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UnifiedEarning } from '../../../../../models/airbnb.model';
import { DialogComponent } from '../../../../../components/ui/dialog/dialog.component';
import { StackedBarChartComponent, StackedBarSeries } from '../../../../../components/ui/charts/stacked-bar-chart/stacked-bar-chart.component';

@Component({
  selector: 'app-earnings-payments-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, DialogComponent, StackedBarChartComponent],
  templateUrl: './earnings-payments-charts.component.html',
})
export class EarningsPaymentsChartsComponent {
  private translate = inject(TranslateService);

  /** Visibility of the dialog */
  visible = model<boolean>(false);

  /** All payments to process for charts */
  payments = input.required<UnifiedEarning[]>();

  /** Processed chart data */
  chartData = computed(() => {
    const data = this.payments();
    if (!data.length) return null;

    // 1. Group by Year and Month
    const monthlyData: Record<string, Record<string, number>> = {};
    const typesSet = new Set<string>();

    data.forEach((p) => {
      const date = new Date(p.data);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      const type = p.tipo || 'OTHER';

      if (!monthlyData[key]) monthlyData[key] = {};
      monthlyData[key][type] = (monthlyData[key][type] || 0) + (p.valor || 0);
      typesSet.add(type);
    });

    // 2. Sort timeline
    const sortedKeys = Object.keys(monthlyData).sort();
    const types = Array.from(typesSet).sort();

    // 3. Prepare labels and year markers
    const labels = sortedKeys.map((key) => {
      const [year, monthStr] = key.split('-');
      const month = parseInt(monthStr, 10);
      return this.translate.instant(`MONTHS.${month}`).substring(0, 3);
    });

    const years = sortedKeys.map((key) => key.split('-')[0]);

    // 4. Create series
    const series: StackedBarSeries[] = types.map((type) => {
      const seriesData = sortedKeys.map((key) => monthlyData[key][type] || 0);
      return {
        name: type,
        data: seriesData,
      };
    });

    if (series.length === 0 || series.every(s => s.data.every(v => v === 0))) {
      return null;
    }

    return {
      labels,
      years,
      series
    };
  });
}
