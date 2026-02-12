/**
 * Item de navegação utilizado no menu lateral.
 */
export interface NavItem {
  /** Identificador único para trackBy. */
  id: string;
  /** Rótulo apresentado quando o menu não está colapsado. */
  label: string;
  /** Sufixo de ícone PrimeIcons (ex.: 'pi-file'). */
  icon: string;
  /** Caminho para um ícone customizado (SVG/IMG) (opcional). */
  image?: string;
  /** Rota Angular (routerLink). */
  route: string;
  /** Valor do badge no item (opcional). */
  badge?: string | number;
  /** Atalho textual do item (opcional). */
  shortcut?: string;
}