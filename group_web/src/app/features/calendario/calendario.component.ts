import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupDataService } from '../../core/services/group-data.service';
import { GroupEventItem } from '../../core/models/event.models';
import { QuoteItem } from '../../core/models/quote.models';
import { EvidenceUploaderModalComponent } from '../../shared/evidence-uploader-modal/evidence-uploader-modal.component';

export interface CalendarDayCell {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  events: GroupEventItem[];
  quotes: QuoteItem[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EvidenceUploaderModalComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss'
})
export class CalendarioComponent {
  readonly groupData = inject(GroupDataService);

  // Active navigation date: Defaults to August 2026 to match data
  readonly currentYear = signal<number>(2026);
  readonly currentMonth = signal<number>(7); // 0-indexed: 7 is August

  readonly viewMode = signal<'mes' | 'semana' | 'agenda'>('mes');
  readonly typeFilter = signal<string>('Todos');
  readonly showQuotesFilter = signal<boolean>(true);

  readonly selectedEvent = signal<GroupEventItem | null>(null);
  readonly selectedQuote = signal<QuoteItem | null>(null);
  readonly isDetailOpen = signal<boolean>(false);
  readonly isDetailDrawerOpen = this.isDetailOpen;
  readonly isUploaderOpen = signal<boolean>(false);

  readonly weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  readonly weekDaysShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  readonly eventTypes = ['Todos', 'Concierto', 'Festival Masivo', 'Boda / Evento Privado', 'Palenque', 'Firma de Autógrafos'];

  readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Current Month Display Name
  readonly currentMonthLabel = computed<string>(() => {
    return `${this.monthNames[this.currentMonth()]} ${this.currentYear()}`;
  });

  // Filtered Events
  readonly filteredEvents = computed<GroupEventItem[]>(() => {
    const list = this.groupData.events();
    const type = this.typeFilter();
    if (type === 'Todos') return list;
    return list.filter(e => e.type === type);
  });

  // Filtered Quotes
  readonly relevantQuotes = computed<QuoteItem[]>(() => {
    if (!this.showQuotesFilter()) return [];
    const profile = this.groupData.activeProfile();
    return this.groupData.quotes().filter(q => 
      (q.groupId === profile.id || q.groupName === profile.name)
    );
  });

  // Month Statistics
  readonly monthStats = computed(() => {
    const y = this.currentYear();
    const m = this.currentMonth();
    const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;

    const monthEvents = this.filteredEvents().filter(e => e.date.startsWith(prefix));
    const monthQuotes = this.relevantQuotes().filter(q => (q.proposedDate || q.eventDate || '').startsWith(prefix));

    const totalRevenue = monthEvents.reduce((acc, ev) => acc + (ev.honorarios || 0), 0);
    const confirmedCount = monthEvents.length;
    const pendingQuotesCount = monthQuotes.filter(q => !q.isDirectChatAccepted).length;

    return {
      confirmedCount,
      totalRevenue,
      pendingQuotesCount,
      events: monthEvents,
      quotes: monthQuotes
    };
  });

  // Real Calendar Matrix Generation (42 cells: 6 rows x 7 cols)
  readonly calendarMatrix = computed<CalendarDayCell[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Calculate day offset for Monday-first week (0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: CalendarDayCell[] = [];
    const todayStr = '2026-08-17'; // Anchor date

    const allEvents = this.filteredEvents();
    const allQuotes = this.relevantQuotes();

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = this.formatDate(prevDate);
      days.push({
        date: prevDate,
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        events: allEvents.filter(e => e.date === dateStr),
        quotes: allQuotes.filter(q => (q.proposedDate || q.eventDate) === dateStr)
      });
    }

    // Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const currDate = new Date(year, month, day);
      const dateStr = this.formatDate(currDate);
      days.push({
        date: currDate,
        dateString: dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        events: allEvents.filter(e => e.date === dateStr),
        quotes: allQuotes.filter(q => (q.proposedDate || q.eventDate) === dateStr)
      });
    }

    // Next month filler days to complete 42 cells grid
    const remaining = 42 - days.length;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      const nextDate = new Date(year, month + 1, nextDay);
      const dateStr = this.formatDate(nextDate);
      days.push({
        date: nextDate,
        dateString: dateStr,
        dayNumber: nextDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        events: allEvents.filter(e => e.date === dateStr),
        quotes: allQuotes.filter(q => (q.proposedDate || q.eventDate) === dateStr)
      });
    }

    return days;
  });

  // Week View Days (7 days centered around anchor or active week)
  readonly weekViewDays = computed<CalendarDayCell[]>(() => {
    const matrix = this.calendarMatrix();
    // Return the week containing events or middle of the month
    const activeIndex = matrix.findIndex(c => c.isCurrentMonth && c.events.length > 0) || 14;
    const weekStart = Math.floor(activeIndex / 7) * 7;
    return matrix.slice(weekStart, weekStart + 7);
  });

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Navigation Methods
  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
  }

  goToToday(): void {
    this.currentYear.set(2026);
    this.currentMonth.set(7); // August 2026
  }

  // Event & Quote Inspector
  openEventDetail(event: GroupEventItem): void {
    this.selectedQuote.set(null);
    this.selectedEvent.set(event);
    this.isDetailOpen.set(true);
  }

  openQuoteDetail(quote: QuoteItem): void {
    this.selectedEvent.set(null);
    this.selectedQuote.set(quote);
    this.isDetailOpen.set(true);
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedEvent.set(null);
    this.selectedQuote.set(null);
  }

  openUploader(event: GroupEventItem): void {
    this.selectedEvent.set(event);
    this.isUploaderOpen.set(true);
  }

  closeUploader(): void {
    this.isUploaderOpen.set(false);
  }

  getEventTypeColor(type: string): { bg: string; text: string; border: string; dot: string } {
    switch (type) {
      case 'Festival Masivo':
        return { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40', dot: 'bg-emerald-400' };
      case 'Boda / Evento Privado':
        return { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/40', dot: 'bg-sky-400' };
      case 'Palenque':
        return { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/40', dot: 'bg-rose-400' };
      case 'Firma de Autógrafos':
        return { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/40', dot: 'bg-purple-400' };
      default:
        return { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/40', dot: 'bg-primary' };
    }
  }
}
