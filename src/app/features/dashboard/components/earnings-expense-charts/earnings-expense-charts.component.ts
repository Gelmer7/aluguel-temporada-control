import { Component, ChangeDetectionStrategy, input, computed, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { Expense } from '../../../../services/supabase.service';
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';

@Component({
  selector: 'app-earnings-expense-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, NgxEchartsDirective, DialogComponent],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './earnings-expense-charts.component.html',
})
export class EarningsExpenseChartsComponent {
  private translate = inject(TranslateService);

  /** Visibility of the dialog */
  visible = model<boolean>(false);

  /** All expenses to process for charts */
  expenses = input.required<Expense[]>();

  /** Chart logic for Stacked Bar Chart (Timeline of Years and Months) */
  chartOption = computed(() => {
    const data = this.expenses();
    if (!data.length) return null;

    // 1. Group by Year and Month
    const monthlyData: Record<string, Record<string, number>> = {};
    const typesSet = new Set<string>();

    data.forEach((e) => {
      const date = new Date(e.purchaseDate);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      const type = e.type || 'OTHER';

      if (!monthlyData[key]) monthlyData[key] = {};
      monthlyData[key][type] = (monthlyData[key][type] || 0) + (e.price || 0);
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
    const series = types.map((type) => {
      return {
        name: type,
        type: 'bar',
        stack: 'total',
        data: sortedKeys.map((key) => monthlyData[key][type] || 0),
        emphasis: { focus: 'series' },
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const dataIndex = params[0].dataIndex;
          const fullKey = sortedKeys[dataIndex];
          const [year, monthStr] = fullKey.split('-');
          const month = parseInt(monthStr, 10);
          const monthName = this.translate.instant(`MONTHS.${month}`);

          let html = `<b>${monthName} ${year}</b><br/>`;
          let total = 0;
          params.forEach((p) => {
            if (p.value > 0) {
              html += `${p.marker} ${p.seriesName}: <b>R$ ${p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b><br/>`;
              total += p.value;
            }
          });
          html += `<hr style="margin: 5px 0; border: 0; border-top: 1px solid #eee;" />`;
          html += `Total: <b>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>`;
          return html;
        },
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        type: 'scroll',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: labels,
          axisLabel: {
            interval: 0,
            fontSize: 10
          },
          axisTick: { alignWithLabel: true }
        },
        {
          type: 'category',
          data: labels,
          gridIndex: 0,
          axisLine: { show: false },
          axisTick: {
            show: true,
            length: 40,
            lineStyle: { color: '#ddd', type: 'dashed' },
            interval: (index: number) => {
              if (index === 0) return true;
              return years[index] !== years[index - 1];
            }
          },
          axisLabel: {
            interval: 0,
            margin: 25,
            fontWeight: 'bold',
            fontSize: 12,
            formatter: (value: any, index: number) => {
              if (index === 0 || years[index] !== years[index - 1]) {
                return years[index];
              }
              return '';
            }
          }
        }
      ],
      yAxis: {
        type: 'value',
      },
      series: series,
    };
  });
}
