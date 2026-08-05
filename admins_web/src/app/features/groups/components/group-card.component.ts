import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupItem } from '../../../core/models/admin.models';
import { RoleService } from '../../../core/services/role.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/ui/badge/badge.component';
import { SparkChartComponent, SparkSeries } from '../../../shared/ui/charts/spark-chart.component';

@Component({
  selector: 'app-group-card',
  standalone: true,
  imports: [CommonModule, BadgeComponent, SparkChartComponent],
  template: `
    <div
      class="relative overflow-hidden rounded-3xl bg-surface-container-high/95 border border-outline-variant/30 backdrop-blur-xl p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-primary/60 transition-all duration-300 group flex flex-col justify-between"
      [class.ring-2]="isSelectedForInsights()"
      [class.ring-primary]="isSelectedForInsights()"
    >
      <!-- Background Ambient Glow -->
      <div class="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all pointer-events-none"></div>

      <!-- Top Section: Header & Badges -->
      <div class="space-y-4 relative z-10">
        
        <!-- Header Info Row with Online Status Indicator -->
        <div class="flex items-start gap-4">
          <!-- Thumbnail Image with Rating & Online Dot -->
          <div class="relative shrink-0">
            <img
              [src]="group().image"
              [alt]="group().name"
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-primary/40 shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
            <span
              class="absolute -bottom-2 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-amber-300 bg-surface-container-highest border border-amber-500/30 flex items-center gap-0.5 shadow-md backdrop-blur-md"
            >
              ★ {{ group().rating }}
            </span>
          </div>

          <!-- Title, Online Status & Badges -->
          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-display-md text-base sm:text-lg font-black text-on-surface group-hover:text-primary transition-colors leading-snug truncate">
                {{ group().name }}
              </h3>

              <!-- ONLINE / LAST CONNECTION BADGE -->
              @if (group().isOnline) {
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 shadow-sm">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> En Línea
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-outline bg-surface-container-highest border border-outline-variant/30 shrink-0">
                  <span class="material-symbols-outlined text-[11px]">schedule</span> {{ group().lastConnectionText || 'Offline' }}
                </span>
              }
            </div>

            <p class="text-xs text-primary font-extrabold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-xs">music_note</span> {{ group().genre }}
            </p>

            <!-- Origin & Exclusivity Badges -->
            <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
              <app-badge [label]="group().disqueraType" [variant]="getContractBadgeVariant(group().disqueraType)" />
              
              @if (group().isPlatformRegistered) {
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span class="material-symbols-outlined text-[11px]">verified</span> En Plataforma
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <span class="material-symbols-outlined text-[11px]">language</span> Viene de Fuera
                </span>
              }

              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-outline bg-surface-container-highest border border-outline-variant/30">
                <span class="material-symbols-outlined text-[11px]">group</span> {{ group().membersCount }} Integrantes
              </span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-xs text-outline font-semibold line-clamp-2 leading-relaxed">
          {{ group().description }}
        </p>

        <!-- ÚLTIMA ACTIVIDAD EN ACORDEX FEED -->
        @if (group().lastActivityText) {
          <div class="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1">
            <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-purple-300">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-purple-400">campaign</span> Última Actividad en Acordex
              </span>
              <span class="text-outline font-bold">{{ group().lastActivityTime }}</span>
            </div>
            <p class="text-xs font-bold text-on-surface truncate">
              "{{ group().lastActivityText }}"
            </p>
          </div>
        }

        <!-- DEDICATED INLINE SVG VECTOR SPARKLINE FOR THIS GROUP -->
        <div class="p-3.5 rounded-2xl bg-surface-container-highest/70 border border-outline-variant/30 space-y-1.5 shadow-inner">
          <div class="flex items-center justify-between text-[10px] font-black">
            <span class="text-outline uppercase tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-primary">show_chart</span> Actividad Dedicada
            </span>
            <div class="flex items-center gap-2">
              <span class="text-purple-300 font-extrabold">{{ group().monthlyQuotesCount }} Cot.</span>
              <span class="text-emerald-400 font-extrabold">{{ group().monthlyEventsCount }} Ev.</span>
            </div>
          </div>

          <!-- Sparkline interactivo: al pasar el cursor muestra el día y sus cifras -->
          <app-spark-chart
            [series]="sparkSeries()"
            [labels]="sparkLabels()"
            [height]="48"
            [idPrefix]="'spark-' + group().id"
            [ariaLabel]="'Actividad diaria de ' + group().name"
          />
        </div>

        <!-- General Info Grid (Summary Items Required) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-surface-container-highest/90 p-3.5 rounded-2xl border border-outline-variant/20 text-xs">
          
          <!-- 1. Aprobación Promedio del Público -->
          <div class="space-y-0.5">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Aprobación Público</span>
            <span class="font-black text-amber-300 text-xs flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">thumb_up</span> {{ group().publicApprovalPercent }}%
            </span>
          </div>

          <!-- 2. Estado de Horario / Agenda -->
          <div class="space-y-0.5">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Agenda / Horario</span>
            <span class="font-black text-xs" [ngClass]="getAgendaClass(group().agendaStatus)">
              {{ group().agendaStatus }}
            </span>
          </div>

          <!-- 3. Seguidores -->
          <div class="space-y-0.5">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Seguidores</span>
            <span class="font-extrabold text-on-surface text-xs flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">grade</span> {{ group().followersCount }}
            </span>
          </div>

          <!-- 4. Eventos Activos -->
          <div class="space-y-0.5 pt-1">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Eventos Activos</span>
            <span class="font-black text-emerald-400 text-xs">{{ group().labelActiveEventsCount }} activos</span>
          </div>

          <!-- 5. Cotizaciones Pendientes -->
          <div class="space-y-0.5 pt-1">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Cot. Pendientes</span>
            <span class="font-black text-amber-300 text-xs">{{ group().pendingQuotesCount }} pendientes</span>
          </div>

          <!-- 6. Cotizaciones Completadas -->
          <div class="space-y-0.5 pt-1">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Cot. Completadas</span>
            <span class="font-black text-primary text-xs">{{ group().completedQuotesCount }} completadas</span>
          </div>

        </div>

        <!-- Financial & Fee Breakdown Box -->
        <div class="p-3.5 rounded-2xl bg-surface-bright/80 border border-outline-variant/30 flex items-center justify-between text-xs gap-2">
          
          <!-- Cobro Base del Grupo (Sin Comisión Disquera) -->
          <div class="min-w-0">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Cobro Base Grupo (Sin Comisión)</span>
            <span class="font-black text-on-surface text-xs sm:text-sm">
              &#36;{{ group().artistFeeBase | number:'1.0-0' }} <span class="text-[10px] text-outline font-semibold">MXN</span>
            </span>
          </div>

          <!-- Ingresos Totales Acordex (Finances check) -->
          <div class="text-right min-w-0">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Ingresos Generados</span>
            @if (roleService.canViewFinances()) {
              <span class="font-black text-emerald-400 text-xs sm:text-sm">
                &#36;{{ group().labelRevenueAcordex | number:'1.0-0' }}
              </span>
            } @else {
              <span class="font-bold text-outline text-xs">Confidencial</span>
            }
          </div>

        </div>

        <!-- Leader / Manager Info Row (Encargado del Grupo) -->
        <div class="flex items-center justify-between gap-2 px-1 text-xs border-t border-outline-variant/20 pt-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0 font-black text-xs shadow-sm">
              {{ group().groupLeaderName.charAt(0) }}
            </div>
            <div class="min-w-0">
              <span class="text-[9px] text-outline uppercase font-black block leading-none">Encargado del Grupo / Líder</span>
              <span class="font-bold text-on-surface text-xs truncate block mt-0.5">{{ group().groupLeaderName }}</span>
            </div>
          </div>

          <span class="text-[10px] text-outline shrink-0 bg-surface-container-highest px-2.5 py-1 rounded-xl border border-outline-variant/30 font-bold">
            {{ group().groupLeaderRole }}
          </span>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="pt-4 mt-3 border-t border-outline-variant/30 flex items-center gap-2.5 relative z-10">
        
        <!-- Button: Seleccionar para Gráficos Dedicados -->
        <button
          (click)="selectForInsights.emit(group())"
          class="px-3.5 py-2.5 rounded-xl bg-surface-container-highest hover:bg-primary/20 hover:text-primary font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 border border-outline-variant/30"
          title="Ver Gráficos Dedicados en Panel Derecho"
        >
          <span class="material-symbols-outlined text-sm text-primary">monitoring</span> Ver Gráficos
        </button>

        <!-- Button: Ver Ficha Completa -->
        <button
          (click)="openDetail.emit(group())"
          class="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-sm">badge</span> Ver Ficha Completa
        </button>

      </div>

    </div>
  `
})
export class GroupCardComponent {
  roleService = inject(RoleService);

  group = input.required<GroupItem>();
  isSelectedForInsights = input<boolean>(false);
  openDetail = output<GroupItem>();
  selectForInsights = output<GroupItem>();

  /** Etiquetas del eje x: los días que trae la métrica diaria del grupo. */
  sparkLabels = computed(() => (this.group().dailyMetrics || []).map(m => m.dayLabel));

  /** Las dos series del sparkline; el trazado y la escala los resuelve el componente. */
  sparkSeries = computed<SparkSeries[]>(() => {
    const metrics = this.group().dailyMetrics || [];
    if (!metrics.length) return [];
    return [
      { key: 'quotes', label: 'Cotizaciones', values: metrics.map(m => m.quotes), color: '#c084fc' },
      { key: 'events', label: 'Eventos', values: metrics.map(m => m.events), color: '#34d399' }
    ];
  });

  getContractBadgeVariant(type: string): BadgeVariant {
    switch (type) {
      case 'Firmado Exclusivo': return 'success';
      case 'Co-gestionado': return 'purple';
      case 'Independiente / Por Evento': return 'warning';
      case 'Pendiente de Firma': return 'error';
      default: return 'neutral';
    }
  }

  getAgendaClass(status: string): string {
    switch (status) {
      case 'Totalmente Libre': return 'text-emerald-400';
      case 'Parcialmente Ocupado': return 'text-amber-300';
      case 'Agenda Llena': return 'text-rose-400';
      default: return 'text-on-surface';
    }
  }
}
