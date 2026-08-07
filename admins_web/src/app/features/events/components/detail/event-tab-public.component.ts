import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem, EventPublicProfile, EventRule, ArtistGreetingVideo } from '../../../../core/models/event.models';
import { GroupItem } from '../../../../core/models/admin.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { EventTabLineupComponent } from './event-tab-lineup.component';
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
 * Pestaña unificada "EVENTO": concentra toda la información pública del evento.
 *
 * Secciones:
 * 1. Encabezado con estado de la ficha y botón para alternar el Side Modal Window de vista previa.
 * 2. Datos Principales del Evento (Tarjetas de cristal con editores inline).
 * 3. Imágenes Oficiales (Portada 16:9 y Cartel 3:4).
 * 4. Textos de Difusión Pública, Reglas dinámicas y Teléfonos de soporte.
 * 5. Cartel & Alineación de grupos (Integrado con app-event-tab-lineup).
 */
@Component({
  selector: 'app-event-tab-public',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent, EventTabLineupComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ─── BARRA DE ACCIÓN SUPERIOR Y TOGGLE DEL SIDE MODAL ─── -->
      <div class="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-surface-container-high/95 to-amber-500/5 border border-amber-500/30 flex items-center justify-between gap-4 backdrop-blur-2xl shadow-2xl flex-wrap">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <span class="material-symbols-outlined text-2xl font-bold">event</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-base font-black uppercase tracking-wider text-on-surface truncate">Gestión Integral del Evento</h4>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-widest">
                Información Pública
              </span>
            </div>
            <p class="text-xs text-outline font-medium truncate mt-0.5">Captura de datos base, ficha técnica para el cliente y alineación de grupos</p>
          </div>
        </div>

        <button
          type="button"
          (click)="togglePreview.emit(!showPreview())"
          [class]="showPreview()
            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-[1.03] border border-amber-300/60 ring-2 ring-amber-400/30'
            : 'bg-surface-container-high/90 text-on-surface border border-outline-variant/30 hover:border-amber-500/50 hover:bg-surface-bright shadow-lg'"
          class="px-5 py-3 min-h-12 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-2.5 shrink-0"
        >
          <span class="material-symbols-outlined text-xl font-bold">{{ showPreview() ? 'visibility_off' : 'visibility' }}</span>
          <span>{{ showPreview() ? 'Cerrar Vista Previa Lateral' : 'Ver Vista Previa de Cliente (Side Modal)' }}</span>
        </button>
      </div>

      <!-- ─── SECCIÓN 1: DATOS PRINCIPALES DEL EVENTO ─── -->
      <section class="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-amber-500/25 border-l-4 border-l-amber-500/70 shadow-2xl shadow-amber-500/5 space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold material-symbols-outlined text-lg">event</span>
            <span>Datos principales del evento</span>
          </h5>
          <span class="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">Identidad Base</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-editable-field
            label="Nombre del evento"
            [value]="event().title"
            [readonly]="!canEditIdentity()"
            (save)="patch.emit({ title: $event })"
          />
          <app-editable-field
            label="Fecha del evento"
            type="date"
            [value]="event().date"
            [readonly]="!canEditIdentity()"
            (save)="patch.emit({ date: $event })"
          />
          <app-editable-field
            label="Aforo del recinto"
            type="number"
            [value]="event().capacity ?? ''"
            [readonly]="!canEditIdentity()"
            (save)="patch.emit({ capacity: toNumber($event) })"
          />
          <app-editable-field
            label="Recinto / Inmueble"
            [value]="event().venue"
            [readonly]="!canEditIdentity()"
            (save)="patch.emit({ venue: $event })"
          />
          <app-editable-field
            label="Ciudad y estado"
            [value]="event().location"
            [readonly]="!canEditIdentity()"
            (save)="patch.emit({ location: $event })"
          />
          <app-editable-field
            label="Dirección del recinto"
            [value]="event().venueAddress || ''"
            [readonly]="!canEditIdentity()"
            (save)="patch.emit({ venueAddress: $event })"
          />
        </div>

        <!-- Categoría como chips y no como <select>: son seis opciones fijas,
             se ven todas de golpe y la elegida queda evidente. Es además el
             dato que encabeza la ficha del cliente. -->
        <div class="space-y-2.5 pt-1">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <label class="text-[10px] font-black uppercase tracking-wider text-outline">Categoría del evento</label>
            <span class="text-[10px] text-outline">Encabeza la ficha pública del cliente</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            @for (c of categoryChips; track c.value) {
              <button
                type="button"
                [disabled]="!canEdit()"
                (click)="patchProfile({ category: $any(c.value) })"
                class="px-3.5 py-2 rounded-2xl border text-[11px] font-black transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                [class]="profile().category === c.value
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border-amber-300/60 shadow-[0_0_18px_-4px_rgba(245,158,11,0.8)] scale-[1.04]'
                  : 'bg-surface-container/60 text-outline border-outline-variant/25 hover:text-on-surface hover:border-amber-500/40'"
              >
                <span class="material-symbols-outlined text-base">{{ c.icon }}</span>
                {{ c.label }}
              </button>
            }
          </div>
        </div>

        <app-editable-field
          label="Nota interna (Confidencial)"
          hint="no se muestra al público"
          type="textarea"
          [rows]="2"
          valueClass="text-xs font-medium text-on-surface-variant break-words"
          [value]="event().description || ''"
          [readonly]="!canEditIdentity()"
          (save)="patch.emit({ description: $event })"
        />
      </section>

      <!-- ─── SECCIÓN 2: IMÁGENES OFICIALES DEL EVENTO ─── -->
      <section class="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-cyan-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-cyan-500/25 border-l-4 border-l-cyan-500/70 shadow-2xl shadow-cyan-500/5 space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold material-symbols-outlined text-lg">image</span>
            <span>Imágenes oficiales del evento</span>
          </h5>
          <span class="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">Multimedia de Difusión</span>
        </div>

        <!-- Solo dos imágenes: son exactamente las que ve el público en la
             ficha de compra —la portada de fondo y el cartel que se amplía—.
             El thumbnail interno de las tarjetas del panel se sincroniza solo
             con el cartel, para no pedirle al encargado una tercera imagen. -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <!-- Portada Panorámica -->
          <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 space-y-3 shadow-md">
            <app-editable-field
              label="Portada panorámica (16:9)"
              hint="encabeza la ficha del portal"
              type="url"
              placeholder="https://…"
              valueClass="text-xs font-mono text-on-surface break-all"
              [value]="profile().coverUrl"
              [readonly]="!canEdit()"
              (save)="patchProfile({ coverUrl: $event })"
            />
            <div class="aspect-video rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/25 relative group shadow-lg">
              @if (profile().coverUrl) {
                <img [src]="profile().coverUrl" alt="Portada" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[9px] font-mono font-bold text-white border border-white/20">
                  16:9 Panorámica
                </div>
              } @else {
                <div class="w-full h-full flex flex-col items-center justify-center text-outline text-xs gap-1.5">
                  <span class="material-symbols-outlined text-2xl text-outline/60">wallpaper</span>
                  <span class="font-semibold">Sin portada panorámica</span>
                </div>
              }
            </div>
          </div>

          <!-- Cartel Oficial Vertical -->
          <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 space-y-3 shadow-md">
            <app-editable-field
              label="Cartel / flyer oficial (3:4)"
              hint="el que se amplía en la ficha del cliente"
              type="url"
              placeholder="https://…"
              valueClass="text-xs font-mono text-on-surface break-all"
              [value]="profile().posterUrl"
              [readonly]="!canEdit()"
              (save)="savePoster($event)"
            />
            <div class="aspect-[3/4] max-h-52 rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/25 mx-auto relative group shadow-lg">
              @if (profile().posterUrl) {
                <img [src]="profile().posterUrl" alt="Cartel" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[9px] font-mono font-bold text-white border border-white/20">
                  3:4 Vertical
                </div>
              } @else {
                <div class="w-full h-full flex flex-col items-center justify-center text-outline text-xs gap-1 text-center p-3">
                  <span class="material-symbols-outlined text-2xl text-outline/60">imagesmode</span>
                  <span class="font-semibold">Sin cartel vertical 3:4</span>
                </div>
              }
            </div>
          </div>
        </div>

        @if (sameImages()) {
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 shadow-md">
            <span class="material-symbols-outlined text-lg shrink-0 text-amber-400 mt-0.5">warning</span>
            <span>La portada y el cartel son la misma imagen. En la ficha del cliente una va horizontal de fondo y la otra se amplía en vertical: se verá recortada en una de las dos.</span>
          </div>
        }
      </section>

      <!-- ─── SECCIÓN 2B: SALUDOS EN VIDEO DE LOS ARTISTAS ─── -->
      <section class="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-rose-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-rose-500/25 border-l-4 border-l-rose-500/70 shadow-2xl shadow-rose-500/5 space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-4 flex-wrap">
          <h5 class="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold material-symbols-outlined text-lg">videocam</span>
            <span>Saludos y mensajes de los artistas</span>
          </h5>
          <div class="flex items-center gap-2.5">
            <span class="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">{{ greetingVideos().length }} video(s)</span>
            @if (canEdit()) {
              <button
                type="button"
                (click)="addGreetingVideo()"
                class="px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[11px] font-black transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-sm">add</span> Añadir saludo
              </button>
            }
          </div>
        </div>

        @if (greetingVideos().length) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (v of greetingVideos(); track v.id) {
              <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 space-y-3 shadow-md">
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border"
                    [class]="v.type === 'youtube'
                      ? 'bg-red-500/15 text-red-300 border-red-500/30'
                      : 'bg-sky-500/15 text-sky-300 border-sky-500/30'">
                    {{ v.type === 'youtube' ? 'YouTube' : 'MP4 subido' }}
                  </span>
                  @if (canEdit()) {
                    <div class="flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="patchGreetingVideo(v, { type: v.type === 'youtube' ? 'local' : 'youtube' })"
                        class="px-2.5 py-1 rounded-lg bg-surface-container-highest text-outline hover:text-on-surface border border-outline-variant/30 text-[10px] font-black transition-all"
                        title="Cambiar entre video subido y enlace de YouTube"
                      >
                        Cambiar tipo
                      </button>
                      <button
                        type="button"
                        (click)="removeGreetingVideo(v)"
                        class="p-1.5 rounded-lg bg-surface-container-highest hover:bg-rose-500/20 text-outline hover:text-rose-300 border border-outline-variant/30 transition-all"
                        title="Quitar este saludo"
                      >
                        <span class="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  }
                </div>

                <app-editable-field
                  label="Título del video"
                  [value]="v.title"
                  [readonly]="!canEdit()"
                  (save)="patchGreetingVideo(v, { title: $event })"
                />
                <app-editable-field
                  [label]="v.type === 'youtube' ? 'Enlace de YouTube (embed)' : 'URL del MP4 subido'"
                  type="url"
                  placeholder="https://…"
                  valueClass="text-xs font-mono text-on-surface break-all"
                  [value]="v.url"
                  [readonly]="!canEdit()"
                  (save)="patchGreetingVideo(v, { url: $event })"
                />

                @if (!v.url.trim()) {
                  <p class="text-[11px] text-amber-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">warning</span>
                    Sin enlace: este saludo no se le mostrará al público.
                  </p>
                }
              </div>
            }
          </div>
        } @else {
          <p class="p-5 text-center text-xs text-outline italic bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/30">
            Todavía no hay saludos en video. El bloque "Saludos y Mensajes de los Artistas" no aparecerá en la ficha del cliente.
          </p>
        }
      </section>

      <!-- ─── SECCIÓN 3: TEXTOS DE DIFUSIÓN PÚBLICA & REGLAS ─── -->
      <section class="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-emerald-500/25 border-l-4 border-l-emerald-500/70 shadow-2xl shadow-emerald-500/5 space-y-6 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold material-symbols-outlined text-lg">edit_note</span>
            <span>Textos de la ficha pública & Reglas</span>
          </h5>
          <span class="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">Contenido del Cliente</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <app-editable-field
            label="Frase de portada"
            hint="una línea bajo el título"
            type="textarea"
            [rows]="2"
            placeholder="Ej. La tambora más potente del país, una sola noche."
            valueClass="text-xs font-bold text-on-surface break-words"
            [value]="profile().tagline"
            [readonly]="!canEdit()"
            (save)="patchProfile({ tagline: $event })"
          />
        </div>

        <app-editable-field
          label="Información detallada del evento"
          hint="lo que el cliente lee antes de comprar"
          type="textarea"
          [rows]="4"
          placeholder="Describe la experiencia, accesos, amenidades y seguridad."
          valueClass="text-xs font-medium text-on-surface-variant break-words leading-relaxed"
          [value]="profile().about"
          [readonly]="!canEdit()"
          (save)="patchProfile({ about: $event })"
        />

        <!-- Reglas -->
        <div class="pt-4 border-t border-outline-variant/20 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h6 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-primary">gavel</span> Reglas e Información Adicional
            </h6>
            <span class="text-xs font-mono font-bold text-outline px-2.5 py-0.5 rounded-lg bg-surface-container border border-outline-variant/20">
              {{ profile().rules.length }} regla(s)
            </span>
          </div>

          <div class="space-y-2.5">
            @for (rule of profile().rules; track rule.id) {
              <div class="flex items-center gap-3 p-3 rounded-2xl bg-surface-container/70 border border-outline-variant/20 shadow-sm hover:border-amber-500/30 transition-all">
                <span class="material-symbols-outlined text-base text-primary shrink-0">chevron_right</span>
                <div class="flex-1 min-w-0">
                  <app-editable-field
                    [value]="rule.text"
                    type="textarea"
                    [rows]="2"
                    valueClass="text-xs font-medium text-on-surface-variant break-words"
                    [readonly]="!canEdit()"
                    (save)="patchRule(rule, $event)"
                  />
                </div>
                @if (canEdit()) {
                  <button
                    type="button"
                    (click)="removeRule(rule)"
                    class="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all shadow-sm"
                  >
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                }
              </div>
            } @empty {
              <p class="text-xs text-outline italic p-4 rounded-2xl bg-surface-container/40 text-center border border-dashed border-outline-variant/30">
                Sin reglas capturadas. Se recomienda agregar accesos, horarios de puertas y restricción de objetos.
              </p>
            }
          </div>

          @if (canEdit()) {
            <button
              type="button"
              (click)="addRule()"
              class="px-4 py-2.5 min-h-11 rounded-2xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <span class="material-symbols-outlined text-base font-bold">add</span> Agregar regla
            </button>
          }
        </div>

        <!-- Compra y contacto -->
        <div class="pt-4 border-t border-outline-variant/20 space-y-4">
          <h6 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-base text-primary">support_agent</span> Compra, Contacto y Restricciones
          </h6>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              label="Cierre de venta de boletos"
              hint="días antes del evento"
              type="number"
              [value]="profile().salesCloseDaysBefore ?? 1"
              [readonly]="!canEdit()"
              (save)="patchProfile({ salesCloseDaysBefore: toNumber($event) })"
            />
            <app-editable-field
              label="Búsqueda en Google Maps"
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
        </div>
      </section>

      <!-- ─── SECCIÓN 4: ALINEACIÓN & CARTEL DE GRUPOS ─── -->
      <section class="space-y-4">
        <div class="flex items-center justify-between gap-3 px-1">
          <h5 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-bold material-symbols-outlined text-lg">queue_music</span>
            <span>Alineación & Cartel de Grupos</span>
          </h5>
          <span class="px-3.5 py-1.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs font-mono font-bold text-outline shadow-sm">
            {{ slots().length }} grupo(s) asignados
          </span>
        </div>

        <app-event-tab-lineup
          [event]="event()"
          [canEdit]="canEditLineup()"
          [canViewFinances]="canViewFinances()"
          [availableGroups]="availableGroups()"
          (patch)="patch.emit($event)"
        />
      </section>

    </div>
  `
})
export class EventTabPublicComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(false);
  canEditIdentity = input<boolean>(false);
  canEditLineup = input<boolean>(false);
  canViewFinances = input<boolean>(false);
  availableGroups = input<GroupItem[]>([]);
  showPreview = input<boolean>(false);

  patch = output<Partial<EventItem>>();
  togglePreview = output<boolean>();

  /** Las seis categorías con su ícono, para el selector de chips. */
  readonly categoryChips: ReadonlyArray<{ value: string; label: string; icon: string }> = [
    { value: 'Concierto', label: 'Concierto', icon: 'music_note' },
    { value: 'Festival', label: 'Festival', icon: 'festival' },
    { value: 'Baile', label: 'Baile', icon: 'nightlife' },
    { value: 'Palenque', label: 'Palenque', icon: 'stadium' },
    { value: 'Firma de Autógrafos', label: 'Firma de Autógrafos', icon: 'stylus_note' },
    { value: 'Rueda de Prensa', label: 'Rueda de Prensa', icon: 'campaign' }
  ];

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

  greetingVideos = computed(() => this.profile().greetingVideos ?? []);

  /** Grupos ya puestos en el cartel: son los que pueden mandar un saludo. */
  lineupBandNames = computed(() => this.slots().map(s => s.groupName).filter(Boolean));
  dateLabel = computed(() => shortDate(this.event().date));

  showTime = computed(() => {
    const start = this.event().schedule?.showStartAt;
    return start ? dateTimeLabel(start).split(', ')[1] || 'Hora por confirmar' : 'Hora por confirmar';
  });

  fromPrice = computed(() => {
    const low = lowestTicketPrice(this.event());
    return low > 0 ? '$' + low.toLocaleString('es-MX') : 'Por definir';
  });

  seats = computed(() => totalSeats(this.event()).toLocaleString('es-MX'));

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

  /**
   * El cartel es la única imagen vertical del evento, así que también sirve de
   * miniatura en las tarjetas del panel. Se guardan las dos a la vez para que
   * el encargado no tenga que subir la misma imagen dos veces ni pueda dejarlas
   * desincronizadas.
   */
  savePoster(url: string): void {
    this.patch.emit({
      publicProfile: { ...this.profile(), posterUrl: url },
      flyerUrl: url
    });
  }

  addGreetingVideo(): void {
    const video: ArtistGreetingVideo = {
      id: 'vid-' + this.event().id + '-' + Date.now(),
      bandName: this.lineupBandNames()[0] || this.event().groupName || 'Grupo del cartel',
      title: 'Saludo del grupo al público',
      url: '',
      type: 'youtube'
    };
    this.patchProfile({ greetingVideos: [...this.greetingVideos(), video] });
  }

  patchGreetingVideo(video: ArtistGreetingVideo, changes: Partial<ArtistGreetingVideo>): void {
    this.patchProfile({
      greetingVideos: this.greetingVideos().map(v => (v.id === video.id ? { ...v, ...changes } : v))
    });
  }

  removeGreetingVideo(video: ArtistGreetingVideo): void {
    this.patchProfile({ greetingVideos: this.greetingVideos().filter(v => v.id !== video.id) });
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

