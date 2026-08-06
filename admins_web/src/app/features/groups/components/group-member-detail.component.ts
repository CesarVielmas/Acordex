import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupMember, MemberVideo, SocialLinks, MemberStatus } from '../group-profile.model';
import { EditableFieldComponent } from '../../../shared/ui/editable-field/editable-field.component';
import { MultiTagSelectComponent } from '../../../shared/ui/multi-tag-select/multi-tag-select.component';
import { ImageSuggestionPickerComponent } from '../../../shared/ui/image-suggestion-picker/image-suggestion-picker.component';
import { INSTRUMENT_TAG_OPTIONS, SOCIAL_NETWORK_OPTIONS } from '../group-options.constants';

/** Cambio pedido sobre un campo del integrante. */
export interface MemberEdit {
  field: string;
  value: string;
}

type MemberTab = 'general' | 'media' | 'redes';

@Component({
  selector: 'app-group-member-detail',
  standalone: true,
  imports: [
    CommonModule,
    EditableFieldComponent,
    MultiTagSelectComponent,
    ImageSuggestionPickerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-4">

      <!-- Cabecera -->
      <div class="rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-high">
        <div class="relative h-28 group/cover">
          <img [src]="member().coverPhotoUrl || member().photoUrl" alt="" class="w-full h-full object-cover opacity-70" />
          <div class="absolute inset-0 bg-gradient-to-t from-surface-container-high to-transparent"></div>
          
          <button
            type="button"
            (click)="showPicker.set('cover')"
            class="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-primary hover:text-on-primary border border-white/20 text-white text-[10px] font-black backdrop-blur-sm transition-all"
          >
            Cambiar portada
          </button>
        </div>
        
        <div class="px-4 pb-4 -mt-10 relative space-y-1.5 flex items-end justify-between gap-3">
          <div class="relative group/avatar shrink-0">
            <img [src]="member().photoUrl" [alt]="member().name" class="w-20 h-20 rounded-2xl object-cover ring-4 ring-surface-container-high shadow-xl" />
            <button
              type="button"
              (click)="showPicker.set('avatar')"
              class="absolute inset-0 rounded-2xl bg-black/70 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <span class="material-symbols-outlined text-lg">photo_camera</span>
            </button>
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="text-base font-black text-on-surface truncate">{{ member().name }}</h3>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2 py-0.5 rounded-lg bg-primary/15 text-primary border border-primary/30 text-[10px] font-black">{{ member().role }}</span>
              @if (member().instrument) {
                <span class="px-2 py-0.5 rounded-lg bg-surface-container text-outline border border-outline-variant/25 text-[10px] font-bold truncate max-w-[150px]">{{ member().instrument }}</span>
              }
              <span
                class="px-2 py-0.5 rounded-lg text-[10px] font-black border"
                [class]="member().status === 'Baja'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'"
              >{{ member().status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ALTA / BAJA. Queda arriba porque decide si el resto de la ficha
           sigue siendo la de un integrante vigente. -->
      <div
        class="p-3 rounded-2xl border flex items-center justify-between gap-3 flex-wrap"
        [class]="member().status === 'Baja'
          ? 'bg-rose-500/8 border-rose-500/30'
          : 'bg-surface-container border-outline-variant/25'"
      >
        <div class="min-w-0">
          <span class="block text-[10px] font-black uppercase tracking-wider text-outline">Situación en el grupo</span>
          @if (member().status === 'Baja' && member().leftAt) {
            <span class="text-[11px] font-bold text-rose-300">Dado de baja el {{ member().leftAt }}</span>
          } @else {
            <span class="text-[11px] font-bold text-emerald-300">Integrante activo desde {{ member().joinedAt }}</span>
          }
        </div>

        @if (member().status === 'Baja') {
          <button
            type="button"
            (click)="statusChange.emit('Activo')"
            class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white text-[11px] font-black transition-all flex items-center gap-1.5 shrink-0"
          >
            <span class="material-symbols-outlined text-sm">person_add</span> Reingresar al grupo
          </button>
        } @else {
          <button
            type="button"
            (click)="statusChange.emit('Baja')"
            class="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[11px] font-black transition-all flex items-center gap-1.5 shrink-0"
          >
            <span class="material-symbols-outlined text-sm">person_remove</span> Dar de baja
          </button>
        }
      </div>

      <!-- Pestañas -->
      <div class="flex items-center gap-1 p-1 rounded-2xl bg-surface-container-highest/80 border border-outline-variant/30">
        @for (t of tabs; track t.id) {
          <button
            type="button"
            (click)="tab.set(t.id)"
            class="flex-1 py-2 px-2 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-1"
            [class]="tab() === t.id ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-on-surface'"
          >
            <span class="material-symbols-outlined text-xs">{{ t.icon }}</span> {{ t.label }}
          </button>
        }
      </div>

      @if (tab() === 'general') {
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2.5">
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <app-editable-field
                [value]="member().name" label="Nombre"
                (save)="edit.emit({ field: 'name', value: $event })"
              />
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <app-editable-field
                [value]="member().role" label="Puesto / Rol"
                (save)="edit.emit({ field: 'role', value: $event })"
              />
            </div>
          </div>

          <!-- Instrument Multi-Select Tag Picker -->
          @if (member().crewRole === 'Integrante') {
            <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
              <app-multi-tag-select
                label="Instrumentos (Opción múltiple):"
                placeholder="Seleccionar instrumentos..."
                [selectedTags]="selectedInstruments()"
                [availableOptions]="instrumentOptions"
                (tagsChange)="updateInstruments($event)"
              />
            </div>
          }

          <div class="grid grid-cols-2 gap-2.5">
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <app-editable-field
                [value]="member().age" label="Edad" type="number" suffix=" años"
                (save)="edit.emit({ field: 'age', value: $event })"
              />
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <app-editable-field
                [value]="member().hometown" label="Origen"
                (save)="edit.emit({ field: 'hometown', value: $event })"
              />
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <app-editable-field
                [value]="member().experienceYears" label="Trayectoria" type="number" suffix=" años"
                (save)="edit.emit({ field: 'experienceYears', value: $event })"
              />
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <app-editable-field
                [value]="member().joinedAt" label="Ingreso al grupo" type="date"
                valueClass="text-xs font-black text-on-surface font-mono"
                (save)="edit.emit({ field: 'joinedAt', value: $event })"
              />
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-primary/8 border border-primary/25">
            <app-editable-field
              [value]="member().quote" label="Lema de vida" type="textarea" [rows]="2"
              valueClass="text-xs text-on-surface italic leading-relaxed"
              (save)="edit.emit({ field: 'quote', value: $event })"
            />
          </div>

          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20">
            <app-editable-field
              [value]="member().fullBio" label="Biografía & trayectoria musical" type="textarea" [rows]="5"
              valueClass="text-xs text-on-surface/90 leading-relaxed"
              (save)="edit.emit({ field: 'fullBio', value: $event })"
            />
          </div>

          <!-- El salario solo se publica si el grupo lo autorizó. -->
          <div
            class="p-3 rounded-2xl border"
            [class]="member().monthlySalary ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-surface-container border-dashed border-outline-variant/30'"
          >
            <app-editable-field
              [value]="member().monthlySalary"
              label="Promedio salarial mensual"
              hint="opcional; vacío = no autorizado"
              type="number"
              prefix="$"
              placeholder="El grupo no autorizó publicarlo"
              [valueClass]="member().monthlySalary ? 'text-base font-black text-emerald-400' : 'text-[11px] text-outline italic'"
              (save)="edit.emit({ field: 'monthlySalary', value: $event })"
            />
          </div>
        </div>
      }

      @if (tab() === 'media') {
        <div class="space-y-4">
          <!-- FOTOS DE GALERÍA DE INTEGRANTE CON AÑADIR/ELIMINAR -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline">Fotos ({{ member().galleryPhotos.length }})</span>
              <button
                type="button"
                (click)="addMemberPhoto()"
                class="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-on-primary text-[10px] font-black transition-all flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-xs">add_photo_alternate</span> Añadir foto
              </button>
            </div>

            <div class="grid grid-cols-3 gap-2">
              @for (photo of member().galleryPhotos; track photo; let idx = $index) {
                <div class="relative group/photo rounded-xl overflow-hidden border border-outline-variant/25">
                  <img [src]="photo" alt="" class="w-full h-20 object-cover" />
                  <button
                    type="button"
                    (click)="deleteMemberPhoto(idx)"
                    class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover/photo:opacity-100 transition-opacity shadow-md"
                    title="Eliminar foto"
                  >
                    ✕
                  </button>
                </div>
              } @empty {
                <p class="col-span-3 text-[10px] text-outline italic p-2 border border-dashed rounded-xl">Sin fotos registradas.</p>
              }
            </div>
          </div>

          <!-- VIDEOS DE INTEGRANTE CON AÑADIR/ELIMINAR -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline">Videos ({{ member().videos.length }})</span>
              <button
                type="button"
                (click)="addMemberVideo()"
                class="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-on-primary text-[10px] font-black transition-all flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-xs">video_call</span> Añadir video
              </button>
            </div>

            <div class="space-y-2">
              @for (v of member().videos; track v.title; let idx = $index) {
                <div class="flex items-center gap-2 p-2 rounded-xl bg-surface-container border border-outline-variant/20">
                  <div class="relative w-20 h-12 rounded-lg overflow-hidden shrink-0">
                    <img [src]="v.thumbnailUrl" alt="" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span class="material-symbols-outlined text-white text-base">play_circle</span>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-on-surface truncate">{{ v.title }}</p>
                    <p class="text-[10px] text-outline font-mono">{{ v.duration }}</p>
                  </div>
                  <button
                    type="button"
                    (click)="deleteMemberVideo(idx)"
                    class="p-1 rounded-lg hover:bg-rose-500/20 text-outline hover:text-rose-400 transition-colors shrink-0"
                    title="Eliminar video"
                  >
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              } @empty {
                <p class="text-[10px] text-outline italic p-2 border border-dashed rounded-xl">Sin videos registrados.</p>
              }
            </div>
          </div>
        </div>
      }

      @if (tab() === 'redes') {
        <div class="space-y-3">
          <app-multi-tag-select
            label="Redes Sociales del Integrante (Opción múltiple):"
            placeholder="Añadir redes..."
            [selectedTags]="activeSocialKeys()"
            [availableOptions]="socialNetworkOptions"
            (tagsChange)="updateMemberSocials($event)"
          />

          <div class="space-y-2 pt-2 border-t border-outline-variant/20">
            @for (netKey of activeSocialKeys(); track netKey) {
              <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                <app-editable-field
                  [value]="socialValue(netKey)"
                  [label]="getSocialLabel(netKey)"
                  type="url"
                  placeholder="https://..."
                  valueClass="text-[11px] font-bold text-on-surface break-all"
                  (save)="editSocialUrl(netKey, $event)"
                />
              </div>
            }
          </div>
        </div>
      }

      <!-- IMAGE SUGGESTION PICKER POPUP FOR MEMBER -->
      @if (showPicker(); as pickerKind) {
        <app-image-suggestion-picker
          [title]="pickerKind === 'avatar' ? 'Foto de Perfil del Integrante' : 'Foto de Portada del Integrante'"
          [currentUrl]="pickerKind === 'avatar' ? member().photoUrl : (member().coverPhotoUrl || '')"
          [categoryFilter]="pickerKind === 'avatar' ? 'avatar' : 'cover'"
          (selectedUrl)="applyPickedImage(pickerKind, $event)"
          (closed)="showPicker.set(null)"
        />
      }

    </div>
  `
})
export class GroupMemberDetailComponent {
  member = input.required<GroupMember>();
  edit = output<MemberEdit>();
  mediaUpdate = output<{ photos: string[]; videos: MemberVideo[] }>();
  socialsUpdate = output<SocialLinks>();
  /** Alta o baja del integrante; el modal lo asienta en la bitácora. */
  statusChange = output<MemberStatus>();

  tab = signal<MemberTab>('general');
  showPicker = signal<'avatar' | 'cover' | null>(null);

  protected readonly instrumentOptions = INSTRUMENT_TAG_OPTIONS;
  protected readonly socialNetworkOptions = SOCIAL_NETWORK_OPTIONS;

  protected readonly tabs: { id: MemberTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: 'badge' },
    { id: 'media', label: 'Fotos & Videos', icon: 'perm_media' },
    { id: 'redes', label: 'Redes', icon: 'share' }
  ];

  selectedInstruments(): string[] {
    const inst = this.member().instrument;
    if (!inst) return [];
    return inst.split(',').map(s => s.trim()).filter(Boolean);
  }

  updateInstruments(tags: string[]): void {
    this.edit.emit({ field: 'instrument', value: tags.join(', ') });
  }

  activeSocialKeys(): string[] {
    const s = (this.member().socials || {}) as Record<string, string | undefined>;
    return Object.keys(s).filter(k => s[k] !== undefined && s[k] !== null);
  }

  getSocialLabel(key: string): string {
    const found = SOCIAL_NETWORK_OPTIONS.find(opt => opt.id === key);
    return found ? found.label : key;
  }

  socialValue(key: string): string {
    return ((this.member().socials || {}) as Record<string, string | undefined>)[key] ?? '';
  }

  updateMemberSocials(selectedKeys: string[]): void {
    const current = (this.member().socials || {}) as Record<string, string | undefined>;
    const updated: Record<string, string | undefined> = {};
    selectedKeys.forEach(k => {
      updated[k] = current[k] ?? '';
    });
    this.socialsUpdate.emit(updated as SocialLinks);
  }

  editSocialUrl(key: string, url: string): void {
    const updated = { ...(this.member().socials || {}), [key]: url };
    this.socialsUpdate.emit(updated as SocialLinks);
  }

  applyPickedImage(kind: 'avatar' | 'cover', url: string): void {
    if (kind === 'avatar') {
      this.edit.emit({ field: 'photoUrl', value: url });
    } else {
      this.edit.emit({ field: 'coverPhotoUrl', value: url });
    }
  }

  addMemberPhoto(): void {
    const url = prompt('Ingresa la URL de la nueva foto para el integrante:');
    if (url && url.trim()) {
      const photos = [...this.member().galleryPhotos, url.trim()];
      this.mediaUpdate.emit({ photos, videos: this.member().videos });
    }
  }

  deleteMemberPhoto(index: number): void {
    const photos = this.member().galleryPhotos.filter((_, i) => i !== index);
    this.mediaUpdate.emit({ photos, videos: this.member().videos });
  }

  addMemberVideo(): void {
    const title = prompt('Título del video:');
    if (!title || !title.trim()) return;
    const url = prompt('URL del miniatura / thumbnail:') || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600';
    const duration = prompt('Duración (ej. 3:45):') || '3:30';

    const videos = [...this.member().videos, { title: title.trim(), thumbnailUrl: url.trim(), duration: duration.trim() }];
    this.mediaUpdate.emit({ photos: this.member().galleryPhotos, videos });
  }

  deleteMemberVideo(index: number): void {
    const videos = this.member().videos.filter((_, i) => i !== index);
    this.mediaUpdate.emit({ photos: this.member().galleryPhotos, videos });
  }
}
