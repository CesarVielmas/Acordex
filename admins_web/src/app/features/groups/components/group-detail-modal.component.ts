import { Component, input, output, signal, computed, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupItem, Quote } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';
import { buildGroupProfile } from '../group-profile.mock';
import { GroupProfileStore } from '../group-profile.store';
import { GeneralEdit } from './tabs/group-tab-general.component';
import {
  GroupMember, GroupPost, GroupReview, GroupEventRecord, GroupRepresentative,
  GalleryImage, HighlightVideo, Track, MemberVideo, SocialLinks, averageRating, approvalPercent
} from '../group-profile.model';

import { GroupSideDrawerComponent } from './group-side-drawer.component';
import { GroupMemberDetailComponent, MemberEdit } from './group-member-detail.component';
import { GroupTabGeneralComponent } from './tabs/group-tab-general.component';
import { GroupTabMembersComponent } from './tabs/group-tab-members.component';
import { GroupTabSocialComponent } from './tabs/group-tab-social.component';
import { GroupTabEventsComponent } from './tabs/group-tab-events.component';
import { GroupTabQuotesComponent } from './tabs/group-tab-quotes.component';
import { GroupTabMusicComponent } from './tabs/group-tab-music.component';
import { GroupTabGalleryComponent } from './tabs/group-tab-gallery.component';
import { EditableFieldComponent } from '../../../shared/ui/editable-field/editable-field.component';

type GroupTab = 'general' | 'integrantes' | 'social' | 'eventos' | 'cotizaciones' | 'musica' | 'galeria';

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
      class="fixed inset-0 z-[99999999] bg-black/90 backdrop-blur-2xl p-0 sm:p-3 md:p-5 flex items-center justify-center animate-fade-in select-none"
      (click)="onBackdrop($event)"
    >
      <div
        class="relative w-full h-full sm:h-[min(96vh,1120px)] max-w-[1640px] bg-[#120f20] rounded-none sm:rounded-3xl border-0 sm:border border-primary/40 shadow-[0_0_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
        (click)="$event.stopPropagation()"
      >

        <!-- LUXURY HERO BANNER HEADER -->
        <header class="shrink-0 relative overflow-hidden bg-gradient-to-r from-[#17132a] via-[#1c1833] to-[#17132a] border-b border-outline-variant/30">
          
          <!-- Ambient Neon Flares -->
          <div class="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute inset-0">
            <img [src]="profile().coverUrl" alt="" class="w-full h-full object-cover opacity-20 filter blur-sm scale-105" />
            <div class="absolute inset-0 bg-gradient-to-r from-[#120f20] via-[#120f20]/90 to-[#120f20]/75"></div>
          </div>

          <div class="relative px-4 sm:px-7 pt-4 pb-3 flex items-start justify-between gap-4">
            
            <!-- Group Avatar, Name & Live Status -->
            <div class="flex items-center gap-4 min-w-0">
              <div class="relative shrink-0">
                <img
                  [src]="profile().avatarUrl"
                  [alt]="profile().name"
                  class="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover ring-4 ring-primary/80 shadow-[0_0_30px_rgba(242,202,80,0.35)]"
                />
                <span class="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-amber-300 bg-[#161326] border border-amber-500/50 shadow-md">
                  ★ {{ rating() }}
                </span>
              </div>

              <div class="min-w-0 space-y-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h2 class="text-xl sm:text-3xl font-black text-on-surface tracking-tight truncate font-display-lg">
                    {{ profile().name }}
                  </h2>
                  
                  @if (group().isOnline) {
                    <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shrink-0">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> En Línea Ahora
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-outline bg-surface-container-highest border border-outline-variant/30 shrink-0">
                      <span class="material-symbols-outlined text-xs">schedule</span> {{ group().lastConnectionText || 'Offline' }}
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2.5 text-xs font-black flex-wrap">
                  <span class="text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/30">{{ profile().genre }}</span>
                  <span class="text-outline">·</span>
                  <span class="text-on-surface flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs text-primary">location_on</span> {{ profile().originCity }}
                  </span>
                  <span class="text-outline">·</span>
                  <span class="text-emerald-400 font-extrabold flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs text-emerald-400">thumb_up</span> {{ approval() }}% Aprobación Pública
                  </span>
                  <span class="text-outline">·</span>
                  <span class="text-purple-300 font-extrabold flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs text-purple-300">groups</span> {{ profile().members.length }} Integrantes
                  </span>
                </div>
              </div>
            </div>

            <!-- Close Action Button -->
            <button
              type="button"
              (click)="closed.emit()"
              class="w-10 h-10 rounded-2xl bg-surface-container-highest/80 hover:bg-rose-500 hover:text-white text-outline transition-all border border-outline-variant/40 shrink-0 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
              aria-label="Cerrar expediente"
            >
              <span class="material-symbols-outlined text-xl font-bold">close</span>
            </button>

          </div>

          <!-- SEGMENTED NAVIGATION TABS BAR -->
          <nav class="relative px-4 sm:px-7 pb-3.5">
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-[#161326]/90 border border-outline-variant/40 shadow-inner">
              @for (t of tabs(); track t.id) {
                <button
                  type="button"
                  (click)="activeTab.set(t.id)"
                  [attr.aria-pressed]="activeTab() === t.id"
                  class="px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 shrink-0 whitespace-nowrap"
                  [class]="activeTab() === t.id
                    ? 'bg-gradient-to-r from-primary via-amber-400 to-primary text-on-primary shadow-[0_0_20px_rgba(242,202,80,0.4)] scale-[1.02]'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container-highest/60'"
                >
                  <span class="material-symbols-outlined text-sm font-bold">{{ t.icon }}</span>
                  {{ t.label }}
                  @if (t.count !== null) {
                    <span
                      class="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black"
                      [class]="activeTab() === t.id ? 'bg-black/30 text-on-primary' : 'bg-surface-container-highest text-outline border border-outline-variant/30'"
                    >
                      {{ t.count }}
                    </span>
                  }
                </button>
              }
            </div>
          </nav>
        </header>

        <!-- MAIN CONTENT AREA -->
        <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-7 py-5">
          @switch (activeTab()) {
            @case ('general') {
              <app-group-tab-general
                [profile]="profile()"
                (openRepresentative)="drawer.set({ kind: 'representative', rep: $event })"
                (edit)="applyGeneralEdit($event)"
                (editMilestone)="applyMilestoneEdit($event)"
                (addMilestone)="addMilestone()"
                (deleteMilestone)="deleteMilestone($event)"
                (toggleOwnAudio)="store.patchSection(group().id, 'audio', { hasOwnEquipment: $event })"
                (toggleContract)="store.patchSection(group().id, 'contract', { hasContract: $event })"
              />
            }
            @case ('integrantes') {
              <app-group-tab-members [profile]="profile()" (openMember)="drawer.set({ kind: 'member', member: $event })" />
            }
            @case ('social') {
              <app-group-tab-social
                [profile]="profile()"
                (openPost)="drawer.set({ kind: 'post', post: $event })"
                (addPost)="store.addPost(group().id, $event)"
                (openReview)="drawer.set({ kind: 'review', review: $event })"
                (editPost)="drawer.set({ kind: 'post', post: $event })"
                (toggleVisibility)="togglePostVisibility($event)"
                (deletePost)="confirmDeletePost($event)"
              />
            }
            @case ('eventos') {
              <app-group-tab-events [profile]="profile()" (openEvent)="drawer.set({ kind: 'event', event: $event })" />
            }
            @case ('cotizaciones') {
              <app-group-tab-quotes [quotes]="groupQuotes()" (openQuote)="openQuote.emit($event)" />
            }
            @case ('musica') {
              <app-group-tab-music
                [profile]="profile()"
                (openTrack)="drawer.set({ kind: 'track', track: $event })"
                (addTrack)="store.addTrack(group().id, $event)"
                (deleteTrack)="store.deleteTrack(group().id, $event)"
              />
            }
            @case ('galeria') {
              <app-group-tab-gallery
                [profile]="profile()"
                (openImage)="drawer.set({ kind: 'image', image: $event })"
                (openVideo)="drawer.set({ kind: 'video', video: $event })"
                (addImage)="store.addGalleryImage(group().id, $event)"
                (deleteImage)="store.deleteGalleryImage(group().id, $event)"
                (addVideo)="store.addVideo(group().id, $event)"
                (deleteVideo)="store.deleteVideo(group().id, $event)"
              />
            }
          }
        </div>

        <!-- SIDE DRAWER PANEL -->
        <app-group-side-drawer
          [open]="!!drawer()"
          [eyebrow]="drawerEyebrow()"
          [title]="drawerTitle()"
          (closed)="drawer.set(null)"
        >
          @if (drawer(); as d) {
            @switch (d.kind) {
              @case ('member') {
                <app-group-member-detail
                  [member]="d.member"
                  (edit)="applyMemberEdit(d.member.id, $event)"
                  (mediaUpdate)="applyMemberMediaUpdate(d.member.id, $event)"
                  (socialsUpdate)="applyMemberSocialsUpdate(d.member.id, $event)"
                />
              }

              @case ('representative') {
                <div class="space-y-4 text-xs">
                  <div class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 space-y-3 shadow-lg">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline">Nivel de Servicio</span>
                      <span class="px-3 py-1 rounded-xl bg-primary/20 text-primary border border-primary/40 text-xs font-black">{{ d.rep.serviceTier }}</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Honorario Cotizado</span>
                      <span class="text-3xl font-black text-emerald-400 tracking-tight">&#36;{{ d.rep.quotedFee | number:'1.0-0' }} MXN</span>
                    </div>
                  </div>

                  <div class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 space-y-2.5 shadow-lg">
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Contacto Titular</span>
                      <span class="font-black text-sm text-on-surface">{{ d.rep.contactName }}</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Teléfono Directo</span>
                      <span class="font-mono text-emerald-400 font-black text-sm">{{ d.rep.phone }}</span>
                    </div>
                    <div class="min-w-0">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Correo Oficial</span>
                      <span class="font-bold text-on-surface break-all text-xs">{{ d.rep.email }}</span>
                    </div>
                  </div>

                  @if (d.rep.notes) {
                    <p class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 text-xs text-on-surface/90 leading-relaxed font-medium">
                      {{ d.rep.notes }}
                    </p>
                  }
                </div>
              }

              @case ('event') {
                <div class="space-y-4 text-xs">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="p-3.5 rounded-2xl bg-[#19152b] border border-outline-variant/30">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Fecha</span>
                      <span class="font-black text-on-surface font-mono text-sm">{{ d.event.date }}</span>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-[#19152b] border border-outline-variant/30">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Estado</span>
                      <span class="font-black text-emerald-400 text-xs">{{ d.event.status }}</span>
                    </div>
                  </div>

                  <div class="p-4 rounded-2xl bg-[#19152b] border border-outline-variant/30">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Recinto & Sede</span>
                    <span class="font-black text-sm text-on-surface block">{{ d.event.venue }}</span>
                    <span class="block text-outline font-bold text-xs">{{ d.event.city }}</span>
                  </div>

                  @if (d.event.capacity) {
                    <div class="p-4 rounded-2xl bg-[#19152b] border border-outline-variant/30 space-y-2">
                      <div class="flex items-center justify-between text-xs font-black">
                        <span class="text-outline">Ocupación / Aforo</span>
                        <span class="text-on-surface font-mono">{{ d.event.attendance || 0 | number:'1.0-0' }} / {{ d.event.capacity | number:'1.0-0' }}</span>
                      </div>
                      <div class="h-3 rounded-full bg-surface-container overflow-hidden border border-outline-variant/30 p-0.5">
                        <div class="h-full rounded-full bg-gradient-to-r from-primary via-amber-400 to-emerald-400" [style.width.%]="eventOccupancy(d.event)"></div>
                      </div>
                    </div>
                  }

                  @if (d.event.revenue) {
                    <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300">Ingreso Registrado</span>
                      <span class="text-lg font-black text-emerald-400">&#36;{{ d.event.revenue | number:'1.0-0' }} MXN</span>
                    </div>
                  }
                </div>
              }

              @case ('post') {
                <div class="space-y-4 text-xs">
                  <div class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 space-y-2.5 shadow-lg">
                    <span class="text-[10px] font-black uppercase tracking-wider text-primary block">Editar Contenido de Publicación</span>
                    <app-editable-field
                      [value]="d.post.content"
                      label="Contenido"
                      type="textarea"
                      [rows]="4"
                      (save)="store.updatePost(group().id, d.post.id, { content: $event })"
                    />
                  </div>

                  <div class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 space-y-2.5 shadow-lg">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Imagen Adjunta</span>
                    <app-editable-field
                      [value]="d.post.imageUrl || ''"
                      label="URL de Imagen"
                      type="url"
                      placeholder="Sin imagen"
                      (save)="store.updatePost(group().id, d.post.id, { imageUrl: $event || undefined })"
                    />
                  </div>

                  <div class="flex items-center gap-4 text-xs font-black text-outline pt-1">
                    <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-rose-400">favorite</span> {{ d.post.likes | number:'1.0-0' }}</span>
                    <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-cyan-400">chat_bubble</span> {{ d.post.comments.length }}</span>
                    <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-emerald-400">share</span> {{ d.post.shares }}</span>
                  </div>

                  <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Comentarios</span>

                  @if (d.post.comments.length) {
                    <div class="space-y-2">
                      @for (c of d.post.comments; track c.id) {
                        <div class="p-3 rounded-2xl bg-[#19152b] border border-outline-variant/20 flex gap-3">
                          <img [src]="c.avatarUrl" [alt]="c.authorName" class="w-8 h-8 rounded-xl object-cover shrink-0" />
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center justify-between gap-2">
                              <span class="text-xs font-black text-on-surface truncate">{{ c.authorName }}</span>
                              <span class="text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0" [class]="commentClass(c.sentiment)">
                                {{ c.sentiment }}
                              </span>
                            </div>
                            <p class="text-xs text-on-surface/90 leading-relaxed mt-0.5">{{ c.text }}</p>
                            <p class="text-[9px] text-outline font-mono mt-1">{{ c.at }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-xs text-outline italic p-4 rounded-2xl bg-[#19152b] border border-dashed border-outline-variant/30">
                      Esta publicación todavía no tiene comentarios.
                    </p>
                  }
                </div>
              }

              @case ('review') {
                <div class="space-y-4 text-xs">
                  <div class="p-4 rounded-3xl bg-[#19152b] border border-amber-500/30 space-y-2 shadow-lg">
                    <span class="text-xl font-black text-amber-300">
                      @for (s of stars; track s) {<span [class]="s <= d.review.rating ? '' : 'opacity-25'">★</span>}
                    </span>
                    <p class="text-xs text-on-surface/90 italic leading-relaxed font-medium">"{{ d.review.comment }}"</p>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-[#19152b] border border-outline-variant/20">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Evento</span>
                    <span class="font-black text-sm text-on-surface block">{{ d.review.eventName }}</span>
                    <span class="block text-outline text-xs mt-0.5">{{ d.review.venue }} · {{ d.review.eventDate }}</span>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-[#19152b] border border-outline-variant/20 flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline">Asistentes al Evento</span>
                    <span class="font-black text-sm text-on-surface">{{ d.review.attendees | number:'1.0-0' }}</span>
                  </div>
                </div>
              }

              @case ('image') {
                <div class="space-y-4 text-xs">
                  <img [src]="d.image.url" [alt]="d.image.caption" class="w-full rounded-3xl border border-outline-variant/30 h-52 object-cover shadow-xl" />
                  
                  <div class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 space-y-2 shadow-lg">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Editar Título / Descripción</span>
                    <app-editable-field
                      [value]="d.image.caption"
                      label="Título"
                      (save)="store.updateGalleryImage(group().id, d.image.url, { caption: $event })"
                    />
                  </div>

                  <div class="flex items-center justify-between p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 shadow-lg">
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Visibilidad Pública</span>
                      <span class="font-black text-xs text-on-surface">{{ d.image.isPublic !== false ? 'Pública en Perfil del Cliente' : 'Oculta (Solo Disquera)' }}</span>
                    </div>
                    <button
                      type="button"
                      (click)="store.updateGalleryImage(group().id, d.image.url, { isPublic: !(d.image.isPublic !== false) })"
                      class="px-3.5 py-1.5 rounded-xl font-black text-xs border transition-all shadow-md"
                      [class]="d.image.isPublic !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'"
                    >
                      {{ d.image.isPublic !== false ? 'Pública' : 'Privada' }}
                    </button>
                  </div>
                </div>
              }

              @case ('video') {
                <div class="space-y-4 text-xs">
                  <div class="relative rounded-3xl overflow-hidden border border-outline-variant/30 shadow-xl">
                    <img [src]="d.video.thumbnailUrl" [alt]="d.video.title" class="w-full h-44 object-cover" />
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span class="material-symbols-outlined text-5xl text-white drop-shadow-lg">play_circle</span>
                    </div>
                  </div>
                  
                  <div class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 space-y-2 shadow-lg">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Editar Título del Video</span>
                    <app-editable-field
                      [value]="d.video.title"
                      label="Título"
                      (save)="store.updateVideo(group().id, d.video.title, { title: $event })"
                    />
                  </div>

                  <div class="flex items-center justify-between p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 shadow-lg">
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Visibilidad Pública</span>
                      <span class="font-black text-xs text-on-surface">{{ d.video.isPublic !== false ? 'Público en Perfil del Cliente' : 'Oculto (Solo Disquera)' }}</span>
                    </div>
                    <button
                      type="button"
                      (click)="store.updateVideo(group().id, d.video.title, { isPublic: !(d.video.isPublic !== false) })"
                      class="px-3.5 py-1.5 rounded-xl font-black text-xs border transition-all shadow-md"
                      [class]="d.video.isPublic !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'"
                    >
                      {{ d.video.isPublic !== false ? 'Público' : 'Privado' }}
                    </button>
                  </div>
                </div>
              }

              @case ('track') {
                <div class="space-y-4 text-xs">
                  <div class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 space-y-2.5 shadow-lg">
                    <span class="text-[10px] font-black uppercase tracking-wider text-primary block">Editar Canción / Pista</span>
                    <app-editable-field
                      [value]="d.track.title"
                      label="Título"
                      (save)="store.updateTrack(group().id, d.track.id, { title: $event })"
                    />
                    <app-editable-field
                      [value]="d.track.genre"
                      label="Género"
                      (save)="store.updateTrack(group().id, d.track.id, { genre: $event })"
                    />
                    <app-editable-field
                      [value]="d.track.releaseYear"
                      label="Año de lanzamiento"
                      (save)="store.updateTrack(group().id, d.track.id, { releaseYear: $event })"
                    />
                    <app-editable-field
                      [value]="d.track.durationLabel"
                      label="Duración"
                      (save)="store.updateTrack(group().id, d.track.id, { durationLabel: $event })"
                    />
                    <app-editable-field
                      [value]="d.track.audioUrl || ''"
                      label="URL Archivo Audio / Demo"
                      type="url"
                      placeholder="https://..."
                      (save)="store.updateTrack(group().id, d.track.id, { audioUrl: $event })"
                    />
                  </div>

                  <div class="p-4 rounded-3xl bg-[#19152b] border border-outline-variant/30 space-y-2 shadow-lg">
                    <div class="flex items-center justify-between text-xs font-black">
                      <span class="text-outline">Aprobación del Público</span>
                      <span class="text-emerald-400 text-sm font-black">{{ d.track.approval }}%</span>
                    </div>
                    <div class="h-3 rounded-full bg-surface-container overflow-hidden border border-outline-variant/30 p-0.5">
                      <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" [style.width.%]="d.track.approval"></div>
                    </div>
                  </div>
                </div>
              }
            }
          }
        </app-group-side-drawer>

        <!-- LUXURY SAVE BAR -->
        @if (store.isDirty(group().id)) {
          <footer class="shrink-0 px-4 sm:px-7 py-3 border-t border-amber-500/50 bg-[#1e1933] flex items-center justify-between gap-3 animate-fade-in shadow-2xl">
            <span class="text-xs font-black text-amber-300 flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-base shrink-0 animate-bounce">edit_note</span>
              <span class="truncate">Hay cambios sin guardar en este expediente</span>
            </span>
            <button
              type="button"
              (click)="store.save(group().id)"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white text-xs font-black transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.4)] shrink-0 hover:scale-105 active:scale-95"
            >
              <span class="material-symbols-outlined text-sm font-bold">save</span> Guardar cambios
            </button>
          </footer>
        } @else if (store.lastSavedAt(group().id); as savedAt) {
          <footer class="shrink-0 px-4 sm:px-7 py-2.5 border-t border-outline-variant/20 bg-[#161326]/80 flex items-center gap-2">
            <span class="material-symbols-outlined text-base text-emerald-400">check_circle</span>
            <span class="text-xs font-extrabold text-outline">Cambios guardados · {{ savedAt }}</span>
          </footer>
        }

      </div>
    </div>
  `
})
export class GroupDetailModalComponent {
  private readonly mockData = inject(MockDataService);
  readonly store = inject(GroupProfileStore);

  group = input.required<GroupItem>();
  closed = output<void>();
  openQuote = output<Quote>();

  groupQuotes = computed(() =>
    this.mockData.quotes().filter(q => q.groupName === this.group().name)
  );

  constructor() {
    effect(() => this.store.ensure(this.group()));
  }

  activeTab = signal<GroupTab>('general');
  drawer = signal<DrawerKind | null>(null);

  protected readonly stars = [1, 2, 3, 4, 5];

  profile = computed(() => this.store.profile(this.group().id) ?? buildGroupProfile(this.group()));

  rating = computed(() => averageRating(this.profile()));
  approval = computed(() => approvalPercent(this.profile()));

  tabs = computed(() => {
    const p = this.profile();
    return [
      { id: 'general' as GroupTab, label: 'General', icon: 'badge', count: null as number | null },
      { id: 'integrantes' as GroupTab, label: 'Integrantes', icon: 'group', count: p.members.length },
      { id: 'social' as GroupTab, label: 'Publicaciones & Reseñas', icon: 'dynamic_feed', count: p.posts.length + p.reviews.length },
      { id: 'eventos' as GroupTab, label: 'Eventos & Firmas', icon: 'event', count: p.events.length },
      { id: 'cotizaciones' as GroupTab, label: 'Cotizaciones', icon: 'request_quote', count: this.groupQuotes().length },
      { id: 'musica' as GroupTab, label: 'Música & Repertorio', icon: 'library_music', count: p.tracks.length },
      { id: 'galeria' as GroupTab, label: 'Galería & Shows', icon: 'photo_library', count: p.gallery.length }
    ];
  });

  private static readonly NUMERIC = new Set([
    'foundedYear', 'suggestedFee', 'minimumHours', 'extraHourFee', 'commissionPercent'
  ]);

  private static readonly LIST_BY_LINE = new Set(['awards', 'riderRequirements']);
  private static readonly LIST_BY_COMMA = new Set(['secondaryGenres']);

  applyGeneralEdit(e: GeneralEdit): void {
    const id = this.group().id;
    const value = this.coerce(e.field, e.value);

    if (e.section === 'root') {
      this.store.patch(id, { [e.field]: value } as never);
      return;
    }
    this.store.patchSection(id, e.section, { [e.field]: value } as never);
  }

  private coerce(field: string, raw: string): unknown {
    if (GroupDetailModalComponent.NUMERIC.has(field)) {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    if (GroupDetailModalComponent.LIST_BY_LINE.has(field)) {
      return raw.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (GroupDetailModalComponent.LIST_BY_COMMA.has(field)) {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return raw;
  }

  applyMilestoneEdit(e: { index: number; field: 'year' | 'title' | 'description'; value: string }): void {
    const milestones = this.profile().milestones.map((m, i) =>
      i === e.index ? { ...m, [e.field]: e.value } : m
    );
    this.store.patch(this.group().id, { milestones });
  }

  addMilestone(): void {
    const milestones = [
      ...this.profile().milestones,
      { year: String(new Date().getFullYear()), title: 'Nuevo hito', description: 'Describe el hito...' }
    ];
    this.store.patch(this.group().id, { milestones });
  }

  deleteMilestone(index: number): void {
    this.store.deleteMilestone(this.group().id, index);
  }

  private static readonly MEMBER_NUMERIC = new Set(['age', 'experienceYears', 'monthlySalary']);

  applyMemberEdit(memberId: string, e: MemberEdit): void {
    let value: unknown = e.value;

    if (GroupDetailModalComponent.MEMBER_NUMERIC.has(e.field)) {
      const trimmed = e.value.trim();
      value = trimmed === '' ? undefined : Number(trimmed);
      if (typeof value === 'number' && !Number.isFinite(value)) value = undefined;
    }

    this.store.updateMember(this.group().id, memberId, { [e.field]: value } as never);

    const updated = this.profile().members.find(m => m.id === memberId);
    if (updated) this.drawer.set({ kind: 'member', member: updated });
  }

  applyMemberMediaUpdate(memberId: string, event: { photos: string[]; videos: MemberVideo[] }): void {
    this.store.updateMemberMedia(this.group().id, memberId, event.photos, event.videos);
    const updated = this.profile().members.find(m => m.id === memberId);
    if (updated) this.drawer.set({ kind: 'member', member: updated });
  }

  applyMemberSocialsUpdate(memberId: string, socials: SocialLinks): void {
    this.store.updateMemberSocials(this.group().id, memberId, socials);
    const updated = this.profile().members.find(m => m.id === memberId);
    if (updated) this.drawer.set({ kind: 'member', member: updated });
  }

  togglePostVisibility(post: GroupPost): void {
    this.store.setPostVisibility(
      this.group().id,
      post.id,
      post.visibility === 'Publicada' ? 'Oculta' : 'Publicada'
    );
  }

  confirmDeletePost(post: GroupPost): void {
    const ok = confirm(`¿Eliminar definitivamente esta publicación de ${this.profile().name}?\n\n"${post.content.slice(0, 120)}"`);
    if (!ok) return;
    this.store.deletePost(this.group().id, post.id);
    if (this.drawer()?.kind === 'post') this.drawer.set(null);
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
