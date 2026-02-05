import { NavItem } from '../../components/ui/types';

/**
 * Single source of truth for Dashboard Menu and Route definitions.
 * This decouples the menu structure from the route implementation,
 * allowing standard components to consume this config without circular dependencies.
 */
export const DASHBOARD_MENU_ITEMS: NavItem[] = [
  {
    id: 'csv-viewer',
    label: 'ACTIONS.VIEW_CSV',
    icon: 'pi-table',
    route: '/dashboard/csv-reports/viewer',
  },
  // {
  //   id: 'entries',
  //   label: 'TERMS.ENTRIES',
  //   icon: 'pi-download',
  //   route: '/dashboard/airbnb-payments',
  // },
  {
    id: 'expenses',
    label: 'TERMS.EXPENSES',
    icon: 'pi-arrow-up',
    route: '/dashboard/expenses',
  },
  // {
  //   id: 'earnings',
  //   label: 'TERMS.EARNINGS',
  //   icon: 'pi-dollar',
  //   route: '/dashboard/earnings',
  // },
  // {
  //   id: 'carne',
  //   label: 'TERMS.CARNE_LEAO',
  //   icon: 'pi-wallet',
  //   route: '/dashboard/carne-leao',
  // },
  // {
  //   id: 'tithe',
  //   label: 'TERMS.TITHE',
  //   icon: 'pi-heart',
  //   route: '/dashboard/tithe',
  // },
  // {
  //   id: 'contracts',
  //   label: 'TERMS.CONTRACTS',
  //   icon: 'pi-file-edit',
  //   route: '/dashboard/contracts',
  // },
  {
    id: 'charts',
    label: 'TERMS.CHARTS',
    icon: 'pi-chart-pie',
    route: '/dashboard/charts',
  },
  {
    id: 'reports',
    label: 'TERMS.REPORTS',
    icon: 'pi-chart-bar',
    route: '/dashboard/reports',
  },
  {
    id: 'suggestions',
    label: 'TERMS.SUGGESTIONS',
    icon: 'pi-comment',
    route: '/dashboard/suggestions',
  },
];
