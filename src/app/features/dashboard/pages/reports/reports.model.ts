export interface FinancialMonth {
  gross: number;
  expenses: number;
  net: number;
}

export interface FinancialYear {
  year: number;
  months: FinancialMonth[]; // 0-11
  totalGross: number;
  totalExpenses: number;
  totalNet: number;
}

export interface FinancialSummary {
  totalGross: number;
  totalExpenses: number;
  totalNet: number;
  yearsCount: number;
}
