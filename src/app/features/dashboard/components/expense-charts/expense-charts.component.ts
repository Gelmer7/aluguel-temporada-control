import { Component, ChangeDetectionStrategy, input, computed, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { Expense } from '../../../../services/supabase.service';
import { DialogComponent } from '../../../../components/ui/dialog/dialog.component';

@Component({
  selector: 'app-expense-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, NgxEchartsDirective, DialogComponent],
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
        formatter: '{b}: R$ {c} ({d}%)'
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

  /** Chart 2: Monthly Expenses for Selected Year (Bar Chart) */
  monthlyChartOption = computed(() => {
    const data = this.expenses();
    const year = this.selectedYear();
    if (!data.length) return null;

    const monthlyTotals = Array(12).fill(0);

    if (year === 'ALL') {
      // Se "TODOS" estiver selecionado, somamos todos os meses de todos os anos disponíveis nos dados filtrados
      data.forEach(e => {
        const month = new Date(e.purchase_date).getUTCMonth();
        monthlyTotals[month] += (e.price || 0);
      });
    } else {
      // Se um ano específico estiver selecionado, filtramos apenas por esse ano
      data.filter(e => new Date(e.purchase_date).getUTCFullYear() === Number(year))
          .forEach(e => {
            const month = new Date(e.purchase_date).getUTCMonth();
            monthlyTotals[month] += (e.price || 0);
          });
    }

    const titleText = year === 'ALL'
      ? this.translate.instant('EXPENSE_CHARTS.MONTHLY_ALL')
      : this.translate.instant('EXPENSE_CHARTS.MONTHLY', { year });

    return {
      title: {
        text: titleText,
        left: 'center',
        textStyle: { fontSize: 14, color: '#4b5563' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}: <b>R$ ${p.value.toFixed(2)}</b>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 12 }, (_, i) => this.translate.instant(`MONTHS.${i}`).substring(0, 3)),
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 }
      },
      series: [
        {
          data: monthlyTotals,
          type: 'bar',
          itemStyle: {
            color: '#6366f1',
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  });

  /** Chart 3: Annual Expenses (Line Chart) */
  annualChartOption = computed(() => {
    const data = this.expenses();
    if (!data.length) return null;

    const annualTotals = data.reduce((acc, curr) => {
      const year = new Date(curr.purchase_date).getUTCFullYear();
      acc[year] = (acc[year] || 0) + (curr.price || 0);
      return acc;
    }, {} as Record<number, number>);

    const sortedYears = Object.keys(annualTotals).map(Number).sort((a, b) => a - b);
    const chartData = sortedYears.map(year => annualTotals[year]);

    return {
      title: {
        text: this.translate.instant('EXPENSE_CHARTS.ANNUAL'),
        left: 'center',
        textStyle: { fontSize: 14, color: '#4b5563' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}: <b>R$ ${p.value.toFixed(2)}</b>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
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
      series: [
        {
          data: chartData,
          type: 'line',
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3, color: '#10b981' },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' }
            ])
          }
        }
      ]
    };
  });
}
