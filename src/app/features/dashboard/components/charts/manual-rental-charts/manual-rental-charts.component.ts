import { Component, ChangeDetectionStrategy, input, computed, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { DialogComponent } from '../../../../../components/ui/dialog/dialog.component';
import { ManualRental } from '../../../../../models/airbnb.model';
import { StackedBarChartComponent, StackedBarSeries } from '../../../../../components/ui/charts/stacked-bar-chart/stacked-bar-chart.component';
import { DateUtils } from '../../../../../shared/utils/date.utils';

@Component({
  selector: 'app-manual-rental-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, NgxEchartsDirective, DialogComponent, StackedBarChartComponent],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './manual-rental-charts.component.html',
})
export class ManualRentalChartsComponent {
  private translate = inject(TranslateService);

  /** Visibility of the dialog */
  visible = model<boolean>(false);

  /** All rentals to process for charts */
  rentals = input.required<ManualRental[]>();

  /** The year currently selected for the monthly chart */
  selectedYear = input<number | string>(new Date().getFullYear());

  /** Chart 1: Distribution by House (Pie Chart) */
  houseChartOption = computed(() => {
    const data = this.rentals();
    if (!data.length) return null;

    const houseTotals = data.reduce((acc, curr) => {
      const house = curr.anuncio || 'OTHER';
      acc[house] = (acc[house] || 0) + (curr.valor_pago || 0);
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(houseTotals).map(([name, value]) => ({
      name,
      value
    }));

    return {
      title: {
        text: this.translate.instant('MANUAL_RENTALS_FORM.CHARTS.DISTRIBUTION_AD'),
        left: 'center',
        textStyle: { fontSize: 14, color: '#4b5563' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}: <b>R$ ${params.value.toFixed(2)}</b> (${params.percent}%)`;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        textStyle: { fontSize: 10 }
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            }
          },
          data: chartData
        }
      ]
    };
  });

  /** Chart 2: Monthly Rentals for Selected Year (Stacked Bar Chart) */
  monthlyChartData = computed(() => {
    const data = this.rentals();
    const year = this.selectedYear();
    if (!data.length) return null;

    // 1. Identify all houses present in the data
    const houses = Array.from(new Set(data.map(r => r.anuncio || 'OTHER')));

    // 2. Initialize structure for totals by house and by month
    const houseMonthlyTotals: Record<string, number[]> = {};
    houses.forEach(house => {
      houseMonthlyTotals[house] = Array(12).fill(0);
    });

    // 3. Fill the data
    const filteredData = year === 'ALL'
      ? data
      : data.filter(r => DateUtils.parseLocal(r.data_pagamento).getFullYear() === Number(year));

    filteredData.forEach(r => {
      const month = DateUtils.parseLocal(r.data_pagamento).getMonth();
      const house = r.anuncio || 'OTHER';
      const amount = r.valor_pago || 0;
      houseMonthlyTotals[house][month] += amount;
    });

    // 4. Create series for the chart
    const series: StackedBarSeries[] = houses.map(house => {
      const seriesData = houseMonthlyTotals[house];
      return {
        name: house,
        data: seriesData,
      };
    });

    if (series.length === 0 || series.every(s => s.data.every(v => v === 0))) {
      return null;
    }

    const labels = Array.from({ length: 12 }, (_, i) => this.translate.instant(`MONTHS.${i}`).substring(0, 3));
    const groups = Array(12).fill(year === 'ALL' ? '' : year.toString());

    return {
      series,
      labels,
      groups
    };
  });

  /** Chart 3: Annual Rentals (Line Chart) */
  annualChartOption = computed(() => {
    const data = this.rentals();
    if (!data.length) return null;

    // Group by year and house
    const annualHouseTotals = data.reduce((acc, curr) => {
      const year = DateUtils.parseLocal(curr.data_pagamento).getFullYear();
      const house = curr.anuncio || 'OTHER';

      if (!acc[year]) acc[year] = {};
      acc[year][house] = (acc[year][house] || 0) + (curr.valor_pago || 0);
      return acc;
    }, {} as Record<number, Record<string, number>>);

    const sortedYears = Object.keys(annualHouseTotals).map(Number).sort((a, b) => a - b);
    const houses = Array.from(new Set(data.map(r => r.anuncio || 'OTHER')));

    const series = houses.map(house => {
      const chartData = sortedYears.map(year => annualHouseTotals[year][house] || 0);

      return {
        name: house,
        data: chartData,
        type: 'line',
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3 }
      };
    });

    return {
      title: {
        text: this.translate.instant('MANUAL_RENTALS_FORM.CHARTS.EVOLUTION'),
        left: 'center',
        textStyle: { fontSize: 14, color: '#4b5563' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          let html = `${params[0].name}<br/>`;
          params.forEach(p => {
            html += `${p.marker} ${p.seriesName}: <b>R$ ${p.value.toFixed(2)}</b><br/>`;
          });
          return html;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        textStyle: { fontSize: 10 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: sortedYears.map(String),
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 }
      },
      series: series
    };
  });
}
