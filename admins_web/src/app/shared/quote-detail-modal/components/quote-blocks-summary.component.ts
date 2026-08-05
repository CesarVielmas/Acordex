import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, PaymentMilestone } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';
import { QuotePaymentMilestonesGridComponent } from './quote-payment-milestones-grid.component';

@Component({
  selector: 'app-quote-blocks-summary',
  standalone: true,
  imports: [CommonModule, QuotePaymentMilestonesGridComponent],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">

      <!-- BLOQUE 1: DURACIÓN Y HORARIOS DEL SHOW -->
      <div class="p-3.5 rounded-2xl bg-surface-container/90 border border-emerald-500/30 space-y-2.5 shadow-md hover:border-emerald-400/50 transition-all">
        <span class="text-emerald-400 text-[10px] font-black uppercase block font-sans tracking-wider flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">schedule</span> 1. Duración & Horario del Show:
        </span>
        <div class="space-y-1.5">
          <div class="flex justify-between text-[11px]">
            <span class="text-outline">Duración Contratada:</span>
            <strong class="text-amber-300 font-mono font-black">{{ quote?.durationHours || 3 }} Horas Totales</strong>
          </div>
          <div class="flex justify-between text-[11px]">
            <span class="text-outline">Formato Presentación:</span>
            <strong class="text-purple-300 font-sans font-bold">
              {{ hasTandas() ? 'Tandas / Bloques' : 'Show Continuo' }}
            </strong>
          </div>
        </div>

        <!-- DESGLOSE DE TANDAS O CONTINUO -->
        <div class="p-2.5 rounded-xl bg-surface-container-high/90 border border-outline-variant/20 space-y-1 font-mono text-[10px]">
          @if (hasTandas()) {
            @for (block of showBlocks(); track block.id; let bIdx = $index) {
              <div class="flex justify-between text-on-surface">
                <span class="text-amber-300 font-sans">• Tanda #{{ bIdx + 1 }}:</span>
                <strong class="font-bold">{{ block.startTime }} - {{ block.endTime }} hrs</strong>
              </div>
            }
          } @else {
            <div class="flex justify-between text-cyan-300">
              <span class="font-sans">• Show Continuo:</span>
              <strong class="font-bold">21:00 a 00:00 hrs</strong>
            </div>
          }
        </div>
      </div>

      <!-- BLOQUE 2: SERVICIO DE AUDIO & LOGÍSTICA -->
      <div class="p-3.5 rounded-2xl bg-surface-container/90 border border-purple-500/30 space-y-2.5 shadow-md hover:border-purple-400/50 transition-all">
        <span class="text-purple-300 text-[10px] font-black uppercase block font-sans tracking-wider flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">speaker</span> 2. Servicio de Audio & Recinto:
        </span>
        <div class="space-y-1.5">
          <div class="flex justify-between text-[11px]">
            <span class="text-outline">Servicio de Audio:</span>
            <strong class="text-purple-300 font-sans font-bold">
              {{ quote?.soundOption === 'proveedor' || (quote?.soundCost && quote!.soundCost! > 0) ? 'Incluye Audio Disquera' : 'Trae el Cliente' }}
            </strong>
          </div>
          <div class="flex justify-between text-[11px] min-w-0">
            <span class="text-outline shrink-0">Recinto / Lugar:</span>
            <strong class="text-on-surface font-sans font-bold text-right break-words">{{ quote?.venue }}</strong>
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-surface-container-high/90 border border-outline-variant/20 space-y-1 font-sans text-[10px]">
          <span class="text-outline block text-[9px] uppercase font-bold">Dirección Completa:</span>
          <p class="font-bold text-on-surface break-words whitespace-normal">{{ quote?.eventAddress || (quote?.venue + ', ' + quote?.city) }}</p>
        </div>
      </div>

      <!-- BLOQUE 3: DESGLOSE FINANCIERO ACEPTADO -->
      <div class="p-3.5 rounded-2xl bg-surface-container/90 border-2 border-amber-400/50 space-y-2.5 font-mono shadow-xl">
        <div class="flex items-center justify-between border-b border-amber-400/20 pb-1.5">
          <span class="text-amber-400 text-[10px] font-black uppercase tracking-wider font-sans flex items-center gap-1">
            <span class="material-symbols-outlined text-sm text-amber-400">receipt_long</span> 3. DESGLOSE FINANCIERO ACEPTADO:
          </span>
          <span class="text-[8px] font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">5% ACORDEX</span>
        </div>

        <div class="space-y-1.5 text-[10px]">
          <div class="flex justify-between text-outline">
            <span>Honorarios del Grupo:</span>
            <strong class="text-on-surface">&#36;{{ (quote?.artistFee || 35000) | number:'1.0-0' }} MXN</strong>
          </div>

          <div class="flex justify-between text-outline">
            <span>Viáticos & Hospedaje:</span>
            <strong class="text-on-surface">&#36;{{ (quote?.viaticosCost || 8500) | number:'1.0-0' }} MXN</strong>
          </div>

          <div class="flex justify-between text-outline">
            <span>Equipo de Audio Profesional:</span>
            <strong class="text-purple-300">&#36;{{ (quote?.soundCost || 0) | number:'1.0-0' }} MXN</strong>
          </div>

          <div class="flex justify-between text-purple-300">
            <span>Margen Disquera / Agencia:</span>
            <strong>&#36;{{ (quote?.marginAmount || 7000) | number:'1.0-0' }} MXN</strong>
          </div>

          <div class="flex justify-between text-cyan-400">
            <span>Comisión Plataforma (5% Fijo):</span>
            <strong>&#36;{{ ((quote?.totalAmount || 50000) * 0.05) | number:'1.0-0' }} MXN</strong>
          </div>

          @if (quote?.includeIva) {
            <div class="flex justify-between text-blue-300">
              <span>Impuesto IVA (+16% Facturado):</span>
              <strong>&#36;{{ ((quote?.totalAmount || 50000) * 0.16) | number:'1.0-0' }} MXN</strong>
            </div>
          }

          <div class="flex justify-between text-amber-400 font-bold border-t border-amber-400/30 pt-2 font-sans text-xs sm:text-sm">
            <span class="uppercase tracking-wider font-black">TOTAL COMERCIAL ACEPTADO:</span>
            <span class="font-mono font-black text-amber-300 text-sm sm:text-base drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              &#36;{{ quote?.totalAmount | number:'1.0-0' }} MXN
            </span>
          </div>
        </div>
      </div>

      <!-- BLOQUE 4: CONDICIONES FINALES DE PAGO Y CUENTA RECEPTORA -->
      <div class="md:col-span-3 p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-surface-container-high to-surface-container border-2 border-emerald-500/60 space-y-3 font-sans shadow-xl">
        <div class="flex items-center justify-between border-b border-emerald-500/30 pb-2">
          <span class="text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 font-sans">
            <span class="material-symbols-outlined text-base text-emerald-400">verified_user</span>
            4. CONDICIONES FINALES DE PAGO ACEPTADAS (CONTRATO)
          </span>
          <span class="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> VIGENTE & REGISTRADO
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div class="p-3 rounded-xl bg-surface-container/90 border border-emerald-500/30 space-y-1 shadow-sm">
            <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-sans">1. Monto Mínimo (Anticipo):</span>
            <strong class="text-emerald-400 font-mono text-sm font-black block">&#36;{{ advancePaymentAmount() | number:'1.0-0' }} MXN</strong>
            <span class="text-[10px] text-emerald-300 font-mono font-semibold">({{ advancePaymentLabel() }})</span>
          </div>

          <div class="p-3 rounded-xl bg-surface-container/90 border border-amber-500/30 space-y-1 shadow-sm">
            <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-sans">2. Fecha Límite de Pago Saldo:</span>
            <strong class="text-amber-300 font-mono text-sm font-black block flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-amber-400">event</span>
              {{ quote?.paymentDueDate || '2026-08-25' }}
            </strong>
            <span class="text-[9px] text-outline block">Fecha límite final para liquidar saldo.</span>
          </div>

          <div class="p-3 rounded-xl bg-surface-container/90 border border-purple-500/30 space-y-1 shadow-sm">
            <span class="text-outline text-[9px] font-bold uppercase tracking-wider block font-sans">3. Cuenta / Tarjeta Receptora:</span>
            <strong class="text-purple-300 font-mono text-xs font-bold block flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-purple-400">credit_card</span>
              {{ receivingCardLabel() }}
            </strong>
          </div>
        </div>
      </div>

      <!-- BLOQUE 5: HITOS Y PROGRAMACIÓN DE PARCIALIDADES DE PAGO ACEPTADAS -->
      <app-quote-payment-milestones-grid [milestones]="milestones()" [totalAmount]="quote?.totalAmount || 0" />
    </div>
  `
})
export class QuoteBlocksSummaryComponent {
  private mockData = inject(MockDataService);

  @Input() quote: Quote | null = null;

  hasTandas(): boolean {
    return this.quote?.scheduleMode === 'tandas' && !!this.quote?.showBlocks && this.quote.showBlocks.length > 0;
  }

  showBlocks() {
    return this.quote?.showBlocks || [];
  }

  milestones(): PaymentMilestone[] {
    const milestones = this.quote?.paymentMilestones;
    if (milestones && milestones.length > 0) {
      return milestones;
    }
    const dueDate = this.quote?.paymentDueDate || '2026-08-25';
    return [
      { id: 'm1_def', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
      { id: 'm2_def', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
      { id: 'm3_def', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: dueDate }
    ];
  }

  advancePaymentAmount(): number {
    const q = this.quote;
    const total = q?.totalAmount || 0;
    const type = q?.advancePaymentType || 'percentage';
    const val = q?.advancePaymentValue ?? 50;
    return type === 'percentage' ? total * (val / 100) : val;
  }

  advancePaymentLabel(): string {
    const q = this.quote;
    const type = q?.advancePaymentType || 'percentage';
    const val = q?.advancePaymentValue ?? 50;
    return type === 'percentage' ? val + '% del total' : '$' + val + ' MXN Fijo';
  }

  receivingCardLabel(): string {
    const cardId = this.quote?.receivingCardId;
    const card = this.mockData.getReceivingCardById(cardId);
    return card ? `${card.bankName} - ${card.accountHolder} (${card.cardNumber})` : 'BBVA México - Acordex (**** 4821)';
  }
}
