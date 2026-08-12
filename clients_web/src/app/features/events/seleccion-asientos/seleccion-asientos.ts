import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, CalendarEvent, TicketPurchase, PurchasedSeat } from '../../../core/services/event.service';
import { LayoutService } from '../../../core/services/layout.service';
import { croquisForEvent } from '../../../core/services/croquis.mock';
import { CroquisPlan, EventCroquis } from '../../../core/models/croquis.model';
import { CroquisMapComponent, CroquisSeatHit, CroquisTableHit, SeatVisualState } from './croquis-map.component';

interface Seat {
  id: string; // e.g. A-3
  row: string;
  number: number;
  category: string;
  price: number;
  status: 'available' | 'sold' | 'selected' | 'purchased';
  /** Zona del croquis en la que está la butaca. */
  areaId: string;
  /**
   * Mesa a la que pertenece el lugar, cuando lo es.
   *
   * Va en el propio asiento y no en una lista aparte porque todo lo demás de
   * esta pantalla —el carrito, el reembolso, el cambio de zona— trabaja sobre
   * la lista de asientos, y una mesa no es otra cosa que un grupo de lugares
   * que se venden juntos.
   */
  tableId?: string;
  tableLabel?: string;
  /** Cómo se renta la mesa; sin mesa, no aplica. */
  rental?: 'completa' | 'sillas';
  /** Mínimo de lugares que hay que llevarse de esa mesa. */
  minSeats?: number;
}

@Component({
  selector: 'app-seleccion-asientos',
  imports: [CommonModule, CroquisMapComponent],
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

  /**
   * El croquis publicado del evento.
   *
   * Antes el recinto estaba escrito a mano aquí dentro: cuatro categorías fijas
   * con sus filas y sus columnas. Eso obligaba a que cada evento se vendiera en
   * el mismo recinto imaginario. Ahora el plano llega desde el evento y esta
   * pantalla solo lo dibuja; lo demás —elegir, comprar, cambiar y reembolsar—
   * funciona exactamente igual que antes.
   */
  croquis = signal<EventCroquis | null>(null);
  activePlanId = signal<string>('');

  plans = computed<CroquisPlan[]>(() => this.croquis()?.plans || []);

  activePlan = computed<CroquisPlan | null>(() =>
    this.plans().find(p => p.id === this.activePlanId()) || this.plans()[0] || null);

  /** Cargo por boleto que fija la taquilla del evento. */
  serviceFee = computed(() => this.croquis()?.serviceFee ?? 45);

  /** Las categorías del selector, con la forma que ya usaba la vista. */
  categoryDetails = computed(() => {
    const plan = this.activePlan();
    const croquis = this.croquis();
    if (!plan || !croquis) return [] as { name: string; price: number; color: string; description?: string }[];

    // Solo las que tienen lugares en esta zona: ofrecer una categoría que aquí
    // no se vende manda al comprador a un mapa donde no puede elegir nada.
    const used = new Set(plan.areas.map(a => a.tierId));
    return croquis.tiers
      .filter(t => used.has(t.id))
      .map(t => ({ name: t.name, price: t.price, color: t.color, description: t.description }));
  });

  /** Zonas de entrada libre: no tienen butaca que elegir, solo aforo. */
  generalAreas = computed(() => {
    const plan = this.activePlan();
    const croquis = this.croquis();
    if (!plan || !croquis) return [];

    return plan.areas.filter(a => !a.numbered).map(a => {
      const tier = croquis.tiers.find(t => t.id === a.tierId);
      return {
        id: a.id,
        name: a.name,
        tierName: tier?.name || '',
        price: tier?.price || 0,
        color: tier?.color || '#ffffff',
        capacity: a.capacity || 0,
        available: Math.max(0, (a.capacity || 0) - (a.sold || 0)),
        accessNote: a.accessNote || ''
      };
    });
  });

  /**
   * Cómo debe pintarse cada butaca en el mapa.
   *
   * Se deriva de `seats`, que es donde vive el estado real: así el croquis
   * refleja la selección, la compra y el reembolso sin que el visor tenga que
   * saber nada de carritos.
   */
  seatStates = computed<Record<string, SeatVisualState>>(() => {
    const active = this.selectedCategory();
    const map: Record<string, SeatVisualState> = {};

    this.seats().forEach(s => {
      if (s.status === 'sold') map[s.id] = 'sold';
      else if (s.status === 'selected') map[s.id] = 'selected';
      else if (s.status === 'purchased') map[s.id] = 'purchased';
      else map[s.id] = active && s.category !== active ? 'muted' : 'available';
    });

    return map;
  });

  /** Escenarios de un croquis, para el selector de zonas. */
  planStages(plan: CroquisPlan): string {
    return plan.elements.filter(e => e.kind === 'escenario').map(e => e.label).join(' · ');
  }

  /** Un toque en el croquis se traduce al asiento que ya conocía la vista. */
  onSeatPicked(hit: CroquisSeatHit) {
    const seat = this.seats().find(s => s.id === hit.id);
    if (seat) this.toggleSeat(seat);
  }

  /** Referencias del recinto (pantallas, barra, accesos…). */
  references = computed(() => {
    const plan = this.activePlan();
    if (!plan) return [] as { icon: string; label: string; color: string }[];

    // Se agrupan por tipo: "Sonido ×4" no le aporta nada a nadie.
    const seen = new Map<string, { icon: string; label: string; color: string }>();
    plan.elements
      .filter(e => e.kind !== 'escenario' && e.kind !== 'texto')
      .forEach(e => {
        if (!seen.has(e.kind)) seen.set(e.kind, { icon: e.icon, label: e.label, color: e.color });
      });
    return [...seen.values()];
  });

  /** Nombre del escenario para el arco superior del mapa. */
  stageLabel = computed(() => {
    const names = (this.activePlan()?.elements || [])
      .filter(e => e.kind === 'escenario')
      .map(e => e.label);
    return names.length ? names.join(' · ') : 'Escenario Principal';
  });

  selectedSeats = computed(() => {
    return Object.values(this.selectedSeatsMap());
  });

  /**
   * Lo que cuestan los lugares elegidos.
   *
   * Una mesa con precio propio se cobra de corrido y no lugar por lugar: se
   * descuenta lo que sumaron sus sillas y se pone el precio de la mesa. Sin
   * esto, una mesa de patrocinador de treinta mil se cobraría como diez lugares
   * de mil, y el organizador se enteraría al cuadrar la taquilla.
   */
  totalPrice = computed(() => {
    let total = this.selectedSeats().reduce((sum, s) => sum + s.price, 0);

    const chosen = this.selectedSeatsMap();
    for (const area of this.activePlan()?.areas || []) {
      for (const table of area.tables || []) {
        if (!table.price || table.state === 'bloqueada') continue;

        const sillas = table.seats.filter(s => s.state !== 'bloqueado');
        if (!sillas.length) continue;
        if (!sillas.every(s => chosen[`${table.label}-${s.number}`])) continue;

        const porSilla = sillas.reduce(
          (sum, s) => sum + (chosen[`${table.label}-${s.number}`]?.price || 0),
          0
        );
        total += table.price - porSilla;
      }
    }

    return total;
  });

  // Group seats by row to render them row-by-row centered in the template
  seatsByRow = computed(() => {
    const map: Record<string, { row: string, categoryName: string, color: string, seats: Seat[] }> = {};
    const cats = this.categoryDetails();

    this.seats().forEach(s => {
      if (!map[s.row]) {
        const catConfig = cats.find(c => c.name === s.category);
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

  /**
   * Las butacas agrupadas por zona y, dentro de cada zona, por fila.
   *
   * El mapa se dibujaba como una sola columna de filas corridas, y eso funciona
   * mientras el recinto sea uno solo. Con el croquis del evento hay zonas con
   * nombre, precio y disponibilidad propios, y no distinguirlas dejaría al
   * comprador adivinando dónde termina el VIP y empieza la general.
   */
  seatedAreas = computed(() => {
    const plan = this.activePlan();
    const croquis = this.croquis();
    if (!plan || !croquis) return [];

    const byArea = new Map<string, Seat[]>();
    this.seats().forEach(s => {
      if (!byArea.has(s.areaId)) byArea.set(s.areaId, []);
      byArea.get(s.areaId)!.push(s);
    });

    return plan.areas.filter(a => a.numbered).map(area => {
      const tier = croquis.tiers.find(t => t.id === area.tierId);
      const seats = byArea.get(area.id) || [];

      const rows: { row: string; color: string; seats: Seat[] }[] = [];
      const index = new Map<string, number>();
      seats.forEach(s => {
        if (!index.has(s.row)) {
          index.set(s.row, rows.length);
          rows.push({ row: s.row, color: tier?.color || '#ffffff', seats: [] });
        }
        rows[index.get(s.row)!].seats.push(s);
      });

      return {
        id: area.id,
        name: area.name,
        tierName: tier?.name || '',
        price: tier?.price || 0,
        color: tier?.color || '#ffffff',
        accessNote: area.accessNote || '',
        available: seats.filter(s => s.status === 'available').length,
        total: seats.length,
        rows
      };
    });
  });

  // Original ticket counts and values
  originalSeatsCount = computed(() => this.existingPurchase()?.seats.length || 0);
  originalPrice = computed(() => this.existingPurchase()?.totalPrice || 0);
  originalCharges = computed(() => this.originalSeatsCount() * this.serviceFee());
  originalTotal = computed(() => this.originalPrice() + this.originalCharges());

  // New ticket counts and values
  newCharges = computed(() => this.selectedSeats().length * this.serviceFee());
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
        amount += s.price + this.serviceFee(); // price + charge
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

        // El croquis primero: de él salen las categorías y las butacas, así que
        // todo lo que viene después ya trabaja sobre el recinto real.
        const croquis = croquisForEvent(id);
        this.croquis.set(croquis);
        this.activePlanId.set(croquis.plans[0]?.id || '');
        
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
          this.selectedCategory.set(firstPurchase.seats[0]?.categoryName || this.categoryDetails()[0]?.name || '');
          
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

  /**
   * Arma la butaquería a partir del croquis publicado.
   *
   * Las butacas ya no se inventan con una fórmula: son las que el organizador
   * dibujó, con su fila, su número, su categoría y su estado de venta. Lo que se
   * mantiene intacto es la forma del dato, para que la selección, la compra y los
   * reembolsos sigan funcionando sin enterarse del cambio.
   */
  generateAllSeats() {
    const plan = this.activePlan();
    const croquis = this.croquis();
    if (!plan || !croquis) {
      this.seats.set([]);
      return;
    }

    const list: Seat[] = [];
    const currentSelections = this.selectedSeatsMap();

    plan.areas.filter(a => a.numbered).forEach(area => {
      const areaTier = croquis.tiers.find(t => t.id === area.tierId);

      area.rows.forEach(row => {
        row.seats.forEach(seat => {
          const seatId = `${row.label}-${seat.number}`;
          const tier = seat.tierId
            ? croquis.tiers.find(t => t.id === seat.tierId) || areaTier
            : areaTier;

          let status: 'available' | 'sold' | 'selected' | 'purchased' = 'available';
          if (currentSelections[seatId]) {
            status = currentSelections[seatId].isOriginal ? 'purchased' : 'selected';
          } else if (seat.state) {
            status = 'sold';
          }

          list.push({
            id: seatId,
            row: row.label,
            number: seat.number,
            category: tier?.name || '',
            price: tier?.price || 0,
            status,
            areaId: area.id
          });
        });
      });

      // Las sillas de mesa entran a la misma lista: para el carrito y para el
      // reembolso son lugares como cualquier otro, y lo único que cambia es que
      // saben de qué mesa vienen.
      (area.tables || []).forEach(table => {
        if (table.state === 'bloqueada') return;
        const tableTier = table.tierId
          ? croquis.tiers.find(t => t.id === table.tierId) || areaTier
          : areaTier;

        table.seats.forEach(seat => {
          const seatId = `${table.label}-${seat.number}`;
          const tier = seat.tierId
            ? croquis.tiers.find(t => t.id === seat.tierId) || tableTier
            : tableTier;

          let status: 'available' | 'sold' | 'selected' | 'purchased' = 'available';
          if (currentSelections[seatId]) {
            status = currentSelections[seatId].isOriginal ? 'purchased' : 'selected';
          } else if (seat.state || table.state) {
            status = 'sold';
          }

          list.push({
            id: seatId,
            row: table.label,
            number: seat.number,
            category: tier?.name || '',
            price: tier?.price || 0,
            status,
            areaId: area.id,
            tableId: table.id,
            tableLabel: table.label,
            rental: table.rental,
            minSeats: Math.max(1, table.minSeats || 1)
          });
        });
      });
    });

    this.seats.set(list);
  }

  /**
   * Rentar una mesa completa: entran o salen todos sus lugares libres de golpe.
   *
   * Es todo o nada porque así la puso a la venta el organizador —quien renta una
   * mesa la renta para que no se siente nadie más—, y dejar la mitad en el
   * carrito sería vender algo que no existe.
   */
  onTablePicked(hit: CroquisTableHit) {
    const libres = this.seats().filter(
      s => s.tableId === hit.tableId && (s.status === 'available' || s.status === 'selected' || s.status === 'purchased')
    );
    if (!libres.length) return;

    const category = libres[0].category;
    if (this.selectedCategory() && category !== this.selectedCategory()) {
      this.errorMessage.set(`${hit.label} se vende como ${category}. Cambia el tipo de boleto para poder apartarla.`);
      setTimeout(() => this.errorMessage.set(''), 5000);
      return;
    }

    const puesta = libres.every(s => this.selectedSeatsMap()[s.id]);

    this.selectedSeatsMap.update(map => {
      const next = { ...map };
      for (const seat of libres) {
        // Los lugares que ya venían comprados no se sueltan desde aquí: para
        // eso está el reembolso, que es una operación con dinero de por medio.
        if (next[seat.id]?.isOriginal) continue;
        if (puesta) delete next[seat.id];
        else next[seat.id] = { id: seat.id, categoryName: seat.category, price: seat.price };
      }
      return next;
    });

    this.refreshSeatStatuses();
  }

  /**
   * Mesas de las que se llevan menos lugares de los que pide el organizador.
   *
   * Se avisa mientras se elige y no al pagar: descubierto al final, el comprador
   * ya habría armado su carrito y tendría que volver al mapa a adivinar cuántos
   * lugares le faltan.
   */
  shortTables = computed(() => {
    const chosen = this.selectedSeatsMap();
    const byTable = new Map<string, { label: string; min: number; taken: number }>();

    for (const seat of this.seats()) {
      if (!seat.tableId || seat.rental !== 'sillas') continue;
      if (!chosen[seat.id]) continue;

      const entry = byTable.get(seat.tableId)
        || { label: seat.tableLabel || '', min: seat.minSeats || 1, taken: 0 };
      entry.taken += 1;
      byTable.set(seat.tableId, entry);
    }

    return [...byTable.values()].filter(t => t.taken < t.min);
  });

  /** Cambia de zona del evento: cada croquis trae su propio boletaje. */
  selectPlan(planId: string) {
    if (planId === this.activePlanId()) return;
    this.activePlanId.set(planId);
    this.selectedCategory.set(this.categoryDetails()[0]?.name || '');
    this.generateAllSeats();
  }

  selectCategory(name: string) {
    this.selectedCategory.set(name);
    // Refresh seat statuses
    this.refreshSeatStatuses();
  }

  refreshSeatStatuses() {
    const currentSelections = this.selectedSeatsMap();
    // Lo vendido lo dice el croquis, no una fórmula: recalcularlo con una semilla
    // haría que un lugar ocupado se liberara solo al deseleccionar otro.
    const sold = this.soldSeatIds();

    this.seats.update(list => list.map(s => {
      let status: 'available' | 'sold' | 'selected' | 'purchased' = 'available';
      if (currentSelections[s.id]) {
        status = currentSelections[s.id].isOriginal ? 'purchased' : 'selected';
      } else if (sold.has(s.id)) {
        status = 'sold';
      }
      return { ...s, status };
    }));
  }

  /** Lugares que el croquis marca como vendidos o apartados. */
  private soldSeatIds(): Set<string> {
    const plan = this.activePlan();
    const ids = new Set<string>();
    if (!plan) return ids;

    plan.areas.forEach(area => {
      area.rows.forEach(row =>
        row.seats.forEach(seat => {
          if (seat.state) ids.add(`${row.label}-${seat.number}`);
        })
      );
      (area.tables || []).forEach(table =>
        table.seats.forEach(seat => {
          if (seat.state || table.state) ids.add(`${table.label}-${seat.number}`);
        })
      );
    });
    return ids;
  }

  toggleSeat(seat: Seat) {
    if (this.isSeatDisabled(seat)) return;

    // Un lugar de una mesa que se renta completa no se elige solo: el gesto es
    // sobre la mesa entera.
    if (seat.tableId && seat.rental === 'completa') {
      this.onTablePicked({ areaId: seat.areaId, tableId: seat.tableId, label: seat.tableLabel || '' });
      return;
    }

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

    // El mínimo por mesa es una regla del recinto, no del carrito: dejar pasar
    // una mesa a medias vendería un lugar que el organizador no puso a la venta.
    const cortas = this.shortTables();
    if (cortas.length) {
      const t = cortas[0];
      this.errorMessage.set(`${t.label} pide mínimo ${t.min} lugares y llevas ${t.taken}. Agrega los que faltan o quítalos.`);
      setTimeout(() => this.errorMessage.set(''), 7000);
      return;
    }

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
