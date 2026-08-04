import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quote, IncidentNegotiationEntry, NoticeItem, TimelineStep } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';
import { LayoutStateService } from '../../../core/services/layout_state.service';
import { FormFieldComponent, FormFieldOption } from '../../ui/form-field/form-field.component';
import { BadgeComponent, BadgeVariant } from '../../ui/badge/badge.component';

type ResolutionType = 'reschedule' | 'group_change' | 'refund' | 'apology_discount' | 'substitute_group';

@Component({
  selector: 'app-quote-incident-negotiation-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, FormFieldComponent, BadgeComponent],
  template: `
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 font-sans">

      @if (mode === 'propose') {
        <!-- FORMULARIO DE NUEVA PROPUESTA DE RESOLUCIÓN -->
        <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-amber-500/40 space-y-4 shadow-xl">
          <div class="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
            <span class="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-amber-400">handshake</span>
              PROPONER RESOLUCIÓN AL CLIENTE
            </span>
            <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[9px] border border-amber-500/30">
              RONDA #{{ nextRound() }}
            </span>
          </div>

          <p class="text-xs text-outline leading-relaxed">
            Selecciona la propuesta de solución para el imprevisto y redacta el mensaje formal. Al enviarla, la cotización cambiará a <strong class="text-on-surface">"Imprevisto Enviado"</strong> en espera de la decisión del cliente.
          </p>

          <div class="space-y-3.5">
            <app-form-field label="Tipo de Resolución Propuesta" type="select" [(value)]="resolutionType" [options]="resolutionOptions" />

            @if (resolutionType === 'reschedule') {
              <app-form-field label="Nueva Fecha Propuesta para el Evento" type="date" [(value)]="proposedDate" />
            }

            @if (resolutionType === 'group_change' || resolutionType === 'substitute_group') {
              <app-form-field
                [label]="resolutionType === 'substitute_group' ? 'Grupo Sustituto Propuesto por la Disquera' : 'Nuevo Grupo Solicitado'"
                type="select"
                [(value)]="newGroupName"
                [options]="groupOptions()"
              />
            }

            @if (resolutionType === 'refund') {
              <app-form-field label="Monto a Reembolsar (MXN)" type="number" [(value)]="refundAmount" />
            }

            @if (resolutionType === 'apology_discount') {
              <app-form-field label="Porcentaje de Descuento / Bonificación (%)" type="number" [(value)]="discountApplied" />
            }

            <app-form-field label="Mensaje Formal para el Cliente" type="textarea" [(value)]="adminMessage" placeholder="Redacta la propuesta que recibirá el cliente en sus notificaciones..." />

            <button
              [disabled]="!!quote?.isCycleSealed || !adminMessage.trim()"
              (click)="sendProposal()"
              class="w-full py-2.5 min-h-11 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
            >
              <span class="material-symbols-outlined text-sm">send</span>
              <span>ENVIAR PROPUESTA AL CLIENTE</span>
            </button>
          </div>
        </div>
      }

      @if (mode === 'pending' && pendingEntry(); as entry) {
        <!-- PROPUESTA PENDIENTE (SOLO LECTURA) -->
        <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-950/80 via-surface-container-high to-slate-900 border-2 border-cyan-500/60 space-y-4 shadow-2xl">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/30 pb-2.5">
            <span class="text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-cyan-400">hourglass_top</span>
              PROPUESTA ENVIADA — RONDA #{{ entry.round }}
            </span>
            <app-badge label="En espera del cliente" variant="info" icon="schedule" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1 sm:col-span-2">
              <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Tipo de Resolución:</span>
              <strong class="text-cyan-300 font-bold">{{ resolutionLabel(entry.resolutionType) }}</strong>
            </div>

            @if (entry.proposedDate) {
              <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1">
                <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Nueva Fecha Propuesta:</span>
                <strong class="text-emerald-300 font-mono">{{ entry.proposedDate }}</strong>
              </div>
            }
            @if (entry.newGroupName) {
              <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1">
                <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Grupo Propuesto:</span>
                <strong class="text-on-surface">{{ entry.newGroupName }}</strong>
              </div>
            }
            @if (entry.refundAmount) {
              <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1">
                <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Monto a Reembolsar:</span>
                <strong class="text-emerald-400 font-mono">&#36;{{ entry.refundAmount | number:'1.0-0' }} MXN</strong>
              </div>
            }
            @if (entry.discountApplied) {
              <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1">
                <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Bonificación Ofrecida:</span>
                <strong class="text-purple-300 font-mono">{{ entry.discountApplied }}%</strong>
              </div>
            }

            <div class="p-3 rounded-xl bg-surface-container/90 border border-outline-variant/20 space-y-1">
              <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-mono">Fecha de Envío:</span>
              <strong class="text-on-surface font-mono">{{ entry.sentAt }}</strong>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-black/30 border border-outline-variant/20 text-xs">
            <span class="text-[9px] font-bold text-outline uppercase block mb-0.5 font-mono">Mensaje Enviado al Cliente:</span>
            <p class="text-on-surface/90 italic leading-relaxed">&ldquo;{{ entry.adminMessage }}&rdquo;</p>
          </div>

          <!-- SIMULACIÓN DE DECISIÓN DEL CLIENTE (NO HAY BACKEND / APP CLIENTE REAL) -->
          <div class="pt-3 border-t border-cyan-500/20 space-y-2.5">
            <span class="text-[10px] font-bold text-outline uppercase tracking-wider block font-mono">
              Simulación de Respuesta del Cliente (Panel Administrativo):
            </span>

            @if (!showRejectForm) {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  (click)="simulateAccept()"
                  class="py-2.5 min-h-11 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-sm">check_circle</span>
                  Simular Aceptación del Cliente
                </button>
                <button
                  (click)="showRejectForm = true"
                  class="py-2.5 min-h-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-sm">cancel</span>
                  Simular Rechazo del Cliente
                </button>
              </div>
            } @else {
              <div class="space-y-2">
                <app-form-field label="Motivo de Rechazo del Cliente" type="textarea" [(value)]="rejectionReason" placeholder="Ej. El cliente no acepta la nueva fecha por conflicto de agenda..." />
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button (click)="showRejectForm = false" class="py-2 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
                  <button
                    [disabled]="!rejectionReason.trim()"
                    (click)="simulateReject()"
                    class="py-2 min-h-11 rounded-xl bg-red-500 text-white text-xs font-bold disabled:opacity-40"
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class QuoteIncidentNegotiationTabComponent {
  private mockData = inject(MockDataService);
  private layoutState = inject(LayoutStateService);

  @Input() quote: Quote | null = null;
  @Input() mode: 'propose' | 'pending' = 'propose';

  readonly resolutionOptions: FormFieldOption[] = [
    { label: 'Reprogramación de Fecha de Evento', value: 'reschedule' },
    { label: 'Cambio de Grupo Musical (Elección del Cliente)', value: 'group_change' },
    { label: 'Reasignación de Grupo Sustituto Disquera', value: 'substitute_group' },
    { label: 'Carta de Disculpa Formal + Bonificación de Descuento', value: 'apology_discount' },
    { label: 'Cancelación con Reembolso Directo al Cliente', value: 'refund' }
  ];

  resolutionType: ResolutionType = 'reschedule';
  proposedDate = '';
  newGroupName = '';
  refundAmount: number = 0;
  discountApplied: number = 10;
  adminMessage = '';

  showRejectForm = false;
  rejectionReason = '';

  groupOptions() {
    return this.mockData.groups().map(g => ({ label: g.name, value: g.name }));
  }

  nextRound(): number {
    return (this.quote?.incidentNegotiations?.length || 0) + 1;
  }

  pendingEntry(): IncidentNegotiationEntry | null {
    const list = this.quote?.incidentNegotiations || [];
    if (list.length === 0) return null;
    return list[list.length - 1];
  }

  resolutionLabel(type: ResolutionType): string {
    return this.resolutionOptions.find(o => o.value === type)?.label || type;
  }

  sendProposal(): void {
    const q = this.quote;
    if (!q || !this.adminMessage.trim()) return;

    const entry: IncidentNegotiationEntry = {
      id: 'inc_neg_' + Date.now(),
      round: this.nextRound(),
      resolutionType: this.resolutionType,
      proposedDate: this.resolutionType === 'reschedule' ? this.proposedDate : undefined,
      newGroupName: (this.resolutionType === 'group_change' || this.resolutionType === 'substitute_group') ? this.newGroupName : undefined,
      refundAmount: this.resolutionType === 'refund' ? Number(this.refundAmount) || 0 : undefined,
      discountApplied: this.resolutionType === 'apology_discount' ? Number(this.discountApplied) || 0 : undefined,
      adminMessage: this.adminMessage.trim(),
      sentAt: new Date().toLocaleString(),
      sentBy: 'Lic. Sofía Ramírez (Administración Disquera)',
      status: 'Enviada'
    };

    const notice: NoticeItem = {
      id: 'not_inc_neg_' + Date.now(),
      target: 'Cliente',
      title: 'Propuesta de Resolución para Imprevisto — Ronda #' + entry.round,
      message: entry.adminMessage,
      sentBy: entry.sentBy,
      sentRole: 'administrador',
      sentAt: entry.sentAt,
      channels: ['Email', 'WhatsApp', 'Platform'],
      priority: 'Urgente'
    };

    const updated: Quote = {
      ...q,
      incidentNegotiations: [...(q.incidentNegotiations || []), entry],
      clientNotices: [notice, ...(q.clientNotices || [])],
      state: 'Imprevisto Enviado'
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.updateQuoteState(q.id, 'Imprevisto Enviado');
    this.mockData.addAudit(
      'Propuesta de Resolución de Imprevisto Enviada al Cliente',
      'Excepciones',
      'Se envió al cliente la propuesta "' + this.resolutionLabel(this.resolutionType) + '" (ronda #' + entry.round + ') para la cotización ' + q.id + '.'
    );

    this.resetForm();
    this.layoutState.openQuoteModal(updated);
  }

  simulateAccept(): void {
    const q = this.quote;
    const entry = this.pendingEntry();
    if (!q || !entry) return;

    const respondedAt = new Date().toLocaleString();
    const updatedNegotiations = (q.incidentNegotiations || []).map(n =>
      n.id === entry.id ? { ...n, status: 'Aceptada' as const, clientRespondedAt: respondedAt } : n
    );
    const updatedIncidents = (q.incidents || []).map(inc => ({
      ...inc,
      status: 'Resuelto' as const,
      resolvedAt: respondedAt
    }));

    const newStep: TimelineStep = {
      id: 'ts_incident_resolved_' + Date.now(),
      phaseNumber: 7,
      phaseName: 'Imprevisto Resuelto y Cotización Reinstaurada',
      state: 'Finalizada',
      completedAt: respondedAt,
      actorName: q.clientName + ' (Cliente)',
      summaryNote: 'El cliente aceptó la propuesta de resolución "' + this.resolutionLabel(entry.resolutionType) + '" para el imprevisto registrado. La cotización se reinstaura como Finalizada.',
      snapshotData: { totalAmount: q.totalAmount }
    };

    const updated: Quote = {
      ...q,
      incidentNegotiations: updatedNegotiations,
      incidents: updatedIncidents,
      incidentStatus: 'Resuelto',
      state: 'Finalizada',
      traceabilityTimeline: [...(q.traceabilityTimeline || []), newStep]
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.updateQuoteState(q.id, 'Finalizada');
    this.mockData.addAudit(
      'Cliente Aceptó Propuesta de Resolución de Imprevisto (Simulado)',
      'Excepciones',
      'La propuesta de la ronda #' + entry.round + ' fue aceptada por el cliente. Cotización ' + q.id + ' reinstaurada a Finalizada.'
    );

    this.layoutState.openQuoteModal(updated);
  }

  simulateReject(): void {
    const q = this.quote;
    const entry = this.pendingEntry();
    if (!q || !entry || !this.rejectionReason.trim()) return;

    const respondedAt = new Date().toLocaleString();
    const updatedNegotiations = (q.incidentNegotiations || []).map(n =>
      n.id === entry.id ? { ...n, status: 'Rechazada' as const, clientRespondedAt: respondedAt, clientRejectionReason: this.rejectionReason.trim() } : n
    );

    const updated: Quote = {
      ...q,
      incidentNegotiations: updatedNegotiations,
      state: 'Cancelada con Imprevisto'
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.updateQuoteState(q.id, 'Cancelada con Imprevisto');
    this.mockData.addAudit(
      'Cliente Rechazó Propuesta de Resolución de Imprevisto (Simulado)',
      'Excepciones',
      'La propuesta de la ronda #' + entry.round + ' fue rechazada por el cliente. Motivo: "' + this.rejectionReason.trim() + '". Cotización ' + q.id + ' regresa a Cancelada con Imprevisto.'
    );

    this.showRejectForm = false;
    this.rejectionReason = '';
    this.layoutState.openQuoteModal(updated);
  }

  private resetForm(): void {
    this.resolutionType = 'reschedule';
    this.proposedDate = '';
    this.newGroupName = '';
    this.refundAmount = 0;
    this.discountApplied = 10;
    this.adminMessage = '';
  }
}
