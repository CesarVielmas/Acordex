import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentMilestone } from '../../../core/models/admin.models';

@Component({
  selector: 'app-quote-payment-milestones-grid',
  standalone: true,
  imports: [CommonModule],
  // Sin esto, este componente (insertado como item directo de un grid de 3 columnas en sus
  // usos actuales) se convierte el mismo en UN solo item del grid del padre, y el
  // "md:col-span-3" de su div raiz no tiene ningun efecto porque no es hijo directo de ese
  // grid. "contents" saca el host del arbol de caja para que sus hijos hereden la posicion
  // de grid del padre como si estuvieran ahi directamente.
  host: { class: 'contents' },
  template: `
    @if (milestones.length > 0) {
      <div class="md:col-span-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-cyan-500/40 space-y-4 font-sans shadow-xl">
        <div class="flex items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
          <span class="text-cyan-300 text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2 font-sans">
            <span class="material-symbols-outlined text-base text-cyan-400">calendar_month</span>
            {{ title }}
          </span>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
            {{ milestones.length }} Parcialidades
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          @for (m of milestones; track m.id; let mIdx = $index) {
            <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2.5 shadow-sm hover:border-cyan-400/60 transition-all">
              <div class="flex items-start justify-between gap-2">
                <span class="font-bold text-on-surface text-xs leading-snug flex items-start gap-1.5 min-w-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0"></span>
                  <span class="min-w-0">#{{ mIdx + 1 }}. {{ m.label }}</span>
                </span>
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                  {{ m.type === 'percentage' ? (m.percentageOrAmount + '%') : ('$' + (m.percentageOrAmount | number:'1.0-0')) }}
                </span>
              </div>

              <div class="space-y-1.5 pt-2 border-t border-outline-variant/15 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-outline">Importe Neto:</span>
                  <strong class="text-emerald-400 font-black font-mono">&#36;{{ calculatedAmount(m) | number:'1.0-0' }} MXN</strong>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-outline flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs text-amber-400">event</span>
                    Fecha / Límite:
                  </span>
                  <strong class="text-amber-300 font-mono font-bold">{{ m.dueDateOrTimeframe }}</strong>
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
