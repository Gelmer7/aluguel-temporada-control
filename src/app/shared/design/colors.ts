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
