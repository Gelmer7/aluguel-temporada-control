import { Routes } from '@angular/router';
import { DashboardLayoutPage } from './layout/dashboard-layout/dashboard-layout.page';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'airbnb-payments' },

      {
        path: 'csv-reports/upload',
        loadComponent: () =>
          import('./pages/upload-csv/upload-csv.page').then((m) => m.UploadCsvPage),
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
        path: 'csv-reports',
        loadComponent: () =>
          import('./pages/csv-reports/csv-reports.page').then((m) => m.CsvReportsPage),
      },
      {
        path: 'expenses',
        loadComponent: () => import('./pages/expenses/expenses.page').then((m) => m.ExpensesPage),
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
        path: 'charts',
        loadComponent: () => import('./pages/charts/charts.page').then((m) => m.ChartsPage),
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
        path: 'suggestions',
        loadComponent: () =>
          import('./pages/suggestions/suggestions.page').then((m) => m.SuggestionsPage),
      },
    ],
  },
];
