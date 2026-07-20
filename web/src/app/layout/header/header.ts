import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { LayoutService } from '../../core/services/layout.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly layoutService = inject(LayoutService);
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  showNotifications = signal(false);
  showCalendar = signal(false);

  notifications = signal([
    { id: 1, title: 'Nueva Cotización', message: 'Se ha recibido una cotización para el evento "Banda Los Reyes".', time: 'Hace 5 min', read: false, icon: 'request_quote', link: '/history' },
    { id: 2, title: 'Evento Confirmado', message: 'El evento "Vibras en Vivo" ha sido confirmado por el administrador.', time: 'Hace 1 hora', read: false, icon: 'confirmation_number', link: '/events' },
    { id: 3, title: 'Historial Actualizado', message: 'Se ha archivado una cotización antigua de "Mariachi Vargas".', time: 'Hace 3 horas', read: true, icon: 'history', link: '/history' },
    { id: 4, title: 'Perfil Completado', message: 'Tu información de perfil ha sido verificada exitosamente.', time: 'Ayer', read: true, icon: 'person', link: '/profile' },
    { id: 5, title: 'Nueva Cotización', message: 'Se ha recibido una cotización para el evento "Banda MS".', time: 'Hace 2 días', read: true, icon: 'request_quote', link: '/history' }
  ]);

  currentDate = signal(new Date());

  // Weekday initials
  weekdays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  // Generated event list (Multiple events on single days) sourced from EventService
  events = computed(() => {
    const current = this.currentDate();
    const y = current.getFullYear();
    const m = current.getMonth();
    return this.eventService.getEventsForMonth(y, m);
  });

  onDayClick(date: Date) {
    this.showCalendar.set(false); // Close calendar panel
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    this.router.navigate(['/events'], { queryParams: { date: dateStr } });
  }

  // Computed properties for calendar days containing event arrays
  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const days = [];
    const allEvents = this.events();

    // Helper to filter events on a specific day
    const getEvents = (d: Date) => {
      return allEvents.filter(e => 
        e.date.getDate() === d.getDate() &&
        e.date.getMonth() === d.getMonth() &&
        e.date.getFullYear() === d.getFullYear()
      );
    };

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        day: prevMonthLastDay - i,
        currentMonth: false,
        date: d,
        isToday: this.isSameDay(d, new Date()),
        events: getEvents(d)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        day: i,
        currentMonth: true,
        date: d,
        isToday: this.isSameDay(d, new Date()),
        events: getEvents(d)
      });
    }

    // Next month padding
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        day: i,
        currentMonth: false,
        date: d,
        isToday: this.isSameDay(d, new Date()),
        events: getEvents(d)
      });
    }

    return days;
  });

  monthName = computed(() => {
    const date = this.currentDate();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  });

  unreadNotificationsCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showNotifications.set(false);
      this.showCalendar.set(false);
    }
  }

  toggleNotifications(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showNotifications.update(v => !v);
    this.showCalendar.set(false);
  }

  toggleCalendar(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showCalendar.update(v => !v);
    this.showNotifications.set(false);
  }

  markAllAsRead() {
    this.notifications.update(notifs => 
      notifs.map(n => ({ ...n, read: true }))
    );
  }

  markAsRead(id: number) {
    this.notifications.update(notifs =>
      notifs.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  clickNotification(notif: any) {
    this.markAsRead(notif.id);
    this.showNotifications.set(false);
    if (notif.link) {
      if (notif.link.startsWith('/')) {
        this.router.navigateByUrl(notif.link);
      } else {
        window.open(notif.link, '_blank');
      }
    }
  }

  prevMonth(event: MouseEvent) {
    event.stopPropagation();
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(event: MouseEvent) {
    event.stopPropagation();
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  }
}
