import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PressEventItem } from '../../../core/models/press.models';
import {
  accreditationStats,
  pressLineup,
  pressPublicProfile,
  pressWhenLabel,
  registrationWindow
} from '../press-metrics';
import { isPublicPressState } from '../../../core/models/press-state.meta';

/**
 * Cómo se ve la ficha en el portal del cliente, sin salir del panel.
 *
 * Es la misma página que vive en `clients_web/features/events/firma-prensa`, con
 * su mismo orden y su mismo lenguaje visual: portada, «Acerca de», las tres
 * tarjetas de fecha/fotografías/acceso, los saludos en video, los artistas, los
 * lineamientos, el bloque de acreditaciones, la ubicación y el soporte.
 *
 * Existe porque el enlace que había antes —«abrir la ficha del cliente»— obliga
 * a cambiar de aplicación, y quien captura no va a hacerlo en cada campo. Con la
 * vista al lado, el hueco se ve en el momento en que se produce: una portada que
 * falta se nota porque la portada está gris, no porque un checklist lo diga.
 *
 * Lo que **no** hace es fingir que hay datos. Cada bloque vacío se dibuja vacío y
 * con su aviso, porque el punto de la vista previa es enseñar lo que el visitante
 * va a encontrarse, y un marcador de posición bonito esconde justo eso.
 */
@Component({
  selector: 'app-press-client-preview',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    @if (event(); as e) {
      <div
        (click)="$event.stopPropagation()"
        class="fixed top-4 bottom-4 right-4 z-[999999999] w-[48vw] min-w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl bg-[#121212] border border-blue-500/50 shadow-[0_25px_95px_rgba(0,0,0,0.98)] backdrop-blur-3xl flex flex-col overflow-hidden animate-scale-up select-none"
      >
        <!-- ─── Cabecera del panel ─── -->
        <div class="shrink-0 p-5 bg-surface-container-high/90 border-b border-outline-variant/30 flex items-center justify-between gap-3 backdrop-blur-2xl">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0 shadow-md">
              <span class="material-symbols-outlined text-xl">visibility</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h5 class="text-xs font-black uppercase tracking-wider text-on-surface truncate">Vista Previa de Cliente</h5>
                <span
                  class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                  [class]="isPublic()
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-outline border-white/15'"
                >{{ isPublic() ? 'En Vivo' : 'Aún privado' }}</span>
              </div>
              <span class="text-[10px] text-outline font-mono block truncate mt-0.5">/events/firma-prensa?id={{ portalId() }}</span>
            </div>
          </div>

          <button
            type="button"
            (click)="closed.emit()"
            class="w-10 h-10 rounded-2xl bg-surface-container-highest hover:bg-surface-bright text-outline hover:text-on-surface flex items-center justify-center border border-outline-variant/30 transition-all shadow-md hover:scale-105 active:scale-95"
            title="Cerrar vista previa"
          >
            <span class="material-symbols-outlined text-lg font-bold">close</span>
          </button>
        </div>

        <!-- ─── Cuerpo: la ficha tal cual ─── -->
        <div class="flex-1 overflow-y-auto custom-scrollbar bg-[#121212] text-white p-5 space-y-5">

          <!-- 1. Portada -->
          <div class="relative w-full h-52 rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl">
            @if (profile().coverUrl) {
              <img [src]="profile().coverUrl" [alt]="e.title" class="w-full h-full object-cover brightness-[0.45]" />
            } @else {
              <div class="w-full h-full bg-gradient-to-br from-white/[0.06] to-transparent flex flex-col items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-3xl text-white/25">image</span>
                <span class="text-[10px] text-white/35 font-bold uppercase tracking-wider">Sin fotografía oficial</span>
              </div>
            }
            <div class="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>

            <div class="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end">
              <div class="flex flex-wrap items-center gap-2 mb-2.5">
                @if (isPast()) {
                  <span class="bg-amber-500/25 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md flex items-center gap-1">
                    <span class="material-symbols-outlined text-[11px]">history</span> Evento finalizado
                  </span>
                }
                <span class="bg-blue-500/25 border border-blue-400/40 text-blue-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                  firma / prensa
                </span>
                <span class="bg-white/5 border border-white/10 text-white/80 px-3 py-1 rounded-full text-[9px] font-bold backdrop-blur-md flex items-center gap-1">
                  <span class="material-symbols-outlined text-[11px] text-blue-300">schedule</span>
                  {{ e.startTime || 'Hora pendiente' }}
                </span>
              </div>

              <h1 class="font-['Epilogue'] font-black text-2xl uppercase tracking-wide text-white leading-tight mb-1.5 flex items-center gap-2">
                <span class="line-clamp-2">{{ e.title }}</span>
                <span class="material-symbols-outlined text-lg text-blue-300 opacity-80 shrink-0">open_in_new</span>
              </h1>

              <p class="text-xs text-white/70 font-light leading-relaxed line-clamp-2">
                {{ profile().tagline || e.description || 'Sin frase de portada' }}
              </p>
            </div>
          </div>

          <!-- 2. Acerca del evento + las tres tarjetas -->
          <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-inner">
            <h3 class="font-['Epilogue'] font-bold text-xs text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
              <span class="material-symbols-outlined text-base">info</span>
              Acerca de la Firma & Rueda de Prensa
            </h3>

            @if (profile().about) {
              <p class="text-[11.5px] text-white/60 leading-relaxed font-light">{{ profile().about }}</p>
            } @else {
              <p class="text-[11.5px] text-amber-300/70 italic leading-relaxed">
                Sin descripción. El visitante llega a un bloque vacío justo donde se le explica de qué va el evento.
              </p>
            }

            <div class="grid grid-cols-3 gap-2.5 mt-4">
              <div class="bg-white/5 border border-white/[0.04] p-2.5 rounded-xl flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-400 text-lg shrink-0">calendar_today</span>
                <div class="flex flex-col min-w-0">
                  <span class="text-[8px] text-white/40 uppercase font-medium">Fecha</span>
                  <span class="text-[10px] text-white font-bold truncate">{{ whenLabel() }}</span>
                </div>
              </div>
              <div class="bg-white/5 border border-white/[0.04] p-2.5 rounded-xl flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-400 text-lg shrink-0">photo_camera</span>
                <div class="flex flex-col min-w-0">
                  <span class="text-[8px] text-white/40 uppercase font-medium">Fotografías</span>
                  <span class="text-[10px] font-bold truncate" [class]="e.photoPolicy ? 'text-white' : 'text-amber-300/70 italic'">
                    {{ e.photoPolicy || 'Sin definir' }}
                  </span>
                </div>
              </div>
              <div class="bg-white/5 border border-white/[0.04] p-2.5 rounded-xl flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-400 text-lg shrink-0">perm_identity</span>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-[8px] text-white/40 uppercase font-medium">Acceso Fan</span>
                  <span class="text-[10px] font-bold uppercase tracking-wide truncate"
                    [class]="e.fanAccess ? 'text-white' : 'text-amber-300/70 italic normal-case'">
                    {{ e.fanAccess || 'Sin definir' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Saludos y mensajes de los artistas -->
          <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-inner space-y-4">
            <h3 class="font-['Epilogue'] font-bold text-xs text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
              <span class="material-symbols-outlined text-base">videocam</span>
              Saludos y Mensajes de los Artistas
            </h3>

            @if (videos().length) {
              <div class="grid grid-cols-1 gap-4">
                @for (v of videos(); track v.id) {
                  <div class="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div class="flex flex-col min-w-0">
                      <span class="text-[8px] text-blue-300 uppercase font-bold tracking-wider flex items-center gap-1">
                        <span class="truncate">{{ v.bandName || 'Grupo sin nombre' }}</span>
                        <span class="material-symbols-outlined text-[10px] shrink-0">open_in_new</span>
                      </span>
                      <h4 class="text-[11px] font-bold text-white truncate mt-0.5">{{ v.title || 'Video sin título' }}</h4>
                    </div>
                    <div class="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                      @if (v.url) {
                        <video [src]="v.url" controls preload="metadata" class="w-full h-full object-cover"></video>
                      } @else {
                        <div class="w-full h-full flex items-center justify-center">
                          <span class="text-[10px] text-white/35 italic">Video sin archivo cargado</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-[11px] text-white/35 italic py-3 text-center">
                Sin videos de invitación. El portal deja este apartado vacío.
              </p>
            }
          </div>

          <!-- 4. Artistas en el evento -->
          <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-inner">
            <h3 class="font-['Epilogue'] font-bold text-xs text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
              <span class="material-symbols-outlined text-base">groups</span>
              Artistas en el Evento
            </h3>

            @if (slots().length) {
              <div class="grid grid-cols-1 gap-3">
                @for (b of slots(); track b.id) {
                  <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    @if (b.imageUrl) {
                      <img [src]="b.imageUrl" [alt]="b.groupName" class="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                    } @else {
                      <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                        <span class="material-symbols-outlined text-lg text-white/25">group</span>
                      </div>
                    }
                    <div class="min-w-0 flex-1">
                      <h4 class="text-xs font-bold text-white truncate font-['Epilogue'] flex items-center gap-1.5">
                        <span class="truncate">{{ b.groupName }}</span>
                        <span class="material-symbols-outlined text-[11px] text-blue-300 shrink-0">open_in_new</span>
                      </h4>
                      <p class="text-[10px] mt-0.5" [class]="b.genre ? 'text-white/40 font-light' : 'text-amber-300/70 italic'">
                        {{ b.genre || 'Sin género capturado' }}
                      </p>
                      @if (!b.profileSlug) {
                        <p class="text-[9px] text-amber-300/70 italic mt-0.5">Sin perfil: el enlace del portal no lleva a ningún lado</p>
                      }
                    </div>
                    <div class="flex flex-col items-end shrink-0">
                      <span class="text-[11px] font-black flex items-center gap-0.5"
                        [class]="(b.rating ?? 0) > 0 ? 'text-blue-300' : 'text-amber-300/70'">
                        <span class="material-symbols-outlined text-[11px]">star</span>
                        {{ (b.rating ?? 0) > 0 ? (b.rating | number:'1.1-1') : '—' }}
                      </span>
                      <span class="text-[8px] text-white/30 uppercase mt-0.5">rating</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-[11px] text-amber-300/70 italic py-3 text-center">
                Sin grupos. El portal no tiene a quién enlazar aquí.
              </p>
            }
          </div>

          <!-- 5. Lineamientos -->
          <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-inner">
            <h3 class="font-['Epilogue'] font-bold text-xs text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
              <span class="material-symbols-outlined text-base">gavel</span>
              Lineamientos para Fanáticos
            </h3>
            @if (rules().length) {
              <ul class="flex flex-col gap-2 text-[11px] text-white/50 font-light list-disc list-inside">
                @for (r of rules(); track r.id) {
                  <li>{{ r.text || 'Regla en blanco' }}</li>
                }
              </ul>
            } @else {
              <p class="text-[11px] text-amber-300/70 italic">Sin lineamientos publicados.</p>
            }
          </div>

          <!-- 6. Prensa & Acreditaciones -->
          <div class="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-5 flex flex-col gap-3 text-center shadow-lg">
            <span class="text-[8px] uppercase tracking-widest font-black text-blue-400">Prensa & Acreditaciones</span>

            @if (isPast()) {
              <div class="flex flex-col gap-2 items-center py-1">
                <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <span class="material-symbols-outlined text-xl">event_busy</span>
                </div>
                <span class="text-[9px] uppercase tracking-widest font-black text-amber-400">Trámite cerrado</span>
                <p class="text-[10px] text-white/60 leading-relaxed px-2">
                  El registro de acreditaciones para prensa y creadores se encuentra cerrado.
                </p>
              </div>
            } @else if (windowState() === 'cerrado') {
              <div class="flex flex-col gap-2 items-center py-1">
                <div class="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <span class="material-symbols-outlined text-xl">lock</span>
                </div>
                <span class="text-[9px] uppercase tracking-widest font-black text-rose-300">Registro cerrado</span>
                <p class="text-[10px] text-white/60 leading-relaxed px-2">Ya no se reciben solicitudes nuevas.</p>
              </div>
            } @else {
              <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-0.5 items-center">
                  <span class="text-lg font-black text-white font-['Epilogue'] uppercase tracking-wider">Acreditaciones</span>
                  <span class="text-[9px] text-white/40">Gafetes de Prensa y Creadores</span>
                </div>
                <p class="text-[10px] text-white/50 leading-relaxed px-2">
                  ¿Eres periodista o creador de contenido independiente? Envía tus datos para tramitar tu cobertura oficial.
                </p>
                <div class="w-full py-3 bg-blue-500 text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider">
                  <span class="material-symbols-outlined text-sm">badge</span> Registrar Solicitud
                </div>
                @if (stats().remaining !== null) {
                  <span class="text-[9px] text-white/35">
                    {{ stats().remaining! > 0 ? stats().remaining + ' lugar(es) disponibles' : 'Cupo lleno' }}
                  </span>
                }
              </div>
            }
          </div>

          <!-- 7. Ubicación -->
          <div class="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
            <span class="text-[8px] font-bold text-white/35 uppercase tracking-widest border-b border-white/5 pb-1.5">Ubicación del Recinto</span>
            <h4 class="font-['Epilogue'] font-black text-xs text-white uppercase flex items-center gap-1.5">
              <span class="material-symbols-outlined text-blue-400 text-sm">pin_drop</span>
              {{ e.venue || 'Sin recinto' }}
            </h4>
            <p class="text-[10px] text-white/40 font-light">
              {{ e.venueAddress || 'Sin dirección capturada: el mapa se busca solo con el nombre del recinto.' }}
            </p>
            <div class="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] flex items-center justify-center">
              <div class="flex flex-col items-center gap-1">
                <span class="material-symbols-outlined text-2xl text-blue-400/50">map</span>
                <span class="text-[9px] text-white/35 font-mono px-4 text-center line-clamp-2">
                  {{ mapQuery() || 'Sin texto de búsqueda' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 8. Soporte -->
          <div class="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
            <span class="text-[8px] font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-500/10 pb-1.5">Soporte & Dudas del Evento</span>
            <div class="flex items-center gap-3 mt-1">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
                <span class="material-symbols-outlined text-lg">phone_in_talk</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-[10px] text-white/50 font-light">¿Tienes dudas sobre el acceso?</span>
                <span class="text-xs font-black text-white font-['Epilogue'] mt-0.5"
                  [class]="profile().supportPhone ? '' : 'text-amber-300/70 italic font-normal'">
                  {{ profile().supportPhone || 'Sin teléfono capturado' }}
                </span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center justify-center gap-1.5 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold uppercase tracking-wider"
                [class]="profile().supportPhone ? 'text-white' : 'text-white/25'">
                <span class="material-symbols-outlined text-xs">call</span> Llamar
              </div>
              <div class="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider border"
                [class]="profile().supportWhatsApp
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/25'">
                <span class="material-symbols-outlined text-xs">chat</span> WhatsApp
              </div>
            </div>
          </div>

          @if (missing().length) {
            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px]">report</span>
                Lo que el visitante no va a encontrar
              </span>
              <ul class="text-[10.5px] text-amber-100/80 leading-relaxed list-disc list-inside space-y-0.5">
                @for (m of missing(); track m) { <li>{{ m }}</li> }
              </ul>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class PressClientPreviewComponent {
  readonly event = input.required<PressEventItem>();
  readonly closed = output<void>();

  readonly profile = computed(() => pressPublicProfile(this.event()));
  readonly slots = computed(() => pressLineup(this.event()));
  readonly rules = computed(() => this.profile().rules || []);
  readonly videos = computed(() => this.profile().greetingVideos || []);
  readonly stats = computed(() => accreditationStats(this.event()));
  readonly windowState = computed(() => registrationWindow(this.event()));
  readonly isPublic = computed(() => isPublicPressState(this.event().state));
  readonly isPast = computed(() =>
    this.event().state === 'Realizado' || this.event().state === 'Cerrado');

  readonly mapQuery = computed(() =>
    this.profile().mapsQuery?.trim() || this.event().venueAddress?.trim() || this.event().venue);

  whenLabel(): string {
    return pressWhenLabel(this.event());
  }

  /** El número con el que el portal busca este evento. */
  portalId(): string {
    return (this.event().id.match(/\d+/) || ['1'])[0];
  }

  /**
   * Los huecos, dichos desde el lado del visitante.
   *
   * No repite el checklist: lo traduce a lo que se ve. «Falta `supportWhatsApp`»
   * no le dice nada a nadie; «el botón de WhatsApp no lleva a ningún lado» sí.
   */
  readonly missing = computed<string[]>(() => {
    const e = this.event();
    const p = this.profile();
    const faltan: string[] = [];

    if (!p.coverUrl?.trim()) faltan.push('La portada sale en gris: no hay fotografía oficial.');
    if ((p.about || '').trim().length < 80) faltan.push('El bloque «Acerca de» está vacío o demasiado corto.');
    if (!e.startTime?.trim()) faltan.push('La portada dice «Hora pendiente».');
    if (!e.photoPolicy) faltan.push('La tarjeta de Fotografías no dice si se puede llevar cámara.');
    if (!e.fanAccess) faltan.push('La tarjeta de Acceso Fan no dice quién puede entrar.');
    if (!p.supportPhone?.trim()) faltan.push('El botón de Llamar no tiene número.');
    if (!p.supportWhatsApp?.trim()) faltan.push('El botón de WhatsApp no lleva a ningún lado.');
    if (!this.slots().length) faltan.push('No hay artistas que mostrar en el evento.');
    if (this.slots().some(s => !s.profileSlug?.trim())) faltan.push('Algún grupo no enlaza a su perfil.');
    if (!this.rules().length) faltan.push('Los lineamientos para fanáticos están vacíos.');
    if (!e.venueAddress?.trim() && !p.mapsQuery?.trim()) faltan.push('El mapa se busca solo con el nombre del recinto.');

    return faltan;
  });
}
