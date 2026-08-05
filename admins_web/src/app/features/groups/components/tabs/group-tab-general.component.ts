import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GroupRepresentative } from '../../group-profile.model';
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
  template: `
    <div class="space-y-5 text-xs">

      <!-- IDENTIDAD COMPACTA DE LUJO -->
      <section class="rounded-3xl overflow-hidden border border-primary/30 bg-surface-container-high/95 shadow-xl relative">
        <div class="relative h-28 sm:h-36 group/cover">
          <img [src]="profile().coverUrl" alt="Portada del grupo" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-surface-container-high via-surface-container-high/40 to-transparent"></div>

          <button
            type="button"
            (click)="showPicker.set('cover')"
            class="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-primary hover:text-on-primary border border-white/20 text-white text-[11px] font-black flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md"
          >
            <span class="material-symbols-outlined text-xs">photo_camera</span> Cambiar Portada
          </button>
        </div>

        <div class="px-4 sm:px-6 pb-5 -mt-12 relative flex flex-col sm:flex-row sm:items-end gap-4">
          <div class="relative shrink-0 group/avatar">
            <img
              [src]="profile().avatarUrl"
              [alt]="profile().name"
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-surface-container-high shadow-2xl"
            />
            <button
              type="button"
              (click)="showPicker.set('avatar')"
              class="absolute inset-0 rounded-2xl bg-black/75 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white"
              aria-label="Cambiar foto de perfil"
            >
              <span class="material-symbols-outlined text-2xl">photo_camera</span>
            </button>
          </div>

          <div class="flex-1 min-w-0 space-y-2.5">
            <app-editable-field
              [value]="profile().name"
              label="Nombre del Grupo"
              valueClass="text-lg sm:text-2xl font-black text-on-surface leading-tight tracking-tight break-words font-display-lg"
              (save)="edit.emit({ section: 'root', field: 'name', value: $event })"
            />

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div class="space-y-1">
                <app-custom-select
                  label="Género Principal"
                  [options]="genreSelectOptions"
                  [value]="profile().genre"
                  (valueChange)="edit.emit({ section: 'root', field: 'genre', value: $event })"
                />
              </div>

              <app-editable-field
                [value]="profile().foundedYear"
                label="Año de Fundación"
                type="number"
                [groupThousands]="false"
                (save)="edit.emit({ section: 'root', field: 'foundedYear', value: $event })"
              />

              <app-editable-field
                [value]="profile().originCity"
                label="Ciudad de Origen"
                (save)="edit.emit({ section: 'root', field: 'originCity', value: $event })"
              />
            </div>

            <!-- Secondary Genres Multi-Tag Select -->
            <div class="pt-1">
              <app-multi-tag-select
                label="Géneros Secundarios (Opción Múltiple):"
                placeholder="Seleccionar géneros secundarios..."
                [selectedTags]="profile().secondaryGenres"
                [availableOptions]="genreTagOptions"
                (tagsChange)="updateSecondaryGenres($event)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 2-COLUMN MASTER GRID (OPTIMIZED SPACE) -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        
        <!-- LEFT COLUMN: Tarifa + Contacto + Representantes -->
        <div class="space-y-5">

          <!-- TARIFA BASE SUGERIDA -->
          <app-group-section
            title="Tarifa Base Sugerida"
            icon="payments"
            tone="emerald"
            subtitle="Propuesta del grupo, ajustable al cotizar"
          >
            <div class="space-y-3">
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
                <div class="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/25 shadow-inner">
                  <app-editable-field
                    [value]="profile().baseRate.minimumHours"
                    label="Horas Mínimas"
                    type="number"
                    suffix=" h"
                    valueClass="text-xl font-black text-on-surface font-mono"
                    (save)="edit.emit({ section: 'baseRate', field: 'minimumHours', value: $event })"
                  />
                </div>
                <div class="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/25 shadow-inner">
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
          <app-group-section title="Oficinas & Contacto de Booking" icon="apartment" tone="cyan">
            <div class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <app-editable-field
                  [value]="profile().officeAddress"
                  label="Domicilio de Oficinas"
                  (save)="edit.emit({ section: 'root', field: 'officeAddress', value: $event })"
                />
                <app-editable-field
                  [value]="profile().officeCity"
                  label="Ciudad"
                  (save)="edit.emit({ section: 'root', field: 'officeCity', value: $event })"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div class="p-3 rounded-2xl bg-surface-container border border-emerald-500/25">
                  <app-editable-field
                    [value]="profile().bookingPhone"
                    label="Teléfono de Contratación"
                    type="tel"
                    valueClass="text-sm font-black text-emerald-400 font-mono break-all"
                    (save)="edit.emit({ section: 'root', field: 'bookingPhone', value: $event })"
                  />
                </div>
                <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/25">
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
          </app-group-section>

          <!-- REPRESENTANTES AUTORIZADOS -->
          <app-group-section
            title="Representantes Autorizados"
            icon="handshake"
            tone="primary"
            [subtitle]="profile().representatives.length + ' disquera(s) pueden cotizar a este grupo'"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (rep of profile().representatives; track rep.id) {
                <button
                  type="button"
                  (click)="openRepresentative.emit(rep)"
                  class="text-left p-3.5 rounded-2xl border transition-all hover:border-primary/60 hover:shadow-lg group/rep"
                  [class]="rep.isPrimary ? 'bg-primary/10 border-primary/40' : 'bg-surface-container border-outline-variant/25'"
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
                  <p class="text-[11px] text-outline truncate">{{ rep.contactName }}</p>
                  <div class="flex items-center justify-between gap-2 mt-2">
                    <span class="text-sm font-black text-emerald-400 font-mono">&#36;{{ rep.quotedFee | number:'1.0-0' }}</span>
                    <span class="text-[10px] font-bold text-primary opacity-0 group-hover/rep:opacity-100 transition-opacity flex items-center gap-0.5">
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
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().contract.exclusivity"
                      label="Exclusividad"
                      type="select"
                      [options]="exclusivityOptions"
                      (save)="edit.emit({ section: 'contract', field: 'exclusivity', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().contract.signedAt"
                      label="Firmado"
                      type="date"
                      valueClass="text-xs font-black text-on-surface font-mono"
                      (save)="edit.emit({ section: 'contract', field: 'signedAt', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-amber-500/25">
                    <app-editable-field
                      [value]="profile().contract.expiresAt"
                      label="Vence"
                      type="date"
                      valueClass="text-xs font-black text-amber-300 font-mono"
                      (save)="edit.emit({ section: 'contract', field: 'expiresAt', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-emerald-500/25">
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

                <div class="flex items-center justify-between gap-2 p-3 rounded-2xl bg-surface-container border border-outline-variant/25">
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
            title="Equipo de Audio"
            icon="speaker"
            [tone]="profile().audio.hasOwnEquipment ? 'emerald' : 'amber'"
            [collapsible]="true"
            [initiallyCollapsed]="false"
          >
            <button
              section-actions
              type="button"
              (click)="toggleOwnAudio.emit(!profile().audio.hasOwnEquipment)"
              class="px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all"
              [class]="profile().audio.hasOwnEquipment
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'"
            >
              {{ profile().audio.hasOwnEquipment ? 'Equipo propio' : 'Requiere audio del recinto' }}
            </button>

            <div class="space-y-3">
              @if (profile().audio.hasOwnEquipment) {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().audio.engineerName"
                      label="Ingeniero de Sonido"
                      (save)="edit.emit({ section: 'audio', field: 'engineerName', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().audio.engineerPhone"
                      label="Teléfono del Ingeniero"
                      type="tel"
                      valueClass="text-xs font-bold text-on-surface font-mono"
                      (save)="edit.emit({ section: 'audio', field: 'engineerPhone', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().audio.consoleModel"
                      label="Consola"
                      (save)="edit.emit({ section: 'audio', field: 'consoleModel', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/25">
                    <app-editable-field
                      [value]="profile().audio.speakersSetup"
                      label="Sistema Principal"
                      (save)="edit.emit({ section: 'audio', field: 'speakersSetup', value: $event })"
                    />
                  </div>
                  <div class="p-2.5 rounded-2xl bg-surface-container border border-outline-variant/25 sm:col-span-2">
                    <app-editable-field
                      [value]="profile().audio.monitorsSetup"
                      label="Monitoreo"
                      (save)="edit.emit({ section: 'audio', field: 'monitorsSetup', value: $event })"
                    />
                  </div>
                </div>
              }

              <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/25">
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

          <!-- TRAYECTORIA -->
          <app-group-section title="Trayectoria" icon="timeline" tone="purple">
            <button
              section-actions
              type="button"
              (click)="addMilestone.emit()"
              class="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 text-[10px] font-black transition-all flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-xs">add</span> Añadir Hito
            </button>

            <div class="space-y-4">
              <ol class="relative border-l-2 border-purple-500/30 ml-2 space-y-4">
                @for (m of profile().milestones; track $index) {
                  <li class="pl-4 relative group/m">
                    <span class="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-purple-400 ring-4 ring-surface-container-high"></span>
                    <div class="grid grid-cols-[4.5rem_1fr_auto] gap-2 items-start">
                      <app-editable-field
                        [value]="m.year"
                        valueClass="text-[11px] font-black text-purple-300 font-mono"
                        (save)="editMilestone.emit({ index: $index, field: 'year', value: $event })"
                      />
                      <div class="space-y-0.5 min-w-0">
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
                        class="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20 transition-all"
                        title="Eliminar hito"
                      >
                        <span class="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </li>
                }
              </ol>

              <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/25">
                <app-editable-field
                  [value]="profile().awards.join('\n')"
                  label="Premios y Reconocimientos"
                  hint="uno por línea"
                  type="textarea"
                  [rows]="3"
                  valueClass="text-[11px] text-amber-200 whitespace-pre-line leading-relaxed"
                  (save)="edit.emit({ section: 'root', field: 'awards', value: $event })"
                />
              </div>
            </div>
          </app-group-section>

        </div>

      </div>

      <!-- ACERCA DE + REDES SOCIALES (GRID 2:1) -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="xl:col-span-2">
          <app-group-section title="Acerca del Grupo" icon="info" tone="neutral" subtitle="Se publica en el perfil del cliente">
            <app-editable-field
              [value]="profile().about"
              type="textarea"
              [rows]="5"
              valueClass="text-xs text-on-surface/90 leading-relaxed font-medium"
              placeholder="Describe al grupo para el público..."
              (save)="edit.emit({ section: 'root', field: 'about', value: $event })"
            />
          </app-group-section>
        </div>

        <app-group-section title="Redes Sociales (Opción Múltiple)" icon="share" tone="cyan" subtitle="Selecciona e ingresa los enlaces de las redes activas">
          <div class="space-y-3">
            <app-multi-tag-select
              label="Redes Habilitadas:"
              placeholder="Añadir redes sociales..."
              [selectedTags]="activeSocialKeys()"
              [availableOptions]="socialNetworkOptions"
              (tagsChange)="updateActiveSocials($event)"
            />

            <div class="space-y-2 pt-2 border-t border-outline-variant/20 max-h-56 overflow-y-auto custom-scrollbar p-1">
              @for (netKey of activeSocialKeys(); track netKey) {
                <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                  <app-editable-field
                    [value]="socialValue(netKey)"
                    [label]="getSocialLabel(netKey)"
                    type="url"
                    placeholder="https://..."
                    valueClass="text-[11px] font-bold text-on-surface break-all"
                    (save)="edit.emit({ section: 'socials', field: netKey, value: $event })"
                  />
                </div>
              }
            </div>
          </div>
        </app-group-section>
      </div>

      <!-- IMAGE SUGGESTION PICKER POPUP -->
      @if (showPicker(); as pickerKind) {
        <app-image-suggestion-picker
          [title]="pickerKind === 'avatar' ? 'Cambiar Foto de Perfil' : 'Cambiar Foto de Portada'"
          [currentUrl]="pickerKind === 'avatar' ? profile().avatarUrl : profile().coverUrl"
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

  openRepresentative = output<GroupRepresentative>();
  edit = output<GeneralEdit>();
  editMilestone = output<{ index: number; field: 'year' | 'title' | 'description'; value: string }>();
  addMilestone = output<void>();
  deleteMilestone = output<number>();
  toggleOwnAudio = output<boolean>();
  toggleContract = output<boolean>();
  replaceMedia = output<'cover' | 'avatar' | 'contract'>();

  showPicker = signal<'avatar' | 'cover' | null>(null);

  protected readonly genreSelectOptions = GENRE_SELECT_OPTIONS;
  protected readonly genreTagOptions = GENRE_TAG_OPTIONS;
  protected readonly socialNetworkOptions = SOCIAL_NETWORK_OPTIONS;

  protected readonly exclusivityOptions = [
    { value: 'Exclusivo', label: 'Exclusivo' },
    { value: 'Co-gestionado', label: 'Co-gestionado' },
    { value: 'Independiente', label: 'Independiente' }
  ];

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

  applyPickedImage(kind: 'avatar' | 'cover', url: string): void {
    if (kind === 'avatar') {
      this.edit.emit({ section: 'root', field: 'avatarUrl', value: url });
    } else {
      this.edit.emit({ section: 'root', field: 'coverUrl', value: url });
    }
  }
}
