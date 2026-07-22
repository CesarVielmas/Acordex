import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, CalendarEvent, TicketPurchase, PurchasedSeat } from '../../../core/services/event.service';
import { LayoutService } from '../../../core/services/layout.service';

interface Seat {
  id: string; // e.g. A-3
  row: string;
  number: number;
  category: string;
  price: number;
  status: 'available' | 'sold' | 'selected' | 'purchased';
}

@Component({
  selector: 'app-seleccion-asientos',
  imports: [CommonModule],
  templateUrl: './seleccion-asientos.html',
  styleUrl: './seleccion-asientos.scss'
})
export class SeleccionAsientos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly layoutService = inject(LayoutService);

  event = signal<CalendarEvent | null>(null);
  selectedCategory = signal<string>('VIP Oro');

  onBandClick(bandName: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!bandName) return;
    const namePart = bandName.split('-')[0].trim();
    const slug = namePart.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.router.navigate(['/grupo', slug]);
  }
  
  // List of all seats in the venue
  seats = signal<Seat[]>([]);
  
  // Global cart selections across all categories
  selectedSeatsMap = signal<Record<string, { id: string, categoryName: string, price: number, isOriginal?: boolean }>>({});

  // Modal states
  isPurchaseModalOpen = signal<boolean>(false);
  isRefundModalOpen = signal<boolean>(false);
  isDiffRefundModalOpen = signal<boolean>(false); // Modal for difference refund (downgrade)
  
  // Mock payment details
  cardName = signal<string>('');
  cardNumber = signal<string>('');
  cardExpiry = signal<string>('');
  cardCvv = signal<string>('');
  
  // Validation errors
  errorMessage = signal<string>('');

  // Original purchase if editing
  existingPurchase = signal<TicketPurchase | null>(null);
  isEditing = signal<boolean>(false);

  // Refund checkboxes selection map (for partial/total refund)
  refundSeats = signal<Record<string, boolean>>({});

  categoryDetails = [
    { name: 'VIP Oro', price: 2200, color: '#F2CA50', rows: ['A', 'B', 'C', 'D'], cols: 6 },
    { name: 'Preferente', price: 1200, color: '#3B82F6', rows: ['E', 'F', 'G', 'H', 'I'], cols: 8 },
    { name: 'General A', price: 650, color: '#10B981', rows: ['J', 'K', 'L', 'M', 'N', 'O'], cols: 10 },
    { name: 'Grada General', price: 350, color: '#F97316', rows: ['P', 'Q', 'R', 'S', 'T', 'U'], cols: 12 }
  ];

  selectedSeats = computed(() => {
    return Object.values(this.selectedSeatsMap());
  });

  totalPrice = computed(() => {
    return this.selectedSeats().reduce((sum, s) => sum + s.price, 0);
  });

  // Group seats by row to render them row-by-row centered in the template
  seatsByRow = computed(() => {
    const map: Record<string, { row: string, categoryName: string, color: string, seats: Seat[] }> = {};
    
    this.seats().forEach(s => {
      if (!map[s.row]) {
        const catConfig = this.categoryDetails.find(c => c.name === s.category);
        map[s.row] = {
          row: s.row,
          categoryName: s.category,
          color: catConfig?.color || '#ffffff',
          seats: []
        };
      }
      map[s.row].seats.push(s);
    });

    return Object.values(map);
  });

  // Original ticket counts and values
  originalSeatsCount = computed(() => this.existingPurchase()?.seats.length || 0);
  originalPrice = computed(() => this.existingPurchase()?.totalPrice || 0);
  originalCharges = computed(() => this.originalSeatsCount() * 45);
  originalTotal = computed(() => this.originalPrice() + this.originalCharges());

  // New ticket counts and values
  newCharges = computed(() => this.selectedSeats().length * 45);
  newTotal = computed(() => this.totalPrice() + this.newCharges());

  // Price difference to pay (can be signed)
  priceDifference = computed(() => {
    if (!this.isEditing()) return this.newTotal();
    return this.newTotal() - this.originalTotal();
  });

  // Absolute positive difference for checkout
  absoluteDifference = computed(() => {
    const diff = this.priceDifference();
    return diff > 0 ? diff : 0;
  });

  // Absolute refund difference for downgrade
  absoluteRefundDifference = computed(() => {
    const diff = this.priceDifference();
    return diff < 0 ? -diff : 0;
  });

  // Partial refund calculations
  refundCount = computed(() => {
    return Object.values(this.refundSeats()).filter(Boolean).length;
  });

  refundAmount = computed(() => {
    const existing = this.existingPurchase();
    if (!existing) return 0;
    const selectedToRefund = Object.keys(this.refundSeats()).filter(seatId => this.refundSeats()[seatId]);
    
    let amount = 0;
    selectedToRefund.forEach(seatId => {
      const s = existing.seats.find(x => x.id === seatId);
      if (s) {
        amount += s.price + 45; // price + charge
      }
    });
    return amount;
  });

  ngOnInit() {
    this.layoutService.setPageTitle('SELECCIONAR ASIENTOS');
    
    this.route.queryParams.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        const id = parseInt(idParam, 10);
        const resolvedEvent = this.eventService.getEventById(id) || this.getFallbackEventById(id);
        this.event.set(resolvedEvent);
        
        // Check for existing purchase for this event
        const purchases = this.eventService.getPurchasesForEvent(id);
        if (purchases.length > 0) {
          const firstPurchase = purchases[0];
          this.existingPurchase.set(firstPurchase);
          
          // Populate the selected seats map with their original seats
          const map: Record<string, { id: string, categoryName: string, price: number, isOriginal: boolean }> = {};
          firstPurchase.seats.forEach(s => {
            map[s.id] = { id: s.id, categoryName: s.categoryName, price: s.price, isOriginal: true };
          });
          this.selectedSeatsMap.set(map);
          this.selectedCategory.set(firstPurchase.seats[0]?.categoryName || 'VIP Oro');
          
          this.isEditing.set(true);
          this.initRefundSeats();
        }
        
        this.generateAllSeats();
      } else {
        this.router.navigate(['/events']);
      }
    });
  }

  // Populate refund checklist with false initially
  initRefundSeats() {
    const existing = this.existingPurchase();
    if (existing) {
      const initial: Record<string, boolean> = {};
      existing.seats.forEach(s => {
        initial[s.id] = false;
      });
      this.refundSeats.set(initial);
    }
  }

  toggleRefundSeat(seatId: string) {
    this.refundSeats.update(map => ({
      ...map,
      [seatId]: !map[seatId]
    }));
  }

  // Generate ALL seats across ALL categories on load
  generateAllSeats() {
    const list: Seat[] = [];
    const currentSelections = this.selectedSeatsMap();

    this.categoryDetails.forEach(config => {
      config.rows.forEach(row => {
        for (let col = 1; col <= config.cols; col++) {
          const seatId = `${row}-${col}`;
          
          // Determine status
          let status: 'available' | 'sold' | 'selected' | 'purchased' = 'available';
          
          if (currentSelections[seatId]) {
            status = currentSelections[seatId].isOriginal ? 'purchased' : 'selected';
          } else {
            // Prepopulate some seats as sold deterministically based on seed
            const seed = (row.charCodeAt(0) * col * 17) % 100;
            if (seed > 65) {
              status = 'sold';
            }
          }

          list.push({
            id: seatId,
            row,
            number: col,
            category: config.name,
            price: config.price,
            status
          });
        }
      });
    });

    this.seats.set(list);
  }

  selectCategory(name: string) {
    this.selectedCategory.set(name);
    // Refresh seat statuses
    this.refreshSeatStatuses();
  }

  refreshSeatStatuses() {
    const currentSelections = this.selectedSeatsMap();
    this.seats.update(list => list.map(s => {
      let status: 'available' | 'sold' | 'selected' | 'purchased' = 'available';
      if (currentSelections[s.id]) {
        status = currentSelections[s.id].isOriginal ? 'purchased' : 'selected';
      } else {
        const seed = (s.row.charCodeAt(0) * s.number * 17) % 100;
        if (seed > 65) {
          status = 'sold';
        }
      }
      return { ...s, status };
    }));
  }

  toggleSeat(seat: Seat) {
    if (this.isSeatDisabled(seat)) return;

    this.selectedSeatsMap.update(map => {
      const next = { ...map };
      if (next[seat.id]) {
        delete next[seat.id];
      } else {
        next[seat.id] = { id: seat.id, categoryName: seat.category, price: seat.price };
      }
      return next;
    });

    this.refreshSeatStatuses();
  }

  // A seat is disabled if it's sold OR if it belongs to another category and is not selected
  isSeatDisabled(seat: Seat): boolean {
    if (seat.status === 'sold') return true;
    
    const isSelected = seat.status === 'selected' || seat.status === 'purchased';
    const isCurrentCategory = seat.category === this.selectedCategory();
    
    // User cannot interact with seats from other categories unless they switched the ticket type first
    return !isCurrentCategory && !isSelected;
  }

  getSeatColor(seat: Seat): string {
    if (seat.status === 'sold') return 'bg-white/10 text-white/20 border-white/5 cursor-not-allowed';
    
    const isSelected = seat.status === 'selected' || seat.status === 'purchased';
    const isCurrentCategory = seat.category === this.selectedCategory();

    if (seat.status === 'selected') return 'bg-primary border-primary text-[#121212] shadow-md shadow-primary/20 cursor-zoom-out';
    if (seat.status === 'purchased') return 'bg-[#10B981] border-[#10B981] text-white shadow-md shadow-emerald-500/20 cursor-zoom-out';

    // If it's another category and not selected, render it in dark gray (inactive)
    if (!isCurrentCategory && !isSelected) {
      return 'bg-white/[0.02] border-white/5 text-white/10 cursor-not-allowed';
    }

    // Available category colors
    switch (seat.category) {
      case 'VIP Oro':
        return 'border-primary/60 text-primary hover:bg-primary/10 hover:border-primary cursor-pointer';
      case 'Preferente':
        return 'border-blue-500/60 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500 cursor-pointer';
      case 'General A':
        return 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 cursor-pointer';
      default:
        return 'border-orange-500/60 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500 cursor-pointer';
    }
  }

  onProceed() {
    const selectedCount = this.selectedSeats().length;
    
    // Validation: if editing, they CANNOT reduce seats count from this view (must use refund modal)
    if (this.isEditing()) {
      const origCount = this.originalSeatsCount();
      if (selectedCount < origCount) {
        this.errorMessage.set(`No puedes reducir tus asientos desde aquí (tienes ${origCount} originales y seleccionaste ${selectedCount}). Utiliza "Solicitar Reembolso" para devolver asientos.`);
        setTimeout(() => this.errorMessage.set(''), 7000);
        return;
      }

      // Check price difference
      const diff = this.priceDifference();
      if (diff > 0) {
        // Upgrade / Added seats: open payment checkout modal
        this.isPurchaseModalOpen.set(true);
      } else if (diff < 0) {
        // Downgrade: open difference refund confirmation modal
        this.isDiffRefundModalOpen.set(true);
      } else {
        // Direct swap at the same cost
        this.onConfirmPurchase();
      }
    } else {
      // New purchase - open checkout modal
      if (selectedCount === 0) return;
      this.isPurchaseModalOpen.set(true);
    }
  }

  onConfirmPurchase() {
    const ev = this.event();
    if (!ev) return;

    // Convert selections to PurchasedSeat format
    const seatsList: PurchasedSeat[] = this.selectedSeats().map(s => ({
      id: s.id,
      categoryName: s.categoryName,
      price: s.price
    }));

    const purchase: TicketPurchase = {
      eventId: ev.id,
      seats: seatsList,
      totalPrice: this.totalPrice(),
      purchaseDate: new Date()
    };

    // Save purchase in service state
    this.eventService.addPurchase(purchase);
    
    // Close modals & navigate back to purchase detail
    this.isPurchaseModalOpen.set(false);
    this.isDiffRefundModalOpen.set(false);
    this.router.navigate(['/events/comprar-boletos'], { queryParams: { id: ev.id } });
  }

  onCancelAndRefund() {
    const ev = this.event();
    const existing = this.existingPurchase();
    if (!ev || !existing) return;

    const selectedToRefund = Object.keys(this.refundSeats()).filter(seatId => this.refundSeats()[seatId]);
    
    if (selectedToRefund.length === 0) {
      this.errorMessage.set('Por favor selecciona al menos un asiento para reembolsar.');
      setTimeout(() => this.errorMessage.set(''), 4000);
      return;
    }

    if (selectedToRefund.length === existing.seats.length) {
      // Full refund: cancel purchase completely
      this.eventService.cancelPurchase(ev.id);
    } else {
      // Partial refund: remove selected seats and decrease price
      const remainingSeats = existing.seats.filter(s => !selectedToRefund.includes(s.id));
      const remainingTotalPrice = remainingSeats.reduce((sum, s) => sum + s.price, 0);
      
      const updatedPurchase: TicketPurchase = {
        eventId: ev.id,
        seats: remainingSeats,
        totalPrice: remainingTotalPrice,
        purchaseDate: existing.purchaseDate
      };
      
      this.eventService.addPurchase(updatedPurchase);
    }

    this.isRefundModalOpen.set(false);
    this.router.navigate(['/events/comprar-boletos'], { queryParams: { id: ev.id } });
  }

  onGoBack() {
    const ev = this.event();
    if (ev) {
      this.router.navigate(['/events/comprar-boletos'], { queryParams: { id: ev.id } });
    } else {
      this.router.navigate(['/events']);
    }
  }

  private getFallbackEventById(id: number): CalendarEvent {
    const fallbacks: Record<number, any> = {
      101: {
        id: 101,
        title: 'Gala Sinaloense VIP',
        date: new Date(2026, 10, 15),
        color: '#10B981',
        description: 'Exclusiva Gala VIP Sinaloense con alfombra roja y cena de gala. • 20:00',
        type: 'concierto',
        location: 'Arena Monterrey',
        imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
      }
    };
    return fallbacks[id] || {
      id: id,
      title: 'Concierto Acordex',
      date: new Date(),
      color: '#10B981',
      description: 'Gran espectáculo musical patrocinado por Acordex. • 20:00',
      type: 'concierto',
      location: 'Auditorio Nacional',
      imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'
    };
  }
}
