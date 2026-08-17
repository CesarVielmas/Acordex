import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayableItem } from '../../../core/models/finance.models';
import { money, calcPercent } from '../finance-metrics';

/**
 * Pestaña de Cuentas por Pagar (C x P - Artistas & Proveedores).
 *
 * Administra las obligaciones y dispersiones de fondos pendientes hacia
 * los grupos musicales del cartel, proveedores de audio/luces, recintos y viáticos.
 */
@Component({
  selector: 'app-finance-tab-payables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- KPIS DE PASIVOS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total por Pagar -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-rose-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-rose-400 font-['Epilogue']">Pasivo Total por Liquidar</span>
          <p class="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">{{ money(totalPending()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">Compromisos de producción y shows</p>
        </div>

        <!-- Dispersado a la Fecha -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-cyan-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-['Epilogue']">Dispersión Liquidada</span>
          <p class="text-xl sm:text-2xl font-black text-cyan-300 font-mono tracking-tight">{{ money(totalPaid()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">{{ calcPercent(totalPaid(), totalGross()) }}% de pasivos extinguidos</p>
        </div>

        <!-- Honorarios a Artistas -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-purple-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-purple-400 font-['Epilogue']">Cachés & Honorarios Talento</span>
          <p class="text-xl sm:text-2xl font-black text-purple-300 font-mono tracking-tight">{{ money(totalArtistsPending()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">Nómina y cachés de agrupaciones</p>
        </div>

        <!-- Proveedores de Producción -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-amber-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 font-['Epilogue']">Proveedores de Producción</span>
          <p class="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">{{ money(totalVendorsPending()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">Audio, escenarios, pantallas y recintos</p>
        </div>
      </div>

      <!-- BARRA DE FILTROS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl">
        <div class="flex bg-[#141414] rounded-2xl p-1 border border-white/10 flex-wrap">
          <button
            type="button"
            (click)="categoryFilter.set('todos')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
            [class]="categoryFilter() === 'todos' ? 'bg-[#222222] text-on-surface shadow-sm' : 'text-outline hover:text-on-surface'"
          >
            Todos ({{ payables().length }})
          </button>
          <button
            type="button"
            (click)="categoryFilter.set('honorarios_artistas')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
            [class]="categoryFilter() === 'honorarios_artistas' ? 'bg-purple-500/20 text-purple-300' : 'text-outline hover:text-on-surface'"
          >
            Honorarios Artistas
          </button>
          <button
            type="button"
            (click)="categoryFilter.set('produccion_audio')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
            [class]="categoryFilter() === 'produccion_audio' ? 'bg-amber-500/20 text-amber-300' : 'text-outline hover:text-on-surface'"
          >
            Producción, Audio & Recintos
          </button>
        </div>
      </div>

      <!-- LISTADO DE CUENTAS POR PAGAR -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of filteredPayables(); track item.id) {
          <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-4 relative overflow-hidden transition-all duration-300 hover:border-rose-500/40">

            <!-- Encabezado de la obligación -->
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono font-bold text-outline">{{ item.id }}</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border font-mono"
                    [class]="item.status === 'pagado'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : item.status === 'programado'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'">
                    {{ item.status === 'pagado' ? '✓ Liquidado' : item.status === 'programado' ? '📅 Programado' : '⏳ Pendiente' }}
                  </span>
                </div>
                <h4 class="text-sm font-black text-on-surface truncate font-['Epilogue']">{{ item.beneficiaryName }}</h4>
                <p class="text-xs text-outline truncate">{{ item.concept }}</p>
              </div>

              <!-- Saldo Pendiente -->
              <div class="text-right shrink-0">
                <span class="text-[10px] text-outline uppercase block font-['Epilogue']">Por Liquidar</span>
                <span class="text-base font-black font-mono"
                  [class]="item.pendingAmount > 0 ? 'text-rose-400' : 'text-emerald-400'">
                  {{ money(item.pendingAmount) }}
                </span>
                <span class="text-[10px] text-outline font-mono block">Total: {{ money(item.totalAmount) }}</span>
              </div>
            </div>

            <!-- Datos Bancarios & Vencimiento -->
            <div class="p-3 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 text-outline">
                <span class="material-symbols-outlined text-sm">account_balance</span>
                <span>{{ item.bankDetails || 'Banorte SPEI Registrado' }}</span>
              </div>
              <span class="font-bold text-on-surface font-mono">Vence: {{ item.dueDate }}</span>
            </div>

            <!-- Barra de Avance de Pago -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs font-mono">
                <span class="text-cyan-400 font-bold">Dispersado: {{ money(item.paidAmount) }}</span>
                <span class="text-outline">{{ calcPercent(item.paidAmount, item.totalAmount) }}%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-[#141414] overflow-hidden border border-white/5">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
                  [style.width.%]="calcPercent(item.paidAmount, item.totalAmount)"></div>
              </div>
            </div>

            <!-- Botones de Acción -->
            @if (item.pendingAmount > 0) {
              <div class="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  (click)="dispersePayment.emit(item)"
                  class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-xs font-black shadow-md shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer font-['Epilogue']"
                >
                  <span class="material-symbols-outlined text-sm">send_money</span>
                  Dispersar Liquidación SPEI
                </button>
              </div>
            }

          </div>
        } @empty {
          <div class="col-span-2 p-12 text-center rounded-3xl bg-[#181818] border border-white/10 text-outline space-y-2">
            <span class="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
            <p class="text-sm font-bold text-on-surface font-['Epilogue']">No hay obligaciones pendientes en este filtro</p>
            <p class="text-xs">Todos los compromisos con artistas y proveedores se encuentran cubiertos.</p>
          </div>
        }
      </div>

    </div>
  `
})
export class FinanceTabPayablesComponent {
  payables = input.required<PayableItem[]>();
  dispersePayment = output<PayableItem>();

  categoryFilter = signal<'todos' | 'honorarios_artistas' | 'produccion_audio'>('todos');

  money = money;
  calcPercent = calcPercent;

  totalPending = computed(() => this.payables().reduce((s, p) => s + p.pendingAmount, 0));
  totalPaid = computed(() => this.payables().reduce((s, p) => s + p.paidAmount, 0));
  totalGross = computed(() => this.payables().reduce((s, p) => s + p.totalAmount, 0));

  totalArtistsPending = computed(() =>
    this.payables().filter(p => p.category === 'honorarios_artistas').reduce((s, p) => s + p.pendingAmount, 0)
  );

  totalVendorsPending = computed(() =>
    this.payables().filter(p => p.category === 'produccion_audio').reduce((s, p) => s + p.pendingAmount, 0)
  );

  filteredPayables = computed(() => {
    const filter = this.categoryFilter();
    if (filter === 'todos') return this.payables();
    return this.payables().filter(p => p.category === filter);
  });
}
