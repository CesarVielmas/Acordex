import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EventLineupSlot,
  EventPublicProfile,
  EventRule,
  emptyPublicProfile
} from '../../../../core/models/event.models';
import { GroupItem } from '../../../../core/models/admin.models';
import { PressEventItem, PressEventType } from '../../../../core/models/press.models';
import { SessionService } from '../../../../core/services/session.service';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { MandatoryTaskTagComponent } from '../../../../shared/ui/mandatory-task-tag/mandatory-task-tag.component';
import { MandatoryFields } from '../../../events/mandatory-fields';
import { markIntervention, ResolvedTask } from '../../../events/event-tasks';
import { slugify } from '../../../events/event-metrics';
import { PressFileDropComponent } from '../press-file-drop.component';
import { pressLineup, pressPublicProfile, pressWhenLabel } from '../../press-metrics';

/**
 * Pestaña "Evento": todo lo que el cliente ve en
 * `/events/firma-prensa?id=…` y los datos base con los que se opera.
 *
 * El orden de la pantalla es el de la página del cliente a propósito —portada,
 * información, videos, artistas, lineamientos, contacto— para que capturar sea
 * literalmente ir llenando lo que el visitante va a leer de arriba abajo.
 */
@Component({
  selector: 'app-press-tab-event',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, MandatoryTaskTagComponent, PressFileDropComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      @if (mandatory.notice(); as aviso) {
        <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-[11px] text-amber-100 flex items-start gap-2">
          <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
          <span class="flex-1 leading-relaxed">{{ aviso }}</span>
          <button type="button" (click)="mandatory.notice.set(null)" class="text-amber-300 hover:text-white shrink-0">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      }

      <!-- ─── IDENTIDAD ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-amber-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-amber-500/25 border-l-4 border-l-amber-500/70 shadow-2xl shadow-amber-500/5 space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center material-symbols-outlined text-lg">newspaper</span>
            <span>Datos del evento de prensa</span>
          </h5>
          <div class="flex items-center gap-2.5">
            <app-mandatory-task-tag ref="identidad_prensa" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
            <span class="text-[10px] font-mono font-bold text-outline uppercase tracking-wider hidden sm:inline">{{ whenLabel() }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-editable-field
            label="Nombre del evento"
            [value]="event().title"
            [readonly]="!canEditIdentity()"
            [proposalWarning]="mandatory.warning('identidad_prensa')"
            [proposals]="mandatory.proposals('identidad_prensa', 'title')"
            [canDecide]="mandatory.canDecide('identidad_prensa')"
            [proposalOwner]="mandatory.approvers('identidad_prensa')"
            (acceptProposal)="mandatory.accept('identidad_prensa', $event)"
            (rejectProposal)="mandatory.reject('identidad_prensa', $event)"
            (save)="mandatory.save('identidad_prensa', 'Nombre del evento', { title: $event })"
          />
          <app-editable-field
            label="Tipo de evento"
            hint="cambia lo que se exige"
            type="select"
            [options]="typeOptions"
            [value]="event().pressType"
            [readonly]="!canEditIdentity()"
            [proposalWarning]="mandatory.warning('identidad_prensa')"
            [proposals]="mandatory.proposals('identidad_prensa', 'pressType')"
            [canDecide]="mandatory.canDecide('identidad_prensa')"
            (acceptProposal)="mandatory.accept('identidad_prensa', $event)"
            (rejectProposal)="mandatory.reject('identidad_prensa', $event)"
            (save)="mandatory.save('identidad_prensa', 'Tipo de evento', { pressType: asType($event) })"
          />
          <app-editable-field
            label="Fecha"
            type="date"
            [value]="event().date"
            [readonly]="!canEditIdentity()"
            [proposalWarning]="mandatory.warning('identidad_prensa')"
            [proposals]="mandatory.proposals('identidad_prensa', 'date')"
            [canDecide]="mandatory.canDecide('identidad_prensa')"
            (acceptProposal)="mandatory.accept('identidad_prensa', $event)"
            (rejectProposal)="mandatory.reject('identidad_prensa', $event)"
            (save)="mandatory.save('identidad_prensa', 'Fecha', { date: $event })"
          />
          <app-editable-field
            label="Hora de inicio"
            hint="24h"
            [value]="event().startTime ?? ''"
            placeholder="16:00"
            [readonly]="!canEditIdentity()"
            (save)="mandatory.save('identidad_prensa', 'Hora de inicio', { startTime: $event })"
          />
          <app-editable-field
            label="Recinto"
            [value]="event().venue"
            [readonly]="!canEditIdentity()"
            [proposalWarning]="mandatory.warning('identidad_prensa')"
            [proposals]="mandatory.proposals('identidad_prensa', 'venue')"
            [canDecide]="mandatory.canDecide('identidad_prensa')"
            (acceptProposal)="mandatory.accept('identidad_prensa', $event)"
            (rejectProposal)="mandatory.reject('identidad_prensa', $event)"
            (save)="mandatory.save('identidad_prensa', 'Recinto', { venue: $event })"
          />
          <app-editable-field
            label="Ciudad y estado"
            [value]="event().location"
            [readonly]="!canEditIdentity()"
            (save)="mandatory.save('identidad_prensa', 'Ciudad y estado', { location: $event })"
          />
        </div>

        <app-editable-field
          label="Dirección exacta del recinto"
          hint="la ve el público y la usa la producción"
          [value]="event().venueAddress ?? ''"
          [readonly]="!canEditIdentity()"
          placeholder="Calle, número, colonia, código postal y ciudad"
          (save)="mandatory.save('identidad_prensa', 'Dirección del recinto', { venueAddress: $event })"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <app-press-file-drop
            label="Imagen de la tarjeta interna"
            hint="solo se ve en el panel"
            kind="image"
            [value]="event().flyerUrl"
            [readonly]="!canEditIdentity()"
            (save)="mandatory.save('identidad_prensa', 'Imagen de la tarjeta', { flyerUrl: $event })"
          />
          <app-editable-field
            label="Descripción corta"
            hint="para el panel"
            type="textarea"
            [rows]="5"
            [value]="event().description ?? ''"
            [readonly]="!canEditIdentity()"
            (save)="mandatory.save('identidad_prensa', 'Descripción corta', { description: $event })"
          />
        </div>
      </section>

      <!-- ─── FICHA PÚBLICA ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-sky-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-sky-500/25 border-l-4 border-l-sky-500/70 shadow-2xl shadow-sky-500/5 space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 flex items-center justify-center material-symbols-outlined text-lg">public</span>
            <span>Lo que ve el público en el portal</span>
          </h5>
          <a
            [href]="portalUrl()"
            target="_blank"
            class="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/35 hover:bg-sky-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[13px]">open_in_new</span> Abrir la ficha del cliente
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline">Fotografía oficial</span>
              <app-mandatory-task-tag ref="foto_oficial" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
            </div>
            <app-press-file-drop
              hint="encabeza la ficha pública"
              kind="image"
              [value]="profile().coverUrl"
              [readonly]="!canEditPublic()"
              (save)="saveProfile('foto_oficial', 'Fotografía oficial', { coverUrl: $event })"
            />
          </div>

          <div class="space-y-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline">Cartel vertical (opcional)</span>
            <app-press-file-drop
              hint="para difusión"
              kind="image"
              [value]="profile().posterUrl"
              [readonly]="!canEditPublic()"
              (save)="saveProfile('foto_oficial', 'Cartel vertical', { posterUrl: $event })"
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline">Acerca de la firma & rueda de prensa</span>
            <app-mandatory-task-tag ref="descripcion_prensa" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
          </div>
          <app-editable-field
            hint="mínimo 80 caracteres"
            type="textarea"
            [rows]="5"
            [value]="profile().about"
            [readonly]="!canEditPublic()"
            [proposalWarning]="mandatory.warning('descripcion_prensa')"
            [proposals]="mandatory.proposals('descripcion_prensa', 'about')"
            [canDecide]="mandatory.canDecide('descripcion_prensa')"
            [proposalOwner]="mandatory.approvers('descripcion_prensa')"
            (acceptProposal)="mandatory.accept('descripcion_prensa', $event)"
            (rejectProposal)="mandatory.reject('descripcion_prensa', $event)"
            placeholder="Qué va a pasar en el evento, en qué orden y qué puede esperar quien asista"
            (save)="saveProfile('descripcion_prensa', 'Descripción del evento', { about: $event })"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-editable-field
            label="Frase de portada"
            [value]="profile().tagline"
            [readonly]="!canEditPublic()"
            (save)="saveProfile('descripcion_prensa', 'Frase de portada', { tagline: $event })"
          />
          <app-editable-field
            label="Búsqueda del mapa"
            hint="lo que se incrusta"
            [value]="profile().mapsQuery ?? ''"
            [readonly]="!canEditPublic()"
            [placeholder]="event().venue"
            (save)="saveProfile('mapa_prensa', 'Búsqueda del mapa', { mapsQuery: $event })"
          />
          <app-editable-field
            label="Edad mínima"
            [value]="profile().minimumAge ?? ''"
            [readonly]="!canEditPublic()"
            placeholder="Ej. menores de 12 acompañados"
            (save)="saveProfile('descripcion_prensa', 'Edad mínima', { minimumAge: $event })"
          />
        </div>

        <!-- Soporte -->
        <div class="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">phone_in_talk</span> Soporte y dudas del evento
            </span>
            <app-mandatory-task-tag ref="soporte_prensa" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
          </div>
          <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
            El portal ofrece dos botones —Llamar y WhatsApp— y los dos salen de aquí. Sin número, los dos llevan a
            ninguna parte y el medio que tiene una duda de acceso se queda sin a quién preguntarle.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <app-editable-field
              label="Teléfono de dudas"
              type="tel"
              [value]="profile().supportPhone ?? ''"
              [readonly]="!canEditPublic()"
              placeholder="+52 (81) 1234 5678"
              (save)="saveProfile('soporte_prensa', 'Teléfono de dudas', { supportPhone: $event })"
            />
            <app-editable-field
              label="WhatsApp"
              hint="solo dígitos con lada"
              [value]="profile().supportWhatsApp ?? ''"
              [readonly]="!canEditPublic()"
              placeholder="528112345678"
              (save)="saveProfile('soporte_prensa', 'WhatsApp de dudas', { supportWhatsApp: $event })"
            />
          </div>
        </div>

        <!-- Reglas -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">gavel</span>
              {{ isFirma() ? 'Lineamientos para fanáticos' : 'Lineamientos de acceso' }}
            </span>
            <div class="flex items-center gap-2">
              <app-mandatory-task-tag ref="reglas_fans" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
              @if (canEditPublic()) {
                <button type="button" (click)="addRule()"
                  class="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/35 hover:bg-sky-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px]">add</span> Agregar regla
                </button>
              }
            </div>
          </div>

          @if (isFirma()) {
            <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
              En una firma la fila <em>es</em> el evento: sin reglas publicadas, la gente llega con cinco discos y
              esperando selfies, y eso se resuelve a gritos en la puerta.
            </p>
          }

          @if (!rules().length) {
            <p class="py-4 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
              Sin reglas capturadas. El portal muestra este bloque vacío.
            </p>
          } @else {
            <div class="space-y-2">
              @for (r of rules(); track r.id) {
                <div class="flex items-start gap-2 p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                  <span class="material-symbols-outlined text-[13px] text-sky-300 mt-0.5 shrink-0">check_circle</span>
                  <input
                    [ngModel]="r.text"
                    (ngModelChange)="patchRule(r.id, $event)"
                    [disabled]="!canEditPublic()"
                    class="flex-1 min-w-0 bg-transparent text-[11px] text-on-surface focus:outline-none border-b border-transparent focus:border-sky-400/60 transition-colors disabled:opacity-70"
                  />
                  @if (canEditPublic()) {
                    <button type="button" (click)="removeRule(r.id)"
                      class="p-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shrink-0">
                      <span class="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Videos de invitación -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">videocam</span> Saludos y mensajes de los artistas
            </span>
            <div class="flex items-center gap-2">
              <app-mandatory-task-tag ref="videos_prensa" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
              @if (canEditPublic()) {
                <button type="button" (click)="addVideo()"
                  class="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/35 hover:bg-sky-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px]">add</span> Agregar video
                </button>
              }
            </div>
          </div>

          @if (!videos().length) {
            <p class="py-4 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
              Sin videos de invitación.
            </p>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (v of videos(); track v.id) {
                <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <input
                      [ngModel]="v.title"
                      (ngModelChange)="patchVideo(v.id, { title: $event })"
                      [disabled]="!canEditPublic()"
                      placeholder="Título del video"
                      class="flex-1 min-w-0 bg-transparent text-xs font-black text-on-surface focus:outline-none border-b border-transparent focus:border-sky-400/60 transition-colors disabled:opacity-70"
                    />
                    @if (canEditPublic()) {
                      <button type="button" (click)="removeVideo(v.id)"
                        class="p-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shrink-0">
                        <span class="material-symbols-outlined text-[13px]">close</span>
                      </button>
                    }
                  </div>
                  <input
                    [ngModel]="v.bandName"
                    (ngModelChange)="patchVideo(v.id, { bandName: $event })"
                    [disabled]="!canEditPublic()"
                    placeholder="Grupo que graba el saludo"
                    class="w-full bg-transparent text-[11px] text-blue-300 focus:outline-none border-b border-transparent focus:border-sky-400/60 transition-colors disabled:opacity-70"
                  />
                  <app-press-file-drop
                    kind="video"
                    [value]="v.url"
                    [readonly]="!canEditPublic()"
                    (save)="patchVideo(v.id, { url: $event, type: videoKind($event) })"
                  />
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- ─── GRUPOS ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-violet-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-violet-500/25 border-l-4 border-l-violet-500/70 shadow-2xl shadow-violet-500/5 space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-violet-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center material-symbols-outlined text-lg">groups</span>
            <span>Artistas en el evento</span>
          </h5>
          <div class="flex items-center gap-2.5">
            <app-mandatory-task-tag ref="grupos_prensa" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
            @if (canEditLineup()) {
              <button type="button" (click)="addOpen.set(!addOpen())"
                class="px-3 py-1.5 rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/35 hover:bg-violet-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px]">add</span> Agregar grupo
              </button>
            }
          </div>
        </div>

        @if (addOpen() && canEditLineup()) {
          <div class="p-3.5 rounded-2xl bg-black/30 border border-violet-500/25 space-y-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline">Elige un grupo del catálogo</span>
            <div class="flex flex-wrap gap-2">
              @for (g of availableGroups(); track g.id) {
                <button type="button" (click)="addGroup(g)"
                  class="px-3 py-2 rounded-xl bg-white/5 border border-white/12 hover:border-violet-400/60 hover:text-violet-200 text-[11px] font-bold text-on-surface-variant transition-all">
                  {{ g.name }}
                </button>
              }
            </div>
          </div>
        }

        @if (!slots().length) {
          <p class="py-5 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
            Sin grupos. El portal no tiene a quién enlazar en "Artistas en el Evento".
          </p>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            @for (s of slots(); track s.id) {
              <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-3">
                <div class="flex items-start gap-3">
                  <img
                    [src]="s.imageUrl || placeholderImage"
                    [alt]="s.groupName"
                    class="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-black text-on-surface truncate">{{ s.groupName }}</span>
                      @if (s.isExternal) {
                        <span class="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9px] font-black uppercase tracking-wider">
                          {{ s.managerName }}
                        </span>
                      }
                    </div>
                    <p class="text-[10px] text-outline mt-0.5">
                      {{ s.isExternal
                        ? 'Su ficha pública la responde su disquera: lo que escribas aquí llega como propuesta.'
                        : 'Grupo propio' }}
                    </p>
                  </div>
                  @if (canEditLineup() && !s.isExternal) {
                    <button type="button" (click)="removeSlot(s.id)"
                      class="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shrink-0">
                      <span class="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  }
                </div>

                <div class="grid grid-cols-2 gap-2.5">
                  <app-editable-field
                    label="Género"
                    [value]="s.genre ?? ''"
                    [readonly]="!canEditSlot(s)"
                    placeholder="Norteño / Banda"
                    (save)="patchSlot(s.id, { genre: $event })"
                  />
                  <app-editable-field
                    label="Calificación"
                    type="number"
                    [groupThousands]="false"
                    [value]="s.rating ?? ''"
                    [readonly]="!canEditSlot(s)"
                    placeholder="4.8"
                    (save)="patchSlot(s.id, { rating: toNumber($event) })"
                  />
                </div>

                <app-editable-field
                  label="Perfil público"
                  hint="enlaza a /grupo/:slug"
                  [value]="s.profileSlug ?? ''"
                  [readonly]="!canEditSlot(s)"
                  [placeholder]="suggestSlug(s)"
                  (save)="patchSlot(s.id, { profileSlug: $event })"
                />

                <app-press-file-drop
                  label="Fotografía del grupo"
                  kind="image"
                  [value]="s.imageUrl ?? ''"
                  [readonly]="!canEditSlot(s)"
                  (save)="patchSlot(s.id, { imageUrl: $event })"
                />
              </div>
            }
          </div>
        }
      </section>

      <!-- ─── GALERÍA ─── -->
      <section class="p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">photo_library</span>
            <span>Galería de fotografías</span>
          </h5>
          <div class="flex items-center gap-2.5">
            <app-mandatory-task-tag ref="galeria_prensa" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
            <button type="button" (click)="uploadPhoto.emit()"
              class="px-3 py-1.5 rounded-xl bg-white/5 text-outline border border-white/15 hover:text-on-surface text-[10px] font-black transition-all flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">add_a_photo</span> Subir material
            </button>
          </div>
        </div>

        @if (!photos().length) {
          <p class="py-5 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
            Sin fotografías cargadas.
          </p>
        } @else {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            @for (m of photos(); track m.id) {
              <figure class="rounded-2xl overflow-hidden border border-outline-variant/25 bg-black/40">
                <img [src]="m.url" [alt]="m.caption" class="w-full h-28 object-cover" />
                <figcaption class="p-2 text-[10px] text-on-surface-variant leading-tight line-clamp-2">{{ m.caption }}</figcaption>
              </figure>
            }
          </div>
        }
      </section>
    </div>
  `
})
export class PressTabEventComponent {
  private readonly session = inject(SessionService);

  readonly event = input.required<PressEventItem>();
  readonly availableGroups = input<GroupItem[]>([]);
  readonly canEditIdentity = input<boolean>(false);
  readonly canEditPublic = input<boolean>(false);
  readonly canEditLineup = input<boolean>(false);

  readonly patch = output<Partial<PressEventItem>>();
  readonly openTasks = output<void>();
  readonly uploadPhoto = output<void>();

  readonly placeholderImage = 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=300&auto=format&fit=crop&q=80';

  readonly typeOptions: EditableOption[] = [
    { value: 'Firma de Autógrafos', label: 'Firma de Autógrafos' },
    { value: 'Rueda de Prensa', label: 'Rueda de Prensa' }
  ];

  readonly addOpen = signal(false);

  readonly mandatory = new MandatoryFields<PressEventItem>(
    () => this.event(),
    () => this.session.actor(),
    patch => this.patch.emit(patch)
  );

  readonly profile = computed<EventPublicProfile>(() => pressPublicProfile(this.event()));
  readonly slots = computed(() => pressLineup(this.event()));
  readonly rules = computed(() => this.profile().rules || []);
  readonly videos = computed(() => this.profile().greetingVideos || []);
  readonly photos = computed(() => (this.event().evidenceMedia || []).filter(m => m.type === 'photo'));

  readonly isFirma = computed(() => this.event().pressType === 'Firma de Autógrafos');

  whenLabel(): string {
    return pressWhenLabel(this.event());
  }

  /**
   * La ficha del cliente para este evento.
   *
   * El portal la busca por número, así que se manda la parte numérica del id: es
   * lo que permite comprobar de un clic que lo capturado aquí es exactamente lo
   * que el visitante ve allá, que es la única prueba real de que el apartado
   * está haciendo su trabajo.
   */
  portalUrl(): string {
    const numero = (this.event().id.match(/\d+/) || ['1'])[0];
    return `http://localhost:4200/events/firma-prensa?id=${numero}`;
  }

  toNumber(value: string): number {
    return Number(value) || 0;
  }

  asType(value: string): PressEventType {
    return value === 'Rueda de Prensa' ? 'Rueda de Prensa' : 'Firma de Autógrafos';
  }

  videoKind(url: string): 'local' | 'youtube' {
    return /youtube|youtu\.be/i.test(url) ? 'youtube' : 'local';
  }

  suggestSlug(s: EventLineupSlot): string {
    return slugify(s.groupName);
  }

  onIntervene(task: ResolvedTask): void {
    this.patch.emit(markIntervention(this.event(), task, this.session.actor()));
  }

  /**
   * Guarda un campo de la ficha pública.
   *
   * Se fusiona con la ficha actual porque es un objeto anidado: un parche que
   * solo trae la frase de portada borraría de un plumazo la fotografía oficial,
   * los videos y las reglas al asignarse encima.
   */
  saveProfile(ref: string, label: string, changes: Partial<EventPublicProfile>): void {
    const actual = this.event().publicProfile || emptyPublicProfile();
    this.mandatory.save(ref, label, {
      publicProfile: { ...actual, ...changes }
    } as Partial<PressEventItem>);
  }

  // ─── Reglas ─────────────────────────────────────────────────────────────────

  addRule(): void {
    const nueva: EventRule = { id: `r-${Date.now().toString(36)}`, text: '' };
    this.saveProfile('reglas_fans', 'Lineamientos', { rules: [...this.rules(), nueva] });
  }

  patchRule(id: string, text: string): void {
    this.saveProfile('reglas_fans', 'Lineamientos', {
      rules: this.rules().map(r => (r.id === id ? { ...r, text } : r))
    });
  }

  removeRule(id: string): void {
    this.saveProfile('reglas_fans', 'Lineamientos', { rules: this.rules().filter(r => r.id !== id) });
  }

  // ─── Videos ─────────────────────────────────────────────────────────────────

  addVideo(): void {
    this.saveProfile('videos_prensa', 'Videos de invitación', {
      greetingVideos: [...this.videos(), {
        id: `gv-${Date.now().toString(36)}`,
        bandName: this.event().groupName,
        title: 'Invitación oficial',
        url: '',
        type: 'local' as const
      }]
    });
  }

  patchVideo(id: string, changes: Partial<{ title: string; bandName: string; url: string; type: 'local' | 'youtube' }>): void {
    this.saveProfile('videos_prensa', 'Videos de invitación', {
      greetingVideos: this.videos().map(v => (v.id === id ? { ...v, ...changes } : v))
    });
  }

  removeVideo(id: string): void {
    this.saveProfile('videos_prensa', 'Videos de invitación', {
      greetingVideos: this.videos().filter(v => v.id !== id)
    });
  }

  // ─── Grupos ─────────────────────────────────────────────────────────────────

  /**
   * Si este actor puede escribir directo en la ficha del grupo.
   *
   * La de un grupo ajeno vive en el expediente de su disquera, así que lo que se
   * escriba aquí sobre él va por el camino de las propuestas. Sin esta
   * comprobación, cualquiera reescribiría el género y la calificación de un grupo
   * que no es suyo y su dueño no se enteraría.
   */
  canEditSlot(s: EventLineupSlot): boolean {
    if (!this.canEditLineup()) return false;
    return !s.isExternal || s.managerName === this.session.actor().managerName;
  }

  addGroup(g: GroupItem): void {
    // El grupo es "de otro encargado" cuando su líder no es quien arma el evento,
    // igual que en el cartel de Eventos. De ahí sale que su ficha pública sea un
    // punto obligatorio a nombre de su disquera y no de la nuestra.
    const owner = this.event().ownerManagerName || this.event().createdBy;
    const propio = g.groupLeaderName === owner;

    const slot: EventLineupSlot = {
      id: `sl-${Date.now().toString(36)}`,
      groupId: g.id,
      groupName: g.name,
      imageUrl: g.image || '',
      genre: g.genre || '',
      rating: g.rating || 0,
      profileSlug: slugify(g.name),
      isExternal: !propio,
      engagementKind: propio ? 'propio' : 'coorganizacion',
      managerName: g.groupLeaderName,
      managerEmail: g.groupLeaderEmail,
      managerPhone: g.groupLeaderPhone,
      order: this.slots().length + 1,
      isHeadliner: this.slots().length === 0,
      costItems: [],
      approval: propio ? 'No Requiere' : 'Sin Enviar'
    };

    this.addOpen.set(false);
    this.patch.emit({
      lineup: [...this.slots(), slot],
      groupName: this.slots().length === 0 ? g.name : this.event().groupName
    });
  }

  patchSlot(id: string, changes: Partial<EventLineupSlot>): void {
    this.mandatory.save('grupos_prensa', 'Ficha pública del grupo', {
      lineup: this.slots().map(s => (s.id === id ? { ...s, ...changes } : s))
    } as Partial<PressEventItem>);
  }

  removeSlot(id: string): void {
    this.patch.emit({ lineup: this.slots().filter(s => s.id !== id) });
  }
}
