import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventItem, EventActivity, ActivityChannel } from '../../../../core/models/event.models';
import { RoleService } from '../../../../core/services/role.service';

@Component({
  selector: 'app-event-tab-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ─── BARRA DE FILTROS & BÚSQUEDA ─── -->
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-surface-container-high/80 border border-white/10 backdrop-blur-2xl shadow-xl">

        <!-- Channel Filter Chips -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button
            type="button"
            (click)="selectedChannel.set('todas')"
            [class]="selectedChannel() === 'todas' ? 'bg-primary text-black font-black shadow-[0_0_20px_rgba(242,202,80,0.5)]' : 'bg-white/5 border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/10 backdrop-blur-md'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
          >
            Todas
          </button>
          @for (c of availableChannels; track c.value) {
            <button
              type="button"
              (click)="selectedChannel.set(c.value)"
              [class]="selectedChannel() === c.value ? c.activeClass : 'bg-white/5 border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/10 backdrop-blur-md'"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" [class]="c.dotClass"></span>
              {{ c.label }}
            </button>
          }
        </div>

        <!-- Filters Right Section (Actor Selector & Search) -->
        <div class="flex items-center gap-3 shrink-0 flex-wrap">
          <div class="relative min-w-[180px]">
            <select
              [ngModel]="selectedActor()"
              (ngModelChange)="selectedActor.set($event)"
              class="w-full bg-white/5 border border-white/10 text-on-surface text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-primary backdrop-blur-md"
            >
              <option value="todos">Todos los autores</option>
              @for (actorName of uniqueActors(); track actorName) {
                <option [value]="actorName">{{ actorName }}</option>
              }
            </select>
          </div>

          <div class="relative min-w-[160px]">
            <span class="material-symbols-outlined absolute left-2.5 top-2 text-outline text-sm">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar cambio..."
              class="w-full bg-white/5 border border-white/10 text-on-surface text-xs rounded-xl pl-8 pr-2.5 py-2 placeholder:text-outline focus:outline-none focus:border-primary backdrop-blur-md"
            />
          </div>
        </div>

      </div>

      <!-- ─── LISTADO DE ACTIVIDAD AGRUPADO POR DÍA ─── -->
      @if (groupedActivities().length > 0) {
        <div class="space-y-6">
          @for (group of groupedActivities(); track group.dayLabel) {
            <div class="space-y-3">

              <!-- Encabezado Pegajoso de Día -->
              <div class="sticky top-0 z-10 py-1.5 px-3.5 rounded-xl bg-surface/95 border border-white/10 backdrop-blur-md inline-flex items-center gap-2 shadow-lg">
                <span class="material-symbols-outlined text-primary text-sm">calendar_today</span>
                <span class="text-xs font-black uppercase tracking-wider text-primary font-['Epilogue']">
                  {{ group.dayLabel }}
                </span>
                <span class="text-[10px] text-outline font-mono">({{ group.items.length }})</span>
              </div>

              <!-- Fila de eventos del día -->
              <div class="space-y-3 pl-3 border-l-2 border-white/10 ml-2">
                @for (act of group.items; track act.id) {
                  <div class="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-black/20 border border-white/10 hover:border-white/20 transition-all duration-200 space-y-2.5 shadow-xl backdrop-blur-2xl group hover:bg-white/5">

                    <!-- Encabezado de entrada -->
                    <div class="flex items-start justify-between gap-4 flex-wrap">

                      <div class="flex items-start gap-3 min-w-0 flex-1">
                        <!-- Timestamp Mono -->
                        <span class="font-mono text-xs text-outline font-bold mt-0.5 shrink-0 bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                          {{ formatTime(act.at) }}
                        </span>

                        <!-- Dot y resumen -->
                        <div class="space-y-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_10px_currentColor]" [class]="getChannelDotClass(act.channel)"></span>
                            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20 border border-white/10" [class]="getChannelTextClass(act.channel)">
                              {{ getChannelLabel(act.channel) }}
                            </span>
                            @if (act.mergedCount && act.mergedCount > 1) {
                              <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                <span class="material-symbols-outlined text-xs">auto_awesome</span>
                                {{ act.mergedCount }} cambios agrupados en 10 min
                              </span>
                            }
                          </div>
                          <p class="text-sm font-bold text-on-surface leading-snug group-hover:text-amber-200 transition-colors">
                            {{ sanitizeSummary(act.summary) }}
                          </p>
                        </div>
                      </div>

                      <!-- Autor / Actor Badge -->
                      <div class="text-right shrink-0 p-2 rounded-xl bg-black/20 border border-white/5 space-y-0.5">
                        <span class="text-xs font-bold text-on-surface block">
                          {{ act.actor.name }}
                        </span>
                        <span class="text-[10px] text-outline font-medium block">
                          {{ act.actor.managerName }} · <strong class="text-amber-300">{{ act.actor.rank }}</strong>
                        </span>
                      </div>

                    </div>

                    <!-- Acordeón Desplegable de Tabla de Diferencias (Diff Engine) -->
                    @if (act.changes && act.changes.length > 0) {
                      <div class="pt-2 border-t border-white/5">
                        <button
                          type="button"
                          (click)="toggleDetails(act.id)"
                          class="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors"
                        >
                          <span class="material-symbols-outlined text-base">
                            {{ isExpanded(act.id) ? 'unfold_less' : 'unfold_more' }}
                          </span>
                          {{ isExpanded(act.id) ? 'Ocultar tabla de diferencias' : 'Ver detalle de diffs (' + act.changes.length + ' campos modificados)' }}
                        </button>

                        @if (isExpanded(act.id)) {
                          <div class="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-3xl p-3 space-y-2 shadow-inner">
                            <table class="w-full text-left text-xs divide-y divide-white/10">
                              <thead>
                                <tr class="text-[10px] font-black uppercase text-outline">
                                  <th class="pb-2 px-3">Campo Modificado</th>
                                  <th class="pb-2 px-3 text-rose-300">Valor Anterior</th>
                                  <th class="pb-2 px-3 text-emerald-300">Valor Nuevo</th>
                                </tr>
                              </thead>
                              <tbody class="divide-y divide-white/5">
                                @for (c of act.changes; track c.field) {
                                  <tr class="hover:bg-white/5 transition-colors">
                                    <td class="py-2.5 px-3 font-bold text-on-surface">{{ c.label }}</td>
                                    <td class="py-2.5 px-3 font-mono">
                                      <span class="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] block w-fit">
                                        {{ sanitizeValue(c.before) }}
                                      </span>
                                    </td>
                                    <td class="py-2.5 px-3 font-mono">
                                      <span class="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] block w-fit">
                                        {{ sanitizeValue(c.after) }}
                                      </span>
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }
                      </div>
                    }

                  </div>
                }
              </div>

            </div>
          }
        </div>

        <!-- Paginado Ver Más -->
        @if (hasMore()) {
          <div class="text-center pt-4">
            <button
              type="button"
              (click)="pageSize.set(pageSize() + 50)"
              class="px-7 py-3 rounded-2xl bg-surface-container-high hover:bg-surface-bright text-primary font-black text-xs border border-white/10 transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              Cargar 50 movimientos más
            </button>
          </div>
        }
      } @else {
        <!-- Estado Vacío -->
        <div class="p-12 text-center rounded-3xl bg-surface-container-high/40 border border-white/5 space-y-3">
          <span class="material-symbols-outlined text-4xl text-outline">history</span>
          <p class="text-sm font-bold text-on-surface">Sin movimientos registrados aún.</p>
          <p class="text-xs text-outline max-w-sm mx-auto">
            Cualquier edición o cambio de estado en el expediente generará una entrada trazable con autor, disquera y hora.
          </p>
        </div>
      }

    </div>
  `
})
export class EventTabActivityComponent {
  event = input.required<EventItem>();
  roleService = inject(RoleService);

  selectedChannel = signal<string>('todas');
  selectedActor = signal<string>('todos');
  searchQuery = '';
  pageSize = signal(50);
  expandedIds = signal<Set<string>>(new Set());

  readonly availableChannels: { value: ActivityChannel; label: string; activeClass: string; dotClass: string }[] = [
    { value: 'evento', label: 'Evento', activeClass: 'bg-amber-400 text-black font-black shadow-md shadow-amber-400/20', dotClass: 'bg-amber-400 text-amber-400' },
    { value: 'cartelera', label: 'Cartelera', activeClass: 'bg-sky-400 text-black font-black shadow-md shadow-sky-400/20', dotClass: 'bg-sky-400 text-sky-400' },
    { value: 'cartel', label: 'Cartel', activeClass: 'bg-indigo-400 text-black font-black shadow-md shadow-indigo-400/20', dotClass: 'bg-indigo-400 text-indigo-400' },
    { value: 'produccion', label: 'Producción', activeClass: 'bg-violet-400 text-black font-black shadow-md shadow-violet-400/20', dotClass: 'bg-violet-400 text-violet-400' },
    { value: 'boletaje', label: 'Boletaje', activeClass: 'bg-cyan-400 text-black font-black shadow-md shadow-cyan-400/20', dotClass: 'bg-cyan-400 text-cyan-400' },
    { value: 'croquis', label: 'Croquis', activeClass: 'bg-emerald-400 text-black font-black shadow-md shadow-emerald-400/20', dotClass: 'bg-emerald-400 text-emerald-400' },
    { value: 'acuerdos', label: 'Acuerdos', activeClass: 'bg-teal-400 text-black font-black shadow-md shadow-teal-400/20', dotClass: 'bg-teal-400 text-teal-400' },
    { value: 'tareas', label: 'Tareas', activeClass: 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20', dotClass: 'bg-amber-500 text-amber-500' }
  ];

  allActivities = computed(() => {
    return this.event().activity || [];
  });

  uniqueActors = computed(() => {
    const list = this.allActivities();
    const set = new Set<string>();
    for (const a of list) {
      if (a.actor?.name) set.add(a.actor.name);
    }
    return Array.from(set);
  });

  filteredActivities = computed(() => {
    let list = [...this.allActivities()].reverse();
    const query = (this.searchQuery || '').toLowerCase().trim();

    if (query) {
      list = list.filter(a => a.summary.toLowerCase().includes(query) || (a.changes || []).some(c => c.label.toLowerCase().includes(query)));
    }

    const channel = this.selectedChannel();
    if (channel !== 'todas') {
      list = list.filter(a => a.channel === channel);
    }

    const actor = this.selectedActor();
    if (actor !== 'todos') {
      list = list.filter(a => a.actor?.name === actor);
    }

    return list;
  });

  paginatedActivities = computed(() => {
    return this.filteredActivities().slice(0, this.pageSize());
  });

  hasMore = computed(() => {
    return this.filteredActivities().length > this.pageSize();
  });

  groupedActivities = computed(() => {
    const items = this.paginatedActivities();
    const map = new Map<string, EventActivity[]>();

    for (const item of items) {
      const dayLabel = this.formatDayLabel(item.at);
      if (!map.has(dayLabel)) {
        map.set(dayLabel, []);
      }
      map.get(dayLabel)!.push(item);
    }

    return Array.from(map.entries()).map(([dayLabel, groupItems]) => ({
      dayLabel,
      items: groupItems
    }));
  });

  toggleDetails(id: string): void {
    const set = new Set(this.expandedIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.expandedIds.set(set);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  formatTime(isoString?: string): string {
    if (!isoString) return '--:--';
    try {
      return isoString.slice(11, 16);
    } catch {
      return '--:--';
    }
  }

  formatDayLabel(isoString?: string): string {
    if (!isoString) return 'Fecha sin definir';
    try {
      const d = new Date(isoString);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Hoy';

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Ayer';

      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  }

  getChannelLabel(channel: ActivityChannel): string {
    switch (channel) {
      case 'evento': return 'Evento';
      case 'cartelera': return 'Cartelera';
      case 'cartel': return 'Cartel';
      case 'produccion': return 'Producción';
      case 'boletaje': return 'Boletaje';
      case 'croquis': return 'Croquis';
      case 'acuerdos': return 'Acuerdos';
      case 'tareas': return 'Tareas';
      case 'revision': return 'Revisión';
      case 'venta': return 'Venta';
      case 'cierre': return 'Cierre';
      default: return channel;
    }
  }

  getChannelDotClass(channel: ActivityChannel): string {
    switch (channel) {
      case 'evento': return 'bg-amber-400 text-amber-400';
      case 'cartelera': return 'bg-sky-400 text-sky-400';
      case 'cartel': return 'bg-indigo-400 text-indigo-400';
      case 'produccion': return 'bg-violet-400 text-violet-400';
      case 'boletaje': return 'bg-cyan-400 text-cyan-400';
      case 'croquis': return 'bg-emerald-400 text-emerald-400';
      case 'acuerdos': return 'bg-teal-400 text-teal-400';
      case 'tareas': return 'bg-amber-500 text-amber-500';
      default: return 'bg-slate-400 text-slate-400';
    }
  }

  getChannelTextClass(channel: ActivityChannel): string {
    switch (channel) {
      case 'evento': return 'text-amber-300';
      case 'cartelera': return 'text-sky-300';
      case 'cartel': return 'text-indigo-300';
      case 'produccion': return 'text-violet-300';
      case 'boletaje': return 'text-cyan-300';
      case 'croquis': return 'text-emerald-300';
      case 'acuerdos': return 'text-teal-300';
      case 'tareas': return 'text-amber-400';
      default: return 'text-slate-300';
    }
  }

  sanitizeSummary(summary: string): string {
    if (!this.roleService.canViewFinances()) {
      return summary.replace(/\$[\d,]+(\.\d{2})?/g, '$***');
    }
    return summary;
  }

  sanitizeValue(val?: string): string {
    if (!val) return '—';
    if (!this.roleService.canViewFinances()) {
      return val.replace(/\$[\d,]+(\.\d{2})?/g, '$***');
    }
    return val;
  }
}
