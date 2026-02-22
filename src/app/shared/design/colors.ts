export interface AppColorConfig {
  host: string;
  coHost: string;
  pagamentos: string;
  damage: string;
  simulation: string;
}

export const AppColors: AppColorConfig = {
  host: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200',
  coHost: 'bg-orange-50 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  pagamentos: 'bg-orange-200 text-orange-950 dark:bg-orange-800 dark:text-orange-100',
  damage: 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200',
  simulation: 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
};

/**
 * Global semantic colors for the application.
 * Used for Charts, PDFs, and UI consistent styling.
 */
export const GlobalColors = {
  revenue: '#10b981',   // Green (Receitas) - emerald-500
  expense: '#f43f5e',   // Red (Gastos) - rose-500
  netIncome: '#3b82f6', // Blue (Ganhos) - blue-500
  average: '#d97706',   // Dark Orange (Média de lucro) - amber-600
};
