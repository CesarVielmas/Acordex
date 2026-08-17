import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EventItem,
  EventLineupSlot,
  EventPublicProfile,
  EventRule,
  LineupEngagementKind,
  emptyPublicProfile
} from '../../../../core/models/event.models';
import { GroupItem } from '../../../../core/models/admin.models';
import {
  FanAccessPolicy,
  PhotoPolicy,
  PressEventItem,
  PressEventType
} from '../../../../core/models/press.models';
import { SessionService } from '../../../../core/services/session.service';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { MandatoryTaskTagComponent } from '../../../../shared/ui/mandatory-task-tag/mandatory-task-tag.component';
import { MandatoryFields } from '../../../events/mandatory-fields';
import { markIntervention, ResolvedTask } from '../../../events/event-tasks';
import { slugify } from '../../../events/event-metrics';
import { PressFileDropComponent } from '../press-file-drop.component';
import { GroupPickerComponent } from '../../../../shared/ui/group-picker/group-picker.component';
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
  imports: [
    CommonModule, FormsModule, EditableFieldComponent,
    MandatoryTaskTagComponent, PressFileDropComponent, GroupPickerComponent
  ],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ─── BARRA SUPERIOR: VISTA PREVIA DE CLIENTE ─── -->
      <div class="p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-surface-container-high/95 to-blue-500/5 border border-blue-500/30 flex items-center justify-between gap-4 backdrop-blur-2xl shadow-2xl flex-wrap">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <span class="material-symbols-outlined text-2xl font-bold">newspaper</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-base font-black uppercase tracking-wider text-on-surface truncate">Ficha del evento de prensa</h4>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-widest">
                {{ event().pressType }}
              </span>
            </div>
            <p class="text-xs text-outline font-medium truncate mt-0.5">
              Todo lo que se captura aquí es exactamente lo que el visitante encuentra en el portal
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="togglePreview.emit(!showPreview())"
          [class]="showPreview()
            ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white font-black shadow-[0_0_25px_rgba(59,130,246,0.4)] scale-[1.03] border border-blue-300/60 ring-2 ring-blue-400/30'
            : 'bg-surface-container-high/90 text-on-surface border border-outline-variant/30 hover:border-blue-500/50 hover:bg-surface-bright shadow-lg'"
          class="px-5 py-3 min-h-12 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-2.5 shrink-0"
        >
          <span class="material-symbols-outlined text-xl font-bold">{{ showPreview() ? 'visibility_off' : 'visibility' }}</span>
          <span>{{ showPreview() ? 'Cerrar Vista Previa' : 'Ver Vista Previa de Cliente' }}</span>
        </button>
      </div>

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
            label="Hora de cierre"
            hint="cuándo se cierra el acceso"
            [value]="event().endTime ?? ''"
            placeholder="19:00"
            [readonly]="!canEditIdentity()"
            (save)="mandatory.save('identidad_prensa', 'Hora de cierre', { endTime: $event })"
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

        <!-- Reglas de acceso. Estos tres datos son las dos tarjetas que el portal
             pintaba con el texto escrito a mano en la plantilla: decía siempre
             "Permitido" y "Solo Acreditados", así que una firma donde el grupo no
             quiere fotos se veía idéntica a una donde sí, y una firma para fans se
             anunciaba como si fuera solo para prensa. -->
        <div class="p-4 rounded-2xl bg-black/25 border border-amber-500/20 space-y-3">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">badge</span> Reglas de acceso que ve el visitante
          </span>
          <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
            Son las dos primeras cosas que mira quien decide si va: si puede llevar cámara y si puede entrar sin ser
            prensa. El portal las pinta en tarjetas bajo la descripción.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <app-editable-field
              label="Fotografías"
              type="select"
              [options]="photoOptions"
              [value]="event().photoPolicy ?? ''"
              [readonly]="!canEditPublic()"
              placeholder="Sin definir"
              (save)="mandatory.save('identidad_prensa', 'Política de fotografías', { photoPolicy: asPhoto($event) })"
            />
            <app-editable-field
              label="Acceso de fans"
              type="select"
              [options]="fanOptions"
              [value]="event().fanAccess ?? ''"
              [readonly]="!canEditPublic()"
              placeholder="Sin definir"
              (save)="mandatory.save('identidad_prensa', 'Acceso de fans', { fanAccess: asFan($event) })"
            />
            <app-editable-field
              label="Aforo de fans"
              hint="si no es solo prensa"
              type="number"
              [value]="event().fanCapacity ?? ''"
              [readonly]="!canEditPublic()"
              (save)="mandatory.save('identidad_prensa', 'Aforo de fans', { fanCapacity: toNumber($event) })"
            />
          </div>
        </div>

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
          <button
            type="button"
            (click)="togglePreview.emit(true)"
            class="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/35 hover:bg-sky-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[13px]">visibility</span> Ver cómo queda
          </button>
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
          <div class="p-4 rounded-2xl bg-black/30 border border-violet-500/25 space-y-3.5">
            <app-group-picker
              [groups]="availableGroups()"
              [events]="allEvents()"
              [pressEvents]="allPressEvents()"
              [eventDate]="event().date"
              [excludeId]="event().id"
              [ownerManager]="ownerManager()"
              [usedGroupIds]="usedGroupIds()"
              [proposedTime]="proposedTime()"
              (selectedChange)="pickGroup($event)"
            />

            <!-- Igual que en el cartel de Eventos: cuando el grupo es de otra
                 disquera hay que decir **por qué vía** entra, porque no es lo
                 mismo pagarle una tarifa que invitar a su manager a co-organizar.
                 De quién sea el grupo no se puede deducir cuál de las dos eligió
                 el organizador. -->
            @if (picked(); as g) {
              @if (isExternalGroup(g)) {
                <div class="p-3.5 rounded-2xl bg-sky-500/[0.07] border border-sky-500/25 space-y-2.5">
                  <span class="text-[10px] font-black uppercase tracking-wider text-sky-300">
                    {{ g.name }} es de {{ g.groupLeaderName }} · ¿por qué vía entra?
                  </span>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button type="button" (click)="engagement.set('cotizacion')"
                      class="p-3 rounded-xl border text-left transition-all"
                      [class]="engagement() === 'cotizacion' ? 'bg-sky-500/20 border-sky-400/50' : 'bg-white/5 border-white/12 hover:border-sky-400/50'">
                      <span class="text-[11px] font-black text-on-surface block">Contratación directa</span>
                      <span class="text-[10px] text-outline block leading-snug mt-0.5">
                        Se le paga una tarifa y ahí termina. No entra al expediente ni ve el gasto.
                      </span>
                    </button>
                    <button type="button" (click)="engagement.set('coorganizacion')"
                      class="p-3 rounded-xl border text-left transition-all"
                      [class]="engagement() === 'coorganizacion' ? 'bg-sky-500/20 border-sky-400/50' : 'bg-white/5 border-white/12 hover:border-sky-400/50'">
                      <span class="text-[11px] font-black text-on-surface block">Co-organiza el evento</span>
                      <span class="text-[10px] text-outline block leading-snug mt-0.5">
                        Su manager entra al expediente: se le pueden encargar puntos y comparte el gasto.
                      </span>
                    </button>
                  </div>
                  <p class="text-[10.5px] text-sky-100/80 leading-relaxed">
                    La solicitud sale con la fecha y el horario de este evento, y
                    <strong>{{ g.groupLeaderName }}</strong> la confirma o la rechaza viendo su propia agenda.
                    {{ isDraft()
                      ? 'Como el evento sigue en borrador, sale al mandarlo a revisión: pedirle algo a alguien por un evento que quizá ni se arme quema la relación en cada intento.'
                      : 'Sale ahora mismo.' }}
                  </p>
                </div>
              }

              <div class="flex items-center justify-end gap-2">
                <button type="button" (click)="cancelPick()"
                  class="px-3 py-2 rounded-xl text-[11px] font-bold text-outline hover:text-on-surface transition-colors">Cancelar</button>
                <button type="button" (click)="confirmAddGroup()"
                  class="px-4 py-2 rounded-xl bg-violet-500 text-white text-[11px] font-black hover:bg-violet-400 transition-all flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px]">add</span> Agregar {{ g.name }}
                </button>
              </div>
            }
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
  /** Toda la agenda del panel: de ahí sale si un grupo está libre ese día. */
  readonly allEvents = input<EventItem[]>([]);
  readonly allPressEvents = input<PressEventItem[]>([]);
  readonly canEditIdentity = input<boolean>(false);
  readonly canEditPublic = input<boolean>(false);
  readonly canEditLineup = input<boolean>(false);

  readonly showPreview = input<boolean>(false);

  readonly patch = output<Partial<PressEventItem>>();
  readonly openTasks = output<void>();
  readonly uploadPhoto = output<void>();
  readonly togglePreview = output<boolean>();

  readonly placeholderImage = 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=300&auto=format&fit=crop&q=80';

  readonly typeOptions: EditableOption[] = [
    { value: 'Firma de Autógrafos', label: 'Firma de Autógrafos' },
    { value: 'Rueda de Prensa', label: 'Rueda de Prensa' }
  ];

  readonly photoOptions: EditableOption[] = [
    { value: 'Permitido', label: 'Permitido' },
    { value: 'Sin flash', label: 'Sin flash' },
    { value: 'Solo prensa acreditada', label: 'Solo prensa acreditada' },
    { value: 'No permitido', label: 'No permitido' }
  ];

  readonly fanOptions: EditableOption[] = [
    { value: 'Solo Acreditados', label: 'Solo acreditados' },
    { value: 'Entrada Libre', label: 'Entrada libre' },
    { value: 'Con Boleto del Concierto', label: 'Con boleto del concierto' },
    { value: 'Con Registro Previo', label: 'Con registro previo' }
  ];

  readonly addOpen = signal(false);
  readonly picked = signal<GroupItem | null>(null);
  readonly engagement = signal<LineupEngagementKind>('cotizacion');

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

  toNumber(value: string): number {
    return Number(value) || 0;
  }

  asType(value: string): PressEventType {
    return value === 'Rueda de Prensa' ? 'Rueda de Prensa' : 'Firma de Autógrafos';
  }

  asPhoto(value: string): PhotoPolicy | undefined {
    const validas: PhotoPolicy[] = ['Permitido', 'Sin flash', 'Solo prensa acreditada', 'No permitido'];
    return validas.includes(value as PhotoPolicy) ? (value as PhotoPolicy) : undefined;
  }

  asFan(value: string): FanAccessPolicy | undefined {
    const validas: FanAccessPolicy[] = ['Solo Acreditados', 'Entrada Libre', 'Con Boleto del Concierto', 'Con Registro Previo'];
    return validas.includes(value as FanAccessPolicy) ? (value as FanAccessPolicy) : undefined;
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

  readonly isDraft = computed(() => this.event().state === 'Borrador');

  /**
   * El grupo es "de otra disquera" cuando su líder no es quien arma el evento,
   * igual que en el cartel de Eventos. De ahí sale que su ficha pública y su
   * compromiso sean puntos obligatorios a nombre de su disquera y no de la
   * nuestra.
   */
  isExternalGroup(g: GroupItem): boolean {
    return g.groupLeaderName !== (this.event().ownerManagerName || this.event().createdBy);
  }

  readonly ownerManager = computed(() => this.event().ownerManagerName || this.event().createdBy);
  readonly usedGroupIds = computed(() => this.slots().map(s => s.groupId));

  /** El horario que se le va a proponer al grupo, ya legible. */
  readonly proposedTime = computed(() => {
    const e = this.event();
    if (!e.startTime) return '';
    return e.endTime ? `${e.startTime} – ${e.endTime} hrs` : `${e.startTime} hrs`;
  });

  pickGroup(g: GroupItem | null): void {
    this.picked.set(g);
    if (g) this.engagement.set(this.isExternalGroup(g) ? 'cotizacion' : 'propio');
  }

  cancelPick(): void {
    this.picked.set(null);
    this.addOpen.set(false);
  }

  /**
   * Da de alta el grupo y, si entra co-organizando, invita a su manager.
   *
   * La invitación nace `Sin Enviar` mientras el evento siga en borrador y sale al
   * mandarlo a revisión, igual que en Eventos: pedirle a alguien que co-organice
   * un evento que quizá ni se arme quema la relación en cada intento.
   */
  confirmAddGroup(): void {
    const g = this.picked();
    if (!g) return;

    const externo = this.isExternalGroup(g);
    const via: LineupEngagementKind = externo ? this.engagement() : 'propio';
    const borrador = this.isDraft();

    const slot: EventLineupSlot = {
      id: `sl-${Date.now().toString(36)}`,
      groupId: g.id,
      groupName: g.name,
      imageUrl: g.image || '',
      genre: g.genre || '',
      rating: g.rating || 0,
      profileSlug: slugify(g.name),
      isExternal: externo,
      engagementKind: via,
      managerName: g.groupLeaderName,
      managerEmail: g.groupLeaderEmail,
      managerPhone: g.groupLeaderPhone,
      order: this.slots().length + 1,
      isHeadliner: this.slots().length === 0,
      costItems: [],
      approval: externo ? (borrador ? 'Sin Enviar' : 'Pendiente') : 'No Requiere'
    };

    const cambios: Partial<PressEventItem> = {
      lineup: [...this.slots(), slot],
      groupName: this.slots().length === 0 ? g.name : this.event().groupName
    };

    // La invitación solo se manda una vez por disquera: si ya está dentro por
    // otro grupo, agregar el segundo no vuelve a preguntarle.
    const yaInvitado = (this.event().managerAgreements || []).some(a => a.managerName === g.groupLeaderName);
    if (via === 'coorganizacion' && !yaInvitado) {
      cambios.managerAgreements = [
        ...(this.event().managerAgreements || []),
        {
          id: `ma-${Date.now().toString(36)}`,
          managerName: g.groupLeaderName,
          role: 'coorganizador' as const,
          settlementKind: 'fijo' as const,
          fixedAmount: 0,
          status: borrador ? 'Sin Enviar' as const : 'Pendiente' as const,
          invitedAt: borrador ? undefined : new Date().toISOString().slice(0, 16)
        }
      ];
    }

    this.picked.set(null);
    this.addOpen.set(false);
    this.patch.emit(cambios);
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
