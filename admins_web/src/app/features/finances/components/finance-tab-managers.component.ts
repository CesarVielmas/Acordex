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
        <div class="p-5 rounded-3xl bg-[#181818] border border-amber-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 font-['Epilogue']">Participación a Co-Productores</span>
          <p class="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">{{ money(totalManagerShare()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">Splits pactados en co-organización</p>
        </div>

        <!-- Pagado a Managers -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-emerald-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-['Epilogue']">Finiquitado & Dispersado</span>
          <p class="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">{{ money(totalPaid()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">Transferencias conciliadas con acta</p>
        </div>

        <!-- Pendiente por Liquidar -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-rose-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-rose-400 font-['Epilogue']">Pendiente de Liquidación</span>
          <p class="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">{{ money(totalPending()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">En proceso de firma o dispersión</p>
        </div>

        <!-- Retenido por Acordex -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-primary/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-primary font-['Epilogue']">Margen Neto Acordex</span>
          <p class="text-xl sm:text-2xl font-black text-primary font-mono tracking-tight">{{ money(totalAcordexRetained()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">Utilidad neta institucional retenida</p>
        </div>
      </div>

      <!-- LISTADO DE MANAGERS Y CONVENIOS -->
      <div class="space-y-4">
        @for (mgr of settlements(); track mgr.managerName) {
          <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-4">

            <!-- Encabezado del Manager -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center material-symbols-outlined text-xl shadow-inner">
                  handshake
                </span>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-base font-black text-on-surface font-['Epilogue']">{{ mgr.managerName }}</h3>
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
                  <span class="text-[10px] text-outline block uppercase font-sans font-['Epilogue']">Finiquito Acordado</span>
                  <span class="text-sm font-bold text-amber-300">{{ money(mgr.managerShareAmount) }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-outline block uppercase font-sans font-['Epilogue']">Por Liquidar</span>
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
                <thead class="text-outline text-[10px] font-black uppercase tracking-wider font-mono border-b border-white/10 bg-[#141414]">
                  <tr>
                    <th class="py-2.5 px-3">Evento / Fecha</th>
                    <th class="py-2.5 px-3">Taquilla Bruta</th>
                    <th class="py-2.5 px-3">Costos de Producción</th>
                    <th class="py-2.5 px-3">Utilidad Bruta</th>
                    <th class="py-2.5 px-3">Convenio Co-prod</th>
                    <th class="py-2.5 px-3 text-right">Liquidación a Manager</th>
                    <th class="py-2.5 px-3 text-center">Firma de Finiquito</th>
                    <th class="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  @for (ev of mgr.events; track ev.eventId) {
                    <tr class="hover:bg-[#1E1E1E]/50 transition-colors">
                      <td class="py-3 px-3">
                        <span class="font-bold text-on-surface block font-['Epilogue']">{{ ev.title }}</span>
                        <span class="text-[10px] text-outline font-mono">{{ ev.date }}</span>
                      </td>
                      <td class="py-3 px-3 font-mono">{{ money(ev.grossRevenue) }}</td>
                      <td class="py-3 px-3 font-mono text-rose-400">-{{ money(ev.productionExpenses) }}</td>
                      <td class="py-3 px-3 font-mono font-bold text-emerald-400">{{ money(ev.netResult) }}</td>
                      <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded-md bg-[#202020] border border-white/10 text-[10px] font-mono">
                          {{ ev.agreementKind === 'porcentaje' ? (ev.agreementValue + '% utilidad') : ('Fijo: ' + money(ev.agreementValue)) }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-right font-mono font-black text-amber-300">
                        {{ money(ev.managerShareAmount) }}
                      </td>
                      <td class="py-3 px-3 text-center">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 font-mono"
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
                          class="px-2.5 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-primary border border-white/10 text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer font-['Epilogue']"
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
