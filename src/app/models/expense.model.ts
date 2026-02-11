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
}

export const EXPENSE_TYPES: ExpenseTypeOption[] = [
  { label: 'EXPENSES_FORM.TYPES.ELECTRICITY', value: 'ELECTRICITY', icon: 'pi pi-bolt' },
  { label: 'EXPENSES_FORM.TYPES.WATER', value: 'WATER', icon: 'pi pi-tint' },
  { label: 'EXPENSES_FORM.TYPES.CONDOMINIUM', value: 'CONDOMINIUM', icon: 'pi pi-building' },
  { label: 'EXPENSES_FORM.TYPES.INTERNET', value: 'INTERNET', icon: 'pi pi-wifi' },
  { label: 'EXPENSES_FORM.TYPES.GAS', value: 'GAS', icon: 'pi pi-fire' },
  { label: 'EXPENSES_FORM.TYPES.MAINTENANCE', value: 'MAINTENANCE', icon: 'pi pi-wrench' },
  { label: 'EXPENSES_FORM.TYPES.CLEANING', value: 'CLEANING', icon: 'pi pi-trash' },
  { label: 'EXPENSES_FORM.TYPES.CARNE_LEAO', value: 'CARNE_LEAO', icon: 'pi pi-percentage' },
  { label: 'EXPENSES_FORM.TYPES.OTHER', value: 'OTHER', icon: 'pi pi-box' }
];

export const QUICK_EXPENSE_TYPES: ExpenseTypeOption[] = [
  { label: 'EXPENSES_FORM.TYPES.ELECTRICITY', value: 'ELECTRICITY', description: 'EXPENSES_FORM.TYPES.ELECTRICITY', icon: 'pi pi-bolt' },
  { label: 'EXPENSES_FORM.TYPES.WATER', value: 'WATER', description: 'EXPENSES_FORM.TYPES.WATER', icon: 'pi pi-tint' },
  { label: 'EXPENSES_FORM.TYPES.CONDOMINIUM', value: 'CONDOMINIUM', description: 'EXPENSES_FORM.TYPES.CONDOMINIUM', icon: 'pi pi-building' },
  { label: 'EXPENSES_FORM.TYPES.INTERNET', value: 'INTERNET', description: 'EXPENSES_FORM.TYPES.INTERNET', icon: 'pi pi-wifi' },
];
