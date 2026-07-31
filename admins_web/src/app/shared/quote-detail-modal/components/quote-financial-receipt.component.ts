import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, NegotiationEntry, PaymentMilestone } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';

@Component({
  selector: 'app-quote-financial-receipt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl flex flex-col justify-between">
      
      <div class="space-y-3.5">
        <!-- CARD HEADER -->
        <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
          <span class="text-[10px] font-black text-purple-300 uppercase tracking-wider block flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base text-purple-400">payments</span> DESGLOSE FINANCIERO ENTREGADO
          </span>
          <span class="font-mono text-[9px] font-extrabold text-cyan-400 uppercase">
            5% TARIFARIO FIJO
          </span>
        </div>

        <!-- ITEMIZED ITEM RECEIPT -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container border-2 border-amber-400/60 space-y-2.5 text-xs font-mono shadow-inner relative overflow-hidden">
          <div class="flex justify-between text-outline">
            <span>Honorarios del Grupo:</span>
            <strong class="text-on-surface">&#36;{{ (quote?.artistFee || 35000) | number:'1.0-0' }} MXN</strong>
          </div>

          <div class="flex justify-between text-outline">
            <span>Viáticos & Hospedaje:</span>
            <strong class="text-on-surface">&#36;{{ (quote?.viaticosCost || 8500) | number:'1.0-0' }} MXN</strong>
          </div>

          <div class="flex justify-between text-outline">
            <span>Equipo de Audio:</span>
            <strong class="text-purple-300">&#36;{{ (quote?.soundCost || 0) | number:'1.0-0' }} MXN</strong>
          </div>

          <div class="flex justify-between text-purple-300">
            <span>Margen Disquera:</span>
            <strong>&#36;{{ (quote?.marginAmount || 7000) | number:'1.0-0' }} MXN</strong>
          </div>

          <div class="flex justify-between text-cyan-400">
            <span>Plataforma Acordex (5% Fijo):</span>
            <strong>&#36;{{ ((quote?.totalAmount || 50000) * 0.05) | number:'1.0-0' }} MXN</strong>
          </div>

          @if (quote?.includeIva) {
            <div class="flex justify-between text-blue-300">
              <span>Impuesto IVA (+16% Facturado):</span>
              <strong>&#36;{{ ((quote?.totalAmount || 50000) * 0.16) | number:'1.0-0' }} MXN</strong>
            </div>
          }

          <div class="flex justify-between text-amber-400 text-xs sm:text-base font-black pt-2.5 border-t border-outline-variant/20 font-sans">
            <span class="uppercase tracking-wider">TOTAL COMERCIAL FINAL:</span>
            <span class="text-xl sm:text-2xl font-black font-mono text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              &#36;{{ quote?.totalAmount | number:'1.0-0' }} MXN
            </span>
          </div>

          <!-- BLOQUE DE CONDICIONES DE PAGO Y TARJETA RECEPTORA EN PROPUESTA INDIVIDUAL -->
          <div class="pt-3 border-t border-outline-variant/20 space-y-2 font-sans">
            <span class="text-[10px] font-black text-cyan-300 uppercase tracking-wider block flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-cyan-400">account_balance_wallet</span>
              CONDICIONES DE PAGO CONFIGURADAS:
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div class="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
                <span class="text-outline text-[9px] block">Monto Mínimo (Anticipo):</span>
                <strong class="text-emerald-400 font-mono text-xs font-black">&#36;{{ getAdvancePaymentAmount() | number:'1.0-0' }} MXN</strong>
                <span class="text-[9px] text-cyan-300 font-mono ml-1">({{ getAdvancePaymentLabel() }})</span>
              </div>
              <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <span class="text-outline text-[9px] block">Fecha Límite de Pago:</span>
                <strong class="text-amber-300 font-mono text-xs font-bold">{{ getPaymentDueDate() }}</strong>
              </div>
            </div>
            <div class="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] flex items-center justify-between">
              <span>Cuenta Receptora:</span>
              <strong class="font-mono text-xs font-bold">{{ getReceivingCardLabel() }}</strong>
            </div>

            <!-- HITOS DE PAGO PROGRAMADOS EN PROPUESTA BASE -->
            @if (getPaymentMilestones().length > 0) {
              <div class="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5 font-sans mt-2">
                <span class="text-[9px] font-bold text-cyan-300 uppercase block font-sans flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-cyan-400">calendar_month</span>
                  Hitos / Parcialidades de Pago Programadas:
                </span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[8px] font-mono">
                  @for (m of getPaymentMilestones(); track m.id; let mIdx = $index) {
                    <div class="p-1.5 rounded-lg bg-surface-container/90 border border-outline-variant/20 flex flex-col justify-between space-y-1">
                      <div class="flex justify-between font-bold text-on-surface">
                        <span class="truncate">#{{ mIdx + 1 }}. {{ m.label }}</span>
                        <span class="text-emerald-400">
                          {{ m.type === 'percentage' ? (m.percentageOrAmount + '%') : ('$' + (m.percentageOrAmount | number:'1.0-0')) }}
                        </span>
                      </div>
                      <div class="flex justify-between text-[9px] font-mono">
                        <span class="text-outline font-sans">Importe:</span>
                        <strong class="text-emerald-300 font-bold">&#36;{{ getMilestoneCalculatedAmount(m) | number:'1.0-0' }} MXN</strong>
                      </div>
                      <div class="flex justify-between text-amber-300 text-[8px] font-sans pt-0.5 border-t border-outline-variant/10">
                        <span>Fecha:</span>
                        <strong class="font-mono">{{ m.dueDateOrTimeframe }}</strong>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- DESGLOSE COMPARATIVO DE NEGOCIACIÓN DESGLOSADO POR RONDA (VISIBLE CUANDO ESTÁ EN NEGOCIACIÓN) -->
      @if (isInNegotiation && negotiationHistory.length > 0) {
        <div class="space-y-3 pt-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-400 text-base">compare_arrows</span>
            <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider">HISTORIAL DE PROPUESTAS ENVIADAS POR RONDA</span>
            <span class="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[9px] flex items-center justify-center">
              {{ negotiationHistory.length }}
            </span>
          </div>

          @for (entry of negotiationHistory; track entry.round; let idx = $index) {
            @let baseline = getBaseline(idx);
            <div class="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-surface-container to-amber-500/10 border-2 border-amber-400/50 space-y-2.5 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
              <div class="flex items-center justify-between border-b border-amber-400/20 pb-2">
                <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-amber-400">send</span>
                  PROPUESTA DISQUERA — RONDA #{{ entry.round }}
                </span>
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-amber-500/20 text-amber-200 border border-amber-400/40">
                    {{ baseline.label }} vs. Ronda #{{ entry.round }}
                  </span>
                </div>
              </div>

              <div class="space-y-1.5 text-[10px] font-mono">
                <!-- Honorarios -->
                <div class="p-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center justify-between">
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
                <div class="p-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center justify-between">
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

                <!-- CONDICIONES DE PAGO ESPECÍFICAS DE ESTA RONDA DEL HISTORIAL -->
                <div class="p-2 rounded-xl bg-cyan-950/60 border border-cyan-400/40 space-y-1 font-sans">
                  <span class="text-[9px] font-bold text-cyan-300 uppercase block">• Condiciones de Pago (Ronda #{{ entry.round }}):</span>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[9px]">
                    <div class="text-emerald-300 font-mono">
                      <span>Anticipo: </span>
                      <strong>&#36;{{ getAdvancePaymentAmount(entry) | number:'1.0-0' }} MXN</strong> ({{ getAdvancePaymentLabel(entry) }})
                    </div>
                    <div class="text-amber-300 font-mono">
                      <span>Límite Pago: </span>
                      <strong>{{ getPaymentDueDate(entry) }}</strong>
                    </div>
                    <div class="text-purple-300 font-mono truncate">
                      <span>Cuenta: </span>
                      <strong class="truncate">{{ getReceivingCardLabel(entry) }}</strong>
                    </div>
                  </div>
                </div>

                <!-- HITOS DE PAGO PROGRAMADOS EN ESTA RONDA DEL HISTORIAL -->
                @if (getPaymentMilestones(entry).length > 0) {
                  <div class="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5 font-sans">
                    <span class="text-[9px] font-bold text-cyan-300 uppercase block font-sans flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs text-cyan-400">calendar_month</span>
                      Hitos de Pago Programados (Ronda #{{ entry.round }}):
                    </span>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[8px] font-mono">
                      @for (m of getPaymentMilestones(entry); track m.id; let mIdx = $index) {
                        <div class="p-1.5 rounded bg-surface-container/90 border border-outline-variant/20 flex flex-col justify-between space-y-1">
                          <div class="flex justify-between font-bold text-on-surface">
                            <span class="truncate">#{{ mIdx + 1 }}. {{ m.label }}</span>
                            <span class="text-emerald-400">
                              {{ m.type === 'percentage' ? (m.percentageOrAmount + '%') : ('$' + (m.percentageOrAmount | number:'1.0-0')) }}
                            </span>
                          </div>
                          <div class="flex justify-between text-[9px] font-mono">
                            <span class="text-outline font-sans">Importe:</span>
                            <strong class="text-emerald-300 font-bold">&#36;{{ getMilestoneCalculatedAmount(m, entry.totalOffered) | number:'1.0-0' }} MXN</strong>
                          </div>
                          <div class="flex justify-between text-amber-300 text-[8px] font-sans pt-0.5 border-t border-outline-variant/10">
                            <span>Fecha:</span>
                            <strong class="font-mono">{{ m.dueDateOrTimeframe }}</strong>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Total Oferta -->
                <div class="flex justify-between text-amber-400 text-xs font-black pt-1.5 border-t border-amber-400/20 font-sans">
                  <span>OFERTA NEGOCIADA ENVIADA:</span>
                  <span class="font-mono">&#36;{{ entry.totalOffered | number:'1.0-0' }} MXN</span>
                </div>

                <!-- Nota de disquera -->
                @if (entry.adminProposalNote) {
                  <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-[10px] font-sans">
                    <span class="font-black uppercase text-[9px] block mb-0.5">MENSAJE ENVIADO EN RONDA #{{ entry.round }}:</span>
                    <p class="italic">&ldquo;{{ entry.adminProposalNote }}&rdquo;</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ROLLBACK ACTION CARD -->
      @if (!isHistoricalPreview) {
        <div class="pt-2">
          @if (isInNegotiation) {
            <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 pt-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-amber-400">undo</span> CORRECCIÓN O AJUSTE DE NEGOCIACIÓN
                </span>
                <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase border bg-amber-500/20 text-amber-300 border-amber-500/40">
                  SIN NOTIFICAR AL CLIENTE
                </span>
              </div>
              <p class="text-[10px] sm:text-xs text-outline leading-relaxed">
                Regresarás al wizard de Negociación para corregir cualquier ajuste de precio, horario o concepto enviado. Solo se pedirá un comentario interno opcional para la bitácora.
              </p>
              <button 
                (click)="openNegotiationRollback.emit()"
                class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span class="material-symbols-outlined text-base">undo</span> Regresar a Negociación
              </button>
            </div>
          } @else {
            <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 pt-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-amber-400">undo</span> CORRECCIÓN O MODIFICACIÓN DE PROPUESTA
                </span>
                <span [class]="clientViewed ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'" class="px-2 py-0.5 rounded text-[8px] font-bold uppercase border">
                  {{ clientViewed ? 'NOTIFICACIÓN REQUERIDA' : 'REVERSIÓN SILENCIOSA' }}
                </span>
              </div>
              <p class="text-[10px] sm:text-xs text-outline leading-relaxed">
                Regresarás la cotización a Fase 1 de Revisión para realizar ajustes administrativos en costos, viáticos, comisión o servicios.
              </p>
              <button 
                (click)="openRollback.emit()"
                class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span class="material-symbols-outlined text-base">undo</span> Regresar Cotización a Revisión
              </button>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class QuoteFinancialReceiptComponent {
  private mockData = inject(MockDataService);

  @Input() quote: Quote | null = null;
  @Input() isInNegotiation: boolean = false;
  @Input() clientViewed: boolean = false;
  @Input() negotiationHistory: NegotiationEntry[] = [];
  @Input() isHistoricalPreview: boolean = false;

  @Output() openNegotiationRollback = new EventEmitter<void>();
  @Output() openRollback = new EventEmitter<void>();

  getBaseline(idx: number): {
    artistFee: number;
    viaticosCost: number;
    soundCost: number;
    marginPercent: number;
    totalOffered: number;
    label: string;
  } {
    if (idx === 0) {
      return {
        artistFee: this.quote?.artistFee || 35000,
        viaticosCost: this.quote?.viaticosCost || 8500,
        soundCost: this.quote?.soundCost || 0,
        marginPercent: 20,
        totalOffered: this.quote?.totalAmount || 50000,
        label: 'Original'
      };
    }
    const prev = this.negotiationHistory[idx - 1];
    return {
      artistFee: prev.artistFee,
      viaticosCost: prev.viaticosCost,
      soundCost: prev.soundCost,
      marginPercent: prev.marginPercent,
      totalOffered: prev.totalOffered,
      label: `Ronda #${prev.round}`
    };
  }

  getAdvancePaymentAmount(entry?: NegotiationEntry | null): number {
    const total = entry ? entry.totalOffered : (this.quote?.totalAmount || 0);
    const type = entry?.advancePaymentType || this.quote?.advancePaymentType || 'percentage';
    const val = entry?.advancePaymentValue ?? this.quote?.advancePaymentValue ?? 50;
    if (type === 'percentage') {
      return (total * val) / 100;
    }
    return val;
  }

  getAdvancePaymentLabel(entry?: NegotiationEntry | null): string {
    const type = entry?.advancePaymentType || this.quote?.advancePaymentType || 'percentage';
    const val = entry?.advancePaymentValue ?? this.quote?.advancePaymentValue ?? 50;
    return type === 'percentage' ? `${val}% del total` : 'Monto Fijo';
  }

  getPaymentDueDate(entry?: NegotiationEntry | null): string {
    return entry?.paymentDueDate || this.quote?.paymentDueDate || '2026-08-25';
  }

  getReceivingCardLabel(entry?: NegotiationEntry | null): string {
    const cardId = entry?.receivingCardId || this.quote?.receivingCardId;
    const card = this.mockData.getReceivingCardById(cardId);
    return card ? `${card.bankName} (${card.cardNumber})` : 'BBVA México (**** 4921)';
  }

  getPaymentMilestones(entry?: NegotiationEntry | null): PaymentMilestone[] {
    return entry?.paymentMilestones || this.quote?.paymentMilestones || [];
  }

  getMilestoneCalculatedAmount(milestone: PaymentMilestone, totalAmount?: number): number {
    if (!milestone) return 0;
    const baseTotal = totalAmount ?? (this.quote?.totalAmount || 0);
    if (milestone.type === 'percentage') {
      return (baseTotal * milestone.percentageOrAmount) / 100;
    }
    return milestone.percentageOrAmount;
  }
}
