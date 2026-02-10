import { Routes } from '@angular/router';
import { DashboardLayoutPage } from './layout/dashboard-layout/dashboard-layout.page';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },

      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'csv-reports/viewer',
        loadComponent: () =>
          import('./pages/csv-viewer/csv-viewer.page').then((m) => m.CsvViewerPage),
      },
      {
        path: 'airbnb-payments',
        loadComponent: () =>
          import('./pages/airbnb-payments/airbnb-payments.page').then((m) => m.AirbnbPaymentsPage),
      },
      {
        path: 'expenses',
        loadComponent: () => import('./pages/expenses/expenses.page').then((m) => m.ExpensesPage),
      },
      {
        path: 'manual-rentals',
        loadComponent: () => import('./pages/manual-rentals/manual-rentals.page').then((m) => m.ManualRentalsPage),
      },
      {
        path: 'earnings',
        loadComponent: () => import('./pages/earnings/earnings.page').then((m) => m.EarningsPage),
      },
      {
        path: 'carne-leao',
        loadComponent: () =>
          import('./pages/carne-leao/carne-leao.page').then((m) => m.CarneLeaoPage),
      },
      {
        path: 'tithe',
        loadComponent: () => import('./pages/tithe/tithe.page').then((m) => m.TithePage),
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./pages/contracts/contracts.page').then((m) => m.ContractsPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'data-management',
        loadComponent: () =>
          import('./pages/data-management/data-management.page').then((m) => m.DataManagementPage),
      },
      {
        path: 'color-settings',
        loadComponent: () =>
          import('./pages/color-settings/color-settings.page').then((m) => m.ColorSettingsPage),
      },
      {
        path: 'suggestions',
        loadComponent: () =>
          import('./pages/suggestions/suggestions.page').then((m) => m.SuggestionsPage),
      },
      {
        path: 'reminders',
        loadComponent: () =>
          import('./pages/reminders/reminders.page').then((m) => m.RemindersPage),
      },
    ],
  },
];
