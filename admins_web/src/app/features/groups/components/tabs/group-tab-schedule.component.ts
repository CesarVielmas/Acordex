import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GroupEventRecord } from '../../group-profile.model';
import { Quote } from '../../../../core/models/admin.models';

export interface ScheduleDayCommitment {
  id: string;
  type: 'evento' | 'cotizacion' | 'firma' | 'libre';
  title: string;
  time: string;
  location: string;
  clientOrRep?: string;
  targetTab?: 'eventos' | 'cotizaciones';
  targetId?: string;
  notes?: string;
}

export interface CalendarDayCell {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  commitments: ScheduleDayCommitment[];
  status: 'confirmado' | 'cotizacion' | 'firma' | 'libre' | 'disponible';
}

@Component({
  selector: 'app-group-tab-schedule',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 text-xs select-none font-['Be_Vietnam_Pro']">

      <!-- TOP AVAILABILITY & WORKLOAD STATISTICS DASHBOARD -->
      <section class="space-y-4">
        <!-- Main Availability Summary Banner -->
        <div class="bg-gradient-to-r from-[#1b1733] via-[#161329] to-[#0f0d1b] border border-primary/40 rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(242,202,80,0.12)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1.5 min-w-0 z-10">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 font-['Epilogue']">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Disponibilidad Promedio: Alta</span>
              </span>
              <span class="text-[10px] text-white/50 font-mono">82% Fines de Semana Ocupados</span>
            </div>
            <h2 class="font-['Epilogue'] font-black text-lg sm:text-2xl text-white uppercase tracking-wide flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl sm:text-2xl">calendar_clock</span>
              <span>Agenda & Horarios de {{ profile().name }}</span>
            </h2>
            <p class="text-white/70 text-xs font-light max-w-2xl">
              Navega en el calendario mensual para consultar la disponibilidad de fechas, revisar contrataciones agendadas, cotizaciones en proceso, firmas de autógrafos y días libres asignados.
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0 z-10 bg-black/40 p-3 sm:p-4 rounded-2xl border border-white/10">
            <div class="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center font-black font-mono text-xl shrink-0">
              {{ occupancyPercentage() }}%
            </div>
            <div>
              <span class="block text-[10px] font-black uppercase tracking-wider text-white/50 font-['Epilogue']">Ocupación Mensual</span>
              <strong class="text-white font-black text-sm">{{ occupiedDaysCount() }} / {{ currentMonthDaysCount() }} Días Ocupados</strong>
            </div>
          </div>
        </div>

        <!-- 4 Metric Cards Breakdown -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div class="p-4 rounded-2xl bg-[#18152a] border border-primary/40 shadow-md flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">event_available</span>
            </div>
            <div class="min-w-0">
              <span class="text-[10px] font-black uppercase tracking-wider text-primary block truncate font-['Epilogue']">Eventos Confirmados</span>
              <span class="text-xl font-black text-white font-mono leading-none">{{ confirmedEventsCount() }}</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-[#18152a] border border-purple-500/40 shadow-md flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">request_quote</span>
            </div>
            <div class="min-w-0">
              <span class="text-[10px] font-black uppercase tracking-wider text-purple-300 block truncate font-['Epilogue']">Cotizaciones</span>
              <span class="text-xl font-black text-white font-mono leading-none">{{ inProcessQuotesCount() }}</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-[#18152a] border border-rose-500/40 shadow-md flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">draw</span>
            </div>
            <div class="min-w-0">
              <span class="text-[10px] font-black uppercase tracking-wider text-rose-300 block truncate font-['Epilogue']">Firmas & Prensa</span>
              <span class="text-xl font-black text-white font-mono leading-none">{{ signingEventsCount() }}</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-[#18152a] border border-emerald-500/40 shadow-md flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">beach_access</span>
            </div>
            <div class="min-w-0">
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 block truncate font-['Epilogue']">Días Libres / Descanso</span>
              <span class="text-xl font-black text-white font-mono leading-none">{{ freeDaysCount() }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- INTERACTIVE MONTHLY CALENDAR GRID -->
      <section class="p-5 sm:p-7 rounded-3xl bg-[#18152a] border border-white/10 space-y-5 shadow-2xl">
        <!-- Calendar Controls & Legend Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <!-- Month Selector -->
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="changeMonth(-1)"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all hover:scale-105 active:scale-95"
              title="Mes Anterior"
            >
              <span class="material-symbols-outlined text-lg">chevron_left</span>
            </button>

            <h3 class="font-['Epilogue'] font-black text-base sm:text-xl text-white uppercase tracking-wide min-w-[180px] text-center">
              {{ currentMonthName() }} {{ currentYear() }}
            </h3>

            <button
              type="button"
              (click)="changeMonth(1)"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all hover:scale-105 active:scale-95"
              title="Mes Siguiente"
            >
              <span class="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          <!-- Color Legend Badges -->
          <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] font-['Epilogue'] font-bold">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary">
              <span class="w-2 h-2 rounded-full bg-primary"></span>
              <span>Evento Confirmado</span>
            </span>

            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300">
              <span class="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>Cotización</span>
            </span>

            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300">
              <span class="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Firma / Prensa</span>
            </span>

            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Día Libre</span>
            </span>
          </div>
        </div>

        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 gap-1.5 sm:gap-2 text-center font-['Epilogue'] font-black text-[10px] sm:text-xs text-white/40 uppercase tracking-widest">
          <div>DOM</div>
          <div>LUN</div>
          <div>MAR</div>
          <div>MIÉ</div>
          <div>JUE</div>
          <div>VIE</div>
          <div>SÁB</div>
        </div>

        <!-- Calendar Days Grid (7 columns) -->
        <div class="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          @for (cell of calendarCells(); track cell.dateStr) {
            <div
              (click)="selectDayCell(cell)"
              class="min-h-[85px] sm:min-h-[110px] p-2 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group shadow-md"
              [class]="getDayCellClass(cell)"
            >
              <!-- Top Row: Day Number + Badge Icon -->
              <div class="flex items-center justify-between">
                <span
                  class="font-mono font-black text-xs sm:text-sm"
                  [class]="cell.commitments.length ? 'text-white' : 'text-white/40'"
                >
                  {{ cell.dayNumber }}
                </span>

                @if (cell.status === 'confirmado') {
                  <span class="material-symbols-outlined text-xs text-primary font-black">star</span>
                } @else if (cell.status === 'cotizacion') {
                  <span class="material-symbols-outlined text-xs text-purple-300">request_quote</span>
                } @else if (cell.status === 'firma') {
                  <span class="material-symbols-outlined text-xs text-rose-300">draw</span>
                } @else if (cell.status === 'libre') {
                  <span class="material-symbols-outlined text-xs text-emerald-400">beach_access</span>
                }
              </div>

              <!-- Content Preview Badge inside Day Box -->
              <div class="space-y-1 mt-1">
                @for (item of cell.commitments; track item.id) {
                  <div
                    class="px-1.5 py-0.5 rounded-lg text-[9px] font-['Epilogue'] font-bold truncate leading-snug"
                    [class]="getCommitmentBadgeClass(item.type)"
                  >
                    {{ item.title }}
                  </div>
                }

                @if (!cell.commitments.length) {
                  <span class="text-[9px] text-white/20 italic block font-light">Disponible</span>
                }
              </div>

              <!-- Bottom Indicator Line -->
              <div
                class="h-1 rounded-full w-full mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity"
                [class]="getBottomLineClass(cell.status)"
              ></div>
            </div>
          }
        </div>
      </section>

      <!-- DAY DETAIL MODAL / DRAWER (AL DAR CLIC EN UN DÍA DEL CALENDARIO) -->
      @if (selectedDay(); as day) {
        <div
          (click)="selectedDay.set(null)"
          class="fixed inset-0 z-[99999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
        >
          <div
            (click)="$event.stopPropagation()"
            class="relative w-full max-w-xl bg-[#171429] border border-white/20 rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-5"
          >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span class="text-[10px] font-black text-primary uppercase tracking-widest block font-['Epilogue']">Detalle de Agenda</span>
                <h3 class="font-['Epilogue'] font-black text-lg sm:text-2xl text-white uppercase tracking-wide mt-0.5">
                  {{ formatDateTitle(day.dateStr) }}
                </h3>
              </div>

              <button
                type="button"
                (click)="selectedDay.set(null)"
                class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105"
              >
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <!-- List of Commitments for this day -->
            <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              @for (c of day.commitments; track c.id) {
                <div
                  class="p-4 rounded-2xl border space-y-2.5 transition-all"
                  [class]="getDetailCardClass(c.type)"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[9.5px] font-['Epilogue'] font-black uppercase tracking-wider border"
                      [class]="getCommitmentPillClass(c.type)"
                    >
                      {{ c.type === 'libre' ? '🌴 Día Libre' : c.type === 'evento' ? '⭐ Evento Confirmado' : c.type === 'cotizacion' ? '💬 Cotización' : '✍️ Firma / Prensa' }}
                    </span>

                    <span class="font-mono text-xs font-bold text-white/80 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs text-primary">schedule</span>
                      {{ c.time }}
                    </span>
                  </div>

                  <div>
                    <h4 class="font-['Epilogue'] font-black text-base text-white uppercase tracking-wide">
                      {{ c.title }}
                    </h4>
                    @if (c.location) {
                      <p class="text-xs text-white/70 flex items-center gap-1 mt-1">
                        <span class="material-symbols-outlined text-xs text-primary">location_on</span>
                        {{ c.location }}
                      </p>
                    }
                    @if (c.clientOrRep) {
                      <p class="text-xs text-white/60 flex items-center gap-1 mt-0.5">
                        <span class="material-symbols-outlined text-xs text-emerald-400">person</span>
                        <span>{{ c.clientOrRep }}</span>
                      </p>
                    }
                  </div>

                  <!-- ACTION BUTTONS: REDIRECCIÓN O LEYENDA DÍA LIBRE + ELIMINAR -->
                  <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    @if (c.type === 'libre') {
                      <!-- LEYENDA DÍA LIBRE (NO REDIRIGE) -->
                      <div class="text-[11px] text-emerald-300 font-medium italic flex items-center gap-1.5 flex-1 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                        <span class="material-symbols-outlined text-sm text-emerald-400 shrink-0">info</span>
                        <span>Día asignado por el grupo como descanso.</span>
                      </div>
                    } @else {
                      <!-- BOTÓN DE REDIRECCIÓN A SECCIÓN CORRESPONDIENTE -->
                      <button
                        type="button"
                        (click)="redirectToSection(c.targetTab || 'eventos')"
                        class="flex-1 bg-primary hover:bg-primary-fixed text-black font-['Epilogue'] font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02]"
                      >
                        <span>Ver en Apartado de {{ c.targetTab === 'cotizaciones' ? 'Cotizaciones' : 'Eventos & Firmas' }}</span>
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    }

                    <!-- BOTÓN ELIMINAR COMPROMISO DE LA AGENDA (SOLO ADMINISTRADOR) -->
                    <button
                      type="button"
                      (click)="deleteCommitment(day, c.id)"
                      class="px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-['Epilogue'] font-bold text-xs transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center gap-1.5 shadow-md"
                      title="Eliminar este compromiso de la agenda"
                    >
                      <span class="material-symbols-outlined text-sm">delete</span>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              }

              @if (!day.commitments.length) {
                <div class="p-6 text-center rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span class="material-symbols-outlined text-3xl text-emerald-400">event_available</span>
                  <h4 class="font-['Epilogue'] font-black text-sm text-white uppercase">Fecha Totalmente Disponible</h4>
                  <p class="text-xs text-white/60">No hay compromisos agendados para este día. El grupo puede ser contratado.</p>
                </div>
              }
            </div>

            <!-- Footer Option to Toggle Free Day -->
            <div class="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                (click)="toggleDayFreeStatus(day)"
                class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-['Epilogue'] font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <span class="material-symbols-outlined text-sm text-emerald-400">beach_access</span>
                <span>{{ isDayFree(day) ? 'Quitar Día Libre' : 'Marcar como Día Libre / Descanso' }}</span>
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class GroupTabScheduleComponent {
  profile = input.required<GroupProfile>();
  quotes = input<Quote[]>([]);
  navigateTab = output<'cotizaciones' | 'eventos' | 'general'>();

  currentYear = signal<number>(2026);
  currentMonthIndex = signal<number>(7); // 0-indexed: 7 = Agosto

  selectedDay = signal<CalendarDayCell | null>(null);

  // Custom free days set by group (YYYY-MM-DD strings)
  customFreeDays = signal<string[]>(['2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25']);

  // Track deleted commitment IDs by admin
  deletedCommitmentIds = signal<string[]>([]);

  deleteCommitment(dayCell: CalendarDayCell, commitmentId: string): void {
    this.deletedCommitmentIds.update(ids => [...ids, commitmentId]);

    if (commitmentId.startsWith('free-')) {
      this.customFreeDays.update(days => days.filter(d => d !== dayCell.dateStr));
    }

    const updated = dayCell.commitments.filter(c => c.id !== commitmentId);
    dayCell.commitments = updated;

    if (!updated.length) {
      dayCell.status = 'disponible';
    }

    // Refresh selectedDay reference
    this.selectedDay.set({ ...dayCell });
  }

  private readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  currentMonthName = computed(() => this.monthNames[this.currentMonthIndex()]);

  changeMonth(offset: number): void {
    let nextMonth = this.currentMonthIndex() + offset;
    let nextYear = this.currentYear();

    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    this.currentMonthIndex.set(nextMonth);
    this.currentYear.set(nextYear);
  }

  // Calendar cells generation for month
  calendarCells = computed<CalendarDayCell[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonthIndex();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const freeDays = this.customFreeDays();
    const deletedIds = this.deletedCommitmentIds();

    const events = this.profile().events;
    const quotesList = this.quotes();

    const cells: CalendarDayCell[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const commitments: ScheduleDayCommitment[] = [];

      // Check if day is set as Free Day
      if (freeDays.includes(dateStr)) {
        commitments.push({
          id: `free-${dateStr}`,
          type: 'libre',
          title: 'Día Libre / Descanso',
          time: 'Todo el día',
          location: 'Asueto de la agrupación',
          notes: 'No disponible para contrataciones'
        });
      }

      // Map Events to this day
      const dayEvents = events.filter(e => e.date && e.date.includes(dateStr) || (day % 4 === 0 && day <= 28));
      if (day === 8) {
        commitments.push({
          id: 'evt-1',
          type: 'evento',
          title: 'Palenque Monterrey 2026',
          time: '22:00 - 03:00 hrs',
          location: 'Domocare, Guadalupe, N.L.',
          clientOrRep: 'Promociones Apodaca',
          targetTab: 'eventos'
        });
      } else if (day === 15) {
        commitments.push({
          id: 'evt-2',
          type: 'evento',
          title: 'Boda Estelar San Pedro',
          time: '21:00 - 02:00 hrs',
          location: 'Club Campestre, San Pedro, N.L.',
          clientOrRep: 'Coordinación M&G',
          targetTab: 'eventos'
        });
      } else if (day === 22) {
        commitments.push({
          id: 'evt-3',
          type: 'firma',
          title: 'Firma de Autógrafos & Prensa',
          time: '17:00 - 20:00 hrs',
          location: 'Plaza Fiesta San Agustín',
          clientOrRep: 'Prensa Acordex',
          targetTab: 'eventos'
        });
      } else if (day === 12 || day === 20) {
        commitments.push({
          id: `quote-${day}`,
          type: 'cotizacion',
          title: 'Cotización Boda Privada',
          time: '19:00 hrs (Horario solicitado)',
          location: 'Quinta Las Palmas, Santiago, N.L.',
          clientOrRep: 'Cliente Directo Acordex',
          targetTab: 'cotizaciones'
        });
      }

      const activeCommitments = commitments.filter(c => !deletedIds.includes(c.id));

      let status: CalendarDayCell['status'] = 'disponible';
      if (activeCommitments.some(c => c.type === 'evento')) status = 'confirmado';
      else if (activeCommitments.some(c => c.type === 'cotizacion')) status = 'cotizacion';
      else if (activeCommitments.some(c => c.type === 'firma')) status = 'firma';
      else if (activeCommitments.some(c => c.type === 'libre')) status = 'libre';

      cells.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        commitments: activeCommitments,
        status
      });
    }

    return cells;
  });

  // Metrics
  currentMonthDaysCount = computed(() => this.calendarCells().length);

  occupiedDaysCount = computed(() => this.calendarCells().filter(c => c.commitments.length > 0).length);

  occupancyPercentage = computed(() => {
    const total = this.currentMonthDaysCount();
    if (!total) return 0;
    return Math.round((this.occupiedDaysCount() / total) * 100);
  });

  confirmedEventsCount = computed(() => this.calendarCells().filter(c => c.status === 'confirmado').length);
  inProcessQuotesCount = computed(() => this.calendarCells().filter(c => c.status === 'cotizacion').length);
  signingEventsCount = computed(() => this.calendarCells().filter(c => c.status === 'firma').length);
  freeDaysCount = computed(() => this.calendarCells().filter(c => c.status === 'libre').length);

  selectDayCell(cell: CalendarDayCell): void {
    this.selectedDay.set(cell);
  }

  redirectToSection(tab: 'eventos' | 'cotizaciones'): void {
    this.selectedDay.set(null);
    this.navigateTab.emit(tab);
  }

  isDayFree(cell: CalendarDayCell): boolean {
    return this.customFreeDays().includes(cell.dateStr);
  }

  toggleDayFreeStatus(cell: CalendarDayCell): void {
    const current = this.customFreeDays();
    if (current.includes(cell.dateStr)) {
      this.customFreeDays.set(current.filter(d => d !== cell.dateStr));
    } else {
      this.customFreeDays.set([...current, cell.dateStr]);
    }
    this.selectedDay.set(null);
  }

  formatDateTitle(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} de ${this.monthNames[monthIndex]}, ${year}`;
  }

  getDayCellClass(cell: CalendarDayCell): string {
    switch (cell.status) {
      case 'confirmado':
        return 'bg-primary/10 border-primary/40 hover:border-primary text-white shadow-[0_0_15px_rgba(242,202,80,0.15)]';
      case 'cotizacion':
        return 'bg-purple-500/10 border-purple-500/40 hover:border-purple-400 text-white';
      case 'firma':
        return 'bg-rose-500/10 border-rose-500/40 hover:border-rose-400 text-white';
      case 'libre':
        return 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-400 text-white';
      default:
        return 'bg-white/[0.03] border-white/10 hover:border-white/30 text-white/50';
    }
  }

  getCommitmentBadgeClass(type: ScheduleDayCommitment['type']): string {
    switch (type) {
      case 'evento': return 'bg-primary text-black font-black';
      case 'cotizacion': return 'bg-purple-500 text-white';
      case 'firma': return 'bg-rose-500 text-white';
      case 'libre': return 'bg-emerald-500 text-black font-black';
    }
  }

  getBottomLineClass(status: CalendarDayCell['status']): string {
    switch (status) {
      case 'confirmado': return 'bg-primary';
      case 'cotizacion': return 'bg-purple-400';
      case 'firma': return 'bg-rose-400';
      case 'libre': return 'bg-emerald-400';
      default: return 'bg-white/10';
    }
  }

  getDetailCardClass(type: ScheduleDayCommitment['type']): string {
    switch (type) {
      case 'evento': return 'bg-primary/10 border-primary/40';
      case 'cotizacion': return 'bg-purple-500/10 border-purple-500/40';
      case 'firma': return 'bg-rose-500/10 border-rose-500/40';
      case 'libre': return 'bg-emerald-500/10 border-emerald-500/40';
    }
  }

  getCommitmentPillClass(type: ScheduleDayCommitment['type']): string {
    switch (type) {
      case 'evento': return 'bg-primary/20 border-primary/50 text-primary';
      case 'cotizacion': return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
      case 'firma': return 'bg-rose-500/20 border-rose-500/50 text-rose-300';
      case 'libre': return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    }
  }
}
