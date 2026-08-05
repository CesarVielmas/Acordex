import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteTag, QuoteTagTone } from './quote-card-insights';

/**
 * Tira de señales contextuales de una cotización ("Evento urgente",
 * "Anticipo pendiente", "Sin firmar"), para poder juzgar el expediente sin
 * abrir el modal.
 */
@Component({
  selector: 'app-quote-card-tags',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (tags.length > 0) {
      <div class="flex items-center gap-1.5 flex-wrap">
        @for (tag of tags; track tag.label) {
          <span
            [class]="toneClass(tag.tone)"
            class="px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span class="material-symbols-outlined text-[11px] shrink-0">{{ tag.icon }}</span>
            {{ tag.label }}
          </span>
        }
      </div>
    }
  `
})
export class QuoteCardTagsComponent {
  @Input() tags: QuoteTag[] = [];

  toneClass(tone: QuoteTagTone): string {
    switch (tone) {
      case 'danger': return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'warning': return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'success': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      case 'info': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
      default: return 'bg-surface-bright text-outline border-outline-variant/30';
    }
  }
}
