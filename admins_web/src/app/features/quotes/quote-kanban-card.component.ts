import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote } from '../../core/models/admin.models';
import { quoteStateMeta } from '../../core/models/quote-state.meta';
import { RoleService } from '../../core/services/role.service';
import { QuoteCardTagsComponent } from './quote-card-tags.component';
import { QuoteHighlight, cardHighlight, cardTags } from './quote-card-insights';

/**
 * Tarjeta de una cotización en el tablero Kanban.
 *
 * Estaba inline en `quotes.component.ts` y mostraba exactamente los mismos
 * campos para los diez estados, incluido un "Monto Propuesto" que en las fases
 * tempranas todavía no es un costo pactado. Ahora el dato principal y las
 * señales de atención los decide `quote-card-insights.ts` según la fase.
 *
 * También se retiró la barra "Mover Estado": el avance del pipeline se hace
 * desde las acciones dedicadas de cada fase dentro del modal, que son las que
 * piden la información y dejan rastro en la trazabilidad.
 */
@Component({
  selector: 'app-quote-kanban-card',
  standalone: true,
  imports: [CommonModule, QuoteCardTagsComponent],
  template: `
    @if (quote; as q) {
      <div
        [class]="borderClass()"
        class="p-4 sm:p-5 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 border-l-4 hover:border-primary/50 hover:shadow-xl transition-all duration-300 space-y-3.5 group relative"
      >

        <!-- FOLIO Y ESTATUS DE PAGO -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            (click)="copyFolio.emit(q.id)"
            class="font-black text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1 text-xs"
            title="Copiar folio"
          >
            {{ q.id }} <span class="material-symbols-outlined text-[10px]">content_copy</span>
          </button>

          <span [class]="paymentBadgeClass" class="px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1">
            {{ paymentLabel }}
          </span>
        </div>

        <!-- SEÑALES DE ATENCIÓN DE ESTA FASE -->
        <app-quote-card-tags [tags]="tags()" />

        <!-- GRUPO Y CLIENTE -->
        <div class="space-y-2">
          <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
              <span class="material-symbols-outlined text-sm">music_note</span>
            </div>
            <div class="min-w-0">
              <span class="text-[9px] font-bold text-primary uppercase tracking-wider block">Grupo / Talento Solicitado</span>
              <h4
                (click)="open.emit(q)"
                class="text-xs font-black text-on-surface group-hover:text-primary transition-colors cursor-pointer truncate"
              >
                {{ q.groupName }}
              </h4>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <span class="material-symbols-outlined text-sm">badge</span>
            </div>
            <div class="min-w-0">
              <span class="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">Cliente / Contratante Único</span>
              <p class="text-xs font-bold text-on-surface truncate">{{ q.clientName }}</p>
              <p class="text-[10px] text-outline truncate">{{ q.clientCompany }}</p>
            </div>
          </div>

          <p class="text-[11px] text-outline flex items-center gap-1 min-w-0">
            <span class="material-symbols-outlined text-xs text-primary shrink-0">location_on</span>
            <span class="truncate">{{ q.venue }}, {{ q.city }} ({{ q.proposedDate }})</span>
          </p>
        </div>

        <!-- DATO PRINCIPAL SEGÚN LA FASE -->
        <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-0.5">
          <span class="text-[9px] text-outline uppercase font-bold tracking-wider flex items-center gap-1">
            {{ highlight().caption }}
            @if (highlight().tentative) {
              <span
                class="px-1.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] normal-case"
                title="Todavía no es una cifra pactada: el cliente aún no acepta la propuesta"
              >Tentativo</span>
            }
          </span>
          <span class="font-black text-on-surface text-sm block truncate">{{ highlight().value }}</span>
          @if (highlight().hint) {
            <span class="text-[10px] text-outline block truncate">{{ highlight().hint }}</span>
          }
        </div>

        <button
          type="button"
          (click)="open.emit(q)"
          class="w-full px-3.5 py-2 min-h-11 rounded-xl bg-surface-bright hover:bg-primary hover:text-on-primary text-on-surface text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span class="material-symbols-outlined text-sm">visibility</span> Abrir Solicitud
        </button>
      </div>
    }
  `
})
export class QuoteKanbanCardComponent {
  private roleService = inject(RoleService);

  @Input() quote: Quote | null = null;
  /** Clases del badge de pago, resueltas por el padre (comparte la lógica con la tabla). */
  @Input() paymentBadgeClass = '';
  @Input() paymentLabel = '';

  @Output() open = new EventEmitter<Quote>();
  @Output() copyFolio = new EventEmitter<string>();

  highlight(): QuoteHighlight {
    return cardHighlight(this.quote!, this.roleService.canViewFinances());
  }

  tags() {
    return this.quote ? cardTags(this.quote) : [];
  }

  borderClass(): string {
    return quoteStateMeta(this.quote?.state).borderLeftClass;
  }
}
