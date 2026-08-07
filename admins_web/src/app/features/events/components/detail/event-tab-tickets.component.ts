import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem, TicketTier, CroquisZone } from '../../../../core/models/event.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { ProgressBarComponent } from '../../../../shared/ui/progress-bar/progress-bar.component';
import {
  money,
  potentialTicketRevenue,
  seatMapSeats,
  serviceFee,
  soldSeats,
  occupancyPercent,
  totalSeats
} from '../../event-metrics';

/**
 * Boletaje, zonas del croquis y mapa de butacas.
 *
 * El mapa de butacas es lo que casi siempre se olvida: el cliente no compra
 * "un boleto de zona General", compra la butaca M-14 sobre una retícula de
 * filas y asientos. Si la categoría no trae filas ni butacas por fila, el
 * selector de asientos del portal no tiene nada que dibujar; y si la retícula
 * no cuadra con los lugares a la venta, se venden boletos sin asiento que
 * darles. Por eso las dos cosas se capturan aquí juntas y se validan a la vista.
 */
@Component({
  selector: 'app-event-tab-tickets',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent, ProgressBarComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">

      <!-- Aforo y avance de venta: es el número que define este apartado, así
           que va arriba y con barra, no como un dato suelto más. -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-cyan-500/25 border-l-4 border-l-cyan-500/70 shadow-2xl shadow-cyan-500/5 space-y-4 backdrop-blur-2xl">
        <div class="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Aforo a la venta</span>
            <span class="font-black text-on-surface text-2xl sm:text-3xl font-mono leading-tight">
              {{ seats().toLocaleString('es-MX') }}
            </span>
            <span class="text-[11px] text-outline block">lugares habilitados en el croquis</span>
          </div>

          <div class="text-right">
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Vendidos</span>
            <span class="font-black text-emerald-400 text-2xl sm:text-3xl font-mono leading-tight">
              {{ occupancy() }}%
            </span>
            <span class="text-[11px] text-outline block">
              {{ sold().toLocaleString('es-MX') }} de {{ seats().toLocaleString('es-MX') }}
            </span>
          </div>
        </div>

        <div class="h-2.5 rounded-full bg-surface-container-highest/80 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-500"
            [style.width.%]="occupancy()"
          ></div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          @if (canViewFinances()) {
            <div class="p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Taquilla potencial</span>
              <span class="font-black text-on-surface text-sm">{{ potential() }}</span>
            </div>
          }
          <div class="p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Cargo por servicio</span>
            <span class="font-black text-on-surface text-sm">&#36;{{ fee() }}</span>
          </div>
        </div>
      </section>

      @if (mismatchCount() > 0) {
        <p class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200 flex items-start gap-1.5">
          <span class="material-symbols-outlined text-sm shrink-0">error</span>
          <span>
            {{ mismatchCount() }} categoría(s) tienen un mapa de butacas que no cuadra con sus lugares a la venta.
            Filas × butacas por fila debe dar exactamente el total de la categoría.
          </span>
        </p>
      }

      <!-- ─── CATEGORÍAS DE BOLETO ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-cyan-500/25 border-l-4 border-l-cyan-500/70 shadow-2xl shadow-cyan-500/5 space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">confirmation_number</span>
            Categorías de boleto ({{ tiers().length }})
          </h5>
          @if (canEdit()) {
            <button
              type="button"
              (click)="addTier()"
              class="px-2.5 py-1.5 min-h-9 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <span class="material-symbols-outlined text-[13px]">add</span> Nueva categoría
            </button>
          }
        </div>

        @for (tier of tiers(); track tier.id || tier.name) {
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-outline-variant/30" [style.background-color]="tier.color + '33'">
                <span class="material-symbols-outlined text-base" [style.color]="tier.color">{{ tier.icon || 'confirmation_number' }}</span>
              </span>
              <div class="flex-1 min-w-0">
                <app-editable-field
                  [value]="tier.name"
                  valueClass="text-xs font-black text-on-surface break-words"
                  [readonly]="!canEdit()"
                  (save)="patchTier(tier, { name: $event })"
                />
              </div>
              @if (tier.soldSeats > 0) {
                <span class="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black shrink-0">
                  {{ tier.soldSeats }} vendidos
                </span>
              }
              @if (canEdit() && tier.soldSeats === 0) {
                <button
                  type="button"
                  (click)="removeTier(tier)"
                  class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                  title="Quitar categoría"
                >
                  <span class="material-symbols-outlined text-[13px]">delete</span>
                </button>
              }
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <app-editable-field
                label="Precio"
                type="number"
                prefix="$"
                [value]="tier.price"
                [readonly]="!canEdit()"
                (save)="patchTier(tier, { price: toNumber($event) })"
              />
              <app-editable-field
                label="Lugares a la venta"
                type="number"
                [value]="tier.totalSeats"
                [readonly]="!canEdit()"
                (save)="patchTier(tier, { totalSeats: toNumber($event) })"
              />
              <app-editable-field
                label="Zona del croquis"
                type="select"
                [options]="zoneOptions()"
                [value]="tier.zoneId || ''"
                [readonly]="!canEdit()"
                (save)="patchTier(tier, { zoneId: $event })"
              />
              <app-editable-field
                label="Ícono en la ficha"
                type="select"
                [options]="iconOptions"
                [value]="tier.icon || 'confirmation_number'"
                [readonly]="!canEdit()"
                (save)="patchTier(tier, { icon: $event })"
              />
            </div>

            <app-editable-field
              label="Qué incluye esta zona"
              hint="el cliente decide su compra con este texto"
              type="textarea"
              [rows]="2"
              placeholder="Ej. Primeras filas, acceso prioritario y bebida de cortesía."
              valueClass="text-[11px] font-medium text-on-surface-variant break-words"
              [value]="tier.description || ''"
              [readonly]="!canEdit()"
              (save)="patchTier(tier, { description: $event })"
            />

            <!-- Mapa de butacas -->
            <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/25 space-y-2">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-[9px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">event_seat</span> Mapa de butacas
                </span>
                <span
                  [class]="seatMapClass(tier)"
                  class="px-2 py-0.5 rounded-lg text-[9px] font-black border"
                >
                  {{ seatMapLabel(tier) }}
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <app-editable-field
                  label="Número de filas"
                  type="number"
                  [groupThousands]="false"
                  [value]="tier.rowLabels?.length || 0"
                  [readonly]="!canEdit()"
                  (save)="setRows(tier, toNumber($event))"
                />
                <app-editable-field
                  label="Butacas por fila"
                  type="number"
                  [groupThousands]="false"
                  [value]="tier.seatsPerRow || 0"
                  [readonly]="!canEdit()"
                  (save)="patchTier(tier, { seatsPerRow: toNumber($event) })"
                />
                <div>
                  <span class="block text-[10px] font-black uppercase tracking-wider text-outline mb-1">Filas asignadas</span>
                  <span class="text-[11px] font-bold text-on-surface break-words">{{ rowsPreview(tier) }}</span>
                </div>
              </div>

              @if (canEdit() && !cuadra(tier) && tier.totalSeats > 0 && (tier.seatsPerRow || 0) > 0) {
                <button
                  type="button"
                  (click)="autoFit(tier)"
                  class="px-2.5 py-1.5 min-h-9 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <span class="material-symbols-outlined text-[13px]">auto_fix_high</span>
                  Ajustar filas para que cuadre ({{ neededRows(tier) }} filas)
                </button>
              }
            </div>
          </div>
        } @empty {
          <p class="p-6 text-center text-[11px] text-outline italic bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/30">
            Sin categorías de boleto. Sin esto no hay nada que vender.
          </p>
        }
      </section>

      <!-- ─── ZONAS DEL CROQUIS ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-cyan-500/25 border-l-4 border-l-cyan-500/70 shadow-2xl shadow-cyan-500/5 space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">map</span>
            Zonas del croquis ({{ zones().length }})
          </h5>
          @if (canEdit()) {
            <button
              type="button"
              (click)="addZone()"
              class="px-2.5 py-1.5 min-h-9 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <span class="material-symbols-outlined text-[13px]">add</span> Nueva zona
            </button>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          @for (zone of zones(); track zone.id) {
            <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/30 space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20" [style.background-color]="zone.color"></span>
                <div class="flex-1 min-w-0">
                  <app-editable-field
                    [value]="zone.name"
                    valueClass="text-[11px] font-black text-on-surface break-words"
                    [readonly]="!canEdit()"
                    (save)="patchZone(zone, { name: $event })"
                  />
                </div>
                @if (canEdit()) {
                  <button
                    type="button"
                    (click)="removeZone(zone)"
                    class="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                  >
                    <span class="material-symbols-outlined text-[12px]">delete</span>
                  </button>
                }
              </div>

              <div class="grid grid-cols-2 gap-2">
                <app-editable-field
                  label="Capacidad"
                  type="number"
                  [value]="zone.capacity"
                  [readonly]="!canEdit()"
                  (save)="patchZone(zone, { capacity: toNumber($event) })"
                />
                <app-editable-field
                  label="Tipo de asiento"
                  type="select"
                  [options]="seatingTypes"
                  [value]="zone.seatingType || 'General'"
                  [readonly]="!canEdit()"
                  (save)="patchZone(zone, { seatingType: $any($event) })"
                />
              </div>

              <app-progress-bar
                [percent]="zone.occupancyPercent"
                [valueLabel]="(zone.occupancyPercent | number:'1.0-1') + '% ocupado'"
                [colorVariant]="zone.occupancyPercent >= 70 ? 'success' : 'primary'"
              />

              <p class="text-[9px] text-outline">
                {{ tiersOf(zone.id).length }} categoría(s) · {{ seatsOf(zone.id).toLocaleString('es-MX') }} lugares asignados
                @if (seatsOf(zone.id) > zone.capacity) {
                  <span class="text-rose-300 font-bold"> · excede la capacidad</span>
                }
              </p>
            </div>
          } @empty {
            <p class="sm:col-span-2 lg:col-span-3 p-6 text-center text-[11px] text-outline italic bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/30">
              Sin zonas. Divide el recinto para poder ligar cada categoría de boleto a un área concreta.
            </p>
          }
        </div>
      </section>
    </div>
  `
})
export class EventTabTicketsComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(false);
  canViewFinances = input<boolean>(false);

  patch = output<Partial<EventItem>>();

  readonly seatingTypes: EditableOption[] = [
    { value: 'Numerada', label: 'Numerada' },
    { value: 'General', label: 'General' },
    { value: 'De Pie', label: 'De Pie' }
  ];

  readonly iconOptions: EditableOption[] = [
    { value: 'workspace_premium', label: 'Premium / VIP' },
    { value: 'star', label: 'Preferente' },
    { value: 'groups', label: 'General de pie' },
    { value: 'event_seat', label: 'Grada numerada' },
    { value: 'chair', label: 'Mesa' },
    { value: 'confirmation_number', label: 'Boleto genérico' }
  ];

  tiers = computed(() => this.event().ticketTiers || []);
  zones = computed(() => this.event().croquisZones || []);

  seats = computed(() => totalSeats(this.event()));
  sold = computed(() => soldSeats(this.event()));
  /** Avance de venta en %, el indicador que manda en este apartado. */
  occupancy = computed(() => occupancyPercent(this.event()));
  potential = computed(() => money(potentialTicketRevenue(this.event())));
  fee = computed(() => serviceFee(this.event()));

  mismatchCount = computed(() => this.tiers().filter(t => !this.cuadra(t)).length);

  zoneOptions = computed<EditableOption[]>(() =>
    this.zones().map(z => ({ value: z.id, label: z.name }))
  );

  toNumber(value: string): number {
    return Math.max(0, Number(String(value).replace(/[^0-9.-]/g, '')) || 0);
  }

  /** True cuando la retícula de butacas coincide con los lugares a la venta. */
  cuadra(tier: TicketTier): boolean {
    return seatMapSeats(tier) === tier.totalSeats && tier.totalSeats > 0;
  }

  neededRows(tier: TicketTier): number {
    const perRow = tier.seatsPerRow || 0;
    return perRow > 0 ? Math.ceil(tier.totalSeats / perRow) : 0;
  }

  seatMapLabel(tier: TicketTier): string {
    const generated = seatMapSeats(tier);
    if (generated === 0) return 'Sin mapa de butacas';
    if (generated === tier.totalSeats) return generated.toLocaleString('es-MX') + ' butacas · cuadra';
    return generated.toLocaleString('es-MX') + ' butacas vs. ' + tier.totalSeats.toLocaleString('es-MX') + ' lugares';
  }

  seatMapClass(tier: TicketTier): string {
    if (seatMapSeats(tier) === 0) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    return this.cuadra(tier)
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  }

  rowsPreview(tier: TicketTier): string {
    const rows = tier.rowLabels || [];
    if (!rows.length) return 'Sin filas';
    if (rows.length <= 4) return rows.join(', ');
    return rows[0] + ' … ' + rows[rows.length - 1] + ' (' + rows.length + ')';
  }

  tiersOf(zoneId: string): TicketTier[] {
    return this.tiers().filter(t => t.zoneId === zoneId);
  }

  seatsOf(zoneId: string): number {
    return this.tiersOf(zoneId).reduce((sum, t) => sum + (t.totalSeats || 0), 0);
  }

  // ─── Mutaciones ────────────────────────────────────────────────────────────

  private commitTiers(next: TicketTier[]): void {
    this.patch.emit({ ticketTiers: next });
  }

  patchTier(tier: TicketTier, changes: Partial<TicketTier>): void {
    this.commitTiers(this.tiers().map(t => (t === tier ? { ...t, ...changes } : t)));
  }

  /**
   * Genera las etiquetas de fila corridas sobre todas las categorías, para que
   * dos zonas del mismo recinto nunca compartan letra de fila (el selector de
   * asientos del cliente agrupa por letra: si se repiten, se mezclan las zonas).
   */
  setRows(tier: TicketTier, count: number): void {
    const list = this.tiers();
    const index = list.indexOf(tier);
    const before = list.slice(0, index).reduce((sum, t) => sum + (t.rowLabels?.length || 0), 0);
    this.patchTier(tier, { rowLabels: this.buildRowLabels(count, before) });
  }

  autoFit(tier: TicketTier): void {
    this.setRows(tier, this.neededRows(tier));
  }

  private buildRowLabels(count: number, startAt: number): string[] {
    const label = (index: number): string => {
      let n = index;
      let out = '';
      do {
        out = String.fromCharCode(65 + (n % 26)) + out;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      return out;
    };
    return Array.from({ length: Math.max(0, count) }, (_, i) => label(startAt + i));
  }

  addTier(): void {
    const tier: TicketTier = {
      id: 'tt-' + this.event().id + '-' + Date.now(),
      name: 'Nueva categoría',
      price: 0,
      totalSeats: 0,
      soldSeats: 0,
      color: '#99907c',
      icon: 'confirmation_number',
      description: ''
    };
    this.commitTiers([...this.tiers(), tier]);
  }

  removeTier(tier: TicketTier): void {
    this.commitTiers(this.tiers().filter(t => t !== tier));
  }

  private commitZones(next: CroquisZone[]): void {
    this.patch.emit({ croquisZones: next });
  }

  patchZone(zone: CroquisZone, changes: Partial<CroquisZone>): void {
    this.commitZones(this.zones().map(z => (z.id === zone.id ? { ...z, ...changes } : z)));
  }

  addZone(): void {
    const zone: CroquisZone = {
      id: 'z-' + this.event().id + '-' + Date.now(),
      name: 'Nueva zona',
      capacity: 0,
      occupancyPercent: 0,
      color: '#99907c',
      seatingType: 'General'
    };
    this.commitZones([...this.zones(), zone]);
  }

  removeZone(zone: CroquisZone): void {
    // Zona y categorías se mandan en un solo parche: las categorías que
    // apuntaban a esta zona se desligan en el mismo movimiento, para que el
    // checklist lo marque como "sin zona" en vez de dejar una referencia rota.
    this.patch.emit({
      croquisZones: this.zones().filter(z => z.id !== zone.id),
      ticketTiers: this.tiers().map(t => (t.zoneId === zone.id ? { ...t, zoneId: undefined } : t))
    });
  }
}
