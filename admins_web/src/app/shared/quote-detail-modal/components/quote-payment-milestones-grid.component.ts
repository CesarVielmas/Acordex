import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentMilestone } from '../../../core/models/admin.models';

@Component({
  selector: 'app-quote-payment-milestones-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (milestones.length > 0) {
      <div class="md:col-span-3 p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-surface-container-high to-slate-900 border-2 border-cyan-500/60 space-y-3.5 font-sans shadow-2xl backdrop-blur-xl">
        <div class="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
          <span class="text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 font-sans">
            <span class="material-symbols-outlined text-base text-cyan-400 animate-bounce">calendar_month</span>
            {{ title }}
          </span>
          <span class="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            {{ milestones.length }} Parcialidades Programadas
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          @for (m of milestones; track m.id; let mIdx = $index) {
            <div class="p-3.5 rounded-xl bg-surface-container/90 border border-cyan-500/40 flex flex-col justify-between text-xs space-y-2.5 shadow-md hover:border-cyan-400 hover:-translate-y-0.5 transition-all">
              <div class="flex items-center justify-between border-b border-outline-variant/15 pb-2">
                <span class="font-extrabold text-on-surface text-xs truncate flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  #{{ mIdx + 1 }}. {{ m.label }}
                </span>
                <span class="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {{ m.type === 'percentage' ? (m.percentageOrAmount + '%') : ('$' + (m.percentageOrAmount | number:'1.0-0') + ' MXN') }}
                </span>
              </div>

              <div class="space-y-1.5 font-mono">
                <div class="flex justify-between items-baseline">
                  <span class="text-[10px] text-outline font-sans">Importe Neto:</span>
                  <strong class="text-emerald-400 font-black text-sm text-shadow-sm">&#36;{{ calculatedAmount(m) | number:'1.0-0' }} MXN</strong>
                </div>
                <div class="flex justify-between items-baseline pt-1.5 border-t border-outline-variant/10">
                  <span class="text-[10px] text-outline font-sans flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs text-amber-400">event</span>
                    Fecha / Límite:
                  </span>
                  <strong class="text-amber-300 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{{ m.dueDateOrTimeframe }}</strong>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class QuotePaymentMilestonesGridComponent {
  @Input() milestones: PaymentMilestone[] = [];
  @Input() totalAmount: number = 0;
  @Input() title: string = '5. HITOS Y PROGRAMACIÓN DE PARCIALIDADES DE PAGO ACEPTADAS (DEFINITIVAS)';

  calculatedAmount(m: PaymentMilestone): number {
    if (m.type === 'percentage') {
      return (this.totalAmount * m.percentageOrAmount) / 100;
    }
    return m.percentageOrAmount;
  }
}
