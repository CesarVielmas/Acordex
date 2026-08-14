import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupFinancialPerformance } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Modal de Ficha Financiera Histórica del Artista / Grupo Musical.
 */
@Component({
  selector: 'app-modal-artist-statement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-2xl rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-3">
            <img
              [src]="talent().image"
              [alt]="talent().groupName"
              class="w-12 h-12 rounded-2xl object-cover border border-outline-variant/40"
            />
            <div>
              <h3 class="text-base font-black text-on-surface">{{ talent().groupName }}</h3>
              <p class="text-xs text-outline">{{ talent().genre }} · {{ talent().disqueraType }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Matriz de Indicadores Clave -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] text-outline uppercase block font-sans">Facturado Total</span>
            <span class="text-sm font-black text-on-surface">{{ money(talent().grossRevenueGenerated) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] text-outline uppercase block font-sans">Cachés Pagados</span>
            <span class="text-sm font-black text-rose-400">{{ money(talent().artistFeesReceived) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
            <span class="text-[9px] text-emerald-400 uppercase block font-sans font-bold">Utilidad Acordex</span>
            <span class="text-sm font-black text-emerald-300">{{ money(talent().netDisqueraProfit) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-purple-500/15 border border-purple-500/30">
            <span class="text-[9px] text-purple-300 uppercase block font-sans font-bold">Retorno ROI</span>
            <span class="text-sm font-black text-purple-300">{{ talent().roiPercent }}%</span>
          </div>
        </div>

        <!-- Desglose de Operación -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2 text-xs">
          <h4 class="text-xs font-bold text-on-surface">Resumen de Actividad Artística</h4>
          <div class="flex justify-between text-outline">
            <span>Total de Presentaciones Realizadas:</span>
            <span class="font-bold text-on-surface">{{ talent().totalShows }} shows</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Contrataciones Privadas (Bodas/XV/Empresariales):</span>
            <span class="font-bold text-on-surface">{{ talent().privateQuotesCount }} fechas</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Espectáculos Masivos (Palenques/Festivales):</span>
            <span class="font-bold text-on-surface">{{ talent().massiveEventsCount }} fechas</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Promedio Bruto Facturado por Show:</span>
            <span class="font-bold font-mono text-primary">{{ money(talent().avgTicketOrFee) }}</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Gasto de Viáticos Acumulado:</span>
            <span class="font-bold font-mono text-rose-400">{{ money(talent().viaticosSpent) }}</span>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-surface-container-high text-outline text-xs font-bold hover:text-on-surface"
          >
            Cerrar
          </button>
          <button
            type="button"
            (click)="printStatement()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-black shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-sm">print</span>
            Imprimir Estado de Cuenta
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalArtistStatementComponent {
  talent = input.required<GroupFinancialPerformance>();
  closed = output<void>();

  money = money;

  printStatement(): void {
    window.print();
  }
}
