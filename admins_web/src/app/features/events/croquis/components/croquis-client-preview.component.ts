import { Component, ChangeDetectionStrategy, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CroquisPlan, CroquisTier } from '../../../../core/models/croquis.models';
import { CroquisCanvasComponent, SeatRef, seatKey } from './croquis-canvas.component';
import { clientReferences, clientTiers, stageNames } from '../croquis-client-layout';
import { areaCapacity, areaHeld, areaSold } from '../croquis-metrics';


/**
 * Lo que verá el comprador.
 *
 * Reproduce la pantalla de selección de asientos del portal —su encabezado, su
 * selector de tipo de boleto, su escenario, sus butacas con número y respaldo,
 * su leyenda y su resumen de compra— alimentada con el croquis que se está
 * dibujando. No es una aproximación "parecida": es el mismo marcado y las mismas
 * clases, para que lo que el organizador aprueba aquí sea exactamente lo que se
 * publica.
 *
 * La selección de butacas funciona de verdad, y a propósito: sin poder tocarlas
 * no se puede comprobar lo único que de verdad se viene a comprobar aquí —que
 * un lugar se puede elegir, que su precio es el correcto y que el total sale
 * bien— y ese error se descubriría con el evento ya publicado. Nada de lo que se
 * toque en esta vista modifica el croquis.
 */
@Component({
  selector: 'app-croquis-client-preview',
  standalone: true,
  imports: [CommonModule, CroquisCanvasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="max-w-7xl mx-auto px-4 md:px-8 py-6 text-white font-['Be_Vietnam_Pro'] select-none">

      <!-- Navegación -->
      <div class="flex items-center justify-between mb-6">
        <span class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-white/70">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          <span>Volver a Evento</span>
        </span>
        <span class="text-[10px] uppercase tracking-widest font-black text-primary">Mapa de Asientos</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">

        <!-- ─── IZQUIERDA: SELECCIÓN ─── -->
        <div class="lg:col-span-8 flex flex-col gap-6">

          <!-- Selector de croquis: solo aparece cuando el evento tiene varias zonas -->
          @if (plans().length > 1) {
            <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-inner">
              <span class="text-[8px] uppercase tracking-widest font-black text-white/35">Elige la zona del evento</span>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3.5">
                @for (p of plans(); track p.id) {
                  <button
                    type="button"
                    (click)="pickPlan(p.id)"
                    [ngClass]="p.id === planId()
                      ? 'border-primary bg-primary/10 text-primary shadow-[0_2px_15px_rgba(242,202,80,0.08)]'
                      : 'border-white/[0.08] bg-[#181818] text-white/60 hover:text-white hover:bg-white/[0.02]'"
                    class="flex flex-col items-center justify-center gap-1.5 py-3 px-2 border rounded-2xl transition-all duration-300 active:scale-95 text-center min-w-0"
                  >
                    <span class="text-[10px] font-black uppercase tracking-wider font-['Epilogue'] truncate max-w-full">{{ p.name }}</span>
                    <span class="text-[9px] font-bold text-white/50 font-['Epilogue']">{{ capacityOf(p).toLocaleString('es-MX') }} lugares</span>
                  </button>
                }
              </div>
              @if (plan()?.description; as desc) {
                <p class="text-[11px] text-white/45 font-light leading-relaxed mt-3">{{ desc }}</p>
              }
            </div>
          }

          <!-- Tipos de boleto -->
          <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-inner">
            <div class="flex justify-between items-center gap-3">
              <span class="text-[8px] uppercase tracking-widest font-black text-white/35">Selecciona el tipo de boleto a colocar en el croquis</span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3.5">
              @for (tier of planTiers(); track tier.id) {
                <button
                  type="button"
                  (click)="activeTierId.set(tier.id || '')"
                  [ngClass]="activeTierId() === tier.id
                    ? 'border-primary bg-primary/10 text-primary shadow-[0_2px_15px_rgba(242,202,80,0.08)]'
                    : 'border-white/[0.08] bg-[#181818] text-white/60 hover:text-white hover:bg-white/[0.02]'"
                  class="flex flex-col items-center justify-center gap-1.5 py-3 px-2 border rounded-2xl transition-all duration-300 active:scale-95 text-center min-w-0"
                >
                  <span class="text-[10px] font-black uppercase tracking-wider font-['Epilogue'] truncate max-w-full">{{ tier.name }}</span>
                  <span class="text-[9px] font-bold text-white/50 font-['Epilogue']">&#36;{{ tier.price }} MXN</span>
                </button>
              } @empty {
                <p class="col-span-full text-xs text-white/30 italic py-2">
                  El croquis todavía no tiene categorías de boleto con lugares asignados.
                </p>
              }
            </div>
          </div>

          <!-- Mapa -->
          <div class="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 shadow-inner flex flex-col items-center overflow-hidden relative">

            <!-- El croquis tal como se dibujó.
                 No es una lista de zonas apiladas: es el mismo plano del editor,
                 con cada área donde el organizador la puso. Reordenarlo aquí
                 sería enseñarle al comprador un recinto que no existe, y al
                 organizador un croquis distinto del que acaba de dibujar. -->
            <div class="w-full h-[62vh] min-h-[420px] rounded-2xl overflow-hidden bg-[#0f0f0f] border border-white/[0.04]">
              @if (plan(); as p) {
                <app-croquis-canvas
                  [plan]="p"
                  [tiers]="tiers()"
                  mode="cliente"
                  [activeTierId]="activeTierId()"
                  [selectedSeats]="selection()"
                  (seatActivated)="onSeatActivated($event)"
                  (tableActivated)="onTableActivated($event)"
                />
              }
            </div>

            <!-- Zonas de entrada libre: no tienen butaca que elegir -->
            @if (generalAreas().length) {
              <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
                @for (area of generalAreas(); track area.id) {
                  <div class="rounded-2xl border border-dashed p-4 flex flex-col items-center gap-1 text-center min-w-0"
                    [style.border-color]="area.color + '55'"
                    [style.background-color]="area.color + '0d'">
                    <span class="material-symbols-outlined text-base" [style.color]="area.color">groups</span>
                    <span class="text-[10px] font-black uppercase tracking-wider font-['Epilogue'] truncate max-w-full" [style.color]="area.color">
                      {{ area.name }}
                    </span>
                    <span class="text-[9px] text-white/45 font-light">
                      {{ area.tierName }} · &#36;{{ area.price }} MXN · entrada libre
                    </span>
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-lg border"
                      [ngClass]="area.available > 0
                        ? 'text-emerald-400/90 border-emerald-500/20 bg-emerald-500/5'
                        : 'text-white/25 border-white/5 bg-white/[0.02]'">
                      {{ area.available > 0 ? area.available.toLocaleString('es-MX') + ' disponibles' : 'Agotada' }}
                    </span>
                  </div>
                }
              </div>
            }

            <!-- Referencias del recinto -->
            @if (references().length) {
              <div class="flex flex-wrap items-center justify-center gap-4 mt-10 border-t border-white/5 pt-6 w-full text-[10px] text-white/40">
                @for (ref of references(); track ref.label) {
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]" [style.color]="ref.color">{{ ref.icon }}</span>
                    <span>{{ ref.label }}</span>
                  </div>
                }
              </div>
            }

            <!-- Leyenda de estados -->
            <div class="flex flex-wrap items-center justify-center gap-5 mt-6 border-t border-white/5 pt-6 w-full text-[10px] text-white/40">
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-4 rounded-t border border-white/20"></div>
                <span>Disponible</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-4 rounded-t bg-primary border border-primary"></div>
                <span>Seleccionado</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-4 rounded-t bg-[#10B981] border border-[#10B981]"></div>
                <span>Mi Asiento original</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-4 h-4 rounded-t bg-white/10 border border-white/5 flex items-center justify-center text-white/20">
                  <span class="material-symbols-outlined text-[9px]">close</span>
                </div>
                <span>Ocupado</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── DERECHA: RESUMEN DE COMPRA ─── -->
        <div class="lg:col-span-4 flex flex-col gap-6">
          <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-inner flex flex-col gap-4">
            <span class="text-[8px] uppercase tracking-widest font-black text-white/35">Resumen de Selección</span>

            <h3 class="font-['Epilogue'] font-black text-lg text-white uppercase truncate flex items-center gap-1.5">
              <span class="truncate">{{ eventTitle() }}</span>
              <span class="material-symbols-outlined text-sm text-primary opacity-80 shrink-0">open_in_new</span>
            </h3>

            <div class="flex flex-col gap-1 text-xs text-white/50 font-light pb-3 border-b border-white/5">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="material-symbols-outlined text-xs text-primary shrink-0">pin_drop</span>
                <span class="truncate">{{ venue() }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-[8px] font-bold text-white/35 uppercase tracking-widest">
                Asientos Seleccionados ({{ picked().length }})
              </span>

              @if (picked().length) {
                <div class="flex flex-wrap gap-1.5">
                  @for (seat of picked(); track seat.key) {
                    <span class="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex flex-col items-start gap-0.5">
                      <span class="flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-[10px]">{{ seat.atTable ? 'table_restaurant' : 'chair' }}</span>
                        <strong>{{ seat.id }}</strong>
                      </span>
                      <span class="text-[7px] text-white/60 lowercase font-light">{{ seat.tierName }}</span>
                    </span>
                  }
                </div>

                <!-- Mesas incompletas: el mínimo del organizador es lo que
                     impide que alguien ocupe una mesa de diez llevándose uno. -->
                @if (shortTables().length) {
                  <p class="text-[10px] text-amber-300/90 leading-snug flex items-start gap-1.5">
                    <span class="material-symbols-outlined text-[12px] mt-0.5 shrink-0">info</span>
                    <span>
                      @for (t of shortTables(); track t.label) {
                        {{ t.label }} pide mínimo {{ t.min }} lugares y llevas {{ t.taken }}.
                      }
                    </span>
                  </p>
                }
              } @else {
                <div class="text-xs text-white/30 italic py-2">
                  Por favor selecciona uno o más asientos en el plano.
                </div>
              }
            </div>

            <div class="border-t border-white/5 pt-4 flex flex-col gap-2">
              <div class="flex justify-between text-xs text-white/50">
                <span>Subtotal Boletos</span>
                <span class="text-white">&#36;{{ subtotal() | number }} MXN</span>
              </div>
              <div class="flex justify-between text-xs text-white/50">
                <span>Cargos por Servicio</span>
                <span class="text-white">&#36;{{ charges() | number }} MXN</span>
              </div>
              <div class="flex justify-between text-sm font-bold border-t border-white/5 pt-2 mt-1">
                <span class="text-primary font-black uppercase tracking-wider text-xs">Total</span>
                <span class="text-primary font-black font-['Epilogue']">&#36;{{ total() | number }} MXN</span>
              </div>
            </div>

            <div class="flex flex-col gap-2 mt-4">
              <button
                type="button"
                disabled
                [ngClass]="picked().length === 0
                  ? 'opacity-40 bg-white/5 border border-white/10 text-white/30 shadow-none'
                  : 'bg-primary text-[#121212] shadow-[0_4px_18px_rgba(242,202,80,0.25)]'"
                class="w-full py-4 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider cursor-default"
              >
                <span class="material-symbols-outlined text-base">payments</span>
                <span>Continuar con el Pago</span>
              </button>
            </div>
          </div>

          <!-- Aviso: esto es una vista previa, no una venta -->
          <div class="bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl p-4 flex items-start gap-2.5">
            <span class="material-symbols-outlined text-base text-amber-400 shrink-0">visibility</span>
            <p class="text-[11px] text-amber-200/80 font-light leading-relaxed">
              Así verá el comprador este croquis. Puedes elegir butacas para probarlo: nada de lo que hagas
              aquí toca el croquis ni genera una venta.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CroquisClientPreviewComponent {
  plans = input.required<CroquisPlan[]>();
  tiers = input<CroquisTier[]>([]);
  eventTitle = input<string>('');
  venue = input<string>('');
  serviceFee = input<number>(45);
  /** Croquis que se muestra; si no llega, el primero. */
  activePlanId = input<string | null>(null);

  private localPlanId = signal<string | null>(null);
  activeTierId = signal<string>('');
  selection = signal<Set<string>>(new Set());

  planId = computed(() => {
    const local = this.localPlanId();
    if (local && this.plans().some(p => p.id === local)) return local;
    const fromInput = this.activePlanId();
    if (fromInput && this.plans().some(p => p.id === fromInput)) return fromInput;
    return this.plans()[0]?.id ?? null;
  });

  plan = computed(() => this.plans().find(p => p.id === this.planId()) || this.plans()[0] || null);

  /** Solo las categorías con lugares en este croquis: las demás no se venden aquí. */
  planTiers = computed(() => {
    const p = this.plan();
    return p ? clientTiers(p, this.tiers()) : [];
  });

  /**
   * Butacas elegidas, por su clave dentro del croquis.
   *
   * Se guardan con la misma clave que usa el plano —área, fila e índice— y no
   * con el "A-12" del boleto: dos zonas del mismo recinto pueden tener una fila
   * A, y con el número impreso se seleccionarían las dos a la vez.
   */
    references = computed(() => {
    const p = this.plan();
    return p ? clientReferences(p) : [];
  });

  stageLabel = computed(() => {
    const p = this.plan();
    const names = p ? stageNames(p) : [];
    if (!names.length) return 'Escenario';
    if (names.length === 1) return names[0];
    return names.join(' · ');
  });

  capacityOf = (p: CroquisPlan) => p.areas.reduce((sum, a) => sum + areaCapacity(a), 0);

  picked = computed(() => {
    const chosen = this.selection();
    const plan = this.plan();
    const index = new Map(this.tiers().map(t => [t.id || '', t]));
    const out: { key: string; id: string; tierName: string; price: number; atTable: string }[] = [];
    if (!plan) return out;

    for (const area of plan.areas) {
      for (const row of area.rows) {
        for (let i = 0; i < row.seats.length; i++) {
          const key = `${area.id}|${row.id}|${i}`;
          if (!chosen.has(key)) continue;
          const seat = row.seats[i];
          const tier = index.get(seat.tierId || area.tierId || '');
          out.push({
            key,
            id: `${row.label}-${seat.number}`,
            tierName: tier?.name || 'Sin categoría',
            price: tier?.price || 0,
            atTable: ''
          });
        }
      }

      for (const table of area.tables || []) {
        for (let i = 0; i < table.seats.length; i++) {
          const key = `${area.id}|${table.id}|${i}`;
          if (!chosen.has(key)) continue;
          const seat = table.seats[i];
          const tier = index.get(seat.tierId || table.tierId || area.tierId || '');
          out.push({
            key,
            id: `${table.label} · lugar ${seat.number}`,
            tierName: tier?.name || 'Sin categoría',
            price: tier?.price || 0,
            atTable: table.id
          });
        }
      }
    }
    return out;
  });

  /**
   * Mesas de las que se llevan menos lugares de los que pide el organizador.
   *
   * Se avisa aquí y no al pagar porque es una regla del croquis, no del carrito:
   * si se descubriera al final, el comprador ya habría elegido sus lugares y
   * tendría que volver al mapa a adivinar cuántos le faltan.
   */
  shortTables = computed(() => {
    const plan = this.plan();
    const chosen = this.selection();
    if (!plan) return [] as { label: string; min: number; taken: number }[];

    const out: { label: string; min: number; taken: number }[] = [];
    for (const area of plan.areas) {
      for (const table of area.tables || []) {
        if (table.rental !== 'sillas') continue;
        const min = Math.max(1, table.minSeats || 1);
        const taken = table.seats.filter((_, i) => chosen.has(`${area.id}|${table.id}|${i}`)).length;
        if (taken > 0 && taken < min) out.push({ label: table.label, min, taken });
      }
    }
    return out;
  });

  /** Zonas de entrada libre: se muestran aparte porque no se eligen butaca a butaca. */
  generalAreas = computed(() => {
    const plan = this.plan();
    const index = new Map(this.tiers().map(t => [t.id || '', t]));
    if (!plan) return [];

    return plan.areas.filter(a => a.kind === 'general').map(a => {
      const tier = a.tierId ? index.get(a.tierId) : undefined;
      return {
        id: a.id,
        name: a.name,
        tierName: tier?.name || 'Sin categoría',
        price: tier?.price || 0,
        color: tier?.color || '#99907c',
        available: Math.max(0, areaCapacity(a) - areaSold(a) - areaHeld(a))
      };
    });
  });

  /** Un clic en el croquis alterna la butaca, igual que en el portal. */
  onSeatActivated(ref: SeatRef): void {
    const key = seatKey(ref);
    const plan = this.plan();
    if (!plan) return;

    const area = plan.areas.find(a => a.id === ref.areaId);
    if (!area) return;

    const row = area.rows.find(r => r.id === ref.rowId);
    const table = (area.tables || []).find(t => t.id === ref.rowId);
    const seat = (row?.seats || table?.seats || [])[ref.index];
    if (!seat) return;
    if (seat.status === 'vendido' || seat.status === 'apartado' || seat.status === 'bloqueado') return;

    // Una silla de mesa que se renta completa no se elige suelta: el gesto es
    // sobre la mesa, y dejar que se despedace aquí contradiría lo que el
    // organizador decidió al montarla.
    if (table && table.rental === 'completa') {
      this.onTableActivated({ areaId: area.id, tableId: table.id });
      return;
    }
    if (table?.status) return;

    const tierId = seat.tierId || table?.tierId || area.tierId || '';
    const active = this.activeTierId();
    // Igual que en el portal: no se mezclan categorías sin cambiar antes el tipo
    // de boleto, para que nadie arme un carrito de cuatro zonas sin notarlo.
    if (active && tierId !== active && !this.selection().has(key)) return;
    if (!active) this.activeTierId.set(tierId);

    this.selection.update(set => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  /**
   * Rentar la mesa completa: entran o salen todos sus lugares libres de golpe.
   *
   * Es todo o nada por definición —quien renta una mesa la renta para que no se
   * siente nadie más—, así que dejar la mitad seleccionada sería ofrecer algo
   * que el organizador no puso a la venta.
   */
  onTableActivated(pick: { areaId: string; tableId: string }): void {
    const plan = this.plan();
    const area = plan?.areas.find(a => a.id === pick.areaId);
    const table = area?.tables?.find(t => t.id === pick.tableId);
    if (!area || !table || table.status) return;

    const libres = table.seats
      .map((seat, i) => ({ seat, key: `${area.id}|${table.id}|${i}` }))
      .filter(({ seat }) => !seat.status);
    if (!libres.length) return;

    const tierId = table.tierId || area.tierId || '';
    const active = this.activeTierId();
    const yaPuesta = libres.every(({ key }) => this.selection().has(key));

    if (!yaPuesta) {
      if (active && tierId !== active) return;
      if (!active) this.activeTierId.set(tierId);
    }

    this.selection.update(set => {
      const next = new Set(set);
      for (const { key } of libres) yaPuesta ? next.delete(key) : next.add(key);
      return next;
    });
  }

  /**
   * Lo que cuesta lo elegido.
   *
   * Una mesa con precio propio se cobra de corrido y no lugar por lugar: se
   * descuenta lo que sumaron sus sillas y se pone el precio de la mesa. Sin
   * esto, una mesa de patrocinador de treinta mil se cobraría como diez lugares
   * de mil.
   */
  subtotal = computed(() => {
    let total = this.picked().reduce((sum, s) => sum + s.price, 0);
    const plan = this.plan();
    const chosen = this.selection();
    if (!plan) return total;

    for (const area of plan.areas) {
      for (const table of area.tables || []) {
        if (!table.price) continue;
        const libres = table.seats
          .map((seat, i) => ({ seat, key: `${area.id}|${table.id}|${i}` }))
          .filter(({ seat }) => seat.status !== 'bloqueado');
        if (!libres.length || !libres.every(({ key }) => chosen.has(key))) continue;

        const index = new Map(this.tiers().map(t => [t.id || '', t]));
        const porSilla = libres.reduce(
          (sum, { seat }) => sum + (index.get(seat.tierId || table.tierId || area.tierId || '')?.price || 0),
          0
        );
        total += table.price - porSilla;
      }
    }
    return total;
  });
  charges = computed(() => this.picked().length * this.serviceFee());
  total = computed(() => this.subtotal() + this.charges());

  pickPlan(id: string): void {
    this.localPlanId.set(id);
    this.selection.set(new Set());
    this.activeTierId.set('');
  }

}
