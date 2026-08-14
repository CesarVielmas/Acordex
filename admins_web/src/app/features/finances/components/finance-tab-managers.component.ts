import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerSettlementSummary, ManagerSettlementEventDetail } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Pestaña de Liquidaciones & Convenios con Managers Co-organizadores (Splits).
 *
 * Monitorea el reparto de utilidades en eventos masivos co-producidos,
 * el estado de las firmas de finiquito y la emisión de carátulas oficiales.
 */
@Component({
  selector: 'app-finance-tab-managers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">

      <!-- KPIS DE MANAGERS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Utilidades Compartidas -->
        <div class="p-5 rounded-3xl bg-surface-container border border-amber-500/30 shadow-lg space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-400">Total Utilidad Compartida</span>
          <p class="text-xl sm:text-2xl font-black text-amber-300 font-mono">{{ money(totalManagerShare()) }}</p>
          <p class="text-[10px] text-outline">Pactado con co-organizadores</p>
        </div>

        <!-- Pagado a Managers -->
        <div class="p-5 rounded-3xl bg-surface-container border border-emerald-500/30 shadow-lg space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400">Finiquitado / Pagado</span>
          <p class="text-xl sm:text-2xl font-black text-emerald-300 font-mono">{{ money(totalPaid()) }}</p>
          <p class="text-[10px] text-outline">Con cheque o transferencia conciliada</p>
        </div>

        <!-- Pendiente por Liquidar -->
        <div class="p-5 rounded-3xl bg-surface-container border border-rose-500/30 shadow-lg space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-rose-400">Pendiente de Liquidar</span>
          <p class="text-xl sm:text-2xl font-black text-rose-400 font-mono">{{ money(totalPending()) }}</p>
          <p class="text-[10px] text-outline">En espera de firma o dispersión</p>
        </div>

        <!-- Retenido por Acordex -->
        <div class="p-5 rounded-3xl bg-surface-container border border-primary/30 shadow-lg space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-primary">Retenido Acordex Records</span>
          <p class="text-xl sm:text-2xl font-black text-primary font-mono">{{ money(totalAcordexRetained()) }}</p>
          <p class="text-[10px] text-outline">Margen neto institucional</p>
        </div>
      </div>

      <!-- LISTADO DE MANAGERS Y CONVENIOS -->
      <div class="space-y-4">
        @for (mgr of settlements(); track mgr.managerName) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">

            <!-- Encabezado del Manager -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center material-symbols-outlined text-xl">
                  handshake
                </span>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-base font-black text-on-surface">{{ mgr.managerName }}</h3>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border"
                      [class]="mgr.status === 'finiquitado'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : mgr.status === 'pendiente_firma'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'">
                      {{ mgr.status === 'finiquitado' ? 'Finiquitado' : mgr.status === 'pendiente_firma' ? 'Pendiente de Firma' : 'Pendiente de Pago' }}
                    </span>
                  </div>
                  <p class="text-xs text-outline">{{ mgr.totalEventsCoOrganized }} evento(s) en co-producción con Acordex Records</p>
                </div>
              </div>

              <!-- Balance del Manager -->
              <div class="flex items-center gap-6 font-mono text-right">
                <div>
                  <span class="text-[10px] text-outline block uppercase font-sans">Finiquito Total</span>
                  <span class="text-sm font-bold text-amber-300">{{ money(mgr.managerShareAmount) }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-outline block uppercase font-sans">Por Liquidar</span>
                  <span class="text-sm font-black"
                    [class]="mgr.pendingAmount > 0 ? 'text-rose-400' : 'text-emerald-400'">
                    {{ money(mgr.pendingAmount) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Tabla de Eventos del Manager -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="text-outline text-[10px] font-black uppercase tracking-wider font-mono border-b border-outline-variant/20">
                  <tr>
                    <th class="py-2.5 px-3">Evento / Fecha</th>
                    <th class="py-2.5 px-3">Taquilla Bruta</th>
                    <th class="py-2.5 px-3">Gastos Compartidos</th>
                    <th class="py-2.5 px-3">Utilidad Neta</th>
                    <th class="py-2.5 px-3">Convenio</th>
                    <th class="py-2.5 px-3 text-right">Pago al Manager</th>
                    <th class="py-2.5 px-3 text-center">Firma Finiquito</th>
                    <th class="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/15">
                  @for (ev of mgr.events; track ev.eventId) {
                    <tr class="hover:bg-surface-container-high/40 transition-colors">
                      <td class="py-3 px-3">
                        <span class="font-bold text-on-surface block">{{ ev.title }}</span>
                        <span class="text-[10px] text-outline font-mono">{{ ev.date }}</span>
                      </td>
                      <td class="py-3 px-3 font-mono">{{ money(ev.grossRevenue) }}</td>
                      <td class="py-3 px-3 font-mono text-rose-400">-{{ money(ev.productionExpenses) }}</td>
                      <td class="py-3 px-3 font-mono font-bold text-emerald-400">{{ money(ev.netResult) }}</td>
                      <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded-md bg-surface-container-high border border-outline-variant/30 text-[10px] font-mono">
                          {{ ev.agreementKind === 'porcentaje' ? (ev.agreementValue + '% utilidad') : ('Fijo: ' + money(ev.agreementValue)) }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-right font-mono font-black text-amber-300">
                        {{ money(ev.managerShareAmount) }}
                      </td>
                      <td class="py-3 px-3 text-center">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1"
                          [class]="ev.isConfirmed
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'">
                          <span class="material-symbols-outlined text-[11px]">
                            {{ ev.isConfirmed ? 'verified' : 'pending' }}
                          </span>
                          {{ ev.isConfirmed ? 'Firmado' : 'Pendiente' }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-right">
                        <button
                          type="button"
                          (click)="openSettlementCaratula.emit({ manager: mgr, event: ev })"
                          class="px-2.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/30 text-[11px] font-bold transition-all inline-flex items-center gap-1"
                        >
                          <span class="material-symbols-outlined text-[13px]">description</span>
                          Carátula
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class FinanceTabManagersComponent {
  settlements = input.required<ManagerSettlementSummary[]>();
  openSettlementCaratula = output<{ manager: ManagerSettlementSummary; event: ManagerSettlementEventDetail }>();

  money = money;

  totalManagerShare = computed(() => this.settlements().reduce((s, m) => s + m.managerShareAmount, 0));
  totalPaid = computed(() => this.settlements().reduce((s, m) => s + m.paidAmount, 0));
  totalPending = computed(() => this.settlements().reduce((s, m) => s + m.pendingAmount, 0));
  totalAcordexRetained = computed(() => this.settlements().reduce((s, m) => s + m.acordexShareAmount, 0));
}
