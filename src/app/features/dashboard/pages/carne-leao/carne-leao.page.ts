import { Component, OnInit, inject, signal, computed, viewChild, TemplateRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';

// Custom Components
import { FilterContainerComponent } from '../../../../components/ui/filter-container/filter-container.component';

// Services
import { HeaderService } from '../../../../services/header';
import { IrTaxService, IrBracket } from '../../../../services/ir-tax.service';
import { SupabaseService } from '../../../../services/supabase.service';

// Models & Utils
import { UnifiedEarning } from '../../../../models/airbnb.model';
import { DateUtils, TAX_PAYMENT_MONTHS } from '../../../../shared/utils/date.utils';
import { Expense } from '../../../../models/expense.model';

interface HostData {
  id: string;
  name: string;
  airbnbPaid: number;
  condominium: {
    selected: boolean;
    value: number;
    extra: number;
  };
  deduction: number;
  calculationBase: number;
  carneLeao: number;
}

interface CarneLeaoEarning extends UnifiedEarning {
  selected: boolean;
}

@Component({
  selector: 'app-carne-leao-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    FloatLabelModule,
    ToastModule,
    TagModule,
    FilterContainerComponent
  ],
  providers: [MessageService],
  templateUrl: './carne-leao.page.html',
  host: {
    class: 'flex-1 flex flex-col min-h-0'
  }
})
export class CarneLeaoPage implements OnInit {
  private headerService = inject(HeaderService);
  private translateService = inject(TranslateService);
  private messageService = inject(MessageService);
  private irTaxService = inject(IrTaxService);
  private supabaseService = inject(SupabaseService);

  // Header Actions
  headerActions = viewChild.required<TemplateRef<any>>('headerActions');

  // Filters
  years = signal<number[]>([]);
  selectedYear = signal<number>(new Date().getFullYear());

  months = signal<{ label: string; value: number }[]>([]);
  selectedMonth = signal<number>(new Date().getMonth());

  simulationValue = signal<number | null>(null);
  iptuValue = signal<number | null>(null);

  // Earnings Data
  earnings = signal<CarneLeaoEarning[]>([]);

  totalEarnings = computed(() => {
    return this.earnings()
      .filter(e => e.selected)
      .reduce((acc, curr) => acc + curr.valor, 0);
  });

  // Condominium Expenses
  condominiumExpenses = signal<Expense[]>([]);

  // Tax Payment Data
  taxPaymentYears = signal<number[]>([2025, 2024]);
  taxPaymentMonths = TAX_PAYMENT_MONTHS;

  // Data
  hosts = signal<HostData[]>([
    {
      id: '1',
      name: 'Luiza',
      airbnbPaid: 2023.83,
      condominium: {
        selected: false,
        value: 224.77,
        extra: 64.26
      },
      deduction: 607.20,
      calculationBase: 0,
      carneLeao: 0
    },
    {
      id: '2',
      name: 'Gelmer',
      airbnbPaid: 0,
      condominium: {
        selected: false,
        value: 224.77,
        extra: 64.26
      },
      deduction: 607.20,
      calculationBase: 0,
      carneLeao: 0
    }
  ]);

  // IR Brackets Data
  irBrackets = signal<IrBracket[]>([]);
  clonedBrackets: { [s: string]: IrBracket } = {};

  constructor() {
     // Configura o header assim que o template estiver disponível
     effect(() => {
      const actions = this.headerActions();
      if (actions) {
        this.headerService.setHeader({
          title: 'TERMS.CARNE_LEAO',
          icon: 'pi-wallet',
          actions: actions
        });
      }
    });

    // Recarrega dados quando filtros mudam
    effect(() => {
      // Dependências
      this.selectedYear();
      this.selectedMonth();

      // Ações
      this.loadEarnings();
      this.loadIrBrackets();
      this.loadCondominiumExpenses();
    });
  }

  ngOnInit() {
    this.initFilters();
    // loadEarnings e loadIrBrackets serão chamados pelo effect
  }

  private initFilters() {
    // Init Years
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      yearsList.push(i);
    }
    this.years.set(yearsList);

    // Init Months
    const monthsList = [
      { label: 'MONTHS.0', value: 0 },
      { label: 'MONTHS.1', value: 1 },
      { label: 'MONTHS.2', value: 2 },
      { label: 'MONTHS.3', value: 3 },
      { label: 'MONTHS.4', value: 4 },
      { label: 'MONTHS.5', value: 5 },
      { label: 'MONTHS.6', value: 6 },
      { label: 'MONTHS.7', value: 7 },
      { label: 'MONTHS.8', value: 8 },
      { label: 'MONTHS.9', value: 9 },
      { label: 'MONTHS.10', value: 10 },
      { label: 'MONTHS.11', value: 11 },
    ];
    this.months.set(monthsList);
  }

  // Filter Summary Helpers
  protected getSelectedYearLabel(): string {
    return this.selectedYear().toString();
  }

  protected getSelectedMonthLabel(): string {
    const month = this.months().find(m => m.value === this.selectedMonth());
    return month ? month.label : '';
  }

  protected getSimulationLabel(): string {
    const val = this.simulationValue();
    return val !== null ? `R$ ${val.toFixed(2)}` : 'R$ 0,00';
  }

  protected getIptuLabel(): string {
    const val = this.iptuValue();
    return val !== null ? `R$ ${val.toFixed(2)}` : 'R$ 0,00';
  }

  clearFilters() {
    this.selectedYear.set(new Date().getFullYear());
    this.selectedMonth.set(new Date().getMonth());
    this.simulationValue.set(null);
    this.iptuValue.set(null);
    // loadIrBrackets and loadEarnings will be called by effect
  }

  async loadEarnings() {
    const { data } = await this.supabaseService.getUnifiedEarnings();
    if (data) {
      const selectedYear = this.selectedYear();
      const selectedMonth = this.selectedMonth();

      const filtered = data
        .filter(item => {
          const date = DateUtils.parseLocal(item.data);
          return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
        })
        .map(item => ({
          ...item,
          selected: true // Default to included
        }));

      this.earnings.set(filtered);
    }
  }

  updateEarnings() {
    this.earnings.update(e => [...e]);
  }

  async loadIrBrackets() {
    // Tenta carregar do banco de dados
    const brackets = await this.irTaxService.getBrackets(this.selectedYear());

    if (brackets && brackets.length > 0) {
      this.irBrackets.set(brackets);
    } else {
      // Fallback/Mock se não houver dados no banco ainda (para visualização imediata)
      this.irBrackets.set([
        { id: 1, min_value: 0, max_value: 2428.80, rate: 0, deduction: 0, year: 2026 },
        { id: 2, min_value: 2428.81, max_value: 2826.65, rate: 7.5, deduction: 182.16, year: 2026 },
        { id: 3, min_value: 2826.66, max_value: 3751.05, rate: 15, deduction: 394.16, year: 2026 },
        { id: 4, min_value: 3751.06, max_value: 4664.68, rate: 22.5, deduction: 675.49, year: 2026 },
        { id: 5, min_value: 4664.68, max_value: null, rate: 27.5, deduction: 908.73, year: 2026 },
      ]);
    }
  }

  async loadCondominiumExpenses() {
    const { data } = await this.supabaseService.getExpenses();
    if (data) {
      const selectedYear = this.selectedYear();
      const selectedMonth = this.selectedMonth();

      const filtered = data
        .filter(item => {
          const date = DateUtils.parseLocal(item.purchaseDate);
          return date.getFullYear() === selectedYear &&
                 date.getMonth() === selectedMonth &&
                 item.type === 'CONDOMINIUM';
        });

      this.condominiumExpenses.set(filtered);
    }
  }

  onPay(host: HostData) {
    // Implementar lógica de pagamento
  }

  // Row Editing Methods
  onRowEditInit(bracket: IrBracket) {
    // @ts-ignore
    this.clonedBrackets[bracket.id as number] = { ...bracket };
  }

  async onRowEditSave(bracket: IrBracket) {
    if (bracket.min_value >= 0) { // Validação básica
      try {
        // Se tiver ID real do banco, atualiza
        if (bracket.id && typeof bracket.id === 'number') { // Mock IDs might be treated differently if we were strict, but here we assume number
           // Chama o serviço para atualizar (se o usuário já tiver rodado o script SQL)
           // Se der erro (ex: tabela não existe), apenas atualiza localmente para demo
           try {
             await this.irTaxService.updateBracket(bracket);
             this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Tabela atualizada' });
           } catch (e) {
             console.warn('Backend update failed (table might not exist yet), updating local state only', e);
             this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Atualizado localmente (Banco de dados não conectado ou tabela inexistente)' });
           }
        }
        // @ts-ignore
        delete this.clonedBrackets[bracket.id as number];
      } catch (error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar' });
      }
    } else {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Valor inválido' });
    }
  }

  onRowEditCancel(bracket: IrBracket, index: number) {
    // @ts-ignore
    this.irBrackets()[index] = this.clonedBrackets[bracket.id as number];
    // @ts-ignore
    delete this.clonedBrackets[bracket.id as number];
  }
}
