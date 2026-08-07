import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GroupRepresentative, defaultSectionVisibility } from '../../group-profile.model';
import { GroupProfileStore } from '../../group-profile.store';
import { GroupSectionComponent } from '../group-section.component';
import { EditableFieldComponent } from '../../../../shared/ui/editable-field/editable-field.component';
import { CustomSelectComponent } from '../../../../shared/ui/custom-select/custom-select.component';
import { MultiTagSelectComponent } from '../../../../shared/ui/multi-tag-select/multi-tag-select.component';
import { ImageSuggestionPickerComponent } from '../../../../shared/ui/image-suggestion-picker/image-suggestion-picker.component';
import { GENRE_SELECT_OPTIONS, GENRE_TAG_OPTIONS, SOCIAL_NETWORK_OPTIONS } from '../../group-options.constants';

export interface GeneralEdit {
  section: 'root' | 'baseRate' | 'audio' | 'contract' | 'socials';
  field: string;
  value: string;
}

/** Imágenes del perfil que se eligen con el selector de sugerencias. */
type PickerKind = 'avatar' | 'cover' | 'mixVideo';

@Component({
  selector: 'app-group-tab-general',
  standalone: true,
  imports: [
    CommonModule,
    GroupSectionComponent,
    EditableFieldComponent,
    CustomSelectComponent,
    MultiTagSelectComponent,
    ImageSuggestionPickerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `    <div class="space-y-5 text-xs select-none">

      <!-- INFORMACIÓN GENERAL Y GÉNEROS (COMPACTO DE LUJO) -->
      <section class="rounded-2xl p-4 sm:p-5 border border-primary/30 bg-gradient-to-br from-[#18152a]/95 via-[#151226]/95 to-[#0f0c1b]/98 shadow-lg relative space-y-4">
        <header class="flex items-center justify-between gap-3 pb-3 border-b border-primary/20 flex-wrap">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-base font-bold">badge</span>
            </span>
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-primary font-display-md">Información General del Talento</h3>
              <p class="text-[10px] text-outline font-bold">Nombre, género principal, año de fundación y ciudad de origen</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="showPicker.set('avatar')"
              class="px-2.5 py-1 rounded-xl bg-surface-container-highest/80 hover:bg-primary hover:text-on-primary border border-outline-variant/30 text-outline text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <span class="material-symbols-outlined text-xs">photo_camera</span> Cambiar Foto
            </button>
            <button
              type="button"
              (click)="showPicker.set('cover')"
              class="px-2.5 py-1 rounded-xl bg-surface-container-highest/80 hover:bg-primary hover:text-on-primary border border-outline-variant/30 text-outline text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <span class="material-symbols-outlined text-xs">image</span> Cambiar Portada
            </button>
          </div>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <app-editable-field
            [value]="profile().name"
            label="Nombre del Grupo / Talento"
            valueClass="text-sm font-black text-on-surface truncate"
            (save)="edit.emit({ section: 'root', field: 'name', value: $event })"
          />

          <app-custom-select
            label="Género Principal"
            [options]="genreSelectOptions"
            [value]="profile().genre"
            (valueChange)="edit.emit({ section: 'root', field: 'genre', value: $event })"
          />

          <app-editable-field
            [value]="profile().foundedYear"
            label="Año de Fundación"
            type="number"
            [groupThousands]="false"
            valueClass="text-xs font-black text-amber-300 font-mono"
            (save)="edit.emit({ section: 'root', field: 'foundedYear', value: $event })"
          />

          <app-editable-field
            [value]="profile().originCity"
            label="Ciudad de Origen"
            valueClass="text-xs font-black text-on-surface truncate"
            (save)="edit.emit({ section: 'root', field: 'originCity', value: $event })"
          />
        </div>

        <div class="pt-2 border-t border-outline-variant/15">
          <app-multi-tag-select
            label="Géneros Secundarios (Opción Múltiple):"
            placeholder="Seleccionar géneros secundarios..."
            [selectedTags]="profile().secondaryGenres"
            [availableOptions]="genreTagOptions"
            (tagsChange)="updateSecondaryGenres($event)"
          />
        </div>
      </section>

      <!-- MASTER 2-COLUMN GRID (EQUILIBRADO Y SIN ESPACIOS VACÍOS) -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        
        <!-- LEFT COLUMN: Bio + Tarifa + Contacto + Representantes + Redes -->
        <div class="space-y-5">
          
          <!-- ACERCA DEL GRUPO -->
          <section
            class="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#18152a] via-[#151226] to-[#0f0c1b] border transition-all duration-300 relative overflow-hidden space-y-4"
            [class]="vis().showAbout ? 'border-primary/40 shadow-[0_15px_35px_rgba(0,0,0,0.5)]' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_30px_rgba(244,63,94,0.2)] opacity-85'"
          >
            <span class="absolute -right-4 -bottom-8 text-[180px] font-serif font-bold text-primary/5 select-none pointer-events-none leading-none font-display-lg">“</span>

            <header class="flex items-center justify-between gap-3 flex-wrap border-b border-primary/20 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-md">
                  <span class="material-symbols-outlined text-base font-bold">auto_stories</span>
                </span>
                <div>
                  <h3 class="text-xs font-black uppercase tracking-wider text-primary font-display-md">
                    <span>Acerca del Grupo — Biografía Oficial</span>
                  </h3>
                  <p class="text-[10px] text-outline font-bold">Reseña editorial expuesta en el perfil público del cliente</p>
                </div>
              </div>

              <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
                <button
                  type="button"
                  (click)="!vis().showAbout && store.toggleSectionVisibility('showAbout')"
                  class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                  [class]="vis().showAbout ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
                >
                  VISIBLE
                </button>
                <button
                  type="button"
                  (click)="vis().showAbout && store.toggleSectionVisibility('showAbout')"
                  class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                  [class]="!vis().showAbout ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
                >
                  OCULTAR
                </button>
              </div>
            </header>

            <div class="relative p-4 rounded-2xl bg-[#131022]/90 border border-outline-variant/30 shadow-inner space-y-3">
              <app-editable-field
                [value]="profile().about"
                type="textarea"
                [rows]="5"
                valueClass="text-xs text-on-surface/95 leading-relaxed font-medium font-sans tracking-wide whitespace-pre-line"
                placeholder="Escribe la biografía completa del grupo..."
                (save)="edit.emit({ section: 'root', field: 'about', value: $event })"
              />

              <div class="flex items-center justify-between text-[10px] text-outline font-bold pt-2 border-t border-outline-variant/20">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">format_align_left</span> {{ characterCount() }} caracteres
                </span>
                <span class="italic text-primary/80">Haz clic sobre el texto para editar directamente</span>
              </div>
            </div>
          </section>

          <!-- REDES SOCIALES MÚLTIPLES -->
          <app-group-section title="Redes Sociales (Opción Múltiple)" icon="share" tone="cyan" subtitle="Selecciona e ingresa los enlaces de las redes activas">
            <div class="space-y-3">
              <app-multi-tag-select
                label="Redes Habilitadas:"
                placeholder="Añadir redes sociales..."
                [selectedTags]="activeSocialKeys()"
                [availableOptions]="socialNetworkOptions"
                (tagsChange)="updateActiveSocials($event)"
              />

              <div class="space-y-2 pt-2 border-t border-outline-variant/20 max-h-64 overflow-y-auto custom-scrollbar p-1">
                @for (netKey of activeSocialKeys(); track netKey) {
                  <div class="p-2.5 rounded-xl bg-[#131022] border border-outline-variant/20">
                    <app-editable-field
                      [value]="socialValue(netKey)"
                      [label]="getSocialLabel(netKey)"
                      type="url"
                      placeholder="https://..."
                      valueClass="text-[11px] font-bold text-on-surface break-all font-mono"
                      (save)="edit.emit({ section: 'socials', field: netKey, value: $event })"
                    />
                  </div>
                }
              </div>
            </div>
          </app-group-section>

        </div>

        <!-- RIGHT COLUMN: Perfil Público + Video + Métricas -->
        <div class="space-y-5">
          <app-group-section
            title="Perfil Público del Cliente"
            icon="public"
            tone="purple"
            subtitle="Lo que aparece en el portal cuando un cliente busca al grupo"
          >
            <div class="space-y-3">
              <div class="p-3 rounded-2xl bg-surface-container/60 border border-dashed border-outline-variant/30">
                <span class="block text-[10px] font-black uppercase tracking-wider text-outline mb-1.5">
                  Se deduce automáticamente
                </span>
                <div class="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span class="px-2 py-1 rounded-lg bg-surface-container border border-outline-variant/25 text-outline">
                    Etiqueta bajo el nombre = <strong class="text-primary">{{ profile().genre }}</strong>
                  </span>
                  <span class="px-2 py-1 rounded-lg bg-surface-container border border-outline-variant/25 text-outline">
                    Disponibilidad = <strong class="text-emerald-300">estado de agenda</strong>
                  </span>
                  <span class="px-2 py-1 rounded-lg bg-surface-container border border-outline-variant/25 text-outline">
                    Ficha técnica = <strong class="text-on-surface">origen, año, género e integrantes</strong>
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  class="p-3 rounded-2xl bg-surface-container border transition-all duration-300 relative space-y-1.5"
                  [class]="vis().showStatHours ? 'border-emerald-500/25' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] opacity-85'"
                >
                  <div class="flex items-center justify-between gap-1 border-b border-outline-variant/20 pb-1.5 mb-1.5">
                    <span class="text-[10px] font-black uppercase text-outline">Escenario</span>
                    <div class="inline-flex p-0.5 rounded-lg bg-[#131022] border border-white/10 shadow-inner">
                      <button
                        type="button"
                        (click)="!vis().showStatHours && store.toggleSectionVisibility('showStatHours')"
                        class="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider transition-all"
                        [class]="vis().showStatHours ? 'bg-emerald-500 text-black font-black shadow-sm' : 'text-white/50 hover:text-white font-bold'"
                      >
                        VISIBLE
                      </button>
                      <button
                        type="button"
                        (click)="vis().showStatHours && store.toggleSectionVisibility('showStatHours')"
                        class="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider transition-all"
                        [class]="!vis().showStatHours ? 'bg-rose-500 text-white font-black shadow-sm animate-pulse' : 'text-white/50 hover:text-white font-bold'"
                      >
                        OCULTAR
                      </button>
                    </div>
                  </div>

                  <app-editable-field
                    [value]="profile().totalHoursLogged"
                    label="Horas de escenario"
                    type="number"
                    suffix=" hrs"
                    valueClass="text-lg font-black text-emerald-400 font-mono"
                    (save)="edit.emit({ section: 'root', field: 'totalHoursLogged', value: $event })"
                  />
                </div>

                <div
                  class="p-3 rounded-2xl bg-surface-container border transition-all duration-300 relative space-y-1.5"
                  [class]="vis().showSenioritySpec ? 'border-outline-variant/25' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] opacity-85'"
                >
                  <div class="flex items-center justify-between gap-1 border-b border-outline-variant/20 pb-1.5 mb-1.5">
                    <span class="text-[10px] font-black uppercase text-outline">Antigüedad</span>
                    <div class="inline-flex p-0.5 rounded-lg bg-[#131022] border border-white/10 shadow-inner">
                      <button
                        type="button"
                        (click)="!vis().showSenioritySpec && store.toggleSectionVisibility('showSenioritySpec')"
                        class="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider transition-all"
                        [class]="vis().showSenioritySpec ? 'bg-emerald-500 text-black font-black shadow-sm' : 'text-white/50 hover:text-white font-bold'"
                      >
                        VISIBLE
                      </button>
                      <button
                        type="button"
                        (click)="vis().showSenioritySpec && store.toggleSectionVisibility('showSenioritySpec')"
                        class="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider transition-all"
                        [class]="!vis().showSenioritySpec ? 'bg-rose-500 text-white font-black shadow-sm animate-pulse' : 'text-white/50 hover:text-white font-bold'"
                      >
                        OCULTAR
                      </button>
                    </div>
                  </div>

                  <app-editable-field
                    [value]="profile().platformJoinedAt"
                    label="Alta en la plataforma"
                    hint="de aquí sale la antigüedad"
                    type="date"
                    valueClass="text-xs font-black text-on-surface font-mono"
                    (save)="edit.emit({ section: 'root', field: 'platformJoinedAt', value: $event })"
                  />
                </div>
              </div>

              <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/25">
                <app-editable-field
                  [value]="profile().history"
                  label="Historia y Trayectoria"
                  hint="texto largo de la pestaña Trayectoria del portal"
                  type="textarea"
                  [rows]="5"
                  valueClass="text-xs text-on-surface/90 leading-relaxed"
                  placeholder="Cuenta la historia del grupo para el público..."
                  (save)="edit.emit({ section: 'root', field: 'history', value: $event })"
                />
              </div>

              <div
                class="space-y-3 p-4 rounded-2xl bg-surface-container border transition-all duration-300"
                [class]="vis().showPresentationVideo ? 'border-outline-variant/25' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.15)] opacity-85'"
              >
                <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2.5 flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-lg">videocam</span>
                    <h4 class="text-xs font-black uppercase text-on-surface">Video de Presentación</h4>
                  </div>

                  <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
                    <button
                      type="button"
                      (click)="!vis().showPresentationVideo && store.toggleSectionVisibility('showPresentationVideo')"
                      class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                      [class]="vis().showPresentationVideo ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
                    >
                      VISIBLE
                    </button>
                    <button
                      type="button"
                      (click)="vis().showPresentationVideo && store.toggleSectionVisibility('showPresentationVideo')"
                      class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                      [class]="!vis().showPresentationVideo ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
                    >
                      OCULTAR
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="p-3 rounded-xl bg-surface border border-outline-variant/20">
                    <app-editable-field
                      [value]="profile().mixVideoTitle"
                      label="Título del video de presentación"
                      (save)="edit.emit({ section: 'root', field: 'mixVideoTitle', value: $event })"
                    />
                  </div>

                  <div class="p-3 rounded-xl bg-surface border border-outline-variant/20">
                    <app-editable-field
                      [value]="profile().mixVideoUrl || ''"
                      label="Enlace del Video (MP4 / YouTube)"
                      placeholder="https://..."
                      (save)="edit.emit({ section: 'root', field: 'mixVideoUrl', value: $event })"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="file" accept="video/*" #videoFileInput class="hidden" (change)="onVideoFileSelected($event)" />
                  <button
                    type="button"
                    (click)="videoFileInput.click()"
                    class="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all flex items-center justify-between gap-3 text-left group"
                  >
                    <div class="min-w-0">
                      <span class="block text-[10px] font-black uppercase tracking-wider text-primary mb-0.5">Archivo de Video MP4</span>
                      <span class="text-xs text-on-surface font-bold group-hover:text-primary transition-colors">Subir video desde mi dispositivo</span>
                    </div>
                    <span class="material-symbols-outlined text-primary text-xl shrink-0 group-hover:scale-110 transition-transform">upload_file</span>
                  </button>

                  <button
                    type="button"
                    (click)="showPicker.set('mixVideo')"
                    class="p-3 rounded-xl bg-surface border border-outline-variant/20 hover:border-primary/50 transition-all flex items-center justify-between gap-3 text-left"
                  >
                    <div class="min-w-0">
                      <span class="block text-[10px] font-black uppercase tracking-wider text-outline mb-0.5">Portada del video</span>
                      <span class="text-xs text-primary font-bold">Cambiar miniatura</span>
                    </div>
                    <img [src]="profile().mixVideoThumbnailUrl" alt="" class="w-14 h-9 rounded-lg object-cover border border-outline-variant/30 shrink-0" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                (click)="toggleVerified.emit(!profile().verified)"
                class="w-full p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all text-left"
                [class]="profile().verified
                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/60'
                  : 'bg-surface-container border-outline-variant/25 hover:border-outline-variant/50'"
              >
                <div class="min-w-0">
                  <span class="block text-[10px] font-black uppercase tracking-wider text-outline">Insignia de verificado</span>
                  <span class="text-[11px] font-bold" [class]="profile().verified ? 'text-emerald-300' : 'text-outline'">
                    {{ profile().verified ? 'Se muestra como perfil verificado' : 'Sin insignia de verificación' }}
                  </span>
                </div>
                <span
                  class="material-symbols-outlined text-2xl shrink-0"
                  [class]="profile().verified ? 'text-emerald-400' : 'text-outline/50'"
                >{{ profile().verified ? 'verified' : 'gpp_maybe' }}</span>
              </button>
            </div>
          </app-group-section>
        </div>

      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        
        <!-- LEFT COLUMN: Tarifa + Contacto + Representantes -->
        <div class="space-y-5">

          <!-- TARIFA BASE SUGERIDA -->
          <app-group-section
            title="Tarifa Base Sugerida"
            icon="payments"
            tone="emerald"
            subtitle="Propuesta del grupo, ajustable al cotizar"
          >
            <div class="space-y-3.5">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-inner">
                  <app-editable-field
                    [value]="profile().baseRate.suggestedFee"
                    label="Honorario Base"
                    type="number"
                    prefix="$"
                    valueClass="text-xl font-black text-emerald-400 font-mono tracking-tight"
                    (save)="edit.emit({ section: 'baseRate', field: 'suggestedFee', value: $event })"
                  />
                </div>
                <div class="p-3.5 rounded-2xl bg-[#131022] border border-outline-variant/25 shadow-inner">
                  <app-editable-field
                    [value]="profile().baseRate.minimumHours"
                    label="Horas Mínimas"
                    type="number"
                    suffix=" h"
                    valueClass="text-xl font-black text-on-surface font-mono"
                    (save)="edit.emit({ section: 'baseRate', field: 'minimumHours', value: $event })"
                  />
                </div>
                <div class="p-3.5 rounded-2xl bg-[#131022] border border-outline-variant/25 shadow-inner">
                  <app-editable-field
                    [value]="profile().baseRate.extraHourFee"
                    label="Hora Extra"
                    type="number"
                    prefix="$"
                    valueClass="text-xl font-black text-on-surface font-mono"
                    (save)="edit.emit({ section: 'baseRate', field: 'extraHourFee', value: $event })"
                  />
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <app-editable-field
                  [value]="profile().baseRate.notes"
                  label="Nota para el Administrador"
                  type="textarea"
                  [rows]="2"
                  valueClass="text-[11px] text-amber-200/90 leading-relaxed font-medium"
                  (save)="edit.emit({ section: 'baseRate', field: 'notes', value: $event })"
                />
              </div>
            </div>
          </app-group-section>

          <!-- OFICINAS Y CONTACTO -->
          <div
            class="p-5 rounded-3xl bg-surface-container border transition-all duration-300 space-y-4"
            [class]="vis().showDirectBooking ? 'border-outline-variant/25' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
          >
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3 flex-wrap gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">apartment</span>
                </span>
                <div>
                  <h3 class="text-xs font-black uppercase tracking-wider text-on-surface">Oficinas & Contacto de Booking</h3>
                  <p class="text-[10px] text-outline">Información de contratación expuesta al cliente</p>
                </div>
              </div>

              <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
                <button
                  type="button"
                  (click)="!vis().showDirectBooking && store.toggleSectionVisibility('showDirectBooking')"
                  class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                  [class]="vis().showDirectBooking ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
                >
                  VISIBLE
                </button>
                <button
                  type="button"
                  (click)="vis().showDirectBooking && store.toggleSectionVisibility('showDirectBooking')"
                  class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                  [class]="!vis().showDirectBooking ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
                >
                  OCULTAR
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <!-- Sub-bloque Domicilio de Oficinas -->
              <div
                class="p-3 rounded-2xl bg-[#131022] border transition-all duration-300 space-y-2"
                [class]="vis().showOfficeAddress ? 'border-outline-variant/20' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] opacity-85'"
              >
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[10px] font-black uppercase text-outline">Domicilio Físico de Oficinas</span>

                  <div class="inline-flex p-0.5 rounded-lg bg-surface-container border border-white/10 shadow-inner">
                    <button
                      type="button"
                      (click)="!vis().showOfficeAddress && store.toggleSectionVisibility('showOfficeAddress')"
                      class="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider transition-all"
                      [class]="vis().showOfficeAddress ? 'bg-emerald-500 text-black font-black shadow-sm' : 'text-white/50 hover:text-white font-bold'"
                    >
                      VISIBLE
                    </button>
                    <button
                      type="button"
                      (click)="vis().showOfficeAddress && store.toggleSectionVisibility('showOfficeAddress')"
                      class="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider transition-all"
                      [class]="!vis().showOfficeAddress ? 'bg-rose-500 text-white font-black shadow-sm animate-pulse' : 'text-white/50 hover:text-white font-bold'"
                    >
                      OCULTAR
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <app-editable-field
                    [value]="profile().officeAddress"
                    label="Dirección Completa"
                    (save)="edit.emit({ section: 'root', field: 'officeAddress', value: $event })"
                  />
                  <app-editable-field
                    [value]="profile().officeCity"
                    label="Ciudad"
                    (save)="edit.emit({ section: 'root', field: 'officeCity', value: $event })"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div class="p-3 rounded-2xl bg-[#131022] border border-emerald-500/30">
                  <app-editable-field
                    [value]="profile().bookingPhone"
                    label="Teléfono de Contratación"
                    type="tel"
                    valueClass="text-sm font-black text-emerald-400 font-mono break-all"
                    (save)="edit.emit({ section: 'root', field: 'bookingPhone', value: $event })"
                  />
                </div>
                <div class="p-3 rounded-2xl bg-[#131022] border border-outline-variant/25">
                  <app-editable-field
                    [value]="profile().bookingEmail"
                    label="Correo Oficial"
                    type="email"
                    valueClass="text-xs font-bold text-on-surface break-all"
                    (save)="edit.emit({ section: 'root', field: 'bookingEmail', value: $event })"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- REPRESENTANTES AUTORIZADOS -->
          <app-group-section
            title="Representantes Autorizados"
            icon="handshake"
            tone="primary"
            [subtitle]="profile().representatives.length + ' disquera(s) pueden cotizar a este grupo'"
          >
            <div section-actions class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
              <button
                type="button"
                (click)="!vis().showRepresentatives && store.toggleSectionVisibility('showRepresentatives')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="vis().showRepresentatives ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
              >
                VISIBLE
              </button>
              <button
                type="button"
                (click)="vis().showRepresentatives && store.toggleSectionVisibility('showRepresentatives')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="!vis().showRepresentatives ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
              >
                OCULTAR
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (rep of profile().representatives; track rep.id) {
                <button
                  type="button"
                  (click)="openRepresentative.emit(rep)"
                  class="text-left p-3.5 rounded-2xl border transition-all hover:border-primary/60 hover:shadow-lg group/rep"
                  [class]="rep.isPrimary ? 'bg-primary/10 border-primary/40' : 'bg-[#131022] border-outline-variant/25'"
                >
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="font-black text-xs text-on-surface truncate">{{ rep.labelName }}</span>
                    @if (rep.isPrimary) {
                      <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary text-on-primary shrink-0">TITULAR</span>
                    } @else {
                      <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-surface-bright text-outline border border-outline-variant/30 shrink-0">
                        {{ rep.serviceTier }}
                      </span>
                    }
                  </div>
                  <p class="text-[11px] text-outline truncate font-bold">{{ rep.contactName }}</p>
                  <div class="flex items-center justify-between gap-2 mt-2">
                    <span class="text-sm font-black text-emerald-400 font-mono">&#36;{{ rep.quotedFee | number:'1.0-0' }}</span>
                    <span class="text-[10px] font-bold text-primary group-hover/rep:translate-x-1 transition-transform flex items-center gap-0.5">
                      Ver Ficha <span class="material-symbols-outlined text-[11px]">chevron_right</span>
                    </span>
                  </div>
                </button>
              }
            </div>
          </app-group-section>

        </div>

        <!-- RIGHT COLUMN: Contrato + Equipo de Audio + Trayectoria -->
        <div class="space-y-5">

          <!-- CONTRATO CON LA DISQUERA -->
          <app-group-section
            title="Contrato con la Disquera"
            icon="description"
            [tone]="profile().contract.hasContract ? 'purple' : 'amber'"
          >
            <button
              section-actions
              type="button"
              (click)="toggleContract.emit(!profile().contract.hasContract)"
              class="px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all"
              [class]="profile().contract.hasContract
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'"
            >
              {{ profile().contract.hasContract ? 'Con contrato' : 'Sin contrato' }}
            </button>

            @if (profile().contract.hasContract) {
              <div class="space-y-3">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().contract.exclusivity"
                      label="Exclusividad"
                      type="select"
                      [options]="exclusivityOptions"
                      (save)="edit.emit({ section: 'contract', field: 'exclusivity', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().contract.signedAt"
                      label="Firmado"
                      type="date"
                      valueClass="text-xs font-black text-on-surface font-mono"
                      (save)="edit.emit({ section: 'contract', field: 'signedAt', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-amber-500/30">
                    <app-editable-field
                      [value]="profile().contract.expiresAt"
                      label="Vence"
                      type="date"
                      valueClass="text-xs font-black text-amber-300 font-mono"
                      (save)="edit.emit({ section: 'contract', field: 'expiresAt', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-emerald-500/30">
                    <app-editable-field
                      [value]="profile().contract.commissionPercent"
                      label="Comisión"
                      type="number"
                      suffix="%"
                      valueClass="text-sm font-black text-emerald-400 font-mono"
                      (save)="edit.emit({ section: 'contract', field: 'commissionPercent', value: $event })"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#131022] border border-outline-variant/25">
                  <span class="text-[11px] font-mono text-outline truncate">{{ profile().contract.fileName }}</span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" (click)="replaceMedia.emit('contract')" class="px-2.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-primary/20 hover:text-primary text-outline text-[10px] font-black border border-outline-variant/25 transition-all">
                      Reemplazar
                    </button>
                    <button type="button" class="px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[10px] font-black transition-all">
                      Ver PDF
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <span class="font-black flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">gpp_maybe</span> Sin Contrato con esta Disquera
                </span>
                <p class="text-[11px] text-amber-200/80 leading-relaxed font-medium">
                  El grupo puede cotizarse igualmente: está compartido por su disquera titular para gestión.
                </p>
              </div>
            }
          </app-group-section>

          <!-- EQUIPO DE AUDIO (COLLAPSIBLE FOR SPACE SAVING) -->
          <app-group-section
            title="Equipo de Audio (Rider Técnico)"
            icon="speaker"
            [tone]="profile().audio.hasOwnEquipment ? 'emerald' : 'amber'"
            [collapsible]="true"
            [initiallyCollapsed]="false"
          >
            <div section-actions class="flex items-center gap-2">
              <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
                <button
                  type="button"
                  (click)="!vis().showAudioRider && store.toggleSectionVisibility('showAudioRider')"
                  class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                  [class]="vis().showAudioRider ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
                >
                  VISIBLE
                </button>
                <button
                  type="button"
                  (click)="vis().showAudioRider && store.toggleSectionVisibility('showAudioRider')"
                  class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                  [class]="!vis().showAudioRider ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
                >
                  OCULTAR
                </button>
              </div>

              <button
                type="button"
                (click)="toggleOwnAudio.emit(!profile().audio.hasOwnEquipment)"
                class="px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all"
                [class]="profile().audio.hasOwnEquipment
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'"
              >
                {{ profile().audio.hasOwnEquipment ? 'Equipo propio' : 'Requiere audio del recinto' }}
              </button>
            </div>

            <div class="space-y-3">
              @if (profile().audio.hasOwnEquipment) {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().audio.engineerName"
                      label="Ingeniero de Sonido"
                      (save)="edit.emit({ section: 'audio', field: 'engineerName', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().audio.engineerPhone"
                      label="Teléfono del Ingeniero"
                      type="tel"
                      valueClass="text-xs font-bold text-on-surface font-mono"
                      (save)="edit.emit({ section: 'audio', field: 'engineerPhone', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().audio.consoleModel"
                      label="Consola"
                      (save)="edit.emit({ section: 'audio', field: 'consoleModel', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().audio.speakersSetup"
                      label="Sistema Principal"
                      (save)="edit.emit({ section: 'audio', field: 'speakersSetup', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-[#131022] border border-outline-variant/25 sm:col-span-2">
                    <app-editable-field
                      [value]="profile().audio.monitorsSetup"
                      label="Monitoreo"
                      (save)="edit.emit({ section: 'audio', field: 'monitorsSetup', value: $event })"
                    />
                  </div>
                </div>
              }

              <div class="p-3 rounded-2xl bg-[#131022] border border-outline-variant/25">
                <app-editable-field
                  [value]="profile().audio.riderRequirements.join('\n')"
                  label="Rider Técnico Requerido"
                  hint="un requisito por línea"
                  type="textarea"
                  [rows]="4"
                  valueClass="text-[11px] text-on-surface whitespace-pre-line leading-relaxed font-mono"
                  (save)="edit.emit({ section: 'audio', field: 'riderRequirements', value: $event })"
                />
              </div>
            </div>
          </app-group-section>

        </div>

      </div>

      <!-- TRAYECTORIA & RECONOCIMIENTOS (ANCHO COMPLETO 2 COLUMNAS) -->
      <app-group-section title="Trayectoria & Reconocimientos de la Agrupación" icon="timeline" tone="purple">
        <div section-actions class="flex items-center gap-2">
          <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
            <button
              type="button"
              (click)="!vis().showMilestones && store.toggleSectionVisibility('showMilestones')"
              class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              [class]="vis().showMilestones ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
            >
              VISIBLE
            </button>
            <button
              type="button"
              (click)="vis().showMilestones && store.toggleSectionVisibility('showMilestones')"
              class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              [class]="!vis().showMilestones ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
            >
              OCULTAR
            </button>
          </div>

          <button
            type="button"
            (click)="openAddMilestoneModal()"
            class="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 text-[10px] font-black transition-all flex items-center gap-1 active:scale-95 shadow-sm"
          >
            <span class="material-symbols-outlined text-xs">add</span>
            <span>Añadir Hito</span>
          </button>
        </div>

        <!-- MODAL POPUP: AÑADIR HITO A LA TRAYECTORIA -->
        @if (showMilestoneModal()) {
          <div class="fixed inset-0 z-[99999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="showMilestoneModal.set(false)">
            <div class="w-full max-w-lg bg-gradient-to-b from-[#1f1638] via-[#151029] to-[#0c0919] border border-purple-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(168,85,247,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
              <div class="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <header class="flex items-center justify-between border-b border-outline-variant/20 pb-4 relative z-10">
                <div class="flex items-center gap-3">
                  <span class="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <span class="material-symbols-outlined text-xl">timeline</span>
                  </span>
                  <div>
                    <h3 class="text-sm font-black uppercase text-on-surface tracking-wider font-display-md">Añadir Hito a la Trayectoria</h3>
                    <p class="text-[11px] text-outline font-medium">Registra un logro o momento clave en la historia del grupo</p>
                  </div>
                </div>
                <button type="button" (click)="showMilestoneModal.set(false)" class="w-8 h-8 rounded-full bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-all hover:scale-110">✕</button>
              </header>

              <div class="space-y-4 relative z-10">
                <div class="grid grid-cols-3 gap-3">
                  <!-- AÑO -->
                  <div class="space-y-1.5 col-span-1">
                    <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Año</label>
                    <input
                      #msYearInput
                      type="text"
                      [value]="newMilestoneYear()"
                      (input)="newMilestoneYear.set(msYearInput.value)"
                      placeholder="2026"
                      class="w-full bg-[#0c0919] border border-outline-variant/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-mono font-bold"
                    />
                  </div>

                  <!-- TÍTULO -->
                  <div class="space-y-1.5 col-span-2">
                    <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Título del Logro</label>
                    <input
                      #msTitleInput
                      type="text"
                      [value]="newMilestoneTitle()"
                      (input)="newMilestoneTitle.set(msTitleInput.value)"
                      placeholder="Ej. Gira Internacional & Disco de Platino"
                      class="w-full bg-[#0c0919] border border-outline-variant/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <!-- DESCRIPCIÓN -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Descripción Detallada</label>
                  <textarea
                    #msDescInput
                    rows="3"
                    [value]="newMilestoneDesc()"
                    (input)="newMilestoneDesc.set(msDescInput.value)"
                    placeholder="Escribe la reseña histórica de este momento cumbre..."
                    class="w-full bg-[#0c0919] border border-outline-variant/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 rounded-2xl p-4 text-xs text-on-surface outline-none transition-all leading-relaxed font-medium"
                  ></textarea>
                </div>
              </div>

              <footer class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 relative z-10">
                <button
                  type="button"
                  (click)="showMilestoneModal.set(false)"
                  class="px-5 py-2.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  (click)="submitNewMilestone()"
                  [disabled]="!newMilestoneTitle().trim()"
                  class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs hover:scale-105 transition-all shadow-[0_0_25px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:scale-100"
                >
                  Guardar Hito
                </button>
              </footer>
            </div>
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- LISTA DE HITOS HISTÓRICOS (COL SPAN 2) -->
          <div class="lg:col-span-2 space-y-3">
            <span class="text-[10px] font-black uppercase tracking-wider text-purple-300 block">Línea del Tiempo & Logros Clave</span>
            <ol class="relative border-l-2 border-purple-500/30 ml-2 space-y-4">
              @for (m of profile().milestones; track $index) {
                <li class="pl-4 relative group/m">
                  <span class="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-purple-400 ring-4 ring-[#18152a]"></span>
                  <div class="grid grid-cols-[4.5rem_1fr_auto] gap-3 items-start p-3 rounded-2xl bg-[#131022] border border-outline-variant/20 hover:border-purple-500/40 transition-all">
                    <app-editable-field
                      [value]="m.year"
                      valueClass="text-xs font-black text-purple-300 font-mono"
                      (save)="editMilestone.emit({ index: $index, field: 'year', value: $event })"
                    />
                    <div class="space-y-1 min-w-0">
                      <app-editable-field
                        [value]="m.title"
                        valueClass="text-xs font-black text-on-surface"
                        (save)="editMilestone.emit({ index: $index, field: 'title', value: $event })"
                      />
                      <app-editable-field
                        [value]="m.description"
                        type="textarea"
                        [rows]="2"
                        valueClass="text-[11px] text-outline leading-relaxed"
                        (save)="editMilestone.emit({ index: $index, field: 'description', value: $event })"
                      />
                    </div>
                    <button
                      type="button"
                      (click)="deleteMilestone.emit($index)"
                      class="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20 transition-all shadow-sm"
                      title="Eliminar hito"
                    >
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </li>
              }
            </ol>
          </div>

          <!-- PREMIOS Y RECONOCIMIENTOS -->
          <div class="space-y-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Premios & Reconocimientos</span>
            <div class="p-4 rounded-2xl bg-[#131022] border border-amber-500/30 shadow-inner space-y-2">
              <app-editable-field
                [value]="profile().awards.join('\n')"
                label="Lista de Trofeos y Certificaciones"
                hint="uno por línea"
                type="textarea"
                [rows]="6"
                valueClass="text-xs text-amber-200 whitespace-pre-line leading-relaxed font-medium"
                (save)="edit.emit({ section: 'root', field: 'awards', value: $event })"
              />
            </div>
          </div>
        </div>
      </app-group-section>

      <!-- IMAGE SUGGESTION PICKER POPUP -->
      @if (showPicker(); as pickerKind) {
        <app-image-suggestion-picker
          [title]="pickerTitle(pickerKind)"
          [currentUrl]="pickerCurrentUrl(pickerKind)"
          [categoryFilter]="pickerKind === 'avatar' ? 'avatar' : 'cover'"
          (selectedUrl)="applyPickedImage(pickerKind, $event)"
          (closed)="showPicker.set(null)"
        />
      }

    </div>
  `
})
export class GroupTabGeneralComponent {
  profile = input.required<GroupProfile>();

  store = inject(GroupProfileStore);
  vis = computed(() => this.profile().sectionVisibility ?? defaultSectionVisibility());

  openRepresentative = output<GroupRepresentative>();
  edit = output<GeneralEdit>();
  editMilestone = output<{ index: number; field: 'year' | 'title' | 'description'; value: string }>();
  addMilestone = output<void>();
  deleteMilestone = output<number>();
  toggleOwnAudio = output<boolean>();
  toggleContract = output<boolean>();
  toggleVerified = output<boolean>();
  replaceMedia = output<'cover' | 'avatar' | 'contract'>();

  showPicker = signal<PickerKind | null>(null);

  onVideoFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      this.edit.emit({ section: 'root', field: 'mixVideoUrl', value: url });
    }
  }

  protected readonly genreSelectOptions = GENRE_SELECT_OPTIONS;
  protected readonly genreTagOptions = GENRE_TAG_OPTIONS;
  protected readonly socialNetworkOptions = SOCIAL_NETWORK_OPTIONS;

  protected readonly exclusivityOptions = [
    { value: 'Exclusivo', label: 'Exclusivo' },
    { value: 'Co-gestionado', label: 'Co-gestionado' },
    { value: 'Independiente', label: 'Independiente' }
  ];

  // Milestone Modal Signals
  showMilestoneModal = signal<boolean>(false);
  newMilestoneYear = signal<string>('2026');
  newMilestoneTitle = signal<string>('');
  newMilestoneDesc = signal<string>('');

  openAddMilestoneModal(): void {
    this.store.openAddMilestoneModal();
  }

  submitNewMilestone(): void {
    const title = this.newMilestoneTitle().trim();
    if (!title) return;

    this.store.addMilestone(
      this.newMilestoneYear().trim() || String(new Date().getFullYear()),
      title,
      this.newMilestoneDesc().trim() || 'Logro registrado en la trayectoria del grupo.'
    );
    this.showMilestoneModal.set(false);
  }

  characterCount = computed(() => (this.profile().about || '').length);

  readingTime = computed(() => {
    const text = this.profile().about || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 180));
  });

  activeSocialKeys(): string[] {
    const s = this.profile().socials as Record<string, string | undefined>;
    return Object.keys(s).filter(k => s[k] !== undefined && s[k] !== null);
  }

  getSocialLabel(key: string): string {
    const found = SOCIAL_NETWORK_OPTIONS.find(opt => opt.id === key);
    return found ? found.label : key;
  }

  socialValue(key: string): string {
    return (this.profile().socials as Record<string, string | undefined>)[key] ?? '';
  }

  updateSecondaryGenres(genres: string[]): void {
    this.edit.emit({ section: 'root', field: 'secondaryGenres', value: genres.join(', ') });
  }

  updateActiveSocials(selectedKeys: string[]): void {
    const current = { ...(this.profile().socials as Record<string, string | undefined>) };
    SOCIAL_NETWORK_OPTIONS.forEach(opt => {
      if (selectedKeys.includes(opt.id)) {
        this.edit.emit({ section: 'socials', field: opt.id, value: current[opt.id] ?? '' });
      } else {
        this.edit.emit({ section: 'socials', field: opt.id, value: '' });
      }
    });
  }

  /** Campo del perfil que actualiza cada tipo de selector de imagen. */
  private static readonly PICKER_FIELD: Record<PickerKind, string> = {
    avatar: 'avatarUrl',
    cover: 'coverUrl',
    mixVideo: 'mixVideoThumbnailUrl'
  };

  applyPickedImage(kind: PickerKind, url: string): void {
    this.edit.emit({ section: 'root', field: GroupTabGeneralComponent.PICKER_FIELD[kind], value: url });
  }

  pickerTitle(kind: PickerKind): string {
    switch (kind) {
      case 'avatar': return 'Cambiar Foto de Perfil';
      case 'cover': return 'Cambiar Foto de Portada';
      case 'mixVideo': return 'Cambiar Portada del Video de Presentación';
    }
  }

  pickerCurrentUrl(kind: PickerKind): string {
    switch (kind) {
      case 'avatar': return this.profile().avatarUrl;
      case 'cover': return this.profile().coverUrl;
      case 'mixVideo': return this.profile().mixVideoThumbnailUrl;
    }
  }
}
