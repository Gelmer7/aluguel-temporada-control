import { TranslateService } from '@ngx-translate/core';
import { UnifiedEarning } from '../../models/airbnb.model';
import { Expense } from '../../models/expense.model';
import { DateUtils } from './date.utils';
import { StackedBarSeries } from '../../components/ui/charts/stacked-bar-chart/stacked-bar-chart.component';

export function calculateEarningsChartData(
  paymentsData: UnifiedEarning[],
  expensesData: Expense[],
  translate: TranslateService
): { labels: string[], series: StackedBarSeries[], groups: string[] } | null {
  if (!paymentsData.length && !expensesData.length) return null;

  // 1. Group by Year and Month
  const monthlyData: Record<string, { income: number; expense: number }> = {};

  paymentsData.forEach((p) => {
    const date = DateUtils.parseLocal(p.data);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month.toString().padStart(2, '0')}`;

    if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
    monthlyData[key].income += (p.pago || 0);
  });

  expensesData.forEach((e) => {
    const date = DateUtils.parseLocal(e.purchaseDate);
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
    return translate.instant(`MONTHS.${month}`).substring(0, 3);
  });

  const years = sortedKeys.map((key) => key.split('-')[0]);

  // 4. Create series
  const incomeData = sortedKeys.map((key) => monthlyData[key].income);
  const expenseData = sortedKeys.map((key) => -Math.abs(monthlyData[key].expense));

  // Calculate Average Net Earnings (Income - Expenses)
  const netData = sortedKeys.map((key) => monthlyData[key].income - monthlyData[key].expense);
  const totalNet = netData.reduce((acc, curr) => acc + curr, 0);
  const averageNet = netData.length > 0 ? totalNet / netData.length : 0;
  const averageData = sortedKeys.map(() => averageNet);

  const formattedAverage = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageNet);

  const series: StackedBarSeries[] = [
    {
      name: translate.instant('TERMS.REVENUE'),
      data: incomeData,
    },
    {
      name: translate.instant('TERMS.EXPENSES'),
      data: expenseData,
    },
    {
      name: `${translate.instant('TERMS.AVERAGE_NET')}: ${formattedAverage}`,
      data: averageData,
      type: 'line'
    }
  ];

  return {
    labels,
    series,
    groups: years
  };
}
