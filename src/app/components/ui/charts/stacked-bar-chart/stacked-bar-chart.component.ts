import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { TranslateModule } from '@ngx-translate/core';

export interface StackedBarSeries {
  name: string;
  data: number[];
}

@Component({
  selector: 'app-stacked-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgxEchartsDirective, TranslateModule],
  template: `
    <div class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-x-auto">
      <div [style.height]="height()" [style.min-width]="minWidth()">
        @if (chartOption()) {
          <div echarts [options]="chartOption()!" class="w-full h-full"></div>
        }
      </div>
    </div>
  `,
})
export class StackedBarChartComponent {
  /** Series data for the chart */
  series = input.required<StackedBarSeries[]>();

  /** Labels for the primary X-axis (e.g., Months) */
  labels = input.required<string[]>();

  /** Labels for the secondary X-axis (e.g., Years) for grouping */
  groups = input<string[]>([]);

  /** Height of the chart */
  height = input<string>('500px');

  /** Minimum width to ensure horizontal scroll on small screens */
  minWidth = input<string>('800px');

  /** Show currency in tooltip */
  isCurrency = input<boolean>(true);

  /** Currency code for tooltip formatting */
  currencyCode = input<string>('BRL');

  /** Currency symbol for tooltip formatting */
  currencySymbol = input<string>('R$');

  /** Locale for number formatting */
  locale = input<string>('pt-BR');

  /** Custom colors for the series */
  colors = input<string[]>([]);

  /** Default ECharts 5 color palette to ensure visibility */
  private readonly defaultPalette = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#37A2DA',
    '#32C5E9', '#67E0E3', '#9FE6B8', '#FFDB5C', '#ff9f7f'
  ];

  chartOption = computed(() => {
    const seriesData = this.series();
    const labels = this.labels();
    const groups = this.groups();
    const inputColors = this.colors();
    const isCurrency = this.isCurrency();
    const currencySymbol = this.currencySymbol();
    const locale = this.locale();

    if (!seriesData || seriesData.length === 0 || !labels || labels.length === 0) return null;

    // Use input colors if provided, otherwise fallback to default palette
    const colors = inputColors.length > 0 ? inputColors : this.defaultPalette;

    const formattedSeries = seriesData.map((s, index) => ({
      name: s.name,
      type: 'bar',
      stack: 'total',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: s.data,
      emphasis: { focus: 'series' },
      barMaxWidth: 50,
      itemStyle: {
        color: colors[index % colors.length],
        borderRadius: [2, 2, 0, 0],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        opacity: 1
      },
      z: 3
    }));

    return {
      color: colors,
      animation: true,
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const dataIndex = params[0].dataIndex;
          const label = labels[dataIndex];
          const group = groups.length > 0 ? groups[dataIndex] : '';

          let html = `<b>${label} ${group}</b><br/>`;
          let total = 0;
          params.forEach((p) => {
            if (p.value > 0) {
              const valueFormatted = isCurrency
                ? `${currencySymbol} ${p.value.toLocaleString(locale, { minimumFractionDigits: 2 })}`
                : p.value.toLocaleString(locale);

              html += `${p.marker} ${p.seriesName}: <b>${valueFormatted}</b><br/>`;
              total += p.value;
            }
          });
          html += `<hr style="margin: 5px 0; border: 0; border-top: 1px solid #eee;" />`;

          const totalFormatted = isCurrency
            ? `${currencySymbol} ${total.toLocaleString(locale, { minimumFractionDigits: 2 })}`
            : total.toLocaleString(locale);

          html += `Total: <b>${totalFormatted}</b>`;
          return html;
        },
      },
      legend: {
        show: true,
        orient: 'horizontal',
        bottom: 0,
        type: 'scroll',
        itemWidth: 15,
        itemHeight: 15,
        textStyle: {
          fontSize: 12
        }
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
            interval: 'auto',
            rotate: labels.length > 24 ? 45 : 0,
            fontSize: 10
          },
          axisTick: { alignWithLabel: true }
        },
        ...(groups.length > 0 ? [{
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
              return groups[index] !== groups[index - 1];
            }
          },
          axisLabel: {
            interval: 0,
            margin: 25,
            fontWeight: 'bold',
            fontSize: 12,
            formatter: (value: any, index: number) => {
              if (index === 0 || groups[index] !== groups[index - 1]) {
                return groups[index];
              }
              return '';
            }
          }
        }] : [])
      ],
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value === 0) return '0';

            const absValue = Math.abs(value);
            let formatted = '';

            if (absValue >= 1000000) {
              formatted = (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            } else if (absValue >= 1000) {
              formatted = (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            } else {
              formatted = value.toLocaleString(locale);
            }

            return isCurrency ? `${currencySymbol} ${formatted}` : formatted;
          }
        }
      },
      series: formattedSeries,
    };
  });
}
