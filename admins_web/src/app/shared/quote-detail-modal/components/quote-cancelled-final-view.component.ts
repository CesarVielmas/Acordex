import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, QuoteIncident, TimelineStep } from '../../../core/models/admin.models';
import { QuoteIncidentSummaryCardComponent } from './quote-incident-summary-card.component';
import { QuoteClientInfoTabComponent } from './quote-client-info-tab.component';
import { QuoteTraceabilityTimelineTabComponent } from './quote-traceability-timeline-tab.component';
import { QuoteIncidentNegotiationHistoryTabComponent } from './quote-incident-negotiation-history-tab.component';

@Component({
  selector: 'app-quote-cancelled-final-view',
  standalone: true,
  imports: [
    CommonModule,
    QuoteIncidentSummaryCardComponent,
    QuoteClientInfoTabComponent,
    QuoteTraceabilityTimelineTabComponent,
    QuoteIncidentNegotiationHistoryTabComponent
  ],
  template: `
    <div class="h-full flex flex-col min-h-0 space-y-4 font-sans">

      <!-- SUB-TABS NAVEGACIÓN ESTADO 'CANCELADA' -->
      <div class="quote-modal-tabs flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 shrink-0">
        <button
          (click)="activeTab.set('resumen')"
          [class]="activeTab() === 'resumen' ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-400/50 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
          class="px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 flex-1 justify-center"
        >
          <span class="material-symbols-outlined text-base">account_balance_wallet</span>
          <span>1. Resumen & Reembolso</span>
        </button>

        @if (incident) {
          <button
            (click)="activeTab.set('imprevisto')"
            [class]="activeTab() === 'imprevisto' ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-400/50 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
            class="px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 flex-1 justify-center"
          >
            <span class="material-symbols-outlined text-base">report_problem</span>
            <span>2. Imprevisto & Negociación</span>
          </button>
        }

        <button
          (click)="activeTab.set('evento')"
          [class]="activeTab() === 'evento' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-400/50 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
          class="px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 flex-1 justify-center"
        >
          <span class="material-symbols-outlined text-base">badge</span>
          <span>{{ incident ? '3' : '2' }}. Información del Evento</span>
        </button>

        <button
          (click)="activeTab.set('trazabilidad')"
          [class]="activeTab() === 'trazabilidad' ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-400/50 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
          class="px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 flex-1 justify-center"
        >
          <span class="material-symbols-outlined text-base">history</span>
          <span>{{ incident ? '4' : '3' }}. Trazabilidad Histórica</span>
        </button>
      </div>

      <!-- CONTENIDO SUB-TAB 1: RESUMEN DEL CIERRE & REEMBOLSO -->
      @if (activeTab() === 'resumen') {
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
          <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-950/90 via-surface-container-high to-slate-900 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] space-y-1.5">
            <span class="text-red-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-red-400">cancel</span>
              COTIZACIÓN CANCELADA DEFINITIVAMENTE
            </span>
            <p class="text-xs text-outline leading-relaxed">
              Expediente cerrado en modo solo lectura tras rechazo definitivo de la resolución del imprevisto. {{ quote?.finalClosureSummary }}
            </p>
          </div>

          <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-emerald-500/30 space-y-3.5 shadow-xl">
            <span class="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-500/20 pb-2.5">
              <span class="material-symbols-outlined text-base text-emerald-400">account_balance_wallet</span>
              RESUMEN DE REEMBOLSO AL CLIENTE
            </span>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Total Pagado por el Cliente:</span>
                <strong class="text-on-surface font-mono text-sm">&#36;{{ montoPagado() | number:'1.0-0' }} MXN</strong>
              </div>
              <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Retenido (Separación, No Reembolsable):</span>
                <strong class="text-amber-300 font-mono text-sm">&#36;{{ montoSeparacion() | number:'1.0-0' }} MXN</strong>
              </div>
              <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-1">
                <span class="text-emerald-300 text-[9px] font-bold uppercase tracking-wider block font-mono">Monto a Reembolsar:</span>
                <strong class="text-emerald-400 font-mono text-base">&#36;{{ montoAReembolsar() | number:'1.0-0' }} MXN</strong>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- CONTENIDO SUB-TAB 2: IMPREVISTO & HISTORIAL DE NEGOCIACIÓN -->
      @if (activeTab() === 'imprevisto' && incident) {
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
          <app-quote-incident-summary-card [incident]="incident" />

          @if ((quote?.incidentNegotiations?.length || 0) > 0) {
            <div class="space-y-2">
              <span class="text-[10px] font-black text-outline uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <span class="material-symbols-outlined text-sm">history</span>
                HISTORIAL COMPLETO DE NEGOCIACIONES DEL IMPREVISTO
              </span>
              <app-quote-incident-negotiation-history-tab [negotiations]="quote?.incidentNegotiations || []" />
            </div>
          }
        </div>
      }

      <!-- CONTENIDO SUB-TAB 3: INFORMACIÓN DEL EVENTO ORIGINALMENTE ACORDADO -->
      @if (activeTab() === 'evento') {
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
          <app-quote-client-info-tab [quote]="quote" />
        </div>
      }

      <!-- CONTENIDO SUB-TAB 4: TRAZABILIDAD HISTÓRICA COMPLETA -->
      @if (activeTab() === 'trazabilidad') {
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
          <app-quote-traceability-timeline-tab [quote]="quote" (openSnapshot)="openSnapshot.emit($event)" />
        </div>
      }

    </div>
  `
})
export class QuoteCancelledFinalViewComponent {
  @Input() quote: Quote | null = null;
  @Output() openSnapshot = new EventEmitter<TimelineStep>();

  activeTab = signal<'resumen' | 'imprevisto' | 'evento' | 'trazabilidad'>('resumen');

  get incident(): QuoteIncident | null {
    const list = this.quote?.incidents || [];
    return list[list.length - 1] || null;
  }

  montoPagado(): number {
    const milestones = this.quote?.paymentMilestones || [];
    return milestones
      .filter(m => m.status === 'Pagado')
      .reduce((sum, m) => sum + (m.paidAmount ?? m.amountCalculated ?? 0), 0);
  }

  montoSeparacion(): number {
    const q = this.quote;
    if (!q) return 0;
    const type = q.advancePaymentType || 'percentage';
    const val = q.advancePaymentValue ?? 50;
    return type === 'percentage' ? (q.totalAmount || 0) * (val / 100) : val;
  }

  montoAReembolsar(): number {
    return Math.max(0, this.montoPagado() - this.montoSeparacion());
  }
}
