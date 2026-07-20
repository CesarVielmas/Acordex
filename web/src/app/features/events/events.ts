import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventCard } from '../../shared/event-card/event-card';
import { LayoutService } from '../../core/services/layout.service';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-events',
  imports: [CommonModule, EventCard],
  templateUrl: './events.html',
  styleUrl: './events.scss'
})
export class Events implements OnInit {
  private readonly layoutService = inject(LayoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  selectedDateStr = signal<string>('');
  selectedDate = signal<Date>(new Date());
  filteredEvents = signal<any[]>([]);

  // Categorized Event Groups for Day View
  conciertosYFestivales = signal<any[]>([]);
  firmasYPrensa = signal<any[]>([]);
  misCotizaciones = signal<any[]>([]);

  // Contract Modal State Signals
  isContractModalOpen = signal<boolean>(false);
  selectedContractEvent = signal<any | null>(null);
  isContractSigned = signal<boolean>(false);

  // Slider State
  currentSliderDate = signal<Date>(new Date());
  sliderDays = signal<any[]>([]);
  showSlider = signal<boolean>(false);

  // General View State (Timeline)
  generalEvents = signal<any[]>([]);
  private isCustomRangeActive = false;

  // Range text for general view subtitle
  rangeStartStr = signal<string>('');
  rangeEndStr = signal<string>('');

  // Dynamic subtitle text
  subtitleText = computed(() => {
    if (this.selectedDateStr()) {
      return `Próximos eventos registrados para el día ${this.getFormattedDateLong()} para sus cotizaciones, conciertos o festivales próximos a llegar.`;
    } else {
      return `Próximos eventos registrados del ${this.rangeStartStr()} al ${this.rangeEndStr()} para sus cotizaciones, conciertos o festivales próximos a llegar.`;
    }
  });

  // Group events by day for the general timeline view, sub-categorizing them internally by event type
  generalEventsGroupedByDay = computed(() => {
    const list = this.generalEvents();
    const groups: {
      dateStr: string;
      dateLong: string;
      conciertosYFestivales: any[];
      misCotizaciones: any[];
      firmasYPrensa: any[];
      hasEvents: boolean;
    }[] = [];

    list.forEach(e => {
      const y = e.rawDate.getFullYear();
      const m = String(e.rawDate.getMonth() + 1).padStart(2, '0');
      const d = String(e.rawDate.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;

      let group = groups.find(g => g.dateStr === key);
      if (!group) {
        group = {
          dateStr: key,
          dateLong: this.getFormattedDateLongForDate(e.rawDate),
          conciertosYFestivales: [],
          misCotizaciones: [],
          firmasYPrensa: [],
          hasEvents: true
        };
        groups.push(group);
      }

      if (e.type === 'concierto' || e.type === 'festival') {
        group.conciertosYFestivales.push(e);
      } else if (e.type === 'cotizacion') {
        group.misCotizaciones.push(e);
      } else if (e.type === 'firma') {
        group.firmasYPrensa.push(e);
      }
    });

    return groups;
  });

  ngOnInit() {
    this.layoutService.setPageTitle('EVENTOS');
    this.route.queryParams.subscribe(params => {
      const dateParam = params['date'];
      if (dateParam) {
        this.selectedDateStr.set(dateParam);
        this.showSlider.set(true);
        
        // Parse date and synchronize slider view
        const parts = dateParam.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const activeDate = new Date(year, month, day);
          this.currentSliderDate.set(new Date(year, month, 1));
          this.selectedDate.set(activeDate);
        }
        
        this.generateSliderDays();
        this.filterEventsForDate(dateParam);
      } else {
        this.selectedDateStr.set('');
        this.showSlider.set(false);
        this.filteredEvents.set([]);
        this.conciertosYFestivales.set([]);
        this.firmasYPrensa.set([]);
        this.misCotizaciones.set([]);
        
        if (this.isCustomRangeActive) {
          // Keep the custom range events loaded by clearDateFilter
          this.isCustomRangeActive = false;
        } else {
          // Default: load events from today until the end of the month
          const today = new Date();
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          this.loadEventsForRange(today, lastDayOfMonth);
        }
      }
    });
  }

  generateSliderDays() {
    const date = this.currentSliderDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    const weekdaysSpan = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

    // Get all events for this month to check which days have events and of what type
    const allEvents = this.eventService.getEventsForMonth(year, month);

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDayDate = new Date(year, month, i);
      // Ignore reunions
      const dayEvents = allEvents.filter(e => e.date.getDate() === i && e.type !== 'reunion');

      days.push({
        dayNumber: i,
        dayName: weekdaysSpan[currentDayDate.getDay()],
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        date: currentDayDate,
        hasEvents: dayEvents.length > 0,
        hasConcert: dayEvents.some(e => e.type === 'concierto'),
        hasFestival: dayEvents.some(e => e.type === 'festival'),
        hasQuote: dayEvents.some(e => e.type === 'cotizacion'),
        hasFirma: dayEvents.some(e => e.type === 'firma'),
      });
    }

    this.sliderDays.set(days);
  }

  filterEventsForDate(dateParam: string) {
    const parts = dateParam.split('-');
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const monthEvents = this.eventService.getEventsForMonth(year, month);
    
    // Filter events for the selected day, EXCLUDING logistics/reuniones!
    const dayEvents = monthEvents.filter(e => {
      const d = e.date;
      return d.getDate() === day && 
             d.getMonth() === month && 
             d.getFullYear() === year &&
             e.type !== 'reunion';
    });

    const mapped = dayEvents.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location || 'Ubicación por confirmar',
      imageUrl: e.imageUrl || this.getFallbackImage(e.type),
      date: this.formatDateLabel(e.date),
      type: e.type,
      color: e.color
    }));

    // Group events by category (excluding reunions)
    this.conciertosYFestivales.set(mapped.filter(e => e.type === 'concierto' || e.type === 'festival'));
    this.firmasYPrensa.set(mapped.filter(e => e.type === 'firma'));
    this.misCotizaciones.set(mapped.filter(e => e.type === 'cotizacion'));

    this.filteredEvents.set(mapped);
  }

  loadEventsForRange(startDate: Date, endDate: Date) {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    let allEvents: any[] = [];
    allEvents = allEvents.concat(this.eventService.getEventsForMonth(startYear, startMonth));

    if (startYear !== endYear || startMonth !== endMonth) {
      allEvents = allEvents.concat(this.eventService.getEventsForMonth(endYear, endMonth));
    }

    // Filter by range and exclude reunions
    const inRange = allEvents.filter(e => {
      const eventTime = new Date(e.date);
      eventTime.setHours(0, 0, 0, 0);

      const startCompare = new Date(startDate);
      startCompare.setHours(0, 0, 0, 0);

      const endCompare = new Date(endDate);
      endCompare.setHours(23, 59, 59, 999);

      return eventTime >= startCompare && eventTime <= endCompare && e.type !== 'reunion';
    });

    // Sort chronologically
    inRange.sort((a, b) => a.date.getTime() - b.date.getTime());

    const mapped = inRange.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location || 'Ubicación por confirmar',
      imageUrl: e.imageUrl || this.getFallbackImage(e.type),
      date: this.formatDateLabel(e.date),
      type: e.type,
      color: e.color,
      rawDate: e.date
    }));

    // Synchronize friendly range dates
    this.rangeStartStr.set(this.formatDateFriendly(startDate));
    this.rangeEndStr.set(this.formatDateFriendly(endDate));

    this.generalEvents.set(mapped);
  }

  private getFallbackImage(type: string): string {
    switch (type) {
      case 'concierto':
      case 'festival':
        return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop';
      case 'firma':
        return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop';
    }
  }

  formatDateLabel(date: Date): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const d = String(date.getDate()).padStart(2, '0');
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  }

  getFormattedDateLong(): string {
    const dateStr = this.selectedDateStr();
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${day} de ${months[monthIdx]} de ${year}`;
  }

  getFormattedDateLongForDate(date: Date): string {
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  }

  formatDateFriendly(date: Date): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  }

  clearDateFilter() {
    const selected = this.selectedDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    let startDate = new Date();
    let endDate = new Date();

    if (selected >= today) {
      // Case A: Selected date is today or in the future -> 1 month range from selected date
      startDate = new Date(selected);
      endDate = new Date(selected);
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      // Case B: Selected date is in the past -> show from today until end of current month
      startDate = new Date(today);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    this.isCustomRangeActive = true;
    this.loadEventsForRange(startDate, endDate);
    this.router.navigate(['/events'], { queryParams: {} });
  }

  prevSliderMonth() {
    const current = this.currentSliderDate();
    const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentSliderDate.set(prev);
    this.generateSliderDays();
  }

  nextSliderMonth() {
    const current = this.currentSliderDate();
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentSliderDate.set(next);
    this.generateSliderDays();
  }

  getSliderMonthName(): string {
    const date = this.currentSliderDate();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  selectSliderDay(dateStr: string) {
    this.router.navigate(['/events'], { queryParams: { date: dateStr } });
  }

  goToBuyTickets(id: number) {
    this.router.navigate(['/events/comprar-boletos'], { queryParams: { id } });
  }

  goToFirmaPrensa(id: number) {
    this.router.navigate(['/events/firma-prensa'], { queryParams: { id } });
  }

  openContract(event: any) {
    this.selectedContractEvent.set(event);
    this.isContractSigned.set(false);
    this.isContractModalOpen.set(true);
  }

  closeContract() {
    this.isContractModalOpen.set(false);
    this.selectedContractEvent.set(null);
  }

  signContract() {
    this.isContractSigned.set(true);
  }

  events = [
    {
      id: 101,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn5YNsp8Swg0q0SGm8jeu6ZVz8b44-B9qtueXTHKEsUpFnI7e_9gllAAV_aCsHZHaiAVErKdwuzJM2YAcc9D-oS5mD8h1RMViV4ygLLhrdDICdoIuSwx7bgAwryuQYUYB_q-mVMx0as2Fa5Z1ac15xt0tEPFSuPUeuE1cENsVvyDipE4WTiCEMOz0Q58k8pGbChddOBHt8FEjAFqnXGYyQ2KusBph6WyCLRsuhcmRwGxTKyOJTgkCmN3o7iGcCkx4iiynHu6IWbxA',
      imageAlt: 'Gala Sinaloense VIP',
      date: '15 Nov 2024',
      title: 'Gala Sinaloense VIP',
      location: 'Arena Monterrey'
    },
    {
      id: 102,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcCmK2O8LiUrz8S3Z8rVYTF2KvBXNugSwQp78x6VCyEoSHOEjhrbgcxJDaEsUf7Lwp9h_TCu7wPAKDh3doMxxvZpXPCJ19JrqNChF33SdUI2oNL9jCtEkecmtWz8d5d3H8cLjWh8qI7Jw340gN8lfFIrwddsM5JkQS8cuKCCHs9Y3134SiAJizMLvK0Mfzo-OzpTM__OIBfOPa8neU8PlkQ1T5Cb9sJ0j2t8ch-Mb0Ize8Fn6_-OwXKtYpVy7-PoVFRGhnqI_0oLY',
      imageAlt: 'Noche de Metales',
      date: '28 Nov 2024',
      title: 'Noche de Metales',
      location: 'Auditorio Telmex'
    },
    {
      id: 103,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSaiVdHEIuUMBk7BlrExFEg9DWu9YUu0dxfBLM1x1KWq_ZczzEGVBp260xE9HXMjE4_i3he5TRGaP4WWyVwSULBOEkBEYE69Jc68Fm2TgYO1tLUTbDZku72AIvZ07aWSc3v-LoRYSuNZCpDBWZKC3M6z2p7QicQi1JlOLYL2f89vHfGe1nfmn3TJSoAVC0F2DDNALF7W8emRTb8jE3oc1L_FOp4F65o9IPSP1X978d_wBHfw6daRDUoT3R3Yoif4R5At0a5PgnC4',
      imageAlt: 'Encuentro de Bandas',
      date: '05 Dic 2024',
      title: 'Encuentro de Bandas',
      location: 'Plaza de Toros México'
    }
  ];
}
