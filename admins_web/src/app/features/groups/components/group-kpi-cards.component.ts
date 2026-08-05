import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupItem } from '../../../core/models/admin.models';

@Component({
  selector: 'app-group-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

      <!-- CARD 1: Grupo con Mayor Aprobación (Estilo Neon Amber Glass) -->
      <div class="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-b from-amber-500/15 via-surface-container-high/95 to-surface-container-high border border-amber-500/40 backdrop-blur-2xl shadow-xl hover:shadow-amber-500/20 hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 group">
        <!-- Top Neon Glow Line -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-t-3xl shadow-sm"></div>
        <div class="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/35 transition-all pointer-events-none"></div>

        <div class="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-amber-500/25 text-amber-300 flex items-center justify-center border border-amber-500/40 shadow-inner">
              <span class="material-symbols-outlined text-sm">star</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider text-amber-300/90 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Aprobación Top
            </span>
          </div>
          <span class="text-xs font-black text-amber-300 bg-amber-500/25 px-3 py-1 rounded-full border border-amber-500/40 shadow-sm flex items-center gap-1">
            ★ {{ topApprovedGroup()?.rating || '0.0' }}
          </span>
        </div>

        @if (topApprovedGroup(); as top) {
          <div class="flex items-center gap-3 relative z-10">
            <div class="relative shrink-0">
              <img [src]="top.image" [alt]="top.name" class="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400/70 shadow-lg group-hover:scale-105 transition-transform" />
              <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-surface-container-high"></span>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-black text-xs text-on-surface truncate group-hover:text-amber-300 transition-colors leading-tight">{{ top.name }}</h4>
              <p class="text-[11px] font-black text-amber-300 block truncate mt-0.5">{{ top.publicApprovalPercent }}% Aprobación Público</p>
              <span class="text-[10px] text-outline font-extrabold block truncate mt-0.5">{{ top.genre }}</span>
            </div>
          </div>
        } @else {
          <p class="text-xs text-outline italic">Sin datos</p>
        }
      </div>

      <!-- CARD 2: Pendientes por Firmar (Estilo Neon Purple Glass) -->
      <div class="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-b from-purple-500/15 via-surface-container-high/95 to-surface-container-high border border-purple-500/40 backdrop-blur-2xl shadow-xl hover:shadow-purple-500/20 hover:border-purple-400 hover:-translate-y-1 transition-all duration-300 group">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-300 rounded-t-3xl shadow-sm"></div>
        <div class="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/35 transition-all pointer-events-none"></div>

        <div class="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-purple-500/25 text-purple-300 flex items-center justify-center border border-purple-500/40 shadow-inner">
              <span class="material-symbols-outlined text-sm">edit_document</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider text-purple-300">Pendientes Firma</span>
          </div>
          <span class="p-1.5 rounded-xl bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm">
            <span class="material-symbols-outlined text-xs">pending_actions</span>
          </span>
        </div>

        <div class="flex items-baseline justify-between mt-1 relative z-10">
          <span class="text-3xl font-black text-on-surface tracking-tight group-hover:text-purple-300 transition-colors">
            {{ pendingContractsCount() }}
          </span>
          <span class="text-[10px] font-black text-purple-300 bg-purple-500/25 px-3 py-1 rounded-full border border-purple-500/40 shadow-sm">
            En negociación
          </span>
        </div>
        <p class="text-[10px] text-outline font-extrabold mt-2 truncate relative z-10">Contratos disquera por incorporar</p>
      </div>

      <!-- CARD 3: No Exclusivos / Por Fuera (Estilo Neon Cyan Glass) -->
      <div class="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-b from-cyan-500/15 via-surface-container-high/95 to-surface-container-high border border-cyan-500/40 backdrop-blur-2xl shadow-xl hover:shadow-cyan-500/20 hover:border-cyan-400 hover:-translate-y-1 transition-all duration-300 group">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 rounded-t-3xl shadow-sm"></div>
        <div class="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/35 transition-all pointer-events-none"></div>

        <div class="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-cyan-500/25 text-cyan-300 flex items-center justify-center border border-cyan-500/40 shadow-inner">
              <span class="material-symbols-outlined text-sm">hub</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider text-cyan-300">No Exclusivos</span>
          </div>
          <span class="p-1.5 rounded-xl bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm">
            <span class="material-symbols-outlined text-xs">explore</span>
          </span>
        </div>

        <div class="flex items-baseline justify-between mt-1 relative z-10">
          <span class="text-3xl font-black text-on-surface tracking-tight group-hover:text-cyan-300 transition-colors">
            {{ externalGroupsCount() }}
          </span>
          <span class="text-[10px] font-black text-cyan-300 bg-cyan-500/25 px-3 py-1 rounded-full border border-cyan-500/40 shadow-sm">
            Co-gestionados / Fuera
          </span>
        </div>
        <p class="text-[10px] text-outline font-extrabold mt-2 truncate relative z-10">Independientes o multi-disquera</p>
      </div>

      <!-- CARD 4: Eventos Totales Mensuales (Estilo Neon Emerald Glass) -->
      <div class="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-b from-emerald-500/15 via-surface-container-high/95 to-surface-container-high border border-emerald-500/40 backdrop-blur-2xl shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 group">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300 rounded-t-3xl shadow-sm"></div>
        <div class="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/35 transition-all pointer-events-none"></div>

        <div class="flex items-center justify-between gap-2 mb-2 relative z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/25 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-inner">
              <span class="material-symbols-outlined text-sm">event_available</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400">Eventos Mes</span>
          </div>
          <span class="text-xs font-black text-emerald-300 bg-emerald-500/25 px-3 py-1 rounded-full border border-emerald-500/40 shadow-sm">
            {{ monthlyEventsStats().totalEvents }} total
          </span>
        </div>

        @if (monthlyEventsStats().topGroup; as topEv) {
          <div class="mt-2 space-y-0.5 relative z-10">
            <span class="text-[9px] text-outline font-black uppercase block">Líder en Eventos:</span>
            <div class="flex items-center justify-between gap-1">
              <span class="font-black text-xs text-on-surface truncate group-hover:text-emerald-300 transition-colors">{{ topEv.name }}</span>
              <span class="text-xs font-black text-emerald-400 shrink-0 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">{{ topEv.monthlyEventsCount }} ev.</span>
            </div>
          </div>
        } @else {
          <p class="text-xs text-outline italic">Sin eventos registrados</p>
        }
      </div>

      <!-- CARD 5: Cotizaciones Totales Mensuales (Estilo Neon Violet Glass) -->
      <div class="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-b from-primary/15 via-surface-container-high/95 to-surface-container-high border border-primary/40 backdrop-blur-2xl shadow-xl hover:shadow-primary/20 hover:border-primary/70 hover:-translate-y-1 transition-all duration-300 group">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-400 to-indigo-400 rounded-t-3xl shadow-sm"></div>
        <div class="absolute -right-8 -top-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/35 transition-all pointer-events-none"></div>

        <div class="flex items-center justify-between gap-2 mb-2 relative z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-primary/25 text-primary flex items-center justify-center border border-primary/40 shadow-inner">
              <span class="material-symbols-outlined text-sm">request_quote</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider text-primary">Cotizaciones Mes</span>
          </div>
          <span class="text-xs font-black text-primary bg-primary/25 px-3 py-1 rounded-full border border-primary/40 shadow-sm">
            {{ monthlyQuotesStats().totalQuotes }} total
          </span>
        </div>

        @if (monthlyQuotesStats().topGroup; as topQt) {
          <div class="mt-2 space-y-0.5 relative z-10">
            <span class="text-[9px] text-outline font-black uppercase block">Líder en Cotizaciones:</span>
            <div class="flex items-center justify-between gap-1">
              <span class="font-black text-xs text-on-surface truncate group-hover:text-primary transition-colors">{{ topQt.name }}</span>
              <span class="text-xs font-black text-primary shrink-0 bg-primary/20 px-2.5 py-0.5 rounded-lg border border-primary/30">{{ topQt.monthlyQuotesCount }} cot.</span>
            </div>
          </div>
        } @else {
          <p class="text-xs text-outline italic">Sin cotizaciones registradas</p>
        }
      </div>

    </div>
  `
})
export class GroupKpiCardsComponent {
  topApprovedGroup = input<GroupItem | null>(null);
  pendingContractsCount = input<number>(0);
  externalGroupsCount = input<number>(0);
  monthlyEventsStats = input<{ totalEvents: number; topGroup: GroupItem | null }>({ totalEvents: 0, topGroup: null });
  monthlyQuotesStats = input<{ totalQuotes: number; topGroup: GroupItem | null }>({ totalQuotes: 0, topGroup: null });
}
