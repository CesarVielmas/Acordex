import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentNegotiationEntry } from '../../../core/models/admin.models';
import { BadgeComponent, BadgeVariant } from '../../ui/badge/badge.component';

const RESOLUTION_LABELS: Record<IncidentNegotiationEntry['resolutionType'], string> = {
  reschedule: 'Reprogramación de Fecha de Evento',
  group_change: 'Cambio de Grupo Musical (Elección del Cliente)',
  substitute_group: 'Reasignación de Grupo Sustituto Disquera',
  apology_discount: 'Carta de Disculpa Formal + Bonificación de Descuento',
  refund: 'Cancelación con Reembolso Directo al Cliente'
};

@Component({
  selector: 'app-quote-incident-negotiation-history-tab',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 font-sans">
      <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
        <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-amber-400">history</span>
          HISTORIAL DE NEGOCIACIONES DEL IMPREVISTO
        </span>
        <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/40">
          {{ negotiations.length }} Ronda(s) Registrada(s)
        </span>
      </div>

      @if (negotiations.length === 0) {
        <div class="p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 text-center space-y-2 shadow-xl">
          <span class="material-symbols-outlined text-2xl text-outline/50">inbox</span>
          <p class="text-xs text-outline">Aún no se ha enviado ninguna propuesta de resolución para este imprevisto.</p>
        </div>
      } @else {
        @for (entry of negotiations; track entry.id) {
          <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border-2 space-y-3" [class]="borderClass(entry.status)">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-400/40 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">event_repeat</span>
                  RONDA #{{ entry.round }}
                </span>
                <span class="text-xs font-bold text-on-surface hidden sm:inline">{{ resolutionLabel(entry.resolutionType) }}</span>
              </div>
              <app-badge [label]="entry.status" [variant]="statusVariant(entry.status)" />
            </div>

            <p class="text-xs font-bold text-on-surface sm:hidden">{{ resolutionLabel(entry.resolutionType) }}</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              @if (entry.proposedDate) {
                <div class="p-2 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span class="text-outline">Nueva Fecha:</span> <strong class="text-emerald-300 font-mono">{{ entry.proposedDate }}</strong>
                </div>
              }
              @if (entry.newGroupName) {
                <div class="p-2 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span class="text-outline">Grupo Propuesto:</span> <strong class="text-on-surface">{{ entry.newGroupName }}</strong>
                </div>
              }
              @if (entry.refundAmount) {
                <div class="p-2 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span class="text-outline">Reembolso:</span> <strong class="text-emerald-400 font-mono">&#36;{{ entry.refundAmount | number:'1.0-0' }} MXN</strong>
                </div>
              }
              @if (entry.discountApplied) {
                <div class="p-2 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span class="text-outline">Bonificación:</span> <strong class="text-purple-300 font-mono">{{ entry.discountApplied }}%</strong>
                </div>
              }
              <div class="p-2 rounded-lg bg-surface-container border border-outline-variant/20">
                <span class="text-outline">Enviada:</span> <strong class="text-on-surface font-mono">{{ entry.sentAt }}</strong>
              </div>
              @if (entry.clientRespondedAt) {
                <div class="p-2 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span class="text-outline">Respondida:</span> <strong class="text-on-surface font-mono">{{ entry.clientRespondedAt }}</strong>
                </div>
              }
            </div>

            <div class="p-2.5 rounded-xl bg-black/30 border border-outline-variant/20 text-[11px]">
              <span class="text-[9px] font-bold text-outline uppercase block mb-0.5 font-mono">Mensaje Enviado:</span>
              <p class="text-on-surface/90 italic leading-relaxed">&ldquo;{{ entry.adminMessage }}&rdquo;</p>
            </div>

            @if (entry.status === 'Rechazada' && entry.clientRejectionReason) {
              <div class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px]">
                <span class="text-[9px] font-bold text-red-400 uppercase block mb-0.5 font-mono">Motivo de Rechazo del Cliente:</span>
                <p class="text-red-200/90 italic leading-relaxed">&ldquo;{{ entry.clientRejectionReason }}&rdquo;</p>
              </div>
            }
          </div>
        }
      }
    </div>
  `
})
export class QuoteIncidentNegotiationHistoryTabComponent {
  @Input() negotiations: IncidentNegotiationEntry[] = [];

  resolutionLabel(type: IncidentNegotiationEntry['resolutionType']): string {
    return RESOLUTION_LABELS[type] || type;
  }

  statusVariant(status: IncidentNegotiationEntry['status']): BadgeVariant {
    switch (status) {
      case 'Aceptada': return 'success';
      case 'Rechazada': return 'error';
      default: return 'info';
    }
  }

  borderClass(status: IncidentNegotiationEntry['status']): string {
    switch (status) {
      case 'Aceptada': return 'border-emerald-500/50';
      case 'Rechazada': return 'border-red-500/50';
      default: return 'border-cyan-500/50';
    }
  }
}
