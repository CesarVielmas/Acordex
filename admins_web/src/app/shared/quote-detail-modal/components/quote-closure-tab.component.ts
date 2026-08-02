import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote } from '../../../core/models/admin.models';

@Component({
  selector: 'app-quote-closure-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-4 font-sans">

      @if (!quote?.isCycleSealed) {
        <!-- TARJETA CIERRE PENDIENTE -->
        <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-500/50 space-y-4 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div class="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-3xl mx-auto shadow-[0_0_25px_rgba(245,158,11,0.3)]">
            <span class="material-symbols-outlined text-3xl">hourglass_top</span>
          </div>

          <div class="max-w-xl mx-auto space-y-2">
            <h3 class="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wide">
              EXPEDIENTE EN PROCESO DE FINALIZACIÓN Y SELLO DEFINITIVO
            </h3>
            <p class="text-xs text-outline leading-relaxed">
              La fecha del evento es el <strong>{{ quote?.proposedDate }}</strong>. Una vez concluida la fecha y validados los hitos de pago al 100%, la administración procederá al sello inmutable.
            </p>
          </div>

          <div class="pt-2">
            <button
              [disabled]="isHistoricalPreview"
              (click)="sealCycle.emit()"
              class="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-105 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-symbols-outlined text-lg">verified_user</span>
              <span>Ejecutar Sello Definitivo de Cierre Disquera</span>
            </button>
          </div>
        </div>
      } @else {
        <!-- TARJETA SELLADA INMUTABLE CON CUPO COMPENSACIÓN -->
        <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-purple-950/90 border-2 border-emerald-500/60 space-y-5 text-center shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div class="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center justify-center font-black text-3xl mx-auto shadow-[0_0_30px_rgba(52,211,153,0.35)]">
            <span class="material-symbols-outlined text-3xl text-emerald-400">verified</span>
          </div>

          <div class="max-w-xl mx-auto space-y-2">
            <span class="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-widest">
              SELLO DEF. INMUTABLE SHA256-ACORDEX-2026-SEALED
            </span>
            <h3 class="text-base sm:text-lg font-black text-on-surface uppercase tracking-wide pt-1">
              EXPEDIENTE HISTÓRICO COMPLETADO AL 100% Y CONCLUIDO
            </h3>
            <p class="text-xs text-outline leading-relaxed">
              Cobranza y servicios concluidos con éxito. Todas las modificaciones han sido inhabilitadas para garantizar el estándar de auditoría disquera.
            </p>
          </div>

          <!-- SECCIÓN COMPENSACIÓN / DESCUENTO FIDELIZACIÓN OPCIONAL -->
          <div class="max-w-md mx-auto p-4 rounded-2xl bg-surface-container/90 border border-purple-500/40 text-left space-y-3 shadow-lg">
            <div class="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <span class="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-purple-400">card_giftcard</span>
                CUPÓN DE FIDELIZACIÓN / COMPENSACIÓN PARA CLIENTE
              </span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center text-outline">
                <span>Código del Cupón:</span>
                <strong class="text-purple-300 font-mono font-bold">{{ couponCode }}</strong>
              </div>
              <div class="flex justify-between items-center text-outline">
                <span>Bonificación:</span>
                <strong class="text-emerald-300 font-mono font-bold">{{ compensationDiscountValue }}% de Descuento</strong>
              </div>
              <button
                [disabled]="isHistoricalPreview"
                (click)="generateCoupon.emit()"
                class="w-full py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="material-symbols-outlined text-sm">local_offer</span>
                <span>Generar Nuevo Cupón de Fidelización</span>
              </button>
            </div>
          </div>

        </div>
      }

    </div>
  `
})
export class QuoteClosureTabComponent {
  @Input() quote: Quote | null = null;
  @Input() isHistoricalPreview: boolean = false;
  @Input() couponCode: string = '';
  @Input() compensationDiscountValue: number = 0;
  @Output() sealCycle = new EventEmitter<void>();
  @Output() generateCoupon = new EventEmitter<void>();
}
