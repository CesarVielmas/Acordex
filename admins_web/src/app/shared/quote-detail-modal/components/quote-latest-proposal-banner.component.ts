import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, NegotiationEntry, PaymentMilestone } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';

@Component({
  selector: 'app-quote-latest-proposal-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (latestEntry) {
      <div class="mt-4 sm:mt-5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-surface-container-high via-surface-container to-cyan-950/40 border-2 border-cyan-400/70 shadow-[0_0_35px_rgba(6,182,212,0.22)] space-y-4 relative overflow-hidden font-sans">
        
        <!-- Glow Line Accent Header -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400"></div>

        <!-- Card Header -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 pb-3 pt-1">
          <div class="flex items-center gap-3">
            <div class="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-inner shrink-0">
              <span class="material-symbols-outlined text-2xl sm:text-3xl">send</span>
            </div>
            <div class="space-y-0.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  ÚLTIMA RONDA ENVIADA • RONDA #{{ latestEntry.round }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-200 border border-cyan-400/30">
                  {{ baseline.label }} vs. Ronda #{{ latestEntry.round }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                  EN ESPERA DE DECISIÓN DEL CLIENTE
                </span>
              </div>
              <h3 class="text-sm sm:text-base font-black text-on-surface flex items-center gap-2 pt-0.5">
                <span>PROPUESTA ENVIADA A {{ quote?.clientName | uppercase }}</span>
                @if (latestEntry.timestamp) {
                  <span class="text-xs font-mono text-cyan-300 font-bold">({{ latestEntry.timestamp }})</span>
                }
              </h3>
            </div>
          </div>

          <div class="flex items-center gap-3 font-mono bg-cyan-500/10 p-2.5 rounded-2xl border border-cyan-400/30">
            <div class="space-y-0.5">
              <span class="text-[9px] text-outline font-bold uppercase block">Monto Oferta Actual:</span>
              <span class="text-base sm:text-xl font-black text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                &#36;{{ latestEntry.totalOffered | number:'1.0-0' }} MXN
              </span>
            </div>
            @if (totalReductionPercent > 0) {
              <span class="px-2 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                -{{ totalReductionPercent | number:'1.0-1' }}% 🔻
              </span>
            }
          </div>
        </div>

        <!-- DESTACADO DE CONDICIONES DE PAGO Y TARJETA RECEPTORA -->
        <div class="p-3 sm:p-3.5 rounded-2xl bg-cyan-950/70 border border-cyan-400/40 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span class="material-symbols-outlined text-lg">account_balance_wallet</span>
            </div>
            <div>
              <span class="text-[9px] font-mono text-cyan-300 font-bold uppercase block">1. Monto Mínimo (Anticipo):</span>
              <div class="flex items-baseline gap-1.5">
                <strong class="text-emerald-400 font-mono text-sm font-black">&#36;{{ advancePaymentAmount | number:'1.0-0' }} MXN</strong>
                <span class="text-[10px] text-emerald-300 font-mono">({{ advancePaymentLabel }})</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span class="material-symbols-outlined text-lg">event_upcoming</span>
            </div>
            <div>
              <span class="text-[9px] font-mono text-amber-300 font-bold uppercase block">2. Fecha Límite de Pago:</span>
              <strong class="text-amber-300 font-mono text-xs font-bold block">{{ paymentDueDate }}</strong>
            </div>
          </div>

          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <span class="material-symbols-outlined text-lg">credit_card</span>
            </div>
            <div>
              <span class="text-[9px] font-mono text-purple-300 font-bold uppercase block">3. Cuenta / Tarjeta Receptora:</span>
              <strong class="text-purple-300 font-mono text-xs font-bold block">{{ receivingCardLabel }}</strong>
            </div>
          </div>
        </div>

        <!-- HITOS / PARCIALIDADES DE PAGO PROGRAMADAS DE LA PROPUESTA -->
        @if (paymentMilestones && paymentMilestones.length > 0) {
          <div class="p-3 sm:p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2 text-xs shadow-inner">
            <span class="text-[9px] font-black text-cyan-300 uppercase tracking-wider block font-sans flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-cyan-400">calendar_month</span>
              HITOS DE PAGO PROGRAMADOS (PARCIALIDADES):
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              @for (m of paymentMilestones; track m.id; let mIdx = $index) {
                <div class="p-2 rounded-xl bg-surface-container/90 border border-outline-variant/20 flex flex-col justify-between font-mono space-y-1">
                  <div class="flex justify-between items-start text-[10px]">
                    <span class="font-bold text-on-surface font-sans truncate">#{{ mIdx + 1 }}. {{ m.label }}</span>
                    <span class="text-emerald-400 font-black">
                      {{ m.type === 'percentage' ? (m.percentageOrAmount + '%') : ('$' + (m.percentageOrAmount | number:'1.0-0') + ' MXN') }}
                    </span>
                  </div>
                  <div class="flex justify-between text-[9px]">
                    <span class="text-outline font-sans">Importe:</span>
                    <strong class="text-emerald-300 font-bold">&#36;{{ getMilestoneCalculatedAmount(m) | number:'1.0-0' }} MXN</strong>
                  </div>
                  <div class="flex justify-between items-center text-[9px] text-amber-300 pt-1 border-t border-outline-variant/10">
                    <span class="font-sans">Fecha:</span>
                    <strong class="font-mono">{{ m.dueDateOrTimeframe }}</strong>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- 3 COLUMNS BREAKDOWN OF THE LATEST SENT PROPOSAL -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          
          <!-- COL 1: FECHA Y HORARIOS ENVIADOS -->
          <div class="p-3.5 rounded-2xl bg-surface-container/90 border border-cyan-500/30 space-y-2">
            <span class="text-[9px] font-black text-cyan-300 uppercase tracking-wider block font-sans flex items-center gap-1">
              <span class="material-symbols-outlined text-sm text-cyan-400">schedule</span>
              1. FECHA Y HORARIOS ENVIADOS:
            </span>

            <div class="space-y-1.5 font-mono text-[11px]">
              <div class="flex justify-between text-emerald-300 font-bold p-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span>• Fecha Propuesta:</span>
                <span>{{ latestEntry.proposedDate || quote?.proposedDate }}</span>
              </div>
              
              @if (latestEntry.scheduleMode === 'tandas' && latestEntry.showBlocks && latestEntry.showBlocks.length > 0) {
                <div class="space-y-1 pt-1">
                  <span class="text-[9px] text-outline block font-sans font-bold">• Bloques de Tandas ({{ latestEntry.showBlocks.length }} sets):</span>
                  @for (blk of latestEntry.showBlocks; track blk.id) {
                    <div class="p-1.5 rounded-lg bg-surface-container-high border border-outline-variant/20 flex justify-between text-[10px] text-on-surface">
                      <span>{{ blk.label }}:</span>
                      <strong class="text-cyan-300">{{ blk.startTime }} - {{ blk.endTime }} hrs</strong>
                    </div>
                  }
                </div>
              } @else {
                <div class="flex justify-between text-on-surface p-1.5 bg-surface-container-high rounded-xl border border-outline-variant/20">
                  <span>• Horario Continuo:</span>
                  <strong class="text-amber-300">{{ latestEntry.startTime || '14:30' }} a {{ latestEntry.endTime || '17:30' }} hrs</strong>
                </div>
              }
            </div>
          </div>

          <!-- COL 2: TARIFAS, MARGEN DISQUERA Y SERVICIOS ENVIADOS CON PORCENTAJES COMPARATIVOS -->
          <div class="p-3.5 rounded-2xl bg-surface-container/90 border border-purple-500/30 space-y-2">
            <span class="text-[9px] font-black text-purple-300 uppercase tracking-wider block font-sans flex items-center gap-1">
              <span class="material-symbols-outlined text-sm text-purple-400">payments</span>
              2. TARIFAS Y SERVICIOS (VS. {{ baseline.label | uppercase }}):
            </span>

            <div class="space-y-1.5 text-[10px] font-mono">
              <!-- Honorarios -->
              <div class="flex justify-between p-1.5 bg-surface-container-high rounded-xl border border-outline-variant/20 items-center">
                <span class="text-outline">• Honorarios Grupo:</span>
                <div class="text-right">
                  <strong class="text-on-surface block">&#36;{{ latestEntry.artistFee | number:'1.0-0' }} MXN</strong>
                  <span [class]="artistFeeDiff < 0 ? 'text-emerald-400' : 'text-outline'" class="text-[8px] font-bold block">
                    {{ artistFeeDiff < 0 ? ('- ' + (artistFeeDiffPercent | number:'1.0-1') + '% 🔻') : '0%' }}
                  </span>
                </div>
              </div>

              <!-- Viáticos -->
              <div class="flex justify-between p-1.5 bg-surface-container-high rounded-xl border border-outline-variant/20 items-center">
                <span class="text-outline">• Viáticos & Logística:</span>
                <div class="text-right">
                  <strong class="text-on-surface block">&#36;{{ latestEntry.viaticosCost | number:'1.0-0' }} MXN</strong>
                  <span [class]="viaticosDiff < 0 ? 'text-emerald-400' : 'text-outline'" class="text-[8px] font-bold block">
                    {{ viaticosDiff < 0 ? ('- ' + (viaticosDiffPercent | number:'1.0-1') + '% 🔻') : '0%' }}
                  </span>
                </div>
              </div>

              <!-- MARGEN DE DISQUERA CON PORCENTAJE DE REDUCCIÓN VS RONDA ANTERIOR -->
              <div class="flex justify-between p-1.5 bg-purple-500/10 rounded-xl border border-purple-500/30 items-center text-purple-300">
                <span class="font-sans font-bold">• Margen Disquera:</span>
                <div class="text-right">
                  <strong class="block font-mono text-[10px]">{{ latestEntry.marginPercent }}%</strong>
                  <span [class]="marginDiff < 0 ? 'text-emerald-400' : 'text-outline'" class="text-[8px] font-bold block">
                    {{ marginDiff < 0 ? ('- ' + (Math.abs(marginDiff) | number:'1.0-1') + '% pts 🔻') : '0%' }}
                  </span>
                </div>
              </div>

              <!-- Servicio Audio -->
              <div class="flex justify-between p-1.5 bg-surface-container-high rounded-xl border border-outline-variant/20 items-center">
                <span class="text-outline">• Servicio Audio:</span>
                <strong class="text-purple-300 font-sans font-bold text-[9px]">
                  {{ latestEntry.soundOption === 'proveedor' || (latestEntry.soundCost && latestEntry.soundCost > 0) ? 'Proveedor' : 'Cliente' }} (&#36;{{ (latestEntry.soundCost || 0) | number:'1.0-0' }})
                </strong>
              </div>

              <!-- PLATAFORMA ACORDEX 5% FIJO -->
              <div class="flex justify-between p-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 items-center text-cyan-300">
                <span class="font-sans font-bold">• Acordex (5% Fijo):</span>
                <strong class="font-mono text-[10px]">&#36;{{ (latestEntry.totalOffered * 0.05) | number:'1.0-0' }} MXN</strong>
              </div>
            </div>
          </div>

          <!-- COL 3: MENSAJE DE DISQUERA Y AVISO SIN RECHAZO AÚN -->
          <div class="p-3.5 rounded-2xl bg-surface-container/90 border border-amber-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <span class="text-[9px] font-black text-amber-300 uppercase tracking-wider block font-sans flex items-center gap-1 mb-1">
                <span class="material-symbols-outlined text-sm text-amber-400">comment</span>
                3. MENSAJE ADJUNTO DE DISQUERA:
              </span>

              <p class="text-[11px] text-on-surface/90 italic bg-black/40 p-2.5 rounded-xl border border-amber-500/20 font-sans leading-relaxed">
                &ldquo;{{ latestEntry.adminProposalNote || 'Se envió propuesta comercial actualizada ajustando las tarifas y horarios solicitados para aprobación del cliente.' }}&rdquo;
              </p>
            </div>

            <div class="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[9px] text-cyan-300 font-sans flex items-center gap-1.5 mt-2">
              <span class="material-symbols-outlined text-base text-cyan-400 shrink-0">pending_actions</span>
              <span><strong>Sin motivo de rechazo del cliente:</strong> Esta propuesta está activa en espera de su decisión.</span>
            </div>
          </div>

        </div>
      </div>
    }
  `
})
export class QuoteLatestProposalBannerComponent {
  private mockData = inject(MockDataService);

  @Input() quote: Quote | null = null;
  @Input() latestEntry: NegotiationEntry | null = null;
  @Input() baseline: {
    artistFee: number;
    viaticosCost: number;
    soundCost: number;
    marginPercent: number;
    totalOffered: number;
    label: string;
  } = {
    artistFee: 35000,
    viaticosCost: 8500,
    soundCost: 0,
    marginPercent: 20,
    totalOffered: 50000,
    label: 'Original'
  };

  Math = Math;

  get advancePaymentAmount(): number {
    const total = this.latestEntry?.totalOffered || this.quote?.totalAmount || 0;
    const type = this.latestEntry?.advancePaymentType || this.quote?.advancePaymentType || 'percentage';
    const val = this.latestEntry?.advancePaymentValue ?? this.quote?.advancePaymentValue ?? 50;
    if (type === 'percentage') {
      return (total * val) / 100;
    }
    return val;
  }

  get advancePaymentLabel(): string {
    const type = this.latestEntry?.advancePaymentType || this.quote?.advancePaymentType || 'percentage';
    const val = this.latestEntry?.advancePaymentValue ?? this.quote?.advancePaymentValue ?? 50;
    return type === 'percentage' ? `${val}% del total` : 'Monto Fijo';
  }

  get paymentDueDate(): string {
    return this.latestEntry?.paymentDueDate || this.quote?.paymentDueDate || '2026-08-25';
  }

  get receivingCardLabel(): string {
    const cardId = this.latestEntry?.receivingCardId || this.quote?.receivingCardId;
    const card = this.mockData.getReceivingCardById(cardId);
    return card ? `${card.bankName} (${card.cardNumber})` : 'BBVA México (**** 4921)';
  }

  get paymentMilestones(): PaymentMilestone[] {
    return this.latestEntry?.paymentMilestones || this.quote?.paymentMilestones || [];
  }

  getMilestoneCalculatedAmount(milestone: PaymentMilestone): number {
    if (!milestone) return 0;
    const baseTotal = this.latestEntry?.totalOffered || this.quote?.totalAmount || 0;
    if (milestone.type === 'percentage') {
      return (baseTotal * milestone.percentageOrAmount) / 100;
    }
    return milestone.percentageOrAmount;
  }

  get totalReductionPercent(): number {
    if (!this.latestEntry || !this.baseline.totalOffered) return 0;
    const diff = this.latestEntry.totalOffered - this.baseline.totalOffered;
    return diff < 0 ? ((Math.abs(diff) / this.baseline.totalOffered) * 100) : 0;
  }

  get artistFeeDiff(): number {
    if (!this.latestEntry) return 0;
    return this.latestEntry.artistFee - this.baseline.artistFee;
  }

  get artistFeeDiffPercent(): number {
    if (!this.baseline.artistFee) return 0;
    return (Math.abs(this.artistFeeDiff) / this.baseline.artistFee) * 100;
  }

  get viaticosDiff(): number {
    if (!this.latestEntry) return 0;
    return this.latestEntry.viaticosCost - this.baseline.viaticosCost;
  }

  get viaticosDiffPercent(): number {
    if (!this.baseline.viaticosCost) return 0;
    return (Math.abs(this.viaticosDiff) / this.baseline.viaticosCost) * 100;
  }

  get marginDiff(): number {
    if (!this.latestEntry) return 0;
    return this.latestEntry.marginPercent - this.baseline.marginPercent;
  }
}
