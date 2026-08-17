import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerSettlementSummary, ManagerSettlementEventDetail } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Modal de Carátula Oficial de Finiquito y Liquidación a Manager Co-organizador.
 */
@Component({
  selector: 'app-modal-manager-settlement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-xl rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center material-symbols-outlined text-xl shadow-inner">
              description
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface font-['Epilogue']">Carátula de Liquidación de Co-producción</h3>
              <p class="text-[11px] text-outline font-['Epilogue']">{{ manager().managerName }} · {{ event().title }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-[#222222] text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Carátula Auditada Imprimible -->
        <div class="p-6 rounded-2xl bg-[#141414] border border-white/5 space-y-4 font-mono text-xs shadow-inner">

          <div class="flex justify-between items-center border-b border-white/10 pb-3">
            <div>
              <span class="font-sans font-black text-sm text-on-surface block font-['Epilogue']">Acordex Records & Representaciones</span>
              <span class="text-[10px] text-outline font-sans">Convenio de Co-producción Masiva</span>
            </div>
            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold border"
              [class]="event().isConfirmed
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'">
              {{ event().isConfirmed ? 'FINIQUITO FIRMADO' : 'PENDIENTE DE FIRMA' }}
            </span>
          </div>

          <!-- Datos del Evento -->
          <div class="space-y-1 font-sans">
            <p class="font-bold text-on-surface text-sm font-['Epilogue']">{{ event().title }}</p>
            <p class="text-xs text-outline">Fecha de Realización: {{ event().date }} · Co-organizador: {{ manager().managerName }}</p>
          </div>

          <!-- Desglose Matemático del Evento -->
          <div class="space-y-2 border-t border-b border-white/10 py-3">
            <div class="flex justify-between">
              <span class="font-sans text-on-surface font-['Epilogue']">1. Taquilla Bruta Recaudada:</span>
              <span class="font-bold text-primary">{{ money(event().grossRevenue) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-sans text-rose-400 font-['Epilogue']">2. Menos: Gastos Directos de Producción:</span>
              <span class="font-bold text-rose-400">-{{ money(event().productionExpenses) }}</span>
            </div>
            <div class="flex justify-between font-bold text-emerald-400 pt-1 border-t border-white/5">
              <span class="font-sans font-['Epilogue']">3. Utilidad Operativa a Distribuir:</span>
              <span>{{ money(event().netResult) }}</span>
            </div>
          </div>

          <!-- Cálculo del Split -->
          <div class="p-3.5 rounded-xl bg-[#1A1A1A] border border-white/5 space-y-2 font-sans">
            <div class="flex justify-between items-center text-xs">
              <span class="text-outline font-['Epilogue']">Cláusula de Participación Pactada:</span>
              <span class="font-bold font-mono text-on-surface">
                {{ event().agreementKind === 'porcentaje' ? (event().agreementValue + '% de la utilidad neta') : ('Monto fijo de ' + money(event().agreementValue)) }}
              </span>
            </div>

            <div class="flex justify-between items-center text-sm pt-2 border-t border-white/10">
              <span class="font-black text-amber-300 font-['Epilogue']">Importe a Liquidar al Co-productor:</span>
              <span class="font-mono font-black text-base text-amber-300">{{ money(event().managerShareAmount) }}</span>
            </div>
          </div>

          <!-- Estado de Pago -->
          <div class="p-3 rounded-xl bg-black/60 border border-white/5 text-[10px] text-outline flex items-center justify-between">
            <div>
              <span class="block text-on-surface font-sans font-bold font-['Epilogue']">Estado de Dispersión Bancaria:</span>
              <span>{{ event().isPaid ? 'Transferencia SPEI Conciliada' : 'Pendiente de dispersión bancaria' }}</span>
            </div>
            @if (event().receiptReference) {
              <span class="font-mono text-primary font-bold">{{ event().receiptReference }}</span>
            }
          </div>

        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-[#222222] text-outline text-xs font-bold hover:text-on-surface cursor-pointer font-['Epilogue']"
          >
            Cerrar
          </button>
          @if (!event().isPaid) {
            <button
              type="button"
              (click)="payManager.emit({ manager: manager(), event: event() })"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
            >
              <span class="material-symbols-outlined text-sm">payments</span>
              Dispersar Liquidación
            </button>
          }
          <button
            type="button"
            (click)="printSettlement()"
            class="px-4 py-2.5 rounded-xl bg-[#202020] hover:bg-[#282828] text-on-surface text-xs font-bold transition-all flex items-center gap-1 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-sm">print</span>
            Imprimir
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalManagerSettlementComponent {
  manager = input.required<ManagerSettlementSummary>();
  event = input.required<ManagerSettlementEventDetail>();

  closed = output<void>();
  payManager = output<{ manager: ManagerSettlementSummary; event: ManagerSettlementEventDetail }>();

  money = money;

  printSettlement(): void {
    window.print();
  }
}
