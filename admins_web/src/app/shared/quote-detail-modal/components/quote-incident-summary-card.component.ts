import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteIncident } from '../../../core/models/admin.models';

@Component({
  selector: 'app-quote-incident-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-950/90 via-surface-container-high to-slate-900 border-2 border-rose-500/50 space-y-3.5 shadow-[0_0_30px_rgba(244,63,94,0.15)] font-sans">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/30 pb-2.5">
        <span class="text-rose-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-rose-400">report_problem</span>
          IMPREVISTO REGISTRADO
        </span>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          {{ incident?.initiatedBy || 'Grupo Musical' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1 sm:col-span-2">
          <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Motivo del Imprevisto:</span>
          <p class="text-on-surface leading-relaxed">{{ incident?.reason || 'Sin detalle registrado.' }}</p>
        </div>

        <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1">
          <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Fecha de Registro:</span>
          <strong class="text-on-surface font-mono text-xs flex items-center gap-1">
            <span class="material-symbols-outlined text-xs text-rose-400">event</span>
            {{ incident?.registeredAt || '—' }}
          </strong>
        </div>

        <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1">
          <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Estatus del Imprevisto:</span>
          <strong class="text-rose-300 font-mono text-xs">{{ incident?.status || 'Imprevisto Grave' }}</strong>
        </div>
      </div>

      @if (incident?.clientMessage) {
        <div class="p-3 rounded-xl bg-black/30 border border-outline-variant/20 text-xs">
          <span class="text-[9px] font-bold text-outline uppercase block mb-0.5 font-mono">Mensaje Formal Enviado al Cliente:</span>
          <p class="text-on-surface/90 italic leading-relaxed">&ldquo;{{ incident?.clientMessage }}&rdquo;</p>
        </div>
      }
    </div>
  `
})
export class QuoteIncidentSummaryCardComponent {
  @Input() incident: QuoteIncident | null = null;
}
