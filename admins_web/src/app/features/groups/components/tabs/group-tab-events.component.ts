import { Component, input, output, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GroupEventRecord, defaultSectionVisibility } from '../../group-profile.model';
import { GroupProfileStore } from '../../group-profile.store';

@Component({
  selector: 'app-group-tab-events',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 text-xs select-none">

      <!-- RESUMEN DE EVENTOS -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="p-4 rounded-2xl bg-[#18152a] border border-emerald-500/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Completados</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ countByStatus('Completado') }}</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-cyan-500/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">Confirmados</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ countByStatus('Confirmado') }}</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-amber-500/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Pendientes</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ countByStatus('Pendiente') }}</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-outline-variant/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Aforo Acumulado</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ totalAttendance() | number:'1.0-0' }}</span>
        </div>
      </section>

      <!-- OCUPACIÓN POR EVENTO -->
      <section class="p-5 rounded-3xl bg-[#18152a] border border-outline-variant/30 space-y-3.5 shadow-xl">
        <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
          <span class="material-symbols-outlined text-base">bar_chart</span> Ocupación & Capacidad de Aforo por Evento
        </h3>
        <div class="space-y-3">
          @for (e of eventsWithCapacity(); track e.id) {
            <div class="space-y-1.5 p-2.5 rounded-2xl bg-[#131022] border border-outline-variant/20">
              <div class="flex items-center justify-between text-xs font-black gap-2">
                <span class="text-on-surface truncate">{{ e.title }}</span>
                <span class="text-emerald-400 shrink-0 font-mono text-[11px]">
                  {{ e.attendance || 0 | number:'1.0-0' }} / {{ e.capacity | number:'1.0-0' }}
                </span>
              </div>
              <div class="h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
                  [style.width.%]="occupancyPercent(e)"
                ></div>
              </div>
            </div>
          }
        </div>
      </section>

      <section
        class="p-5 rounded-3xl bg-[#18152a] border transition-all duration-300 space-y-3.5 shadow-xl"
        [class]="vis().showUpcomingEvents ? 'border-outline-variant/30' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <header class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-3">
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-base">event</span> Agenda de Eventos & Firmas
            </h3>
            <p class="text-[10px] text-outline">Sección "Próximos Eventos & Gira" expuesta en la Vista Previa del Cliente</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
              <button
                type="button"
                (click)="!vis().showUpcomingEvents && store.toggleSectionVisibility('showUpcomingEvents')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="vis().showUpcomingEvents ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
              >
                VISIBLE
              </button>
              <button
                type="button"
                (click)="vis().showUpcomingEvents && store.toggleSectionVisibility('showUpcomingEvents')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="!vis().showUpcomingEvents ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
              >
                OCULTAR
              </button>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap">
              @for (f of filters; track f) {
                <button
                  type="button"
                  (click)="statusFilter.set(f)"
                  class="px-3 py-1 rounded-xl text-[10px] font-black border transition-all"
                  [class]="statusFilter() === f ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-[#18152a] text-outline border-outline-variant/25 hover:text-on-surface'"
                >
                  {{ f }}
                </button>
              }
            </div>
          </div>
        </header>

        <div class="space-y-3">
          @for (e of visibleEvents(); track e.id) {
            <button
              type="button"
              (click)="openEvent.emit(e)"
              class="w-full text-left p-4 rounded-3xl bg-[#18152a] border border-outline-variant/30 hover:border-primary/60 transition-all flex items-center gap-4 shadow-md group transform hover:-translate-y-0.5"
            >
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-md group-hover:scale-105 transition-transform" [class]="typeClass(e.type)">
                <span class="material-symbols-outlined text-xl">{{ typeIcon(e.type) }}</span>
              </div>

              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <span class="text-xs font-black text-on-surface truncate group-hover:text-primary transition-colors font-display-md">{{ e.title }}</span>
                  <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black border shrink-0 shadow-sm" [class]="statusClass(e.status)">
                    {{ e.status }}
                  </span>
                </div>
                <p class="text-xs text-outline font-bold truncate">{{ e.venue }} · {{ e.city }}</p>
                <div class="flex items-center gap-3 text-[10px] font-bold text-outline flex-wrap">
                  <span class="font-mono text-primary font-black">{{ e.date }}</span>
                  @if (e.attendance) {
                    <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">groups</span> {{ e.attendance | number:'1.0-0' }} asistentes</span>
                  }
                  @if (e.rating) {
                    <span class="text-amber-300 font-black">★ {{ e.rating }}</span>
                  }
                </div>
              </div>

              <span class="material-symbols-outlined text-base text-outline group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0">chevron_right</span>
            </button>
          }
        </div>
      </section>

    </div>
  `
})
export class GroupTabEventsComponent {
  profile = input.required<GroupProfile>();

  store = inject(GroupProfileStore);
  vis = computed(() => this.profile().sectionVisibility ?? defaultSectionVisibility());

  openEvent = output<GroupEventRecord>();

  protected readonly filters = ['Todos', 'Completado', 'Confirmado', 'Pendiente'] as const;
  statusFilter = signal<(typeof this.filters)[number]>('Todos');

  visibleEvents = computed(() => {
    const f = this.statusFilter();
    const list = this.profile().events;
    return f === 'Todos' ? list : list.filter(e => e.status === f);
  });

  eventsWithCapacity = computed(() => this.profile().events.filter(e => !!e.capacity));

  totalAttendance = computed(() =>
    this.profile().events.reduce((s, e) => s + (e.attendance || 0), 0)
  );

  countByStatus(status: GroupEventRecord['status']): number {
    return this.profile().events.filter(e => e.status === status).length;
  }

  occupancy(e: GroupEventRecord): number {
    if (!e.capacity) return 0;
    return Math.min(100, ((e.attendance || 0) / e.capacity) * 100);
  }

  occupancyPercent(e: GroupEventRecord): number {
    return this.occupancy(e);
  }

  typeIcon(type: GroupEventRecord['type']): string {
    switch (type) {
      case 'Concierto': return 'music_note';
      case 'Firma de Autógrafos': return 'draw';
      case 'Rueda de Prensa': return 'campaign';
      default: return 'celebration';
    }
  }

  typeClass(type: GroupEventRecord['type']): string {
    switch (type) {
      case 'Concierto': return 'bg-primary/15 text-primary border-primary/40';
      case 'Firma de Autógrafos': return 'bg-purple-500/15 text-purple-300 border-purple-500/40';
      case 'Rueda de Prensa': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
      default: return 'bg-surface-container text-outline border-outline-variant/40';
    }
  }

  statusClass(status: GroupEventRecord['status']): string {
    switch (status) {
      case 'Completado': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Confirmado': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Pendiente': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  }
}
