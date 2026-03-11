import { NavItem } from '../../components/ui/types';

/**
 * Single source of truth for Dashboard Menu and Route definitions.
 * This decouples the menu structure from the route implementation,
 * allowing standard components to consume this config without circular dependencies.
 */
export const DASHBOARD_MENU_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'TERMS.HOME',
    icon: 'pi-home',
    route: '/dashboard/home',
  },
  {
    id: 'csv-viewer',
    label: 'ACTIONS.VIEW_CSV',
    icon: '',
    image: 'airbnb_rose.svg',
    imageClass: 'dark:brightness-100',
    route: '/dashboard/csv-reports/viewer',
    items: [
      {
        id: 'payouts-reservas',
        label: 'Payouts / Reservas',
        icon: 'pi-calendar-clock',
        route: '/dashboard/payouts-reservas',
      },
      {
        id: 'feedback-analytics',
        label: 'Análise de Feedback',
        icon: 'pi-chart-pie',
        route: '/dashboard/feedback-analytics',
      },
    ],
  },
  {
    id: 'manual-rentals',
    label: 'TERMS.MANUAL_RENTALS',
    icon: 'pi-warehouse',
    route: '/dashboard/manual-rentals',
  },
  {
    id: 'revenue',
    label: 'TERMS.REVENUE',
    icon: 'pi-arrow-down text-revenue',
    route: '/dashboard/revenue',
  },
  {
    id: 'expenses',
    label: 'TERMS.EXPENSES',
    icon: 'pi-arrow-up text-expense',
    route: '/dashboard/expenses',
  },
  {
    id: 'earnings',
    label: 'TERMS.EARNINGS',
    icon: 'pi-dollar text-net-income',
    route: '/dashboard/earnings',
  },
  {
    id: 'carne',
    label: 'TERMS.CARNE_LEAO',
    icon: 'pi-wallet',
    route: '/dashboard/carne-leao',
  },
  {
    id: 'tithe',
    label: 'TERMS.TITHE',
    icon: 'pi-heart',
    route: '/dashboard/tithe',
  },
  {
    id: 'contracts',
    label: 'TERMS.CONTRACTS',
    icon: 'pi-file-edit',
    route: '/dashboard/contracts',
  },

  {
    id: 'reports',
    label: 'TERMS.REPORTS',
    icon: 'pi-file',
    route: '/dashboard/reports',
  },
  {
    id: 'suggestions',
    label: 'TERMS.SUGGESTIONS',
    icon: 'pi-comment',
    route: '/dashboard/suggestions',
  },
  {
    id: 'reminders',
    label: 'TERMS.REMINDERS',
    icon: 'pi-bell',
    route: '/dashboard/reminders',
  },
  {
    id: 'links',
    label: 'TERMS.LINKS',
    icon: 'pi-external-link',
    route: '/dashboard/links',
  },
  {
    id: 'Site',
    label: 'Ver Site',
    icon: 'pi-globe',
    route: '/',
  }
];
