import { Component, input, output, signal, computed, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GroupItem, Quote } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';
import { buildGroupProfile } from '../group-profile.mock';
import { GroupProfileStore } from '../group-profile.store';
import { GeneralEdit } from './tabs/group-tab-general.component';
import {
  GroupProfile, GroupMember, GroupPost, GroupReview, GroupEventRecord, GroupRepresentative,
  GalleryImage, HighlightVideo, Track, MemberVideo, SocialLinks, MemberStatus,
  averageRating, approvalPercent
} from '../group-profile.model';

import { GroupSideDrawerComponent } from './group-side-drawer.component';
import { GroupMemberDetailComponent, MemberEdit } from './group-member-detail.component';
import { GroupTabGeneralComponent } from './tabs/group-tab-general.component';
import { GroupTabScheduleComponent } from './tabs/group-tab-schedule.component';
import { GroupTabMembersComponent } from './tabs/group-tab-members.component';
import { GroupTabSocialComponent } from './tabs/group-tab-social.component';
import { GroupTabEventsComponent } from './tabs/group-tab-events.component';
import { GroupTabQuotesComponent } from './tabs/group-tab-quotes.component';
import { GroupTabMusicComponent } from './tabs/group-tab-music.component';
import { GroupTabGalleryComponent } from './tabs/group-tab-gallery.component';
import { EditableFieldComponent } from '../../../shared/ui/editable-field/editable-field.component';

type GroupTab = 'general' | 'horarios' | 'integrantes' | 'social' | 'eventos' | 'cotizaciones' | 'musica' | 'galeria';

type DrawerKind =
  | { kind: 'member'; member: GroupMember }
  | { kind: 'representative'; rep: GroupRepresentative }
  | { kind: 'event'; event: GroupEventRecord }
  | { kind: 'post'; post: GroupPost }
  | { kind: 'review'; review: GroupReview }
  | { kind: 'image'; image: GalleryImage }
  | { kind: 'video'; video: HighlightVideo }
  | { kind: 'track'; track: Track };

@Component({
  selector: 'app-group-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    GroupSideDrawerComponent,
    GroupMemberDetailComponent,
    GroupTabGeneralComponent,
    GroupTabScheduleComponent,
    GroupTabMembersComponent,
    GroupTabSocialComponent,
    GroupTabEventsComponent,
    GroupTabQuotesComponent,
    GroupTabMusicComponent,
    GroupTabGalleryComponent,
    EditableFieldComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="group-modal-backdrop fixed inset-0 z-[99999999] backdrop-blur-2xl p-0 sm:p-3 md:p-5 flex items-center justify-center select-none overflow-hidden"
      (click)="onBackdrop($event)"
    >
      <!-- Orbes de ambiente -->
      <div class="group-modal-orb group-modal-orb-purple absolute -top-20 -left-16 w-72 sm:w-96 h-72 sm:h-96 bg-purple-600/25 rounded-full"></div>
      <div class="group-modal-orb group-modal-orb-amber absolute -bottom-20 -right-16 w-72 sm:w-96 h-72 sm:h-96 bg-primary/20 rounded-full"></div>

      <div
        class="group-modal-shell relative w-full h-full sm:h-[min(96vh,1120px)] max-w-[1640px] rounded-none sm:rounded-3xl border-0 sm:border border-primary/50 shadow-[0_25px_90px_rgba(0,0,0,0.9)] bg-[#120f20] flex flex-col overflow-hidden"
        (click)="$event.stopPropagation()"
      >

        <!-- LUXURY HERO BANNER HEADER -->
        <header class="group-modal-header shrink-0 relative overflow-hidden border-b border-primary/20">

          <!-- Portada difuminada como fondo de la cabecera -->
          <div class="absolute inset-0">
            <img [src]="profile().coverUrl" alt="" class="w-full h-full object-cover opacity-25 blur-[2px] scale-110" />
            <div class="absolute inset-0 bg-gradient-to-r from-[#120f20] via-[#120f20]/92 to-[#120f20]/70"></div>
          </div>

          <div class="relative px-4 sm:px-7 pt-4 pb-3 flex items-start justify-between gap-3 sm:gap-4">

            <div class="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              <div class="relative shrink-0">
                <img
                  [src]="profile().avatarUrl"
                  [alt]="profile().name"
                  class="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl object-cover ring-2 sm:ring-4 ring-primary/80 shadow-[0_0_30px_rgba(242,202,80,0.35)]"
                />
                <span class="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black text-amber-300 bg-[#161326] border border-amber-500/50 shadow-md">
                  ★ {{ rating() }}
                </span>
              </div>

              <div class="min-w-0 space-y-1.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-base sm:text-2xl lg:text-3xl font-black text-on-surface tracking-tight font-display-lg break-words">
                    {{ profile().name }}
                  </h2>

                  @if (group().isOnline) {
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> En Línea
                    </span>
                  }
                </div>

                <!-- Métricas como chips -->
                <div class="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] font-black">
                  <span class="px-2 py-0.5 rounded-lg bg-primary/12 text-primary border border-primary/30">{{ profile().genre }}</span>

                  <span class="px-2 py-0.5 rounded-lg bg-surface-container-highest/70 text-on-surface border border-outline-variant/30 inline-flex items-center gap-1 max-w-[11rem]">
                    <span class="material-symbols-outlined text-[11px] text-primary shrink-0">location_on</span>
                    <span class="truncate">{{ profile().originCity }}</span>
                  </span>

                  <span class="px-2 py-0.5 rounded-lg bg-emerald-500/12 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                    <span class="material-symbols-outlined text-[11px] shrink-0">thumb_up</span>
                    {{ approval() }}%
                    <span class="hidden sm:inline font-bold opacity-80">aprobación</span>
                  </span>

                  <span class="px-2 py-0.5 rounded-lg bg-purple-500/12 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
                    <span class="material-symbols-outlined text-[11px] shrink-0">groups</span>
                    {{ profile().members.length }}
                    <span class="hidden sm:inline font-bold opacity-80">integrantes</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- HEADER ACTIONS & CLOSE BUTTON -->
            <div class="flex items-center gap-2 shrink-0">

              <button
                type="button"
                (click)="downloadDossierPdf()"
                class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-on-primary text-[11px] font-black transition-all shadow-md active:scale-95"
                title="Descargar Dossier PDF Oficial"
              >
                <span class="material-symbols-outlined text-sm">picture_as_pdf</span> Dossier PDF
              </button>
              <!-- Vista previa del perfil público, tal como lo verá el cliente -->
              <button
                type="button"
                (click)="openPublicPreview()"
                class="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-primary via-amber-400 to-primary text-on-primary text-[11px] font-black transition-all shadow-[0_0_20px_rgba(242,202,80,0.35)] hover:shadow-[0_0_28px_rgba(242,202,80,0.55)] active:scale-95 shrink-0"
                title="Ver cómo se verá este perfil en el portal del cliente"
              >
                <span class="material-symbols-outlined text-sm">visibility</span>
                <span class="hidden sm:inline">Ver Vista Previa</span>
                <span class="sm:hidden">Vista</span>
              </button>

              <button
                type="button"
                (click)="closed.emit()"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-surface-container-highest/80 hover:bg-rose-500 hover:text-white text-outline transition-all border border-outline-variant/40 shrink-0 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
                aria-label="Cerrar expediente"
              >
                <span class="material-symbols-outlined text-lg sm:text-xl font-bold">close</span>
              </button>
            </div>

          </div>

          <!-- SEGMENTED NAVIGATION TABS BAR -->
          <nav class="relative px-4 sm:px-7 pb-3.5">
            <div class="group-modal-tabs flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#161326]/90 border border-outline-variant/40 shadow-inner">
              @for (t of tabs(); track t.id) {
                <button
                  type="button"
                  (click)="activeTab.set(t.id)"
                  class="group-modal-tab flex-1 min-w-0 py-2 px-2.5 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs transition-all duration-200 flex items-center justify-center gap-1.5 text-center relative"
                  [class]="activeTab() === t.id
                    ? 'bg-gradient-to-r from-primary via-amber-400 to-primary text-on-primary shadow-[0_0_20px_rgba(242,202,80,0.4)] scale-[1.02]'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container-highest/60'"
                >
                  <span class="material-symbols-outlined text-sm shrink-0">{{ t.icon }}</span>
                  <span class="truncate hidden md:inline">{{ t.label }}</span>
                  <span class="truncate inline md:hidden">{{ t.shortLabel }}</span>
                  @if (t.count !== undefined) {
                    <span
                      class="px-1.5 py-0.2 rounded-full text-[9px] font-mono shrink-0"
                      [class]="activeTab() === t.id ? 'bg-on-primary/20 text-on-primary font-black' : 'bg-surface-container-highest text-outline'"
                    >
                      {{ t.count }}
                    </span>
                  }
                </button>
              }
            </div>
          </nav>
        </header>

        <!-- MAIN SCROLLABLE CONTENT BODY -->
        <main class="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-7 relative bg-[#120f20]">
          @switch (activeTab()) {
            @case ('general') {
              <app-group-tab-general
                [profile]="profile()"
                (openRepresentative)="openRepresentativeDrawer($event)"
                (edit)="onGeneralEdit($event)"
                (editMilestone)="store.updateMilestone($event.index, $event.field, $event.value)"
                (addMilestone)="store.addMilestone('2026', 'Nuevo Hito', 'Descripción del hito')"
                (deleteMilestone)="store.deleteMilestone($event)"
                (toggleOwnAudio)="store.toggleOwnAudio($event)"
                (toggleContract)="store.toggleContract($event)"
                (toggleVerified)="store.updateRootField('verified', $event)"
                (replaceMedia)="replaceMedia($event)"
              />
            }
            @case ('horarios') {
              <app-group-tab-schedule
                [profile]="profile()"
                [quotes]="groupQuotes()"
                (navigateTab)="activeTab.set($event)"
              />
            }
            @case ('integrantes') {
              <app-group-tab-members
                [profile]="profile()"
                (openMember)="openMemberDrawer($event)"
              />
            }
            @case ('social') {
              <app-group-tab-social
                [profile]="profile()"
                (openPost)="openPostDrawer($event)"
                (addPost)="store.addPost($event)"
                (editPost)="openPostDrawer($event)"
                (deletePost)="store.deletePost($event.id)"
                (toggleVisibility)="store.togglePostVisibility($event.id)"
                (openReview)="openReviewDrawer($event)"
              />
            }
            @case ('eventos') {
              <app-group-tab-events
                [profile]="profile()"
                (openEvent)="openEventDrawer($event)"
              />
            }
            @case ('cotizaciones') {
              <app-group-tab-quotes
                [quotes]="groupQuotes()"
                (openQuote)="openQuoteDetail.emit($event)"
              />
            }
            @case ('musica') {
              <app-group-tab-music
                [profile]="profile()"
                (openTrack)="openTrackDrawer($event)"
                (addTrack)="store.addTrack($event)"
                (deleteTrack)="store.deleteTrack($event)"
                (addGenre)="handleAddGenre()"
              />
            }
            @case ('galeria') {
              <app-group-tab-gallery
                [profile]="profile()"
                (openImage)="openImageDrawer($event)"
                (openVideo)="openVideoDrawer($event)"
                (addImage)="store.addImage($event)"
                (deleteImage)="store.deleteImage($event)"
                (addVideo)="store.addVideo($event)"
                (deleteVideo)="store.deleteVideo($event)"
              />
            }
          }
        </main>

        <!-- FLOATING SAVE CHANGES BAR -->
        @if (store.dirty()) {
          <footer class="shrink-0 p-3 sm:p-4 bg-[#18152a] border-t border-primary/30 flex items-center justify-between gap-3 shadow-2xl animate-slide-up z-20">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span class="text-xs font-black text-on-surface">Tienes cambios sin guardar en el expediente</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="store.discardChanges()"
                class="px-3.5 py-1.5 rounded-xl bg-surface-container-highest hover:bg-rose-500/20 text-outline hover:text-rose-300 text-xs font-black border border-outline-variant/30 transition-all"
              >
                Descartar
              </button>
              <button
                type="button"
                (click)="store.saveChanges()"
                class="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-sm font-bold">check</span> Guardar Cambios
              </button>
            </div>
          </footer>
        }

        <!-- SIDE DRAWER PANEL -->
        @if (drawer(); as d) {
          <app-group-side-drawer
            [open]="true"
            [title]="drawerTitle()"
            [eyebrow]="drawerEyebrow()"
            (closed)="closeDrawer()"
          >
            @switch (d.kind) {
              @case ('member') {
                <app-group-member-detail
                  [member]="d.member"
                  (edit)="onMemberEdit(d.member.id, $event)"
                  (mediaUpdate)="store.updateMemberMedia(profile().id, d.member.id, $event.photos, $event.videos)"
                  (socialsUpdate)="store.updateMemberSocials(profile().id, d.member.id, $event)"
                />
              }

              @case ('representative') {
                <div class="space-y-4 text-xs">
                  <div class="p-4 rounded-2xl bg-surface-container border border-primary/30 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-black text-sm text-on-surface">{{ d.rep.labelName }}</span>
                      @if (d.rep.isPrimary) {
                        <span class="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-primary text-on-primary">TITULAR</span>
                      }
                    </div>
                    <p class="text-xs text-outline">{{ d.rep.serviceTier }} tier</p>
                  </div>

                  <div class="space-y-2">
                    <app-editable-field
                      [value]="d.rep.contactName"
                      label="Contacto Principal"
                      (save)="store.updateRepresentative(d.rep.id, 'contactName', $event)"
                    />
                    <app-editable-field
                      [value]="d.rep.phone"
                      label="Teléfono"
                      type="tel"
                      (save)="store.updateRepresentative(d.rep.id, 'phone', $event)"
                    />
                    <app-editable-field
                      [value]="d.rep.email"
                      label="Correo Oficial"
                      type="email"
                      (save)="store.updateRepresentative(d.rep.id, 'email', $event)"
                    />
                    <app-editable-field
                      [value]="d.rep.quotedFee"
                      label="Honorario Cotizado"
                      type="number"
                      prefix="$"
                      valueClass="text-base font-black text-emerald-400 font-mono"
                      (save)="store.updateRepresentative(d.rep.id, 'quotedFee', $event)"
                    />
                    <app-editable-field
                      [value]="d.rep.notes"
                      label="Notas Operativas"
                      type="textarea"
                      [rows]="3"
                      (save)="store.updateRepresentative(d.rep.id, 'notes', $event)"
                    />
                  </div>
                </div>
              }

              @case ('event') {
                <div class="space-y-4 text-xs">
                  <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1">
                    <span class="text-[10px] font-black uppercase text-primary font-mono">{{ d.event.type }}</span>
                    <h3 class="text-sm font-black text-on-surface">{{ d.event.title }}</h3>
                    <p class="text-xs text-outline">{{ d.event.venue }} · {{ d.event.city }}</p>
                    <p class="text-xs font-mono text-primary font-bold pt-1">{{ d.event.date }}</p>
                  </div>

                  @if (d.event.capacity) {
                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2">
                      <div class="flex items-center justify-between text-xs font-bold">
                        <span class="text-outline">Ocupación de aforo</span>
                        <span class="text-emerald-400 font-mono">{{ d.event.attendance || 0 | number:'1.0-0' }} / {{ d.event.capacity | number:'1.0-0' }}</span>
                      </div>
                      <div class="h-2.5 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20">
                        <div class="h-full rounded-full bg-gradient-to-r from-primary to-amber-300" [style.width.%]="eventOccupancy(d.event)"></div>
                      </div>
                    </div>
                  }
                </div>
              }

              @case ('post') {
                <div class="space-y-4 text-xs">
                  <!-- EDICIÓN DE INFORMACIÓN DE PUBLICACIÓN -->
                  <div class="p-4 rounded-2xl bg-[#131022] border border-outline-variant/30 space-y-3 shadow-inner">
                    <span class="text-[10px] font-black uppercase tracking-wider text-primary block">Edición de Publicación</span>
                    
                    <app-editable-field
                      [value]="d.post.content"
                      label="Contenido / Texto de la Publicación"
                      type="textarea"
                      [rows]="4"
                      valueClass="text-xs text-on-surface leading-relaxed font-medium"
                      (save)="store.updatePost(d.post.id, { content: $event })"
                    />

                    <app-editable-field
                      [value]="d.post.imageUrl || ''"
                      label="URL de Imagen o Video Adjunto"
                      type="url"
                      placeholder="https://..."
                      valueClass="text-[11px] font-mono text-on-surface break-all"
                      (save)="store.updatePost(d.post.id, { imageUrl: $event || undefined })"
                    />

                    @if (d.post.imageUrl) {
                      <div class="pt-2">
                        <span class="text-[10px] font-bold text-outline block mb-1">Vista Previa de Multimedia:</span>
                        <img [src]="d.post.imageUrl" alt="Media de publicación" class="w-full h-40 object-cover rounded-xl border border-outline-variant/25 shadow-md" />
                      </div>
                    }

                    <div class="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                      <span class="text-[10px] text-outline font-mono">{{ d.post.publishedAt }}</span>
                      
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="store.togglePostVisibility(d.post.id)"
                          class="px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all"
                          [class]="d.post.visibility === 'Publicada' ? 'bg-primary/20 text-primary border-primary/40 hover:bg-primary hover:text-on-primary' : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'"
                        >
                          {{ d.post.visibility === 'Publicada' ? 'Ocultar (Hacer Privada)' : 'Publicar' }}
                        </button>
                        <button
                          type="button"
                          (click)="store.deletePost(d.post.id); closeDrawer()"
                          class="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1"
                        >
                          <span class="material-symbols-outlined text-xs">delete</span> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- COMENTARIOS & MODERACIÓN -->
                  <div class="space-y-2.5 pt-2">
                    <h4 class="text-xs font-black uppercase tracking-wider text-primary">Comentarios & Moderación ({{ d.post.comments.length }})</h4>
                    <ul class="space-y-2">
                      @for (c of d.post.comments; track c.id) {
                        <li class="p-3 rounded-xl bg-[#131022] border border-outline-variant/20 space-y-1">
                          <div class="flex items-center justify-between">
                            <span class="font-black text-xs text-on-surface">{{ c.authorName }}</span>
                            <span class="text-[9px] font-mono text-outline">{{ c.at }}</span>
                          </div>
                          <p class="text-xs text-on-surface/90">{{ c.text }}</p>
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              }

              @case ('review') {
                <div class="space-y-4 text-xs">
                  <div class="p-4 rounded-2xl bg-surface-container border border-amber-500/30 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-black text-sm text-on-surface">{{ d.review.clientName }}</span>
                      <span class="text-amber-300 font-bold">★ {{ d.review.rating }}</span>
                    </div>
                    <p class="text-xs text-outline">{{ d.review.eventName }} · {{ d.review.venue }}</p>
                    <p class="text-xs text-on-surface italic">"{{ d.review.comment }}"</p>
                  </div>
                </div>
              }

              @case ('image') {
                <div class="space-y-4 text-xs">
                  <img [src]="d.image.url" [alt]="d.image.caption" class="w-full h-64 object-cover rounded-2xl border border-outline-variant/30 shadow-lg" />
                  <p class="text-xs font-black text-on-surface">{{ d.image.caption }}</p>
                  <span class="inline-block px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black border border-primary/30">
                    {{ d.image.category }}
                  </span>
                </div>
              }

              @case ('video') {
                <div class="space-y-4 text-xs">
                  <div class="relative h-48 rounded-2xl overflow-hidden border border-outline-variant/30 shadow-lg">
                    <img [src]="d.video.thumbnailUrl" [alt]="d.video.title" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span class="material-symbols-outlined text-5xl text-white">play_circle</span>
                    </div>
                  </div>
                  <h3 class="text-xs font-black text-on-surface">{{ d.video.title }}</h3>
                  <p class="text-[10px] text-outline font-mono">{{ d.video.duration }} · {{ d.video.views }} vistas</p>
                </div>
              }

              @case ('track') {
                <div class="space-y-4 text-xs">
                  <div class="p-4 rounded-2xl bg-[#131022] border border-outline-variant/30 space-y-3.5 shadow-inner">
                    <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <span class="text-[10px] font-black uppercase tracking-wider text-primary">Edición de Canción & Audio</span>
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-black border" [class]="d.track.audioUrl ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'">
                        {{ d.track.audioUrl ? 'Audio Configurado ✓' : 'Sin Archivo de Audio' }}
                      </span>
                    </div>

                    <!-- Título de la Canción -->
                    <app-editable-field
                      [value]="d.track.title"
                      label="Título de la Canción"
                      type="text"
                      valueClass="text-sm font-black text-on-surface font-display-md"
                      (save)="store.updateTrack(d.track.id, { title: $event }); updateDrawerTrack(d.track.id, { title: $event })"
                    />

                    <div class="grid grid-cols-2 gap-3">
                      <!-- Año de Lanzamiento -->
                      <app-editable-field
                        [value]="d.track.releaseYear"
                        label="Año de Lanzamiento"
                        type="text"
                        valueClass="text-xs font-bold text-on-surface font-mono"
                        (save)="store.updateTrack(d.track.id, { releaseYear: $event }); updateDrawerTrack(d.track.id, { releaseYear: $event })"
                      />

                      <!-- Duración -->
                      <app-editable-field
                        [value]="d.track.durationLabel"
                        label="Duración (mm:ss)"
                        type="text"
                        valueClass="text-xs font-bold text-on-surface font-mono"
                        (save)="store.updateTrack(d.track.id, { durationLabel: $event }); updateDrawerTrack(d.track.id, { durationLabel: $event })"
                      />
                    </div>

                    <!-- Género Musical con selector de géneros existentes -->
                    <div class="space-y-2 pt-1 border-t border-outline-variant/20">
                      <label class="text-[10px] font-bold text-outline uppercase tracking-wider block">Mover a un Género Existente</label>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        @for (g of availableGenres(); track g) {
                          <button
                            type="button"
                            (click)="store.updateTrack(d.track.id, { genre: g }); updateDrawerTrack(d.track.id, { genre: g })"
                            class="px-2.5 py-1 rounded-xl text-[10px] font-black border transition-all"
                            [class]="d.track.genre === g ? 'bg-primary text-black border-primary shadow-md font-black' : 'bg-surface-container text-outline border-outline-variant/30 hover:text-white hover:border-primary/40'"
                          >
                            {{ g }}
                          </button>
                        }
                      </div>

                      <app-editable-field
                        [value]="d.track.genre"
                        label="Nombre del Género (Manual / Personalizado)"
                        type="text"
                        valueClass="text-xs font-bold text-primary font-mono"
                        (save)="store.updateTrack(d.track.id, { genre: $event }); updateDrawerTrack(d.track.id, { genre: $event })"
                      />
                    </div>

                    <!-- Archivo de Audio MP3/WAV o URL -->
                    <div class="space-y-2 pt-1 border-t border-outline-variant/20">
                      <label class="text-[10px] font-bold text-outline uppercase tracking-wider block">Archivo de Audio de la Canción</label>
                      
                      <div class="flex items-center gap-2">
                        <label class="flex-1 cursor-pointer p-2.5 rounded-xl bg-primary/20 hover:bg-primary hover:text-on-primary border border-primary/40 text-primary transition-all flex items-center justify-center gap-2 font-bold text-xs shadow-sm active:scale-95">
                          <span class="material-symbols-outlined text-base">upload_file</span>
                          <span>{{ d.track.audioUrl ? 'Reemplazar Archivo MP3' : 'Subir Canción / Audio' }}</span>
                          <input type="file" accept="audio/*" class="hidden" (change)="handleAudioFileUpload($event, d.track.id)" />
                        </label>
                      </div>

                      <app-editable-field
                        [value]="d.track.audioUrl || ''"
                        label="O Enlace Directo (URL MP3)"
                        type="url"
                        placeholder="https://..."
                        valueClass="text-[11px] font-mono text-on-surface break-all"
                        (save)="store.updateTrack(d.track.id, { audioUrl: $event }); updateDrawerTrack(d.track.id, { audioUrl: $event })"
                      />

                      @if (d.track.audioUrl) {
                        <div class="pt-2">
                          <span class="text-[10px] font-bold text-outline block mb-1">Reproductor de Verificación:</span>
                          <audio [src]="d.track.audioUrl" controls class="w-full h-8 rounded-lg border border-outline-variant/30"></audio>
                        </div>
                      }
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                      <button
                        type="button"
                        (click)="store.updateTrack(d.track.id, { isPopular: !d.track.isPopular }); updateDrawerTrack(d.track.id, { isPopular: !d.track.isPopular })"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all"
                        [class]="d.track.isPopular ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-surface-container text-outline border-outline-variant/30'"
                      >
                        {{ d.track.isPopular ? '★ En Ranking Destacado' : '☆ Marcar Destacada' }}
                      </button>

                      <button
                        type="button"
                        (click)="store.deleteTrack(d.track.id); closeDrawer()"
                        class="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1"
                      >
                        <span class="material-symbols-outlined text-xs">delete</span> Eliminar
                      </button>
                    </div>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-surface-container border border-emerald-500/30 space-y-2">
                    <div class="flex items-center justify-between text-xs font-bold">
                      <span class="text-outline">Aprobación del público</span>
                      <span class="text-emerald-400 font-mono">{{ d.track.approval }}%</span>
                    </div>
                    <div class="h-2 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20">
                      <div class="h-full rounded-full bg-emerald-400" [style.width.%]="d.track.approval"></div>
                    </div>
                  </div>
                </div>
              }
            }
          </app-group-side-drawer>
        }

      </div>
    </div>

    <!-- CENTRALIZED POPUP MODALS AT SHELL ROOT LEVEL -->
    @if (store.activeModal() === 'post') {
      <div class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="store.closeModal()">
        <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-xl">post_add</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-on-surface font-display-md tracking-tight">NUEVA PUBLICACIÓN DEL GRUPO</h3>
                <p class="text-[11px] text-outline font-bold">Publica noticias, comunicados o lanzamientos en el muro oficial</p>
              </div>
            </div>
            <button type="button" (click)="store.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Mensaje / Contenido de la Publicación</label>
              <textarea
                [value]="store.newPostContent()"
                (input)="store.newPostContent.set($any($event.target).value)"
                rows="4"
                placeholder="¡Estamos emocionados de anunciar nuestras próximas fechas en palenques y estadios..."
                class="w-full px-4 py-3 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
              ></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Imagen o Multimedia Adjunta</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [value]="store.newPostImageUrl()"
                  (input)="store.newPostImageUrl.set($any($event.target).value)"
                  placeholder="https://..."
                  class="flex-1 px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
                <label class="px-3.5 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0">
                  <span class="material-symbols-outlined text-sm">upload_file</span> Subir Imagen
                  <input type="file" accept="image/*" class="hidden" (change)="handlePostFileSelect($event)" />
                </label>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Estado de Visibilidad</label>
              <select
                [value]="store.newPostVisibility()"
                (change)="store.newPostVisibility.set($any($event.target).value)"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              >
                <option value="Publicada">Publicada (Público)</option>
                <option value="Borrador">Borrador (Solo Interno)</option>
                <option value="Archivada">Archivada</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" (click)="store.closeModal()" class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all">Cancelar</button>
            <button type="button" (click)="store.submitNewPost()" class="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95">Publicar Ahora</button>
          </div>
        </div>
      </div>
    }

    @if (store.activeModal() === 'member') {
      <div class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="store.closeModal()">
        <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-xl">person_add</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-on-surface font-display-md tracking-tight">AÑADIR INTEGRANTE O STAFF</h3>
                <p class="text-[11px] text-outline font-bold">Alta de músicos, producción o staff en la nómina del grupo</p>
              </div>
            </div>
            <button type="button" (click)="store.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Tipo de Personal</label>
              <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#131022] border border-outline-variant/30">
                <button
                  type="button"
                  (click)="store.newMemberCrewRole.set('Integrante')"
                  class="py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                  [class]="store.newMemberCrewRole() === 'Integrante' ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-on-surface'"
                >
                  <span class="material-symbols-outlined text-sm">queue_music</span> Alineación Artística
                </button>
                <button
                  type="button"
                  (click)="store.newMemberCrewRole.set('Staff')"
                  class="py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2"
                  [class]="store.newMemberCrewRole() === 'Staff' ? 'bg-cyan-500 text-black shadow-md' : 'text-outline hover:text-on-surface'"
                >
                  <span class="material-symbols-outlined text-sm">engineering</span> Staff de Apoyo
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Nombre Completo</label>
              <input
                type="text"
                [value]="store.newMemberName()"
                (input)="store.newMemberName.set($any($event.target).value)"
                placeholder="Ej. Juan Carlos Treviño"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>

            @if (store.newMemberCrewRole() === 'Integrante') {
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Instrumento / Rol Musical</label>
                <select
                  [value]="store.selectedInstrumentOption()"
                  (change)="store.selectedInstrumentOption.set($any($event.target).value); store.newMemberRole.set($any($event.target).value); store.newMemberInstrument.set($any($event.target).value)"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                >
                  @for (inst of presetInstruments; track inst) {
                    <option [value]="inst">{{ inst }}</option>
                  }
                </select>
                @if (store.selectedInstrumentOption() === 'Otro / Personalizado') {
                  <input
                    type="text"
                    [value]="store.customInstrumentText()"
                    (input)="store.customInstrumentText.set($any($event.target).value)"
                    placeholder="Escribe el nuevo instrumento..."
                    class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-amber-500/50 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner mt-2"
                  />
                }
              </div>
            } @else {
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Cargo de Staff de Apoyo</label>
                <select
                  [value]="store.selectedStaffOption()"
                  (change)="store.selectedStaffOption.set($any($event.target).value); store.newMemberRole.set($any($event.target).value)"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                >
                  @for (st of presetStaffRoles; track st) {
                    <option [value]="st">{{ st }}</option>
                  }
                </select>
                @if (store.selectedStaffOption() === 'Otro Cargo') {
                  <input
                    type="text"
                    [value]="store.customStaffText()"
                    (input)="store.customStaffText.set($any($event.target).value)"
                    placeholder="Escribe el nuevo cargo..."
                    class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-cyan-500/50 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner mt-2"
                  />
                }
              </div>
            }

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Edad</label>
                <input
                  type="number"
                  [value]="store.newMemberAge()"
                  (input)="store.newMemberAge.set(+$any($event.target).value)"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Ciudad de Origen</label>
                <input
                  type="text"
                  [value]="store.newMemberHometown()"
                  (input)="store.newMemberHometown.set($any($event.target).value)"
                  placeholder="Monterrey, N.L."
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Fotografía del Integrante</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [value]="store.newMemberPhotoUrl()"
                  (input)="store.newMemberPhotoUrl.set($any($event.target).value)"
                  placeholder="https://..."
                  class="flex-1 px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
                <label class="px-3.5 py-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0">
                  <span class="material-symbols-outlined text-sm">upload</span> Foto
                  <input type="file" accept="image/*" class="hidden" (change)="handleMemberFileSelect($event)" />
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" (click)="store.closeModal()" class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all">Cancelar</button>
            <button type="button" (click)="store.submitNewMember()" class="px-5 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95">Guardar Integrante</button>
          </div>
        </div>
      </div>
    }

    @if (store.activeModal() === 'genre') {
      <div class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="store.closeModal()">
        <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-xl">style</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-on-surface font-display-md tracking-tight">NUEVO GÉNERO / ESTILO MUSICAL</h3>
                <p class="text-[11px] text-outline font-bold">Crea una nueva categoría en el repertorio oficial</p>
              </div>
            </div>
            <button type="button" (click)="store.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Nombre del Género Musical</label>
              <input
                type="text"
                [value]="store.newGenreName()"
                (input)="store.newGenreName.set($any($event.target).value)"
                placeholder="Ej. Cumbia Norteña, Huapango, Zapateado..."
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Título de la Canción Inicial del Género</label>
              <input
                type="text"
                [value]="store.newGenreTrackTitle()"
                (input)="store.newGenreTrackTitle.set($any($event.target).value)"
                placeholder="Ej. El Rey del Huapango (En Vivo)"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Audio MP3 / Demo de la Canción</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [value]="store.newGenreTrackAudioUrl()"
                  (input)="store.newGenreTrackAudioUrl.set($any($event.target).value)"
                  placeholder="https://.../audio.mp3"
                  class="flex-1 px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
                <label class="px-3.5 py-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500 hover:text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0">
                  <span class="material-symbols-outlined text-sm">audio_file</span> Subir MP3
                  <input type="file" accept="audio/*" class="hidden" (change)="handleGenreAudioFileSelect($event)" />
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" (click)="store.closeModal()" class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all">Cancelar</button>
            <button type="button" (click)="store.submitNewGenre()" class="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-400 to-purple-500 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95">Crear Género Musical</button>
          </div>
        </div>
      </div>
    }

    @if (store.activeModal() === 'track') {
      <div class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="store.closeModal()">
        <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-xl">library_music</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-on-surface font-display-md tracking-tight">FICHA DE CANCIÓN (NUEVA CANCIÓN)</h3>
                <p class="text-[11px] text-outline font-bold">Registra un nuevo tema en los géneros existentes del grupo</p>
              </div>
            </div>
            <button type="button" (click)="store.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Género Musical de la Canción</label>
              <select
                [value]="store.newTrackGenre()"
                (change)="store.newTrackGenre.set($any($event.target).value)"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              >
                @for (g of availableGenres(); track g) {
                  <option [value]="g">{{ g }}</option>
                }
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Título de la Canción</label>
              <input
                type="text"
                [value]="store.newTrackTitle()"
                (input)="store.newTrackTitle.set($any($event.target).value)"
                placeholder="Ej. El Ausente (Versión Acústica)"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Año de Lanzamiento</label>
                <input
                  type="text"
                  [value]="store.newTrackYear()"
                  (input)="store.newTrackYear.set($any($event.target).value)"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner font-mono"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Duración (mm:ss)</label>
                <input
                  type="text"
                  [value]="store.newTrackDuration()"
                  (input)="store.newTrackDuration.set($any($event.target).value)"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner font-mono"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Audio de la Canción (MP3 / Demo)</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [value]="store.newTrackAudioUrl()"
                  (input)="store.newTrackAudioUrl.set($any($event.target).value)"
                  placeholder="https://.../cancion.mp3"
                  class="flex-1 px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner font-mono"
                />
                <label class="px-3.5 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0">
                  <span class="material-symbols-outlined text-sm">audio_file</span> Subir Audio
                  <input type="file" accept="audio/*" class="hidden" (change)="handleTrackAudioFileSelect($event)" />
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" (click)="store.closeModal()" class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all">Cancelar</button>
            <button type="button" (click)="store.submitNewTrack()" class="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95">Añadir Canción</button>
          </div>
        </div>
      </div>
    }

    @if (store.activeModal() === 'image') {
      <div class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="store.closeModal()">
        <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-xl">add_photo_alternate</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-on-surface font-display-md tracking-tight">AÑADIR FOTO A LA GALERÍA</h3>
                <p class="text-[11px] text-outline font-bold">Agrega fotografías promocionales o fotogalería de shows</p>
              </div>
            </div>
            <button type="button" (click)="store.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Fotografía</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [value]="store.newImgUrl()"
                  (input)="store.newImgUrl.set($any($event.target).value)"
                  placeholder="https://..."
                  class="flex-1 px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
                <label class="px-3.5 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0">
                  <span class="material-symbols-outlined text-sm">upload</span> Subir Foto
                  <input type="file" accept="image/*" class="hidden" (change)="handleImageFileSelect($event)" />
                </label>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Pie de Foto / Leyenda</label>
              <input
                type="text"
                [value]="store.newImgCaption()"
                (input)="store.newImgCaption.set($any($event.target).value)"
                placeholder="Ej. Sesión oficial de fotos en Domo Care 2026"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Categoría de la Imagen</label>
              <select
                [value]="store.newImgCategory()"
                (change)="store.newImgCategory.set($any($event.target).value)"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              >
                <option value="Promocional">Promocional</option>
                <option value="En Vivo">En Vivo / Conciertos</option>
                <option value="Backstage">Backstage & Camerinos</option>
                <option value="Prensa">Prensa & Medios</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" (click)="store.closeModal()" class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all">Cancelar</button>
            <button type="button" (click)="store.submitNewImage()" class="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95">Añadir Fotografía</button>
          </div>
        </div>
      </div>
    }

    @if (store.activeModal() === 'video') {
      <div class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="store.closeModal()">
        <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-xl">video_call</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-on-surface font-display-md tracking-tight">AÑADIR VIDEO DESTACADO / SHOW</h3>
                <p class="text-[11px] text-outline font-bold">Publica videos musicales, directos o videoclips en el perfil</p>
              </div>
            </div>
            <button type="button" (click)="store.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Título del Video</label>
              <input
                type="text"
                [value]="store.newVidTitle()"
                (input)="store.newVidTitle.set($any($event.target).value)"
                placeholder="Ej. En Vivo desde el Palenque de Monterrey"
                class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Imagen de Miniatura (Thumbnail)</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [value]="store.newVidThumb()"
                  (input)="store.newVidThumb.set($any($event.target).value)"
                  placeholder="https://..."
                  class="flex-1 px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
                <label class="px-3.5 py-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0">
                  <span class="material-symbols-outlined text-sm">upload</span> Subir Thumb
                  <input type="file" accept="image/*" class="hidden" (change)="handleThumbFileSelect($event)" />
                </label>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Duración (mm:ss)</label>
                <input
                  type="text"
                  [value]="store.newVidDuration()"
                  (input)="store.newVidDuration.set($any($event.target).value)"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner font-mono"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Contador de Vistas</label>
                <input
                  type="text"
                  [value]="store.newVidViews()"
                  (input)="store.newVidViews.set($any($event.target).value)"
                  placeholder="1.2k vistas"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner font-mono"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" (click)="store.closeModal()" class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all">Cancelar</button>
            <button type="button" (click)="store.submitNewVideo()" class="px-5 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 text-white font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95">Publicar Video</button>
          </div>
        </div>
      </div>
    }

    @if (store.activeModal() === 'milestone') {
      <div class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="store.closeModal()">
        <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-xl">workspace_premium</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-on-surface font-display-md tracking-tight">AÑADIR HITO HISTÓRICO / LOGRO</h3>
                <p class="text-[11px] text-outline font-bold">Registra premios, discos de oro, giras o hitos en la trayectoria del grupo</p>
              </div>
            </div>
            <button type="button" (click)="store.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="space-y-1.5 col-span-1">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Año del Hito</label>
                <input
                  type="text"
                  [value]="store.newMilestoneYear()"
                  (input)="store.newMilestoneYear.set($any($event.target).value)"
                  placeholder="2026"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner font-mono"
                />
              </div>
              <div class="space-y-1.5 col-span-2">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Título del Hito</label>
                <input
                  type="text"
                  [value]="store.newMilestoneTitle()"
                  (input)="store.newMilestoneTitle.set($any($event.target).value)"
                  placeholder="Ej. Disco de Platino por 100M Streams"
                  class="w-full px-4 py-2.5 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Descripción del Hito</label>
              <textarea
                [value]="store.newMilestoneDesc()"
                (input)="store.newMilestoneDesc.set($any($event.target).value)"
                rows="3"
                placeholder="Detalles sobre el reconocimiento, gira internacional o premio obtenido..."
                class="w-full px-4 py-3 rounded-2xl bg-[#131022] border border-outline-variant/30 text-xs font-bold text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" (click)="store.closeModal()" class="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all">Cancelar</button>
            <button type="button" (click)="store.submitNewMilestone()" class="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95">Añadir Hito</button>
          </div>
        </div>
      </div>
    }
  `
})
export class GroupDetailModalComponent {
  group = input.required<GroupItem>();
  closed = output<void>();
  openQuoteDetail = output<Quote>();

  store = inject(GroupProfileStore);
  private mockData = inject(MockDataService);
  private router = inject(Router);

  activeTab = signal<GroupTab>('general');
  drawer = signal<DrawerKind | null>(null);

  readonly presetInstruments = [
    'Acordeón',
    'Vocalista Principal / Acordeón',
    'Primera Voz',
    'Segunda Voz / Bajo Quinto',
    'Bajo Quinto',
    'Bajo Eléctrico',
    'Batería',
    'Saxofón',
    'Percusiones / Timbales',
    'Teclados / Piano',
    'Animador / Coros',
    'Otro / Personalizado'
  ];

  readonly presetStaffRoles = [
    'Ingeniero de Audio FOH (Sala)',
    'Ingeniero de Monitores',
    'Director Técnico / Stage Manager',
    'Técnico de Acordeones & Instrumentos',
    'Técnico de Iluminación & DMX',
    'Operador de Video & Pantallas LED',
    'Jefe de Seguridad & Logística',
    'Road Manager',
    'Chófer de Producción / Autobús',
    'Otro Cargo'
  ];

  handlePostFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.store.newPostImageUrl.set(URL.createObjectURL(file));
  }

  handleMemberFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.store.newMemberPhotoUrl.set(URL.createObjectURL(file));
  }

  handleGenreAudioFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.store.newGenreTrackAudioUrl.set(URL.createObjectURL(file));
  }

  handleTrackAudioFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.store.newTrackAudioUrl.set(URL.createObjectURL(file));
  }

  handleImageFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.store.newImgUrl.set(URL.createObjectURL(file));
  }

  handleThumbFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.store.newVidThumb.set(URL.createObjectURL(file));
  }

  constructor() {
    effect(() => {
      const g = this.group();
      if (!g) return;
      this.store.ensure(g);
    });
  }

  profile = computed<GroupProfile>(() => {
    const active = this.store.activeProfile();
    if (active) return active;
    const g = this.group();
    return buildGroupProfile(g);
  });

  rating = computed(() => averageRating(this.profile()));
  approval = computed(() => approvalPercent(this.profile()));

  groupQuotes = computed<Quote[]>(() => {
    const name = this.group().name;
    return this.mockData.quotes().filter(q => q.groupName === name);
  });

  availableGenres = computed(() => {
    const set = new Set<string>();
    const p = this.profile();
    if (p.genre) set.add(p.genre);
    if (p.secondaryGenres) p.secondaryGenres.forEach(g => set.add(g));
    if (p.tracks) p.tracks.forEach(t => { if (t.genre) set.add(t.genre); });
    return [...set];
  });

  tabs = computed(() => [
    { id: 'general' as const, label: 'General', shortLabel: 'Gen', icon: 'info' },
    { id: 'horarios' as const, label: 'Horarios & Agenda', shortLabel: 'Horarios', icon: 'calendar_clock' },
    { id: 'integrantes' as const, label: 'Integrantes', shortLabel: 'Integr', icon: 'groups', count: this.profile().members.length },
    { id: 'social' as const, label: 'Publicaciones & Reseñas', shortLabel: 'Social', icon: 'insights', count: this.profile().posts.length },
    { id: 'eventos' as const, label: 'Eventos & Firmas', shortLabel: 'Eventos', icon: 'event', count: this.profile().events.length },
    { id: 'cotizaciones' as const, label: 'Cotizaciones', shortLabel: 'Cotiz', icon: 'request_quote', count: this.groupQuotes().length },
    { id: 'musica' as const, label: 'Música & Repertorio', shortLabel: 'Música', icon: 'music_note', count: this.profile().tracks.length },
    { id: 'galeria' as const, label: 'Galería & Shows', shortLabel: 'Galería', icon: 'photo_library', count: this.profile().gallery.length }
  ]);

  openMemberDrawer(member: GroupMember): void {
    this.drawer.set({ kind: 'member', member });
  }

  openRepresentativeDrawer(rep: GroupRepresentative): void {
    this.drawer.set({ kind: 'representative', rep });
  }

  openEventDrawer(event: GroupEventRecord): void {
    this.drawer.set({ kind: 'event', event });
  }

  openPostDrawer(post: GroupPost): void {
    this.drawer.set({ kind: 'post', post });
  }

  openReviewDrawer(review: GroupReview): void {
    this.drawer.set({ kind: 'review', review });
  }

  openImageDrawer(image: GalleryImage): void {
    this.drawer.set({ kind: 'image', image });
  }

  openVideoDrawer(video: HighlightVideo): void {
    this.drawer.set({ kind: 'video', video });
  }

  openTrackDrawer(track: Track): void {
    this.drawer.set({ kind: 'track', track });
  }

  updateDrawerTrack(trackId: string, changes: Partial<Track>): void {
    const curr = this.drawer();
    if (curr && curr.kind === 'track' && curr.track.id === trackId) {
      this.drawer.set({
        kind: 'track',
        track: { ...curr.track, ...changes }
      });
    }
  }

  handleAudioFileUpload(event: Event, trackId: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const objectUrl = URL.createObjectURL(file);

    const audio = new Audio();
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      const totalSecs = Math.round(audio.duration);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      const durationLabel = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      const changes = { audioUrl: objectUrl, durationLabel };
      this.store.updateTrack(trackId, changes);
      this.updateDrawerTrack(trackId, changes);
    };
  }

  closeDrawer(): void {
    this.drawer.set(null);
  }

  copyPublicLink(): void {
    const url = `http://localhost:4200/grupo/${this.profile().id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(`¡Enlace público copiado al portapapeles!\n\n${url}`);
    });
  }

  downloadDossierPdf(): void {
    alert(`Iniciando descarga del dossier PDF para: ${this.profile().name}`);
  }

  /**
   * Abre la vista previa del perfil público.
   *
   * Cierra el expediente antes de navegar: el modal se monta a nivel de layout
   * y, si siguiera abierto, taparía la vista previa. Los cambios sin guardar no
   * se pierden porque viven en el store, no en el modal.
   */
  openPublicPreview(): void {
    const id = this.group().id;
    this.closed.emit();
    this.router.navigate(['/grupo-preview', id]);
  }

  handleAddGenre(): void {
    const genre = prompt('Nombre del nuevo género (ej. Cumbia, Norteño, Banda):');
    if (!genre || !genre.trim()) return;
    
    // Add an empty track to register the genre
    const newTrack: Track = {
      id: crypto.randomUUID(),
      title: 'Canción Ejemplo',
      genre: genre.trim(),
      releaseYear: String(new Date().getFullYear()),
      durationLabel: '3:00',
      audioUrl: '',
      isPopular: false,
      plays: '0',
      approval: 100
    };
    this.store.addTrack(newTrack);
  }

  onGeneralEdit(e: GeneralEdit): void {
    switch (e.section) {
      case 'root':
        this.store.updateRootField(e.field, e.value);
        break;
      case 'baseRate':
        this.store.updateBaseRate(e.field, e.value);
        break;
      case 'audio':
        this.store.updateAudio(e.field, e.value);
        break;
      case 'contract':
        this.store.updateContract(e.field, e.value);
        break;
      case 'socials':
        this.store.updateSocials(e.field, e.value);
        break;
    }
  }

  onMemberEdit(memberId: string, e: MemberEdit): void {
    this.store.updateMemberField(memberId, e.field, e.value);
  }

  replaceMedia(target: 'cover' | 'avatar' | 'contract'): void {
    alert(`Abre el selector de archivos para reemplazar: ${target}`);
  }

  onBackdrop(event: MouseEvent): void {
    if (this.drawer()) {
      this.drawer.set(null);
      event.stopPropagation();
      return;
    }
    this.closed.emit();
  }

  drawerTitle(): string {
    const d = this.drawer();
    if (!d) return '';
    switch (d.kind) {
      case 'member': return d.member.name;
      case 'representative': return d.rep.labelName;
      case 'event': return d.event.title;
      case 'post': return 'Publicación';
      case 'review': return d.review.clientName;
      case 'image': return d.image.caption;
      case 'video': return d.video.title;
      case 'track': return d.track.title;
    }
  }

  drawerEyebrow(): string {
    const d = this.drawer();
    if (!d) return '';
    switch (d.kind) {
      case 'member': return d.member.crewRole === 'Staff' ? 'Equipo de apoyo' : 'Integrante';
      case 'representative': return d.rep.isPrimary ? 'Disquera titular' : 'Representante autorizado';
      case 'event': return d.event.type;
      case 'post': return 'Comentarios y moderación';
      case 'review': return 'Reseña del público';
      case 'image': return 'Galería';
      case 'video': return 'Show destacado';
      case 'track': return 'Ficha de canción';
    }
  }

  eventOccupancy(e: GroupEventRecord): number {
    if (!e.capacity) return 0;
    return Math.min(100, ((e.attendance || 0) / e.capacity) * 100);
  }

  commentClass(sentiment: string): string {
    switch (sentiment) {
      case 'Positivo': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Negativo': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default: return 'bg-slate-500/25 text-slate-200 border-slate-400/30';
    }
  }
}
