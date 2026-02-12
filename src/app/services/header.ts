import { Injectable, signal, TemplateRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  /** Título da página */
  title = signal<string>('');

  /** Ícone da página */
  icon = signal<string>('');

  /** Ícone customizado (SVG/IMG) */
  image = signal<string>('');

  /** Template para as ações do lado direito */
  actionsTemplate = signal<TemplateRef<any> | null>(null);

  /**
   * Atualiza as informações do cabeçalho
   * @param config Objeto de configuração do cabeçalho
   */
  setHeader(config: { title: string; icon: string; image?: string; actions?: TemplateRef<any> | null }): void {
    this.title.set(config.title);
    this.icon.set(config.icon);
    this.image.set(config.image || '');
    this.actionsTemplate.set(config.actions || null);
  }

  /**
   * Limpa as informações do cabeçalho
   */
  clearHeader(): void {
    this.title.set('');
    this.icon.set('');
    this.image.set('');
    this.actionsTemplate.set(null);
  }
}
