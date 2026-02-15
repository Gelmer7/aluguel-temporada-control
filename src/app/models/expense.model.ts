export type ExpenseTypeValue = 'ELECTRICITY' | 'WATER' | 'CONDOMINIUM' | 'INTERNET' | 'GAS' | 'MAINTENANCE' | 'CLEANING' | 'CARNE_LEAO' | 'OTHER';

export interface Expense {
  id: string;
  price: number;
  description: string;
  observation?: string;
  type: ExpenseTypeValue | string;
  purchaseDate: string;
  cubicMeters?: number;
  reserveFund?: number;
  association?: number;
  kws?: number;
  createDate?: string;
  house_code?: string;
  createUser?: string;
}

export interface ExpenseTypeOption {
  label: string;
  value: ExpenseTypeValue;
  icon?: string;
  description?: string;
  severity?: 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';
}

export const EXPENSE_TYPES: ExpenseTypeOption[] = [
  { label: 'EXPENSES_FORM.TYPES.ELECTRICITY', value: 'ELECTRICITY', icon: 'pi pi-bolt', severity: 'warn' },
  { label: 'EXPENSES_FORM.TYPES.WATER', value: 'WATER', icon: 'pi pi-tint', severity: 'info' },
  { label: 'EXPENSES_FORM.TYPES.CONDOMINIUM', value: 'CONDOMINIUM', icon: 'pi pi-building', severity: 'success' },
  { label: 'EXPENSES_FORM.TYPES.INTERNET', value: 'INTERNET', icon: 'pi pi-wifi', severity: 'secondary' },
  { label: 'EXPENSES_FORM.TYPES.GAS', value: 'GAS', icon: 'pi pi-fire', severity: 'warn' },
  { label: 'EXPENSES_FORM.TYPES.MAINTENANCE', value: 'MAINTENANCE', icon: 'pi pi-wrench', severity: 'danger' },
  { label: 'EXPENSES_FORM.TYPES.CLEANING', value: 'CLEANING', icon: 'pi pi-trash', severity: 'info' },
  { label: 'EXPENSES_FORM.TYPES.CARNE_LEAO', value: 'CARNE_LEAO', icon: 'pi pi-percentage', severity: 'danger' },
  { label: 'EXPENSES_FORM.TYPES.OTHER', value: 'OTHER', icon: 'pi pi-box', severity: 'secondary' }
];

export const getExpenseTypeConfig = (type: string | ExpenseTypeValue): ExpenseTypeOption | undefined => {
  return EXPENSE_TYPES.find(t => t.value === type);
};

export const QUICK_EXPENSE_TYPES: ExpenseTypeOption[] = [
  { label: 'EXPENSES_FORM.TYPES.ELECTRICITY', value: 'ELECTRICITY', description: 'EXPENSES_FORM.TYPES.ELECTRICITY', icon: 'pi pi-bolt' },
  { label: 'EXPENSES_FORM.TYPES.WATER', value: 'WATER', description: 'EXPENSES_FORM.TYPES.WATER', icon: 'pi pi-tint' },
  { label: 'EXPENSES_FORM.TYPES.CONDOMINIUM', value: 'CONDOMINIUM', description: 'EXPENSES_FORM.TYPES.CONDOMINIUM', icon: 'pi pi-building' },
  { label: 'EXPENSES_FORM.TYPES.INTERNET', value: 'INTERNET', description: 'EXPENSES_FORM.TYPES.INTERNET', icon: 'pi pi-wifi' },
];
