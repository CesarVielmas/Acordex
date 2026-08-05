import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteState } from '../../../core/models/admin.models';
import { quoteStateMeta } from '../../../core/models/quote-state.meta';

/**
 * Badge del estado de una cotización, con el color y el ícono propios de esa fase.
 *
 * Existe porque `BadgeComponent` sólo admite un enum cerrado de 8 variantes y no
 * puede expresar los 10 colores del pipeline: por eso la Vista Tabla terminaba
 * pintando todos los estados del mismo color y era imposible distinguirlos.
 * Aquí el color se lee de `quoteStateMeta()`, la misma fuente que usan el Kanban
 * y el modal, así que las tres vistas quedan consistentes.
 */
@Component({
  selector: 'app-quote-state-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (state) {
      <span
        [class]="badgeClasses()"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border whitespace-nowrap"
      >
        @if (showIcon) {
          <span class="material-symbols-outlined text-sm shrink-0">{{ meta().icon }}</span>
        }
        {{ state }}
      </span>
    }
  `
})
export class QuoteStateBadgeComponent {
  @Input() state: QuoteState | null = null;
  @Input() size: 'sm' | 'md' = 'sm';
  @Input() showIcon = true;

  meta() {
    return quoteStateMeta(this.state);
  }

  badgeClasses(): string {
    const size = this.size === 'md' ? 'text-xs' : 'text-[10px]';
    return this.meta().badgeClass + ' ' + size;
  }
}
