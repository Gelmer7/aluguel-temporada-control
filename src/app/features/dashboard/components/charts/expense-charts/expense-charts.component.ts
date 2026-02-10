import { Component, ChangeDetectionStrategy, input, computed, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { DialogComponent } from '../../../../../components/ui/dialog/dialog.component';
import { Expense } from '../../../../../services/supabase.service';
import { StackedBarChartComponent, StackedBarSeries } from '../../../../../components/ui/charts/stacked-bar-chart/stacked-bar-chart.component';

@Component({
  selector: 'app-expense-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, NgxEchartsDirective, DialogComponent, StackedBarChartComponent],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './expense-charts.component.html',
})
export class ExpenseChartsComponent {
  private translate = inject(TranslateService);

  /** Visibility of the dialog */
  visible = model<boolean>(false);

  /** All expenses to process for charts */
  expenses = input.required<Expense[]>();

  /** The year currently selected for the monthly chart */
  selectedYear = input<number | string>(new Date().getFullYear());

  /** The types of expenses currently selected */
  selectedTypes = input<string[]>([]);

  /** Chart 1: Distribution by Type (Pie Chart) */
  typeChartOption = computed(() => {
    const data = this.expenses();
    if (!data.length) return null;

    const typeTotals = data.reduce((acc, curr) => {
      const type = curr.type || 'OTHER';
      acc[type] = (acc[type] || 0) + (curr.price || 0);
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(typeTotals).map(([name, value]) => ({
      name: this.translate.instant(`EXPENSES_FORM.TYPES.${name}`),
      value
    }));

    return {
      title: {
        text: this.translate.instant('EXPENSE_CHARTS.DISTRIBUTION'),
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

  /** Chart 2: Monthly Expenses for Selected Year (Stacked Bar Chart) */
  monthlyChartData = computed(() => {
    const data = this.expenses();
    const year = this.selectedYear();
    if (!data.length) return null;

    // 1. Identificar todos os tipos presentes nos dados
    const types = Array.from(new Set(data.map(e => e.type || 'OTHER')));

    // 2. Inicializar estrutura para totais por tipo e por mês
    const typeMonthlyTotals: Record<string, number[]> = {};
    types.forEach(type => {
      typeMonthlyTotals[type] = Array(12).fill(0);
    });

    // 3. Preencher os dados
    const filteredData = year === 'ALL'
      ? data
      : data.filter(e => new Date(e.purchaseDate).getUTCFullYear() === Number(year));

    filteredData.forEach(e => {
      const month = new Date(e.purchaseDate).getUTCMonth();
      const type = e.type || 'OTHER';
      const amount = (e.price || 0) + (e.reserveFund || 0) + (e.association || 0);
      typeMonthlyTotals[type][month] += amount;
    });

    // 4. Criar as séries para o gráfico
    const series: StackedBarSeries[] = types.map(type => {
      const seriesData = typeMonthlyTotals[type];
      return {
        name: this.translate.instant(`EXPENSES_FORM.TYPES.${type}`),
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

  /** Chart 3: Annual Expenses (Line Chart) */
  annualChartOption = computed(() => {
    const data = this.expenses();
    const selectedTypes = this.selectedTypes();
    if (!data.length) return null;

    // Se nenhum tipo for passado (opcional), pegamos todos os tipos presentes nos dados
    const typesToShow = selectedTypes.length > 0
      ? selectedTypes
      : Array.from(new Set(data.map(e => e.type || 'OTHER')));

    // Agrupar por ano e tipo
    const annualTypeTotals = data.reduce((acc, curr) => {
      const year = new Date(curr.purchaseDate).getUTCFullYear();
      const type = curr.type || 'OTHER';

      if (!acc[year]) acc[year] = {};
      acc[year][type] = (acc[year][type] || 0) + (curr.price || 0);
      return acc;
    }, {} as Record<number, Record<string, number>>);

    const sortedYears = Object.keys(annualTypeTotals).map(Number).sort((a, b) => a - b);

    const series = typesToShow.map(type => {
      const chartData = sortedYears.map(year => annualTypeTotals[year][type] || 0);
      const typeLabel = this.translate.instant(`EXPENSES_FORM.TYPES.${type}`);

      return {
        name: typeLabel,
        data: chartData,
        type: 'line',
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3 }
      };
    });

    return {
      title: {
        text: this.translate.instant('EXPENSE_CHARTS.ANNUAL'),
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
