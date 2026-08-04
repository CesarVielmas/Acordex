import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, QuoteIncident } from '../../../core/models/admin.models';
import { QuoteIncidentInfoTabComponent } from './quote-incident-info-tab.component';
import { QuoteIncidentNegotiationTabComponent } from './quote-incident-negotiation-tab.component';
import { QuoteCommunicationTabComponent } from './quote-communication-tab.component';
import { QuoteIncidentNegotiationHistoryTabComponent } from './quote-incident-negotiation-history-tab.component';

type IncidentTab = 'info' | 'negociacion' | 'comunicacion' | 'historial';

@Component({
  selector: 'app-quote-incident-state-view',
  standalone: true,
  imports: [
    CommonModule,
    QuoteIncidentInfoTabComponent,
    QuoteIncidentNegotiationTabComponent,
    QuoteCommunicationTabComponent,
    QuoteIncidentNegotiationHistoryTabComponent
  ],
  template: `
    <div class="h-full flex flex-col min-h-0 space-y-4 font-sans">

      <!-- BANNER DE ESTADO DEL IMPREVISTO -->
      <div class="p-3.5 rounded-2xl border flex items-center justify-between gap-3 shrink-0" [class]="isPending() ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-rose-500/10 border-rose-500/40'">
        <span class="text-xs font-black uppercase tracking-wider flex items-center gap-2" [class]="isPending() ? 'text-cyan-300' : 'text-rose-300'">
          <span class="material-symbols-outlined text-base">{{ isPending() ? 'hourglass_top' : 'report_problem' }}</span>
          {{ isPending() ? 'IMPREVISTO — PROPUESTA EN ESPERA DEL CLIENTE' : 'IMPREVISTO ACTIVO — SIN RESOLUCIÓN PENDIENTE' }}
        </span>
        <span class="text-[10px] font-mono text-outline hidden sm:inline">{{ quote?.id }}</span>
      </div>

      <!-- SUB-TABS NAVEGACIÓN -->
      <div class="quote-modal-tabs flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-high border border-outline-variant/30 overflow-x-auto custom-scrollbar shrink-0">
        <button
          (click)="tab.set('info')"
          [class]="tab() === 'info' ? 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-300 border-rose-400/50 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
          class="px-3 py-2 min-h-11 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-base">info</span>
          <span>1. Información General</span>
        </button>

        <button
          (click)="tab.set('negociacion')"
          [class]="tab() === 'negociacion' ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-400/50 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
          class="px-3 py-2 min-h-11 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-base">handshake</span>
          <span>2. Negociación</span>
        </button>

        <button
          (click)="tab.set('comunicacion')"
          [class]="tab() === 'comunicacion' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-400/50 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
          class="px-3 py-2 min-h-11 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-base">forum</span>
          <span>3. Avisos & Chat Cruzado</span>
        </button>

        <button
          (click)="tab.set('historial')"
          [class]="tab() === 'historial' ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-400/50 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
          class="px-3 py-2 min-h-11 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-base">history</span>
          <span>4. Historial de Negociaciones</span>
        </button>
      </div>

      <!-- CONTENIDO -->
      @if (tab() === 'info') {
        <app-quote-incident-info-tab [quote]="quote" [incident]="activeIncident()" />
      }
      @if (tab() === 'negociacion') {
        <app-quote-incident-negotiation-tab [quote]="quote" [mode]="isPending() ? 'pending' : 'propose'" />
      }
      @if (tab() === 'comunicacion') {
        <app-quote-communication-tab [quote]="quote" [incidentBanner]="communicationBanner()" />
      }
      @if (tab() === 'historial') {
        <app-quote-incident-negotiation-history-tab [negotiations]="quote?.incidentNegotiations || []" />
      }
    </div>
  `
})
export class QuoteIncidentStateViewComponent {
  @Input() quote: Quote | null = null;

  tab = signal<IncidentTab>('info');

  isPending(): boolean {
    return this.quote?.state === 'Imprevisto Enviado';
  }

  activeIncident(): QuoteIncident | null {
    const list = this.quote?.incidents || [];
    return list.find(inc => inc.status !== 'Resuelto') || list[list.length - 1] || null;
  }

  communicationBanner(): string {
    const incident = this.activeIncident();
    if (!incident) return '';
    return this.isPending()
      ? 'Hay una propuesta de resolución enviada al cliente y en espera de respuesta para el imprevisto: "' + incident.reason + '".'
      : 'Esta cotización tiene un imprevisto activo sin resolución pendiente: "' + incident.reason + '". Usa la pestaña "Negociación" para enviar una propuesta.';
  }
}
