cria a implementação  seguindo estas diretrizes rigorosas:

1. Estrutura de Componentes:
- Sempre utilizar componentes inteligentes (containers) e componentes de apresentação
- Seguir a estrutura Angular Style Guide oficial
- Criar módulos por funcionalidade (Feature Modules)
- Implementar lazy loading para rotas quando aplicável

2. Estilização:
- Exclusivamente Tailwind CSS para estilos
- NUNCA utilizar CSS/SASS diretamente
- Evitar classes utilitárias Tailwind muito longas (usar @apply quando necessário)
- Nenhuma formatação de texto direta (cor, tamanho, peso, estilo)

3. UI/UX:
- Utilizar PrimeNG como biblioteca de componentes principal
- Implementar design system consistente
- Seguir princípios de acessibilidade (WCAG)
- Componentes reutilizáveis e bem documentados

4. Boas Práticas de Código:
- TypeScript estrito (strict mode)
- Interfaces bem definidas
- Injeção de dependência correta
- State management quando necessário
- Testes unitários e de integração
- Código limpo e legível (SOLID, DRY)
- Documentação interna (TSDoc)

5. Performance:
- Change Detection OnPush
- TrackBy em loops *ngFor
- Unsubscribes gerenciados
- Lazy loading de módulos
- Bundle optimization

Template base para novos componentes:

```
// component-name.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-component-name',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, /* outros módulos PrimeNG */],
  template: `app-component-name`
    
})
export class ComponentNameComponent {
  // Lógica do componente
}
```
```
// component-name.component.html
<div class="container mx-auto p-4">
      <!-- Conteúdo usando diretivas PrimeNG e classes Tailwind -->
      <p-card>
        <ng-template pTemplate="header">
          <!-- Cabeçalho -->
        </ng-template>
        
        <!-- Conteúdo principal -->
        
        <ng-template pTemplate="footer">
          <!-- Rodapé -->
        </ng-template>
      </p-card>
    </div>
  ```
Diretrizes adicionais:
- Sempre usar os prefixos do PrimeNG (p-button, p-card, etc)
- Classes Tailwind devem seguir a ordem padrão (layout > flexbox > spacing > etc)
- Componentes devem ser auto-documentados
- Evitar métodos com mais de 50 linhas
- Manter a consistência visual em todo o sistema.
