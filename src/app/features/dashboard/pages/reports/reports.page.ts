import { Component, ChangeDetectionStrategy, signal, inject, computed, OnInit, effect, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG
import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';

// Services & Models
import { SupabaseService, Expense } from '../../../../services/supabase.service';
import { HouseService } from '../../../../services/house.service';
import { HeaderService } from '../../../../services/header';
import { FinancialYear, FinancialSummary, FinancialMonth } from './reports.model';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    CardModule,
    TableModule,
    CheckboxModule,
    TagModule,
    SkeletonModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    TranslateModule,
    NgxEchartsDirective,
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './reports.page.html',
})
export class ReportsPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly houseService = inject(HouseService);
  private readonly headerService = inject(HeaderService);

  headerActions = viewChild<TemplateRef<any>>('headerActions');

  constructor() {
    // Reload data when house changes
    effect(() => {
      this.houseService.currentHouseCode();
      this.fetchData();
    });

    effect(() => {
      this.headerService.setHeader({
        title: 'TERMS.REPORTS',
        icon: 'pi-chart-bar',
        actions: this.headerActions()
      });
    });
  }

  protected readonly loading = signal<boolean>(true);
  protected readonly payments = signal<any[]>([]);
  protected readonly expenses = signal<Expense[]>([]);

  // Filtros de Visibilidade
  protected readonly showGross = signal<boolean>(true);
  protected readonly showExpenses = signal<boolean>(true);
  protected readonly showNet = signal<boolean>(true);

  private readonly translate = inject(TranslateService);

  protected readonly flattenedData = computed(() => {
    const years = this.yearlyData();
    const result: any[] = [];
    years.forEach(y => {
      y.months.forEach((m, i) => {
        result.push({
          ...m,
          year: y.year,
          monthIndex: i,
          yearTotalGross: y.totalGross,
          yearTotalExpenses: y.totalExpenses,
          yearTotalNet: y.totalNet
        });
      });
    });
    return result;
  });

  protected readonly colSpan = computed(() => {
    return 1 + (this.showGross() ? 1 : 0) + (this.showExpenses() ? 1 : 0) + (this.showNet() ? 1 : 0);
  });

  protected readonly yearlyData = computed<FinancialYear[]>(() => {
    const pays = this.payments();
    const exps = this.expenses();
    const yearMap = new Map<number, FinancialYear>();

    // Processar Ganhos
    pays.forEach(p => {
      const date = new Date(p.data);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const value = parseFloat(p.valor) || 0;

      if (!yearMap.has(year)) this.initYear(yearMap, year);
      const yearData = yearMap.get(year)!;
      yearData.months[month].gross += value;
      yearData.totalGross += value;
    });

    // Processar Gastos
    exps.forEach(e => {
      const date = new Date(e.purchaseDate);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();

      let amount = e.price || 0;
      // Lógica do sistema: para condomínio, somamos o fundo de reserva e associação ao valor base
      if (e.type === 'CONDOMINIUM') {
        amount += (e.reserveFund || 0);
        amount += (e.association || 0);
      }

      if (!yearMap.has(year)) this.initYear(yearMap, year);
      const yearData = yearMap.get(year)!;
      yearData.months[month].expenses += amount;
      yearData.totalExpenses += amount;
    });

    // Calcular Líquido e Totais
    yearMap.forEach(y => {
      y.months.forEach(m => {
        m.net = m.gross - m.expenses;
      });
      y.totalNet = y.totalGross - y.totalExpenses;
    });

    return Array.from(yearMap.values()).sort((a, b) => b.year - a.year);
  });

  protected readonly summary = computed<FinancialSummary>(() => {
    const data = this.yearlyData();
    return data.reduce((acc, curr) => ({
      totalGross: acc.totalGross + curr.totalGross,
      totalExpenses: acc.totalExpenses + curr.totalExpenses,
      totalNet: acc.totalNet + curr.totalNet,
      yearsCount: data.length
    }), { totalGross: 0, totalExpenses: 0, totalNet: 0, yearsCount: 0 });
  });

  protected readonly chartOptions = computed(() => {
    const data = [...this.yearlyData()].sort((a, b) => a.year - b.year);
    const series = [];

    if (this.showGross()) {
      series.push({
        name: this.translate.instant('REPORTS.GROSS'),
        type: 'bar',
        data: data.map(y => y.totalGross),
        itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] }
      });
    }

    if (this.showExpenses()) {
      series.push({
        name: this.translate.instant('REPORTS.EXPENSES'),
        type: 'bar',
        data: data.map(y => y.totalExpenses),
        itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] }
      });
    }

    if (this.showNet()) {
      series.push({
        name: this.translate.instant('REPORTS.NET'),
        type: 'bar',
        data: data.map(y => y.totalNet),
        itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }
      });
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: { color: '#4b5563' },
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '23%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(y => y.year.toString()),
        axisTick: { alignWithLabel: true },
        axisLabel: { color: '#6b7280' },
        axisLine: { lineStyle: { color: '#e5e7eb' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f3f4f6' } }
      },
      series
    };
  });

  ngOnInit() {
    this.fetchData();
  }

  private async fetchData() {
    this.loading.set(true);
    try {
      const [paysRes, expsRes] = await Promise.all([
        this.supabase.getAirbnbRecords(),
        this.supabase.getExpenses()
      ]);

      if (paysRes.data) this.payments.set(paysRes.data);
      if (expsRes.data) this.expenses.set(expsRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private initYear(map: Map<number, FinancialYear>, year: number) {
    map.set(year, {
      year,
      months: Array.from({ length: 12 }, () => ({ gross: 0, expenses: 0, net: 0 })),
      totalGross: 0,
      totalExpenses: 0,
      totalNet: 0
    });
  }
}
