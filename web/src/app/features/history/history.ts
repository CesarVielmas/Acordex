import { Component, inject, OnInit, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { EventCard, EventCardMode } from '../../shared/event-card/event-card';
import { LayoutService } from '../../core/services/layout.service';
import { EventService, TicketPurchase, PressAccreditation, QuoteItem } from '../../core/services/event.service';

interface PastEvent {
  id: number;
  imageUrl: string;
  imageAlt: string;
  date: string;
  title: string;
  location: string;
  mode: EventCardMode;
  rating: number;
  comment?: string;
  photos?: string[];
  videoRecap?: string;
  sanitizedVideoRecap?: SafeResourceUrl;
}

interface Coupon {
  code: string;
  discount: string;
  description: string;
  expiryDate: string;
  isUsed: boolean;
}

@Component({
  selector: 'app-history',
  imports: [CommonModule, FormsModule],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  private readonly layoutService = inject(LayoutService);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly elementRef = inject(ElementRef);

  goToBandProfile(bandName: string) {
    const slug = bandName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.router.navigate(['/grupo', slug]);
  }

  // Active filter tab pill
  activeTab = signal<string>('todos');

  // Date filters
  filterStartDate = signal<string>('');
  filterEndDate = signal<string>('');
  showDateFilterPopover = signal<boolean>(false);
  activeDatePreset = signal<string>('all');

  // Rating and review toast notification state
  ratingMessage = signal<string>('');

  // Contract Modal State
  isContractModalOpen = signal<boolean>(false);
  selectedContractQuote = signal<QuoteItem | null>(null);
  isContractSigned = signal<boolean>(false);

  // Detail View Modals States (Large Full Screen panels)
  isTicketDetailModalOpen = signal<boolean>(false);
  selectedTicketDetail = signal<any | null>(null);

  isQuoteDetailModalOpen = signal<boolean>(false);
  selectedQuoteDetail = signal<QuoteItem | null>(null);

  isAccredDetailModalOpen = signal<boolean>(false);
  selectedAccredDetail = signal<any | null>(null);

  // Rating and review input forms inside full-screen modals
  tempRating = signal<number>(0);
  tempComment = signal<string>('');

  // Map stores comments and reviews for quote folios
  quoteReviews = signal<Record<string, { rating: number, comment: string }>>({});

  // Active Coupons List
  coupons = signal<Coupon[]>([
    {
      code: 'ACX-WELCOME-5',
      discount: '5% DESC',
      description: 'Cupón de bienvenida por registro oficial en la plataforma Acordex.',
      expiryDate: '31/12/2026',
      isUsed: false
    }
  ]);

  // Claimed rewards map
  claimedRewards = signal<Record<number, boolean>>({});

  // Complaints / Suggestions dynamic database
  complaintsLog = signal<any[]>([]);
  tempComplaintText = signal<string>('');

  // Seeded past events matching EventService purchases/accreds
  pastEvents = signal<PastEvent[]>([
    {
      id: 101,
      imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=600&auto=format&fit=crop',
      imageAlt: 'Gala Sinaloense VIP',
      date: '15 Nov 2024',
      title: 'Gala Sinaloense VIP',
      location: 'Arena Monterrey',
      mode: 'history_done' as EventCardMode,
      rating: 4.5,
      comment: 'Un concierto espectacular, la cercanía con la banda y el sonido en la Arena fue de otro planeta.',
      photos: [
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=300&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300&auto=format&fit=crop'
      ],
      videoRecap: 'https://www.youtube.com/embed/F77FwZq-7gE',
      sanitizedVideoRecap: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/F77FwZq-7gE')
    },
    {
      id: 102,
      imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
      imageAlt: 'Noche de Metales',
      date: '28 Nov 2024',
      title: 'Noche de Metales',
      location: 'Auditorio Telmex',
      mode: 'history_done' as EventCardMode,
      rating: 4.0,
      comment: 'Espectáculo de primer nivel, el sonido estuvo increíble y la logística de acceso fue muy rápida.',
      photos: [
        'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=300&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=300&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop'
      ],
      videoRecap: 'https://www.youtube.com/embed/TfH73dnhfmg',
      sanitizedVideoRecap: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/TfH73dnhfmg')
    }
  ]);

  // Computed lists resolving global service states with fallback info
  purchasedTickets = computed(() => {
    return this.eventService.purchases().map((p, idx) => {
      const eventInfo = this.eventService.getEventById(p.eventId) || {
        id: p.eventId,
        title: 'Concierto Especial Acordex',
        date: p.purchaseDate,
        location: 'Arena Auditorio Principal',
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop'
      };
      
      const matchedPast = this.pastEvents().find(x => x.id === p.eventId);

      return {
        ...p,
        eventInfo,
        rating: matchedPast ? matchedPast.rating : 0,
        comment: matchedPast ? matchedPast.comment : '',
        photos: matchedPast ? matchedPast.photos : [
          'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=300',
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300'
        ],
        videoRecap: matchedPast ? matchedPast.videoRecap : 'https://www.youtube.com/embed/lZeaL8Z96iE',
        sanitizedVideoRecap: matchedPast ? matchedPast.sanitizedVideoRecap : this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/lZeaL8Z96iE'),
        transactionId: `TXN-${p.eventId}-${1000 + idx * 7}`,
        qrUrl: this.sanitizer.bypassSecurityTrustResourceUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ACX-TICKET-${p.eventId}-${idx}`)
      };
    });
  });

  pressAccreditations = computed(() => {
    const accreds = this.eventService.pressAccreditations();
    return Object.values(accreds).map((a, idx) => {
      const eventInfo = this.eventService.getEventById(a.eventId) || {
        id: a.eventId,
        title: 'Firma de Autógrafos Oficial',
        date: new Date(),
        location: 'Plaza Central Recinto',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop'
      };
      return {
        ...a,
        eventInfo,
        qrUrl: this.sanitizer.bypassSecurityTrustResourceUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ACX-PRESS-${a.eventId}-${idx}`)
      };
    });
  });

  submittedQuotes = computed(() => {
    return this.eventService.submittedQuotes();
  });

  communityReviews = computed(() => {
    const ticket = this.selectedTicketDetail();
    if (!ticket) return [];
    
    return [
      {
        userName: 'Adrián Cantú',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
        rating: 5,
        comment: '¡El mejor concierto del año! La banda tocó sin parar, interactuó muchísimo con el público y el sonido estuvo impecable. ¡Espero que vuelvan pronto!'
      },
      {
        userName: 'Valeria S.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
        rating: 4.5,
        comment: 'Excelente organización y seguridad. Pudimos ingresar rápidamente con el código QR y los asientos tenían una visibilidad de primer nivel hacia el escenario.'
      }
    ];
  });

  // Dynamic filter application logic combining Tabs and Date Filters
  filteredPurchasedTickets = computed(() => {
    let list = this.purchasedTickets();
    const start = this.filterStartDate();
    const end = this.filterEndDate();
    
    if (start) {
      list = list.filter(p => {
        const pDate = new Date(p.purchaseDate);
        return pDate >= new Date(start + 'T00:00:00');
      });
    }
    if (end) {
      list = list.filter(p => {
        const pDate = new Date(p.purchaseDate);
        return pDate <= new Date(end + 'T23:59:59');
      });
    }
    return list;
  });

  filteredSubmittedQuotes = computed(() => {
    let list = this.submittedQuotes();
    const start = this.filterStartDate();
    const end = this.filterEndDate();
    
    if (start) {
      list = list.filter(q => new Date(q.eventDate) >= new Date(start));
    }
    if (end) {
      list = list.filter(q => new Date(q.eventDate) <= new Date(end));
    }
    return list;
  });

  filteredPressAccreditations = computed(() => {
    let list = this.pressAccreditations();
    const start = this.filterStartDate();
    const end = this.filterEndDate();
    
    if (start) {
      list = list.filter(a => {
        const dateObj = new Date(a.eventInfo.date);
        return dateObj >= new Date(start + 'T00:00:00');
      });
    }
    if (end) {
      list = list.filter(a => {
        const dateObj = new Date(a.eventInfo.date);
        return dateObj <= new Date(end + 'T23:59:59');
      });
    }
    return list;
  });

  hasAnyActivities = computed(() => {
    return this.filteredPurchasedTickets().length > 0 || 
           this.filteredSubmittedQuotes().length > 0 || 
           this.filteredPressAccreditations().length > 0;
  });

  // Stats Dashboard computed values
  stats = computed(() => {
    const pastAttendedCount = this.pastEvents().filter(e => e.rating > 0).length;
    return {
      totalAttended: pastAttendedCount || 1,
      totalTickets: this.purchasedTickets().reduce((sum, p) => sum + p.seats.length, 0),
      totalQuotes: this.submittedQuotes().length,
      activeCoupons: this.coupons().filter(c => !c.isUsed).length
    };
  });

  ngOnInit() {
    this.layoutService.setPageTitle('MI HISTORIAL Y ACTIVIDADES');
  }

  setActiveTab(tabName: string) {
    this.activeTab.set(tabName);
  }

  clearDateFilters() {
    this.filterStartDate.set('');
    this.filterEndDate.set('');
  }

  // Claim reward for attending a past event
  claimAttendanceReward(eventId: number, eventTitle: string) {
    if (this.claimedRewards()[eventId]) return;

    this.claimedRewards.update(map => ({ ...map, [eventId]: true }));
    
    const couponCode = `ACX-ASISTIO-${eventId}-${Math.floor(100 + Math.random() * 900)}`;
    this.coupons.update(list => [
      ...list,
      {
        code: couponCode,
        discount: '20% DESC',
        description: `Premio de lealtad otorgado por asistir a "${eventTitle}". ¡Gracias por tu preferencia!`,
        expiryDate: '15/12/2026',
        isUsed: false
      }
    ]);

    this.ratingMessage.set('¡Recompensa de asistencia reclamada! Obtuviste un cupón del 20%.');
    setTimeout(() => this.ratingMessage.set(''), 4000);
  }

  // Rate and comment events
  rateEvent(event: PastEvent, stars: number) {
    this.pastEvents.update(list => list.map(item => {
      if (item.id === event.id) {
        return { ...item, rating: stars, mode: 'history_done' as EventCardMode };
      }
      return item;
    }));

    this.unlockRatingCoupon(event.title);
  }

  saveEventComment(event: PastEvent, commentText: string) {
    this.pastEvents.update(list => list.map(item => {
      if (item.id === event.id) {
        return { ...item, comment: commentText };
      }
      return item;
    }));

    this.unlockRatingCoupon(event.title);
    
    this.ratingMessage.set(`¡Reseña guardada y descuento desbloqueado para "${event.title}"!`);
    setTimeout(() => this.ratingMessage.set(''), 4000);
  }

  private unlockRatingCoupon(eventTitle: string) {
    const couponCode = `ACX-REVIEW-${Math.floor(10 + Math.random() * 90)}`;
    const exists = this.coupons().some(c => c.code.startsWith('ACX-REVIEW'));
    
    if (!exists) {
      this.coupons.update(list => [
        ...list,
        {
          code: couponCode,
          discount: '10% DESC',
          description: `Descuento especial obtenido al calificar tu asistencia a: "${eventTitle}".`,
          expiryDate: '30/11/2026',
          isUsed: false
        }
      ]);
    }
  }

  // Rate and comment quotes
  rateQuote(folio: string, stars: number) {
    const current = this.quoteReviews()[folio] || { rating: 0, comment: '' };
    this.quoteReviews.update(map => ({
      ...map,
      [folio]: { ...current, rating: stars }
    }));
  }

  saveQuoteComment(folio: string, commentText: string) {
    const current = this.quoteReviews()[folio] || { rating: 0, comment: '' };
    this.quoteReviews.update(map => ({
      ...map,
      [folio]: { ...current, comment: commentText }
    }));

    this.coupons.update(list => {
      const exists = list.some(c => c.code.startsWith('ACX-QUOTE'));
      if (exists) return list;
      return [
        ...list,
        {
          code: `ACX-QUOTE-15`,
          discount: '15% DESC',
          description: `Desbloqueado por calificar y calentar la cotización de bandas musicales en Acordex.`,
          expiryDate: '31/12/2026',
          isUsed: false
        }
      ];
    });

    this.ratingMessage.set(`¡Calificación de cotización guardada y cupón del 15% desbloqueado!`);
    setTimeout(() => this.ratingMessage.set(''), 4000);
  }

  // Submit Complaint / Suggestion Box
  submitComplaint(category: string, referenceId: string) {
    if (!this.tempComplaintText().trim()) {
      alert('Por favor escribe tu sugerencia o queja.');
      return;
    }

    this.complaintsLog.update(list => [
      ...list,
      {
        id: `COMP-${1000 + list.length}`,
        category,
        referenceId,
        text: this.tempComplaintText(),
        status: 'Enviado a Soporte',
        date: new Date()
      }
    ]);

    this.tempComplaintText.set('');
    this.ratingMessage.set('Sugerencia/Queja enviada con éxito al departamento legal de Acordex.');
    setTimeout(() => this.ratingMessage.set(''), 4500);

    this.closeTicketDetail();
    this.closeQuoteDetail();
    this.closeAccredDetail();
  }

  // Navigations
  adminTickets(eventId: number) {
    this.router.navigate(['/events/comprar-boletos'], { queryParams: { id: eventId } });
  }

  adminAccreditation(eventId: number) {
    this.router.navigate(['/events/firma-prensa'], { queryParams: { id: eventId } });
  }

  // Detail Modals Handlers (Opening large full screen views)
  openTicketDetail(ticket: any) {
    this.selectedTicketDetail.set(ticket);
    
    const matchedPast = this.pastEvents().find(x => x.id === ticket.eventId);
    this.tempRating.set(matchedPast ? matchedPast.rating : 0);
    this.tempComment.set(matchedPast ? matchedPast.comment || '' : '');
    this.tempComplaintText.set('');
    
    this.isTicketDetailModalOpen.set(true);
  }

  closeTicketDetail() {
    this.isTicketDetailModalOpen.set(false);
    this.selectedTicketDetail.set(null);
  }

  submitTicketReview(eventId: number) {
    this.pastEvents.update(list => {
      const found = list.find(x => x.id === eventId);
      if (found) {
        return list.map(item => {
          if (item.id === eventId) {
            return { ...item, rating: this.tempRating(), comment: this.tempComment(), mode: 'history_done' as EventCardMode };
          }
          return item;
        });
      } else {
        const ticketDetail = this.selectedTicketDetail();
        return [...list, {
          id: eventId,
          imageUrl: ticketDetail?.eventInfo?.imageUrl || '',
          imageAlt: ticketDetail?.eventInfo?.title || '',
          date: 'Reciente',
          title: ticketDetail?.eventInfo?.title || 'Concierto',
          location: ticketDetail?.eventInfo?.location || '',
          mode: 'history_done' as EventCardMode,
          rating: this.tempRating(),
          comment: this.tempComment(),
          photos: [
            'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=300',
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300'
          ],
          videoRecap: 'https://www.youtube.com/embed/lZeaL8Z96iE',
          sanitizedVideoRecap: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/lZeaL8Z96iE')
        }];
      }
    });

    this.unlockRatingCoupon(this.selectedTicketDetail()?.eventInfo?.title || 'Concierto');

    this.ratingMessage.set('Reseña del concierto guardada y cupón desbloqueado con éxito.');
    setTimeout(() => this.ratingMessage.set(''), 4000);
    this.closeTicketDetail();
  }

  openQuoteDetail(quote: QuoteItem) {
    this.selectedQuoteDetail.set(quote);
    
    const matchedReview = this.quoteReviews()[quote.folio] || { rating: 0, comment: '' };
    this.tempRating.set(matchedReview.rating);
    this.tempComment.set(matchedReview.comment);
    this.tempComplaintText.set('');
    
    this.isQuoteDetailModalOpen.set(true);
  }

  closeQuoteDetail() {
    this.isQuoteDetailModalOpen.set(false);
    this.selectedQuoteDetail.set(null);
  }

  submitQuoteReview(folio: string) {
    this.quoteReviews.update(map => ({
      ...map,
      [folio]: { rating: this.tempRating(), comment: this.tempComment() }
    }));

    this.coupons.update(list => {
      const exists = list.some(c => c.code.startsWith('ACX-QUOTE'));
      if (exists) return list;
      return [
        ...list,
        {
          code: `ACX-QUOTE-15`,
          discount: '15% DESC',
          description: `Desbloqueado por calificar y calentar la cotización de bandas musicales en Acordex.`,
          expiryDate: '31/12/2026',
          isUsed: false
        }
      ];
    });

    this.ratingMessage.set('Calificación de la cotización guardada y cupón desbloqueado.');
    setTimeout(() => this.ratingMessage.set(''), 4000);
    this.closeQuoteDetail();
  }

  openAccredDetail(accred: any) {
    this.selectedAccredDetail.set(accred);
    this.tempComplaintText.set('');
    this.isAccredDetailModalOpen.set(true);
  }

  closeAccredDetail() {
    this.isAccredDetailModalOpen.set(false);
    this.selectedAccredDetail.set(null);
  }

  // Contract Modal Handlers
  openContract(quote: QuoteItem) {
    this.selectedContractQuote.set(quote);
    this.isContractSigned.set(quote.status === 'signed');
    this.isContractModalOpen.set(true);
  }

  closeContract() {
    this.isContractModalOpen.set(false);
    this.selectedContractQuote.set(null);
  }

  signContract() {
    const quote = this.selectedContractQuote();
    if (quote) {
      this.isContractSigned.set(true);
      quote.status = 'signed';
      this.eventService.addQuote(quote);
      
      const detailed = this.selectedQuoteDetail();
      if (detailed && detailed.folio === quote.folio) {
        this.selectedQuoteDetail.set({ ...detailed, status: 'signed' });
      }
    }
  }

  toggleDatePopover(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.showDateFilterPopover.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDateFilterPopover.set(false);
    }
  }

  applyPreset(preset: string) {
    this.activeDatePreset.set(preset);
    if (preset === 'all') {
      this.filterStartDate.set('');
      this.filterEndDate.set('');
    } else if (preset === 'nov_2024') {
      this.filterStartDate.set('2024-11-01');
      this.filterEndDate.set('2024-11-30');
    } else if (preset === 'year_2024') {
      this.filterStartDate.set('2024-01-01');
      this.filterEndDate.set('2024-12-31');
    }
    this.showDateFilterPopover.set(false);
  }
}
