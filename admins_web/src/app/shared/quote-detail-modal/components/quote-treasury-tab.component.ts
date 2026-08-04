import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quote, PaymentMilestone, NoticeItem } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';
import { LayoutStateService } from '../../../core/services/layout_state.service';

@Component({
  selector: 'app-quote-treasury-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">

      @if (quote?.isCycleSealed) {
        <div class="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between text-xs font-sans text-purple-200 shadow-lg">
          <span class="flex items-center gap-2 font-bold uppercase tracking-wider">
            <span class="material-symbols-outlined text-base text-purple-400">lock</span>
            EXPEDIENTE SELLADO EN MODO SOLO LECTURA
          </span>
          <span class="text-[10px] font-mono text-outline">Modificaciones Deshabilitadas</span>
        </div>
      }

      <!-- CONTROL DE UMBRAL Y LÍMITE DE APLAZOS DINÁMICO -->
      <div class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div>
          <span class="text-xs font-bold text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-400 text-sm">tune</span>
            Configuración de Límite de Retrasos / Aplazados Tesorería
          </span>
          <p class="text-[11px] text-outline mt-0.5">Definición administrativa de tolerancia. Ingresa el número de hitos vencidos o en mora permitidos antes de que el expediente se marque con el aviso de "Pago Atrasado" en el panel de Cotizaciones.</p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-outline font-mono">Máx. Retrasos Permitidos:</span>
          <input
            type="number"
            min="0"
            max="20"
            [disabled]="!!quote?.isCycleSealed"
            [(ngModel)]="maxAllowedDelaysInput"
            class="bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs text-on-surface font-bold font-mono w-20 focus:border-primary outline-none disabled:opacity-40"
          />
          <button
            [disabled]="!!quote?.isCycleSealed"
            (click)="updateMaxAllowedDelays()"
            class="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all disabled:opacity-40 shadow-sm"
          >
            Guardar Límite
          </button>
        </div>
      </div>

      <!-- TABLA / GRILLA DE HITOS DE PAGO -->
      <div class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3 shadow-lg">
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
          <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <span class="material-symbols-outlined text-base">account_balance_wallet</span>
            CONTROL DESGLOSADO DE HITOS DE PAGO Y COBRANZA
          </span>
          <span class="text-[11px] font-mono text-outline">
            Monto Total: <strong class="text-emerald-300">&#36;{{ quote?.totalAmount | number:'1.0-0' }} MXN</strong>
          </span>
        </div>

        <div class="space-y-2.5">
          @for (milestone of quote?.paymentMilestones || []; track milestone.id) {
            <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-outline-variant/40">

              <!-- INFO DEL HITO -->
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-xs text-on-surface">{{ milestone.label }}</span>

                  @if (milestone.status === 'Pagado') {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">check_circle</span> PAGADO
                    </span>
                  } @else if (milestone.status === 'Moratorio') {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">warning</span> CON MORATORIO
                    </span>
                  } @else if (milestone.status === 'Vencido') {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">event_busy</span> VENCIDO
                    </span>
                  } @else {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">hourglass_empty</span> PENDIENTE
                    </span>
                  }
                </div>

                <div class="flex items-center gap-3 text-[11px] text-outline font-mono flex-wrap">
                  <span>Fecha Límite: <strong class="text-on-surface">{{ milestone.dueDateOrTimeframe }}</strong></span>
                  <span>Monto Calculado: <strong class="text-emerald-300">&#36;{{ milestone.amountCalculated | number:'1.0-0' }} MXN</strong></span>
                  @if (milestone.paidAt) {
                    <span>Pagado el: <strong class="text-teal-300">{{ milestone.paidAt }}</strong> ({{ milestone.receiptReference }})</span>
                  }
                </div>

                @if (milestone.manualPaymentReason) {
                  <div class="mt-1 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[11px] text-blue-200 font-sans">
                    <span class="font-bold flex items-center gap-1 text-blue-400">
                      <span class="material-symbols-outlined text-xs">info</span> Pago Registrado Manualmente (Falla / Error de Sistema)
                    </span>
                    <p class="text-[10px] text-blue-300/90 italic mt-0.5">Motivo: "{{ milestone.manualPaymentReason }}" | Ref: {{ milestone.receiptReference }}</p>
                  </div>
                }

                @if (milestone.hasMoratorio) {
                  <div class="mt-1 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-[11px] text-orange-200">
                    <span class="font-bold flex items-center gap-1 text-orange-400">
                      <span class="material-symbols-outlined text-xs">error</span> Cargo Moratorio Aplicado: +&#36;{{ milestone.moratorioAmountCalculated | number:'1.0-0' }} MXN ({{ milestone.moratorioType === 'percentage' ? milestone.moratorioValue + '%' : '&#36;' + milestone.moratorioValue + ' MXN' }})
                    </span>
                    <p class="text-[10px] text-orange-300/80 italic mt-0.5">Motivo: "{{ milestone.moratorioReason }}" (Aplicado: {{ milestone.appliedAt }})</p>
                  </div>
                }
              </div>

              <!-- ACCIONES DE PAGOS & MORATORIOS -->
              <div class="flex items-center gap-2 shrink-0 flex-wrap">
                @if (milestone.status !== 'Pagado') {
                  <button
                    [disabled]="!!quote?.isCycleSealed"
                    (click)="openManualPayment.emit(milestone)"
                    class="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-40"
                  >
                    <span class="material-symbols-outlined text-sm">payments</span>
                    <span>Pago Manual</span>
                  </button>

                  <button
                    [disabled]="!!quote?.isCycleSealed"
                    (click)="openMoratorio.emit(milestone)"
                    class="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-40"
                  >
                    <span class="material-symbols-outlined text-sm">add_alert</span>
                    <span>Aplicar Mora</span>
                  </button>

                  <button
                    [disabled]="!!quote?.isCycleSealed"
                    (click)="sendMilestoneReminder(milestone)"
                    class="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-40"
                    title="Enviar recordatorio sutil enfocado en este hito específico al cliente"
                  >
                    <span class="material-symbols-outlined text-sm">notifications</span>
                    <span>Recordatorio Hito</span>
                  </button>
                } @else {
                  <span class="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">verified</span> Liquidado
                  </span>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class QuoteTreasuryTabComponent {
  private mockData = inject(MockDataService);
  private layoutState = inject(LayoutStateService);

  @Input() quote: Quote | null = null;
  @Output() openManualPayment = new EventEmitter<PaymentMilestone>();
  @Output() openMoratorio = new EventEmitter<PaymentMilestone>();

  maxAllowedDelaysInput = 2;

  updateMaxAllowedDelays(): void {
    const q = this.quote;
    if (!q) return;

    const updated: Quote = {
      ...q,
      maxAllowedDelays: this.maxAllowedDelaysInput
    };
    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.addAudit(
      'Ajuste Límite de Retrasos Tesorería',
      'Tesorería',
      'Se actualizó el límite dinámico de retrasos a ' + this.maxAllowedDelaysInput + ' hitos para la cotización ' + q.id + '.'
    );
    this.layoutState.openQuoteModal(updated);
  }

  sendMilestoneReminder(milestone: PaymentMilestone): void {
    const q = this.quote;
    if (!q) return;

    const amt = milestone.amountCalculated || Math.round(q.totalAmount * (milestone.percentageOrAmount / 100));
    const newNotice: NoticeItem = {
      id: 'not_rem_' + Date.now(),
      target: 'Cliente',
      title: 'Recordatorio de Pago: ' + milestone.label,
      message: 'Estimado ' + q.clientName + ', le recordamos amablemente que el hito de pago "' + milestone.label + '" por $' + amt.toLocaleString('es-MX') + ' MXN tiene fecha límite para el ' + milestone.dueDateOrTimeframe + '. Agradecemos su pronta atención.',
      sentBy: 'Lic. Sofía Ramírez',
      sentRole: 'administrador',
      sentAt: new Date().toLocaleString(),
      channels: ['Email', 'WhatsApp', 'Platform'],
      priority: 'Alta',
      relatedMilestoneId: milestone.id
    };

    const updated: Quote = {
      ...q,
      clientNotices: [newNotice, ...(q.clientNotices || [])]
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.addAudit(
      'Envío de Recordatorio Específico de Hito',
      'Comunicación',
      'Recordatorio enviado al cliente para el hito "' + milestone.label + '".'
    );
    this.layoutState.openQuoteModal(updated);
  }
}
