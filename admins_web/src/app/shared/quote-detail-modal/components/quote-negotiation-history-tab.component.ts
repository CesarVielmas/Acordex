import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, NegotiationEntry, PaymentMilestone } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';

interface RoundBaseline {
  artistFee: number;
  viaticosCost: number;
  soundCost: number;
  marginPercent: number;
  totalOffered: number;
  label: string;
}

@Component({
  selector: 'app-quote-negotiation-history-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
      <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
        <span class="material-symbols-outlined text-sm text-amber-400">history</span>
        {{ title }}
      </span>
      <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/40">
        {{ negotiationHistory.length }} Rondas de Negociación Registradas
      </span>
    </div>

    @if (showEmptyState && negotiationHistory.length === 0) {
      <div class="p-6 rounded-3xl bg-surface-container-high/90 border border-emerald-500/30 text-center space-y-2 shadow-xl backdrop-blur-xl">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined text-2xl">verified</span>
        </div>
        <h4 class="text-sm font-black text-on-surface">ACEPTACIÓN DIRECTA EN PRIMERA PROPUESTA</h4>
        <p class="text-xs text-outline max-w-md mx-auto">
          Esta cotización fue aceptada directamente por el cliente en su primer envío, sin requerir rondas adicionales de contraoferta ni modificaciones comerciales.
        </p>
      </div>
    } @else {
      @for (entry of negotiationHistory; track entry.round; let idx = $index) {
        @let baseline = getPreviousRoundBaseline(idx);

        <!-- ROUND ITEM CONTAINER -->
        <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border-2 border-amber-400/50 space-y-4 shadow-[0_0_30px_rgba(251,191,36,0.12)] backdrop-blur-xl">

          <!-- ROUND HEADER BANNER -->
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/30 pb-3">
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-400/40 flex items-center gap-1 shadow-sm">
                <span class="material-symbols-outlined text-sm text-amber-400">event_repeat</span>
                RONDA #{{ entry.round }}
              </span>
              <span class="text-xs font-bold text-on-surface hidden sm:inline">| {{ roundContextLabel }}</span>
            </div>

            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-xl text-cyan-200 bg-surface-container-high/90 border border-cyan-500/30 font-mono text-xs font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-cyan-400">schedule</span>
                FECHA DE NEGOCIACIÓN (RONDA #{{ entry.round }}): {{ entry.timestamp }}
              </span>
            </div>
          </div>

          <!-- MOTIVO DE RECHAZO DEL CLIENTE EN ESTA RONDA -->
          <div class="p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 space-y-1.5 shadow-inner">
            <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1 font-sans">
              <span class="material-symbols-outlined text-xs text-amber-400">feedback</span>
              MOTIVO DE RECHAZO DEL CLIENTE EN RONDA #{{ entry.round }}:
            </span>
            <p class="text-xs text-on-surface/90 italic font-sans leading-relaxed">
              &ldquo;{{ entry.clientRejectionMessage }}&rdquo;
            </p>
          </div>

          <!-- 2-COLUMN SPLIT FOR ROUND #N DETAILS -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">

            <!-- LEFT COLUMN: DETALLES DEL SHOW PROPUESTO EN RONDA #N (6 COLS) -->
            <div class="lg:col-span-6 p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-3.5">
              <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1 font-sans">
                <span class="material-symbols-outlined text-xs text-emerald-400">event</span>
                DETALLES DEL SHOW PROPUESTO EN RONDA #{{ entry.round }}
              </span>

              <div class="space-y-2 text-xs font-sans">
                <!-- FECHAS -->
                <div class="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-1">
                  <span class="text-outline text-[9px] font-bold block uppercase font-sans">FECHA ORIGINAL SOLICITADA POR EL CLIENTE:</span>
                  <span class="text-on-surface font-mono font-bold text-xs block">{{ quote?.proposedDate }}</span>
                </div>

                <div class="p-2.5 rounded-xl bg-surface-container-high border border-emerald-500/40 space-y-1">
                  <span class="text-outline text-[9px] font-bold block uppercase font-sans">FECHA PROPUESTA (RONDA #{{ entry.round }}):</span>
                  <span class="text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] font-black font-mono text-xs block">
                    {{ entry.proposedDate || quote?.proposedDate }}
                  </span>
                </div>

                <!-- DURACIÓN Y ESTRUCTURA -->
                <div class="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-outline text-[9px] font-bold uppercase font-sans">Estructura de Horarios:</span>
                    <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {{ entry.scheduleMode === 'tandas' || (entry.showBlocks && entry.showBlocks.length > 0) ? 'Tandas / Bloques Fragmentados' : 'Horario Continuo' }}
                    </span>
                  </div>

                  @if (entry.showBlocks && entry.showBlocks.length > 0) {
                    <div class="space-y-1">
                      @for (block of entry.showBlocks; track block.id; let bIdx = $index) {
                        <div class="p-1.5 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-between text-[10px] font-mono">
                          <span class="font-bold text-amber-300 font-sans">• Tanda #{{ bIdx + 1 }}: {{ block.label || 'Set Musical' }}</span>
                          <span class="text-on-surface font-extrabold">{{ block.startTime }} a {{ block.endTime }} hrs</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="p-1.5 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-between text-[10px] font-mono">
                      <span class="font-bold text-cyan-300 font-sans">• Show Continuo Sin Pausas</span>
                      <span class="text-on-surface font-extrabold">{{ entry.startTime || '21:00' }} a {{ entry.endTime || '00:00' }} hrs</span>
                    </div>
                  }
                </div>

                <!-- SERVICIO DE AUDIO EN ESTA RONDA -->
                <div class="p-2.5 rounded-xl bg-surface-container-high border border-purple-500/30 space-y-1">
                  <span class="text-outline text-[9px] font-bold block uppercase font-sans">Servicio de Equipo de Audio (Ronda #{{ entry.round }}):</span>
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-purple-300 font-sans text-xs flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs text-purple-400">speaker_group</span>
                      {{ entry.soundOption === 'proveedor' || (entry.soundCost && entry.soundCost > 0) ? 'Incluye Sistema de Audio Profesional Disquera' : 'Proporcionado por el Cliente' }}
                    </span>
                    <span class="font-mono text-xs font-black text-on-surface">
                      &#36;{{ (entry.soundCost || 0) | number:'1.0-0' }} MXN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN: DETALLES DE LA PROPUESTA DISQUERA EN RONDA #N (6 COLS) -->
            <div class="lg:col-span-6 p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-3.5">
              <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1 font-sans">
                  <span class="material-symbols-outlined text-xs text-amber-400">payments</span>
                  DETALLES DE LA PROPUESTA DISQUERA EN RONDA #{{ entry.round }}
                </span>
                <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {{ baseline.label }} vs Ronda #{{ entry.round }}
                </span>
              </div>

              <div class="space-y-1.5 text-[10px] font-mono">
                <!-- Honorarios -->
                <div class="p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between">
                  <div>
                    <span class="font-sans font-bold text-on-surface block text-[10px]">• Honorarios Grupo:</span>
                    <span class="text-outline text-[9px]">{{ baseline.label }}: &#36;{{ baseline.artistFee | number:'1.0-0' }} MXN</span>
                  </div>
                  <div class="text-right">
                    <strong class="text-amber-300 block">&#36;{{ entry.artistFee | number:'1.0-0' }} MXN</strong>
                    <span [class]="(entry.artistFee - baseline.artistFee) < 0 ? 'text-emerald-400' : ((entry.artistFee > baseline.artistFee) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                      {{ (entry.artistFee - baseline.artistFee) < 0 ? ('- ' + (((baseline.artistFee - entry.artistFee) / (baseline.artistFee || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.artistFee > baseline.artistFee) ? '🔺 +%' : '0%') }}
                    </span>
                  </div>
                </div>

                <!-- Viáticos -->
                <div class="p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between">
                  <div>
                    <span class="font-sans font-bold text-on-surface block text-[10px]">• Viáticos & Hospedaje:</span>
                    <span class="text-outline text-[9px]">{{ baseline.label }}: &#36;{{ baseline.viaticosCost | number:'1.0-0' }} MXN</span>
                  </div>
                  <div class="text-right">
                    <strong class="text-amber-300 block">&#36;{{ entry.viaticosCost | number:'1.0-0' }} MXN</strong>
                    <span [class]="(entry.viaticosCost - baseline.viaticosCost) < 0 ? 'text-emerald-400' : ((entry.viaticosCost > baseline.viaticosCost) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                      {{ (entry.viaticosCost - baseline.viaticosCost) < 0 ? ('- ' + (((baseline.viaticosCost - entry.viaticosCost) / (baseline.viaticosCost || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.viaticosCost > baseline.viaticosCost) ? '🔺 +%' : '0%') }}
                    </span>
                  </div>
                </div>

                <!-- Equipo de Audio Profesional -->
                <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span class="font-sans font-bold text-purple-300 block text-[10px]">• Equipo de Audio Profesional:</span>
                    <span class="text-outline text-[9px]">
                      {{ entry.soundOption === 'proveedor' || (entry.soundCost && entry.soundCost > 0) ? 'Proveedor Disquera' : 'Proporcionado por Cliente' }} — {{ baseline.label }}: &#36;{{ baseline.soundCost | number:'1.0-0' }} MXN
                    </span>
                  </div>
                  <div class="text-right">
                    <strong class="text-purple-300 block">&#36;{{ (entry.soundCost || 0) | number:'1.0-0' }} MXN</strong>
                    <span [class]="(entry.soundCost - baseline.soundCost) < 0 ? 'text-emerald-400' : ((entry.soundCost > baseline.soundCost) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                      {{ (entry.soundCost - baseline.soundCost) < 0 ? ('- ' + (((baseline.soundCost - entry.soundCost) / (baseline.soundCost || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.soundCost > baseline.soundCost) ? '🔺 +%' : '0%') }}
                    </span>
                  </div>
                </div>

                <!-- Margen -->
                <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span class="font-sans font-bold text-purple-300 block text-[10px]">• Margen Disquera:</span>
                    <span class="text-outline text-[9px]">{{ baseline.label }}: {{ baseline.marginPercent }}% — Ronda #{{ entry.round }}: {{ entry.marginPercent }}%</span>
                  </div>
                  <div class="text-right">
                    <strong class="text-purple-300 block">{{ entry.marginPercent }}%</strong>
                    <span [class]="entry.marginPercent < baseline.marginPercent ? 'text-emerald-400' : 'text-outline'" class="text-[9px] font-bold">
                      {{ entry.marginPercent < baseline.marginPercent ? ('- ' + (baseline.marginPercent - entry.marginPercent) + '% pts 🔻') : '0%' }}
                    </span>
                  </div>
                </div>

                <!-- Total Oferta Final -->
                <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-surface-container-high to-amber-500/20 border-2 border-amber-400/60 flex items-center justify-between mt-2 shadow-lg backdrop-blur-md">
                  <span class="font-sans font-black text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-amber-400">monetization_on</span>
                    OFERTA TOTAL EN RONDA #{{ entry.round }}:
                  </span>
                  <strong class="text-amber-300 font-mono font-black text-lg sm:text-xl drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                    &#36;{{ entry.totalOffered | number:'1.0-0' }} MXN
                  </strong>
                </div>

                <!-- CONDICIONES DE PAGO ACORDADAS EN ESTA RONDA DEL HISTORIAL -->
                <div class="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-surface-container-high to-slate-900 border-2 border-cyan-400/60 space-y-3 font-sans shadow-xl backdrop-blur-xl">
                  <div class="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                    <span class="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2 font-sans">
                      <span class="material-symbols-outlined text-base text-cyan-400">payments</span>
                      CONDICIONES DE PAGO Y CUENTA RECEPTORA EN RONDA #{{ entry.round }}
                    </span>
                    <span class="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      REGISTRO HISTÓRICO
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px]">
                    <div class="p-2.5 rounded-xl bg-surface-container-high/90 border border-emerald-500/30 space-y-1 shadow-sm">
                      <span class="text-outline text-[8px] font-bold uppercase tracking-wider block font-sans">Monto Mínimo (Anticipo):</span>
                      <strong class="text-emerald-400 font-mono text-xs font-black block">&#36;{{ getAdvancePaymentAmount(entry) | number:'1.0-0' }} MXN</strong>
                      <span class="text-[8px] text-emerald-300 font-mono block">({{ getAdvancePaymentLabel(entry) }})</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-surface-container-high/90 border border-amber-500/30 space-y-1 shadow-sm">
                      <span class="text-outline text-[8px] font-bold uppercase tracking-wider block font-sans">Fecha Límite Pago:</span>
                      <strong class="text-amber-300 font-mono text-xs font-bold block flex items-center gap-1">
                        <span class="material-symbols-outlined text-[10px] text-amber-400">event</span>
                        {{ getPaymentDueDate(entry) }}
                      </strong>
                    </div>
                    <div class="p-2.5 rounded-xl bg-surface-container-high/90 border border-purple-500/30 space-y-1 shadow-sm">
                      <span class="text-outline text-[8px] font-bold uppercase tracking-wider block font-sans">Cuenta Receptora:</span>
                      <strong class="text-purple-300 font-mono text-[9px] font-bold block truncate">{{ getReceivingCardLabel(entry) }}</strong>
                    </div>
                  </div>

                  <!-- HITOS DE PAGO DEFINIDOS EN ESTA RONDA DEL HISTORIAL -->
                  @if (getPaymentMilestones(entry).length > 0) {
                    <div class="pt-2.5 border-t border-cyan-500/30 space-y-2.5">
                      <span class="text-[10px] font-black text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-xs text-cyan-400">calendar_month</span>
                        HITOS Y PROGRAMACIÓN DE PARCIALIDADES DE PAGO EN RONDA #{{ entry.round }}:
                      </span>
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        @for (m of getPaymentMilestones(entry); track m.id; let mIdx = $index) {
                          <div class="p-2.5 rounded-xl bg-surface-container/90 border border-cyan-500/40 flex flex-col justify-between text-[10px] space-y-1.5 shadow-md hover:border-cyan-400 hover:-translate-y-0.5 transition-all">
                            <div class="flex justify-between items-center font-extrabold text-on-surface border-b border-outline-variant/15 pb-1">
                              <span class="truncate flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                #{{ mIdx + 1 }}. {{ m.label }}
                              </span>
                              <span class="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                {{ m.type === 'percentage' ? (m.percentageOrAmount + '%') : ('$' + (m.percentageOrAmount | number:'1.0-0')) }}
                              </span>
                            </div>
                            <div class="flex justify-between items-baseline font-mono text-[9px]">
                              <span class="text-outline font-sans">Importe:</span>
                              <strong class="text-emerald-400 font-black">&#36;{{ getMilestoneCalculatedAmount(m, entry.totalOffered) | number:'1.0-0' }} MXN</strong>
                            </div>
                            <div class="flex justify-between items-baseline font-mono text-[9px] pt-1 border-t border-outline-variant/10">
                              <span class="text-outline font-sans flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-[10px] text-amber-400">event</span>
                                Fecha:
                              </span>
                              <strong class="text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{{ m.dueDateOrTimeframe }}</strong>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>

                @if (entry.adminProposalNote) {
                  <div class="p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 text-[10px] font-sans pt-1.5">
                    <span class="text-[9px] font-black text-amber-300 uppercase block mb-0.5">NOTA DE NEGOCIACIÓN DISQUERA:</span>
                    <p class="italic text-on-surface/80">&ldquo;{{ entry.adminProposalNote }}&rdquo;</p>
                  </div>
                }
              </div>
            </div>

          </div>

        </div>
      }
    }
  `
})
export class QuoteNegotiationHistoryTabComponent {
  private mockData = inject(MockDataService);

  @Input() quote: Quote | null = null;
  @Input() negotiationHistory: NegotiationEntry[] = [];
  @Input() title: string = 'Cronología de Rondas Negociadas';
  @Input() roundContextLabel: string = 'Cotización en Negociación';
  @Input() showEmptyState: boolean = false;

  getPreviousRoundBaseline(idx: number): RoundBaseline {
    if (idx > 0 && this.negotiationHistory[idx - 1]) {
      const prev = this.negotiationHistory[idx - 1];
      return {
        artistFee: prev.artistFee,
        viaticosCost: prev.viaticosCost,
        soundCost: prev.soundCost,
        marginPercent: prev.marginPercent,
        totalOffered: prev.totalOffered,
        label: 'Ronda #' + prev.round
      };
    }
    const q = this.quote;
    return {
      artistFee: q?.artistFee || 35000,
      viaticosCost: q?.viaticosCost || 8500,
      soundCost: q?.soundCost || 0,
      marginPercent: 20,
      totalOffered: q?.totalAmount || 0,
      label: 'Original'
    };
  }

  getAdvancePaymentAmount(entry?: NegotiationEntry | null): number {
    const q = this.quote;
    const total = entry ? entry.totalOffered : (q?.totalAmount || 0);
    const type = entry?.advancePaymentType || q?.advancePaymentType || 'percentage';
    const val = entry?.advancePaymentValue ?? q?.advancePaymentValue ?? 50;
    return type === 'percentage' ? total * (val / 100) : val;
  }

  getAdvancePaymentLabel(entry?: NegotiationEntry | null): string {
    const q = this.quote;
    const type = entry?.advancePaymentType || q?.advancePaymentType || 'percentage';
    const val = entry?.advancePaymentValue ?? q?.advancePaymentValue ?? 50;
    return type === 'percentage' ? val + '% del total' : '$' + val + ' MXN Fijo';
  }

  getPaymentDueDate(entry?: NegotiationEntry | null): string {
    const q = this.quote;
    return entry?.paymentDueDate || q?.paymentDueDate || '2026-08-25';
  }

  getReceivingCardLabel(entry?: NegotiationEntry | null): string {
    const cardId = entry?.receivingCardId || this.quote?.receivingCardId;
    const card = this.mockData.getReceivingCardById(cardId);
    return card ? `${card.bankName} - ${card.accountHolder} (${card.cardNumber})` : 'BBVA México - Acordex (**** 4821)';
  }

  getPaymentMilestones(entry?: NegotiationEntry | null): PaymentMilestone[] {
    const q = this.quote;
    const milestones = entry?.paymentMilestones || q?.paymentMilestones;
    if (milestones && milestones.length > 0) {
      return milestones;
    }
    const dueDate = entry?.paymentDueDate || q?.paymentDueDate || '2026-08-25';
    return [
      { id: 'm1_def', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
      { id: 'm2_def', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
      { id: 'm3_def', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: dueDate }
    ];
  }

  getMilestoneCalculatedAmount(milestone: PaymentMilestone, totalAmount?: number | null): number {
    if (!milestone) return 0;
    const baseTotal = totalAmount ?? (this.quote?.totalAmount || 0);
    if (milestone.type === 'percentage') {
      return (baseTotal * milestone.percentageOrAmount) / 100;
    }
    return milestone.percentageOrAmount;
  }
}
