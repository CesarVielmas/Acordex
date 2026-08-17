import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupItem } from '../../../core/models/admin.models';
import { EventItem } from '../../../core/models/event.models';
import { PressEventItem } from '../../../core/models/press.models';
import {
  AVAILABILITY_META,
  AvailabilityLevel,
  availabilityCalendar,
  availabilityOn,
  calendarLeadingBlanks,
  monthLoad
} from '../../../features/groups/group-availability';

/**
 * Selector de grupos para un evento: buscar, filtrar y ver si están libres.
 *
 * Lo comparten Eventos y Prensa porque la pregunta es exactamente la misma —«¿a
 * quién meto y puede ese día?»— y la respuesta se calcula igual. Tenerlo dos
 * veces garantizaba que una de las dos copias se quedara sin el filtro nuevo.
 *
 * Lo que lo distingue de una lista de nombres es que **contesta antes de que
 * preguntes**: cada grupo llega con su disponibilidad del día ya resuelta y con
 * qué choca si no la tiene. Elegir a ciegas y descubrir el cruce tres pantallas
 * después es cómo un grupo acaba comprometido en dos sitios a la vez.
 */
@Component({
  selector: 'app-group-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'block' },
  template: `
    <div class="space-y-3.5">

      <!-- ─── FILTROS ─── -->
      <div class="space-y-2.5">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-outline">search</span>
          <input
            [ngModel]="term()"
            (ngModelChange)="term.set($event)"
            placeholder="Buscar por nombre, género o encargado"
            class="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/40 border border-outline-variant/25 focus:border-primary/60 text-xs text-on-surface focus:outline-none transition-colors"
          />
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          @for (chip of ownerChips(); track chip.value) {
            <button type="button" (click)="ownerFilter.set(chip.value)"
              [class]="ownerFilter() === chip.value
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-white/5 text-outline border-white/12 hover:text-on-surface'"
              class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5">
              {{ chip.label }}
              <span class="font-mono opacity-70">{{ chip.count }}</span>
            </button>
          }

          <span class="w-px h-5 bg-white/10 mx-0.5"></span>

          <!-- El filtro que de verdad importa cuando hay fecha: quién puede ese
               día. Sin él hay que abrir uno por uno para descubrir el cruce. -->
          @for (chip of availabilityChips(); track chip.value) {
            <button type="button" (click)="availFilter.set(chip.value)"
              [disabled]="!eventDate()"
              [title]="eventDate() ? '' : 'El evento todavía no tiene fecha'"
              [class]="availFilter() === chip.value
                ? chip.activeClass
                : 'bg-white/5 text-outline border-white/12 hover:text-on-surface'"
              class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none">
              @if (chip.value !== 'todas') {
                <span class="w-1.5 h-1.5 rounded-full shrink-0" [class]="chip.dot"></span>
              }
              {{ chip.label }}
              <span class="font-mono opacity-70">{{ chip.count }}</span>
            </button>
          }

          @if (genres().length > 1) {
            <span class="w-px h-5 bg-white/10 mx-0.5"></span>
            <select
              [ngModel]="genreFilter()"
              (ngModelChange)="genreFilter.set($event)"
              class="px-3 py-1.5 rounded-xl bg-white/5 border border-white/12 text-[10px] font-bold text-on-surface focus:outline-none focus:border-primary/60">
              <option value="todos" class="bg-surface-container">Todos los géneros</option>
              @for (g of genres(); track g) {
                <option [value]="g" class="bg-surface-container">{{ g }}</option>
              }
            </select>
          }
        </div>

        @if (eventDate()) {
          <p class="text-[10.5px] text-outline leading-relaxed">
            La disponibilidad sale de lo que cada grupo ya tiene agendado el
            <strong class="text-on-surface">{{ dateLabel() }}</strong>: no se captura a mano, así que no se puede
            desincronizar.
          </p>
        }
      </div>

      <!-- ─── LISTA ─── -->
      @if (!filtered().length) {
        <p class="py-6 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
          {{ groups().length ? 'Ningún grupo coincide con el filtro.' : 'No hay grupos en el catálogo.' }}
        </p>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-80 overflow-y-auto scroll-oculto pr-1">
          @for (row of filtered(); track row.group.id) {
            <button type="button" (click)="pick(row.group)"
              class="p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5"
              [class]="selectedId() === row.group.id
                ? 'bg-primary/15 border-primary/50'
                : 'bg-white/5 border-white/12 hover:border-primary/40'">

              @if (row.group.image) {
                <img [src]="row.group.image" [alt]="row.group.name" class="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0" />
              } @else {
                <div class="w-11 h-11 rounded-xl bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg text-outline">group</span>
                </div>
              }

              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11.5px] font-black text-on-surface truncate">{{ row.group.name }}</span>
                  @if (!row.isOwn) {
                    <span class="px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[8.5px] font-black uppercase tracking-wider">
                      Externo
                    </span>
                  }
                </div>
                <p class="text-[10px] text-outline truncate">{{ row.group.genre }} · {{ row.group.groupLeaderName }}</p>

                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                    [class]="meta(row.level).badge">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" [class]="meta(row.level).dot"></span>
                    {{ meta(row.level).label }}
                  </span>
                  @if (row.level !== 'libre' && row.level !== 'sin-fecha') {
                    <span class="text-[9.5px] text-outline truncate max-w-[180px]">{{ row.conflictLabel }}</span>
                  }
                  @if (row.load.busyDays > 0) {
                    <span class="text-[9.5px] text-outline font-mono">{{ row.load.busyDays }}d ocupados el mes</span>
                  }
                </div>
              </div>
            </button>
          }
        </div>
      }

      <!-- ─── DETALLE DEL GRUPO ELEGIDO ─── -->
      @if (selected(); as g) {
        <div class="p-4 rounded-2xl border space-y-3.5"
          [class]="isOwn(g) ? 'bg-primary/[0.06] border-primary/30' : 'bg-sky-500/[0.06] border-sky-500/30'">

          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="material-symbols-outlined text-base" [class]="isOwn(g) ? 'text-primary' : 'text-sky-300'">
              {{ isOwn(g) ? 'calendar_month' : 'send' }}
            </span>
            <span class="text-[11px] font-black uppercase tracking-wider text-on-surface">
              {{ isOwn(g) ? 'Agenda de ' + g.name : 'Solicitud a ' + g.groupLeaderName }}
            </span>
          </div>

          @if (isOwn(g)) {
            <!-- Grupo propio: su agenda es nuestra, así que se enseña entera y se
                 decide aquí mismo. -->
            <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
              Es un grupo propio: su agenda la llevamos nosotros, así que basta con ver que el día esté libre.
              @if (selectedAvailability().level === 'ocupado') {
                <strong class="text-rose-300"> Ese día ya está comprometido.</strong>
              }
            </p>

            <!-- Calendario del mes: enseña si el choque es un día suelto o si
                 tiene la semana entera tomada, que es lo que decide si se
                 negocia o se busca a otro. -->
            <!-- Acotado a lo ancho: un calendario que ocupa todo el panel deja
                 celdas del tamaño de un botón y se lee peor que uno normal. -->
            <div class="space-y-1.5 max-w-[280px]">
              <div class="grid grid-cols-7 gap-1 text-center">
                @for (d of weekDays; track d) {
                  <span class="text-[8.5px] font-black uppercase tracking-wider text-outline/70">{{ d }}</span>
                }
                @for (b of blanks(); track b) { <span></span> }
                @for (day of calendar(); track day.date) {
                  <span
                    class="h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all"
                    [class]="dayClass(day.level, day.isTarget)"
                    [title]="day.commitments.length ? day.commitments[0].title : 'Libre'"
                  >{{ day.day }}</span>
                }
              </div>
              <div class="flex items-center gap-2.5 flex-wrap text-[9px] text-outline">
                <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Libre</span>
                <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Apartado</span>
                <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Ocupado</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded border-2 border-primary"></span> Día del evento</span>
              </div>
            </div>
          } @else {
            <!-- Grupo ajeno: su agenda no es nuestra. Lo único honesto es decir
                 que la solicitud sale a su encargado y que él contesta con su
                 propia agenda delante. -->
            <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
              Es un grupo de <strong class="text-sky-300">{{ g.groupLeaderName }}</strong>. Su agenda la lleva su
              disquera, no nosotros: la solicitud sale con la fecha y el horario de este evento y
              <strong class="text-on-surface">él confirma o rechaza</strong> viendo su propia disponibilidad.
              Lo que se ve aquí abajo es solo lo que a nosotros nos consta.
            </p>
          }

          <!-- Lo que ya tiene ese día, propio o ajeno -->
          @if (selectedAvailability().conflicts.length) {
            <div class="space-y-1.5">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline">Ese día ya tiene</span>
              @for (c of selectedAvailability().conflicts; track c.sourceId) {
                <div class="p-2.5 rounded-xl bg-black/35 border text-[10.5px] flex items-start gap-2"
                  [class]="c.tentative ? 'border-amber-500/30' : 'border-rose-500/30'">
                  <span class="material-symbols-outlined text-[13px] shrink-0 mt-0.5"
                    [class]="c.tentative ? 'text-amber-300' : 'text-rose-300'">
                    {{ c.kind === 'evento' ? 'festival' : 'newspaper' }}
                  </span>
                  <span class="min-w-0 flex-1">
                    <strong class="text-on-surface block truncate">{{ c.title }}</strong>
                    <span class="text-outline">
                      {{ c.venue }} · {{ c.state }}{{ c.time ? ' · ' + c.time : '' }}
                      {{ c.tentative ? ' · sin confirmar' : '' }}
                    </span>
                  </span>
                </div>
              }
            </div>
          } @else if (eventDate()) {
            <p class="text-[10.5px] text-emerald-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">check_circle</span>
              No tiene nada agendado ese día.
            </p>
          }

          <!-- Horario que se le propone -->
          @if (proposedTime()) {
            <div class="p-2.5 rounded-xl bg-black/30 border border-white/10 text-[10.5px] text-on-surface-variant flex items-center gap-2">
              <span class="material-symbols-outlined text-[13px] text-outline">schedule</span>
              <span>Horario propuesto: <strong class="text-on-surface">{{ proposedTime() }}</strong></span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class GroupPickerComponent {
  readonly groups = input<GroupItem[]>([]);
  readonly events = input<EventItem[]>([]);
  readonly pressEvents = input<PressEventItem[]>([]);
  /** Fecha del evento que se está armando; sin ella no hay disponibilidad que calcular. */
  readonly eventDate = input<string | undefined>(undefined);
  /** El propio expediente, para que no salga como conflicto de sí mismo. */
  readonly excludeId = input<string | undefined>(undefined);
  /** La disquera que organiza: contra ella se decide qué grupo es propio. */
  readonly ownerManager = input<string>('');
  /** Ids ya presentes en el evento; no se vuelven a ofrecer. */
  readonly usedGroupIds = input<string[]>([]);
  /** Horario que se le va a proponer al grupo, para enseñarlo antes de elegir. */
  readonly proposedTime = input<string>('');

  readonly selectedId = signal<string | null>(null);
  readonly selectedChange = output<GroupItem | null>();

  readonly term = signal('');
  readonly ownerFilter = signal<'todos' | 'propios' | 'externos'>('todos');
  readonly availFilter = signal<'todas' | AvailabilityLevel>('todas');
  readonly genreFilter = signal('todos');

  readonly weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  readonly meta = (level: AvailabilityLevel) => AVAILABILITY_META[level];

  isOwn(g: GroupItem): boolean {
    return !this.ownerManager() || g.groupLeaderName === this.ownerManager();
  }

  /** Los candidatos, ya con su disponibilidad resuelta. */
  private readonly rows = computed(() => {
    const usados = new Set(this.usedGroupIds());
    return this.groups()
      .filter(g => !usados.has(g.id))
      .map(g => {
        const avail = availabilityOn(g.id, this.eventDate(), this.events(), this.pressEvents(), this.excludeId());
        return {
          group: g,
          isOwn: this.isOwn(g),
          level: avail.level,
          conflictLabel: avail.conflicts[0]?.title || '',
          load: monthLoad(g.id, this.eventDate(), this.events(), this.pressEvents(), this.excludeId())
        };
      });
  });

  readonly filtered = computed(() => {
    const t = this.term().trim().toLowerCase();
    const dueno = this.ownerFilter();
    const disp = this.availFilter();
    const genero = this.genreFilter();

    return this.rows().filter(r => {
      if (dueno === 'propios' && !r.isOwn) return false;
      if (dueno === 'externos' && r.isOwn) return false;
      if (disp !== 'todas' && r.level !== disp) return false;
      if (genero !== 'todos' && r.group.genre !== genero) return false;
      if (!t) return true;
      return r.group.name.toLowerCase().includes(t)
        || (r.group.genre || '').toLowerCase().includes(t)
        || (r.group.groupLeaderName || '').toLowerCase().includes(t);
    })
      // Lo que se puede usar, arriba: primero los libres, y dentro de cada nivel
      // los que menos cargado tienen el mes.
      .sort((a, b) => orden(a.level) - orden(b.level) || a.load.busyDays - b.load.busyDays);
  });

  readonly genres = computed(() =>
    [...new Set(this.rows().map(r => r.group.genre).filter(Boolean))].sort());

  ownerChips() {
    const rows = this.rows();
    return [
      { value: 'todos' as const, label: 'Todos', count: rows.length },
      { value: 'propios' as const, label: 'Propios', count: rows.filter(r => r.isOwn).length },
      { value: 'externos' as const, label: 'Externos', count: rows.filter(r => !r.isOwn).length }
    ];
  }

  availabilityChips() {
    const rows = this.rows();
    return [
      { value: 'todas' as const, label: 'Cualquiera', count: rows.length, dot: '', activeClass: 'bg-primary text-on-primary border-primary' },
      { value: 'libre' as const, label: 'Libres', count: rows.filter(r => r.level === 'libre').length, dot: 'bg-emerald-400', activeClass: 'bg-emerald-500 text-black border-emerald-400' },
      { value: 'apartado' as const, label: 'Apartados', count: rows.filter(r => r.level === 'apartado').length, dot: 'bg-amber-400', activeClass: 'bg-amber-400 text-black border-amber-300' },
      { value: 'ocupado' as const, label: 'Ocupados', count: rows.filter(r => r.level === 'ocupado').length, dot: 'bg-rose-400', activeClass: 'bg-rose-500 text-white border-rose-400' }
    ];
  }

  readonly selected = computed(() =>
    this.groups().find(g => g.id === this.selectedId()) || null);

  readonly selectedAvailability = computed(() => {
    const g = this.selected();
    if (!g) return { level: 'sin-fecha' as AvailabilityLevel, conflicts: [], label: '' };
    return availabilityOn(g.id, this.eventDate(), this.events(), this.pressEvents(), this.excludeId());
  });

  readonly calendar = computed(() => {
    const g = this.selected();
    if (!g) return [];
    return availabilityCalendar(g.id, this.eventDate(), this.events(), this.pressEvents(), this.excludeId());
  });

  readonly blanks = computed(() =>
    Array.from({ length: calendarLeadingBlanks(this.eventDate()) }, (_, i) => i));

  dateLabel(): string {
    const d = this.eventDate();
    if (!d) return '';
    const parsed = new Date(d + 'T00:00:00');
    if (isNaN(parsed.getTime())) return d;
    return parsed.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  dayClass(level: AvailabilityLevel, isTarget: boolean): string {
    const base = level === 'ocupado'
      ? 'bg-rose-500/20 text-rose-200 border-rose-500/35'
      : level === 'apartado'
        ? 'bg-amber-500/20 text-amber-200 border-amber-500/35'
        : 'bg-white/5 text-outline border-white/8';
    return isTarget ? `${base} !border-2 !border-primary ring-2 ring-primary/25 font-black` : base;
  }

  pick(g: GroupItem): void {
    const next = this.selectedId() === g.id ? null : g.id;
    this.selectedId.set(next);
    this.selectedChange.emit(next ? g : null);
  }

  reset(): void {
    this.selectedId.set(null);
    this.term.set('');
    this.ownerFilter.set('todos');
    this.availFilter.set('todas');
    this.genreFilter.set('todos');
  }
}

/** Lo aprovechable primero: libre, luego apartado, luego ocupado. */
function orden(level: AvailabilityLevel): number {
  switch (level) {
    case 'libre': return 0;
    case 'sin-fecha': return 1;
    case 'apartado': return 2;
    default: return 3;
  }
}
