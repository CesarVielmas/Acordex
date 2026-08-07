import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem, EventPublicProfile, EventRule } from '../../../../core/models/event.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import {
  publicProfile,
  lineup,
  lowestTicketPrice,
  highestTicketPrice,
  shortDate,
  dateTimeLabel,
  totalSeats
} from '../../event-metrics';

/**
 * Ficha pública del evento: exactamente lo que el cliente ve en
 * `/events/comprar-boletos`.
 *
 * A la izquierda se captura; a la derecha se ve el resultado. La vista previa
 * no es adorno: sin ella es fácil dar por buena una ficha a la que le falta el
 * cartel vertical o el texto de presentación, porque desde el panel
 * administrativo esos huecos no se notan — se notan en la página del cliente,
 * que es donde ya es tarde.
 */
@Component({
  selector: 'app-event-tab-public',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent],
  host: { class: 'block' },
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">

      <!-- ─── CAPTURA ─── -->
      <div class="space-y-4">

        <!-- Imágenes -->
        <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
          <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">image</span> Imágenes de la ficha pública
          </h5>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-2">
              <app-editable-field
                label="Portada panorámica"
                hint="encabeza la ficha"
                type="url"
                placeholder="https://…"
                valueClass="text-[10px] font-medium text-on-surface break-all"
                [value]="profile().coverUrl"
                [readonly]="!canEdit()"
                (save)="patchProfile({ coverUrl: $event })"
              />
              <div class="aspect-video rounded-xl overflow-hidden bg-surface-container border border-outline-variant/25">
                @if (profile().coverUrl) {
                  <img [src]="profile().coverUrl" alt="Portada" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-outline text-[10px] gap-1">
                    <span class="material-symbols-outlined text-base">wallpaper</span> Sin portada
                  </div>
                }
              </div>
            </div>

            <div class="space-y-2">
              <app-editable-field
                label="Cartel oficial (3:4)"
                hint="el que se amplía con lupa"
                type="url"
                placeholder="https://…"
                valueClass="text-[10px] font-medium text-on-surface break-all"
                [value]="profile().posterUrl"
                [readonly]="!canEdit()"
                (save)="patchProfile({ posterUrl: $event })"
              />
              <div class="aspect-[3/4] max-h-44 rounded-xl overflow-hidden bg-surface-container border border-outline-variant/25 mx-auto">
                @if (profile().posterUrl) {
                  <img [src]="profile().posterUrl" alt="Cartel" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex flex-col items-center justify-center text-outline text-[10px] gap-1 text-center px-2">
                    <span class="material-symbols-outlined text-base">imagesmode</span> Sin cartel vertical
                  </div>
                }
              </div>
            </div>
          </div>

          @if (sameImages()) {
            <p class="text-[10px] text-amber-300 flex items-start gap-1.5">
              <span class="material-symbols-outlined text-[13px] shrink-0">warning</span>
              La portada y el cartel son la misma imagen. En la ficha del cliente una va horizontal de fondo y la otra
              se amplía en vertical: usar la misma se ve recortada en al menos una de las dos.
            </p>
          }
        </section>

        <!-- Textos -->
        <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
          <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">edit_note</span> Textos de la ficha
          </h5>

          <app-editable-field
            label="Categoría del evento"
            type="select"
            [options]="categories"
            [value]="profile().category"
            [readonly]="!canEdit()"
            (save)="patchProfile({ category: $any($event) })"
          />

          <app-editable-field
            label="Frase de portada"
            hint="una línea bajo el título"
            type="textarea"
            [rows]="2"
            placeholder="Ej. La tambora más potente del país, una sola noche."
            valueClass="text-[11px] font-semibold text-on-surface break-words"
            [value]="profile().tagline"
            [readonly]="!canEdit()"
            (save)="patchProfile({ tagline: $event })"
          />

          <app-editable-field
            label="Información del evento"
            hint="lo que el cliente lee antes de comprar"
            type="textarea"
            [rows]="5"
            placeholder="Describe la experiencia, accesos, amenidades y seguridad."
            valueClass="text-[11px] font-medium text-on-surface-variant break-words leading-relaxed"
            [value]="profile().about"
            [readonly]="!canEdit()"
            (save)="patchProfile({ about: $event })"
          />
        </section>

        <!-- Reglas -->
        <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">gavel</span> Reglas e información adicional
            </h5>
            <span class="text-[9px] text-outline">{{ profile().rules.length }} regla(s)</span>
          </div>

          <div class="space-y-2">
            @for (rule of profile().rules; track rule.id) {
              <div class="flex items-start gap-2 p-2 rounded-lg bg-surface-container border border-outline-variant/20">
                <span class="material-symbols-outlined text-[13px] text-primary mt-1 shrink-0">chevron_right</span>
                <div class="flex-1 min-w-0">
                  <app-editable-field
                    [value]="rule.text"
                    type="textarea"
                    [rows]="2"
                    valueClass="text-[11px] font-medium text-on-surface-variant break-words"
                    [readonly]="!canEdit()"
                    (save)="patchRule(rule, $event)"
                  />
                </div>
                @if (canEdit()) {
                  <button
                    type="button"
                    (click)="removeRule(rule)"
                    class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                  >
                    <span class="material-symbols-outlined text-[13px]">delete</span>
                  </button>
                }
              </div>
            } @empty {
              <p class="text-[10px] text-outline italic">
                Sin reglas capturadas. El portal muestra este bloque siempre: vacío se ve incompleto.
              </p>
            }
          </div>

          @if (canEdit()) {
            <button
              type="button"
              (click)="addRule()"
              class="px-2.5 py-1.5 min-h-9 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <span class="material-symbols-outlined text-[13px]">add</span> Agregar regla
            </button>
          }
        </section>

        <!-- Compra y contacto -->
        <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
          <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">support_agent</span> Compra, contacto y avisos
          </h5>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <app-editable-field
              label="Teléfono de compra"
              type="tel"
              placeholder="+52 (81) 1234 5678"
              [value]="profile().supportPhone || ''"
              [readonly]="!canEdit()"
              (save)="patchProfile({ supportPhone: $event })"
            />
            <app-editable-field
              label="WhatsApp"
              hint="solo dígitos"
              type="tel"
              placeholder="528112345678"
              [value]="profile().supportWhatsApp || ''"
              [readonly]="!canEdit()"
              (save)="patchProfile({ supportWhatsApp: $event })"
            />
            <app-editable-field
              label="Cargo por servicio"
              hint="por asiento"
              type="number"
              prefix="$"
              [value]="profile().serviceFeePerSeat ?? 0"
              [readonly]="!canEdit()"
              (save)="patchProfile({ serviceFeePerSeat: toNumber($event) })"
            />
            <app-editable-field
              label="Restricción de edad"
              placeholder="Mayores de 15 años"
              [value]="profile().minimumAge || ''"
              [readonly]="!canEdit()"
              (save)="patchProfile({ minimumAge: $event })"
            />
            <app-editable-field
              label="Búsqueda en el mapa"
              hint="lo que se envía a Google Maps"
              placeholder="Arena Monterrey"
              [value]="profile().mapsQuery || ''"
              [readonly]="!canEdit()"
              (save)="patchProfile({ mapsQuery: $event })"
            />
            <app-editable-field
              label="Sello de garantía"
              placeholder="Acordex VIP"
              [value]="profile().guaranteeLabel || ''"
              [readonly]="!canEdit()"
              (save)="patchProfile({ guaranteeLabel: $event })"
            />
          </div>
        </section>
      </div>

      <!-- ─── VISTA PREVIA DE LA FICHA DEL CLIENTE ─── -->
      <div class="xl:sticky xl:top-2 space-y-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-cyan-400">visibility</span>
          <h5 class="text-[10px] font-black uppercase tracking-wider text-on-surface">Vista previa de la ficha del cliente</h5>
          <span class="text-[9px] text-outline ml-auto">/events/comprar-boletos?id={{ event().id }}</span>
        </div>

        <div class="rounded-2xl overflow-hidden border border-outline-variant/40 bg-[#121212] shadow-2xl">

          <!-- Hero -->
          <div class="relative h-40 sm:h-48 bg-surface-container-high">
            @if (profile().coverUrl) {
              <img [src]="profile().coverUrl" alt="Portada" class="w-full h-full object-cover brightness-[0.45]" />
            }
            <div class="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>
            <div class="absolute bottom-0 inset-x-0 p-4 space-y-1.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[8px] font-black uppercase tracking-widest">
                  {{ profile().category }}
                </span>
                <span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[8px] font-bold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[10px] text-primary">schedule</span>
                  {{ showTime() }}
                </span>
              </div>
              <h3 class="font-display-xl font-black text-lg sm:text-xl uppercase tracking-wide text-white leading-tight line-clamp-2">
                {{ event().title }}
              </h3>
              <p class="text-[10px] text-white/70 font-light line-clamp-2">
                {{ profile().tagline || 'Sin frase de portada' }}
              </p>
            </div>
          </div>

          <div class="p-4 space-y-4">

            <!-- Información del evento -->
            <div class="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-2">
              <span class="text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                <span class="material-symbols-outlined text-[11px]">info</span> Información del Evento
              </span>
              <p class="text-[10px] text-white/60 leading-relaxed line-clamp-4">
                {{ profile().about || 'Sin texto de presentación. El cliente vería este bloque vacío.' }}
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div class="bg-white/5 border border-white/[0.04] p-2 rounded-lg">
                  <span class="text-[7px] text-white/40 uppercase font-medium block">Fecha</span>
                  <span class="text-[9px] text-white font-bold">{{ dateLabel() }}</span>
                </div>
                <div class="bg-white/5 border border-white/[0.04] p-2 rounded-lg">
                  <span class="text-[7px] text-white/40 uppercase font-medium block">Categoría</span>
                  <span class="text-[9px] text-white font-bold uppercase truncate block">{{ profile().category }}</span>
                </div>
                <div class="bg-white/5 border border-white/[0.04] p-2 rounded-lg">
                  <span class="text-[7px] text-white/40 uppercase font-medium block">Precios desde</span>
                  <span class="text-[9px] text-emerald-400 font-bold">{{ fromPrice() }}</span>
                </div>
                <div class="bg-white/5 border border-white/[0.04] p-2 rounded-lg">
                  <span class="text-[7px] text-white/40 uppercase font-medium block">Garantía</span>
                  <span class="text-[9px] text-white font-bold truncate block">{{ profile().guaranteeLabel || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Cartel oficial + line-up -->
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-1">
                <div class="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]">
                  @if (profile().posterUrl) {
                    <img [src]="profile().posterUrl" alt="Cartel" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-white/30 text-[8px] text-center px-1">
                      Falta el cartel oficial
                    </div>
                  }
                </div>
              </div>

              <div class="col-span-2 rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-2">
                <span class="text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                  <span class="material-symbols-outlined text-[11px]">groups</span> Line-up
                </span>
                @for (slot of slots(); track slot.id) {
                  <div class="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    @if (slot.imageUrl) {
                      <img [src]="slot.imageUrl" [alt]="slot.groupName" class="w-7 h-7 rounded-lg object-cover shrink-0" />
                    } @else {
                      <span class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-[11px] text-white/40">no_photography</span>
                      </span>
                    }
                    <span class="min-w-0 flex-1">
                      <span class="text-[10px] font-bold text-white truncate block">{{ slot.groupName }}</span>
                      <span class="text-[8px] text-white/40 truncate block">{{ slot.genre || 'Sin género' }}</span>
                    </span>
                    <span class="text-[9px] text-primary font-black shrink-0 flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[9px]">star</span>{{ slot.rating || '—' }}
                    </span>
                  </div>
                } @empty {
                  <p class="text-[9px] text-white/30 italic">Sin grupos en el cartel</p>
                }
              </div>
            </div>

            <!-- Zonas y precios -->
            <div class="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-2">
              <span class="text-[8px] font-bold text-white/35 uppercase tracking-widest">Zonas y Precios</span>
              @for (tier of event().ticketTiers; track tier.name) {
                <div class="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <div class="flex justify-between items-center gap-2">
                    <span class="text-[10px] font-bold text-white flex items-center gap-1 min-w-0">
                      <span class="material-symbols-outlined text-[11px] text-primary shrink-0">{{ tier.icon || 'confirmation_number' }}</span>
                      <span class="truncate">{{ tier.name }}</span>
                    </span>
                    <span class="text-[10px] font-bold text-emerald-400 shrink-0">&#36;{{ tier.price | number:'1.0-0' }} MXN</span>
                  </div>
                  <p class="text-[8px] text-white/40 leading-relaxed mt-0.5 line-clamp-2">
                    {{ tier.description || 'Sin descripción: el cliente no sabe qué incluye esta zona.' }}
                  </p>
                </div>
              } @empty {
                <p class="text-[9px] text-white/30 italic">Sin categorías de boleto</p>
              }
            </div>

            <!-- Ubicación y soporte -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                <span class="text-[8px] font-bold text-white/35 uppercase tracking-widest block">Ubicación</span>
                <span class="text-[10px] font-black text-white uppercase mt-1 flex items-center gap-1">
                  <span class="material-symbols-outlined text-primary text-[12px]">pin_drop</span>
                  <span class="truncate">{{ event().venue }}</span>
                </span>
                <span class="text-[8px] text-white/40 block mt-0.5 truncate">
                  {{ profile().mapsQuery || event().venue + ', ' + event().location }}
                </span>
              </div>

              <div class="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
                <span class="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block">Compra telefónica</span>
                <span class="text-[10px] font-black text-white mt-1 block truncate">
                  {{ profile().supportPhone || 'Sin teléfono' }}
                </span>
                <span class="text-[8px] text-white/40 block mt-0.5">
                  + &#36;{{ profile().serviceFeePerSeat ?? 0 }} de cargo por asiento
                </span>
              </div>
            </div>

            <!-- Reglas -->
            <div class="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
              <span class="text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1 mb-1.5">
                <span class="material-symbols-outlined text-[11px]">gavel</span> Reglas e Información Adicional
              </span>
              <ul class="list-disc list-inside space-y-0.5">
                @for (rule of profile().rules; track rule.id) {
                  <li class="text-[9px] text-white/50 font-light">{{ rule.text }}</li>
                } @empty {
                  <li class="text-[9px] text-white/30 italic list-none">Sin reglas capturadas</li>
                }
              </ul>
            </div>

            <div class="text-center pt-1">
              <span class="text-[8px] text-white/30 uppercase tracking-widest">
                {{ seats() }} lugares · Cargo por servicio no incluido
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EventTabPublicComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(false);

  patch = output<Partial<EventItem>>();

  readonly categories: EditableOption[] = [
    { value: 'Concierto', label: 'Concierto' },
    { value: 'Festival', label: 'Festival' },
    { value: 'Baile', label: 'Baile' },
    { value: 'Palenque', label: 'Palenque' },
    { value: 'Firma de Autógrafos', label: 'Firma de Autógrafos' },
    { value: 'Rueda de Prensa', label: 'Rueda de Prensa' }
  ];

  profile = computed(() => publicProfile(this.event()));

  slots = computed(() => lineup(this.event()));

  dateLabel = computed(() => shortDate(this.event().date));

  showTime = computed(() => {
    const start = this.event().schedule?.showStartAt;
    return start ? dateTimeLabel(start).split(', ')[1] || 'Hora por confirmar' : 'Hora por confirmar';
  });

  fromPrice = computed(() => {
    const low = lowestTicketPrice(this.event());
    return low > 0 ? '$' + low.toLocaleString('es-MX') : 'Por definir';
  });

  priceRange = computed(() => {
    const low = lowestTicketPrice(this.event());
    const high = highestTicketPrice(this.event());
    if (low <= 0) return 'Sin precios';
    return '$' + low.toLocaleString('es-MX') + ' – $' + high.toLocaleString('es-MX') + ' MXN';
  });

  seats = computed(() => totalSeats(this.event()).toLocaleString('es-MX'));

  /** Usar la misma imagen de portada y de cartel deja una de las dos recortada. */
  sameImages = computed(() => {
    const p = this.profile();
    return !!p.coverUrl && p.coverUrl === p.posterUrl;
  });

  toNumber(value: string): number {
    return Number(String(value).replace(/[^0-9.-]/g, '')) || 0;
  }

  patchProfile(changes: Partial<EventPublicProfile>): void {
    this.patch.emit({ publicProfile: { ...this.profile(), ...changes } });
  }

  addRule(): void {
    const rule: EventRule = { id: 'r-' + this.event().id + '-' + Date.now(), text: 'Nueva regla del evento' };
    this.patchProfile({ rules: [...this.profile().rules, rule] });
  }

  patchRule(rule: EventRule, text: string): void {
    this.patchProfile({ rules: this.profile().rules.map(r => (r.id === rule.id ? { ...r, text } : r)) });
  }

  removeRule(rule: EventRule): void {
    this.patchProfile({ rules: this.profile().rules.filter(r => r.id !== rule.id) });
  }
}
