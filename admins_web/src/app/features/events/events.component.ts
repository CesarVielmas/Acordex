import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { EventItem } from '../../core/models/admin.models';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { InfoBannerComponent } from '../../shared/ui/info-banner/info-banner.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { FormFieldComponent, FormFieldOption } from '../../shared/ui/form-field/form-field.component';
import { ProgressBarComponent } from '../../shared/ui/progress-bar/progress-bar.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, InfoBannerComponent, ModalShellComponent, FormFieldComponent, ProgressBarComponent],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Gestor de Eventos & Cartelera</h1>
            <app-badge label="Co-producción & Croquis Zonal" variant="primary" />
          </div>
          <p class="text-xs text-outline mt-1">Diseñador de eventos, aprobaciones compartidas y carga de evidencia de campo</p>
        </div>

        @if (roleService.canEditEvents()) {
          <button
            (click)="isCreating.set(true)"
            class="px-4 py-2.5 min-h-11 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 self-start"
          >
            <span class="material-symbols-outlined text-lg">add_circle</span> Crear Nuevo Evento
          </button>
        }
      </div>

      <!-- CO-PRODUCTION WARNING & APPROVAL BANNER (CRITICAL REQUIREMENT #3) -->
      @for (evt of getPendingCoProductionEvents(); track evt.id) {
        <app-info-banner icon="handshake" title="Aviso de Co-producción Pendiente" variant="urgent" [hasAction]="true">
          <span class="text-purple-200/90">
            <strong class="text-purple-200">{{ evt.title }}</strong> — La disquera socia <strong>{{ evt.pendingChanges?.proposedBy }}</strong> ha solicitado cambios en el evento:
            <em>"{{ evt.pendingChanges?.reason }}"</em>
          </span>

          <div banner-action>
            <button
              (click)="openCoProductionModal(evt)"
              class="px-4 py-2 min-h-11 rounded-xl bg-purple-500 hover:bg-purple-400 text-purple-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-base">rate_review</span> Revisar y Aprobar/Rechazar
            </button>
          </div>
        </app-info-banner>
      }

      <!-- EVENTS LIST -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        @for (evt of mockData.events(); track evt.id) {
          <div class="p-5 rounded-3xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">

            <div>
              <div class="relative rounded-2xl overflow-hidden mb-4 aspect-video bg-surface-container-high">
                <img [src]="evt.flyerUrl" [alt]="evt.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                <div class="absolute top-3 left-3 flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-background/80 backdrop-blur-md text-primary border border-primary/30">
                    {{ evt.groupName }}
                  </span>
                </div>

                <div class="absolute top-3 right-3">
                  <span [class]="evt.status === 'Publicado' ? 'bg-emerald-500/80 text-black' : 'bg-amber-500/80 text-black'" class="px-2.5 py-1 rounded-lg text-xs font-black backdrop-blur-md">
                    {{ evt.status }}
                  </span>
                </div>
              </div>

              <h3 class="text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                {{ evt.title }}
              </h3>

              <div class="mt-2 space-y-1 text-xs text-outline font-medium">
                <p class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-primary">calendar_month</span> {{ evt.date }}
                </p>
                <p class="flex items-center gap-1.5 min-w-0">
                  <span class="material-symbols-outlined text-sm text-primary shrink-0">location_on</span> <span class="truncate">{{ evt.venue }}, {{ evt.location }}</span>
                </p>
              </div>

              <!-- Ticket Tiers Summary -->
              <div class="mt-4 pt-3 border-t border-outline-variant/20">
                <span class="text-[10px] font-bold uppercase tracking-wider text-outline block mb-2">Zonas & Boletos</span>
                <div class="flex items-center gap-2 flex-wrap">
                  @for (tier of evt.ticketTiers; track tier.name) {
                    <span class="text-[11px] font-semibold px-2 py-1 rounded-lg bg-surface-container-high border border-outline-variant/30 text-on-surface">
                      {{ tier.name }}: <strong class="text-primary">&#36;{{ tier.price }}</strong>
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Footer Actions & Role Buttons -->
            <div class="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                (click)="openDetailModal(evt)"
                class="flex-1 py-2.5 min-h-11 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">visibility</span> Ver Croquis & Evidencias
              </button>

              <!-- EXCLUSIVE UPLOAD ACTION FOR USUARIO ROLE (CRITICAL REQUIREMENT #4) -->
              @if (roleService.isUsuarioOnly()) {
                <button
                  (click)="openUploadModal(evt)"
                  class="px-3 py-2.5 min-h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-1 shrink-0"
                  title="Subir Fotos o Videos de campo sin modificar precios o fechas"
                >
                  <span class="material-symbols-outlined text-base">add_a_photo</span> Subir Evidencia
                </button>
              }
            </div>

          </div>
        }
      </div>

      <!-- CO-PRODUCTION MODAL APPROVAL / REJECTION (CRITICAL REQUIREMENT #3) -->
      @if (selectedCoProdEvent(); as evt) {
        <app-modal-shell title="Revisión de Co-producción" icon="handshake" size="xl" [hasFooter]="true" (closed)="selectedCoProdEvent.set(null)">
          <div class="space-y-4 text-xs">
            <div class="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
              <p class="font-bold text-purple-200 text-sm mb-1">{{ evt.title }}</p>
              <p class="text-outline">Socio Propugnante: <strong class="text-on-surface">{{ evt.pendingChanges?.proposedBy }}</strong></p>
            </div>

            <div class="space-y-2 bg-surface-container-high p-4 rounded-2xl border border-outline-variant/30">
              <h4 class="font-bold text-on-surface text-xs uppercase tracking-wider">Modificaciones Solicitadas:</h4>
              <p><strong>Fecha Propuesta:</strong> {{ evt.pendingChanges?.proposedDate }}</p>
              <p><strong>Recinto Propuesto:</strong> {{ evt.pendingChanges?.proposedVenue }}</p>
              <p><strong>Reparto de Utilidades:</strong> {{ evt.pendingChanges?.proposedSplitPercent }}% / {{ 100 - (evt.pendingChanges?.proposedSplitPercent || 50) }}%</p>
              <p class="mt-2 text-outline"><strong>Justificación:</strong> {{ evt.pendingChanges?.reason }}</p>
            </div>
          </div>

          <ng-container modal-footer>
            <button
              (click)="respondCoProduction(false)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white font-bold text-xs transition-all"
            >
              Rechazar Propuesta
            </button>
            <button
              (click)="respondCoProduction(true)"
              class="px-5 py-2.5 min-h-11 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 font-black text-xs shadow-lg transition-all"
            >
              Aprobar Cambios en Evento
            </button>
          </ng-container>
        </app-modal-shell>
      }

      <!-- EVENT DETAIL & CROQUIS MODAL -->
      @if (selectedEvent(); as evt) {
        <app-modal-shell [title]="evt.title" [subtitle]="evt.venue + ', ' + evt.location + ' (' + evt.date + ')'" size="3xl" [hasFooter]="true" (closed)="selectedEvent.set(null)">
          <div class="space-y-6">
            <!-- SIMULATED CROQUIS MAP ZONES -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-base">map</span> Croquis Zonal Interactivo (Simulado)
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                @for (zone of evt.croquisZones; track zone.id) {
                  <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-on-surface">{{ zone.name }}</span>
                      <span class="w-3 h-3 rounded-full shrink-0" [style.background-color]="zone.color"></span>
                    </div>
                    <p class="text-xs text-outline">Capacidad: {{ zone.capacity }} personas</p>
                    <app-progress-bar [percent]="zone.occupancyPercent" valueLabel="{{ zone.occupancyPercent }}% Ocupado" colorVariant="primary" />
                  </div>
                }
              </div>
            </div>

            <!-- EVIDENCE MEDIA GALLERY -->
            <div class="space-y-3 pt-3 border-t border-outline-variant/20">
              <div class="flex items-center justify-between gap-2">
                <h4 class="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-400 text-base">photo_library</span>
                  Evidencia Multimedia de Campo ({{ evt.evidenceMedia?.length || 0 }})
                </h4>

                <button
                  (click)="openUploadModal(evt)"
                  class="px-3 py-1.5 min-h-9 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-xs transition-all flex items-center gap-1 shrink-0"
                >
                  <span class="material-symbols-outlined text-sm">add_a_photo</span> Subir Evidencia
                </button>
              </div>

              @if ((evt.evidenceMedia?.length || 0) === 0) {
                <div class="p-6 rounded-2xl bg-surface-container-high text-center text-xs text-outline border border-dashed border-outline-variant/40">
                  No se ha adjuntado evidencia aún. El rol Usuario puede subir fotos/videos de la prueba de sonido.
                </div>
              } @else {
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  @for (ev of evt.evidenceMedia; track ev.id) {
                    <div class="rounded-2xl overflow-hidden bg-surface-container-high border border-outline-variant/30 space-y-2 p-2">
                      <img [src]="ev.url" [alt]="ev.caption" class="w-full aspect-video object-cover rounded-xl" />
                      <p class="text-[11px] font-semibold text-on-surface px-1">{{ ev.caption }}</p>
                      <div class="flex items-center justify-between text-[10px] text-outline px-1">
                        <span class="truncate">{{ ev.uploaderName }}</span>
                        <span class="shrink-0">{{ ev.uploadedAt }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <ng-container modal-footer>
            <button (click)="selectedEvent.set(null)" class="px-5 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface font-semibold text-xs">
              Cerrar Detalle
            </button>
          </ng-container>
        </app-modal-shell>
      }

      <!-- USUARIO EVIDENCE UPLOAD MODAL (CRITICAL REQUIREMENT #4) -->
      @if (uploadEventTarget(); as target) {
        <app-modal-shell title="Subir Evidencia (Fotos / Videos)" icon="add_a_photo" size="md" [hasFooter]="true" (closed)="uploadEventTarget.set(null)">
          <div class="space-y-3.5">
            <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs">
              <strong>Acción de Campo Habilitada:</strong> Subida de evidencia autorizada para el evento {{ target.title }}. No se modifican costos ni fechas.
            </div>

            <app-form-field label="Tipo de Archivo" type="select" [(value)]="uploadForm.type" [options]="uploadTypeOptions" />
            <app-form-field label="Descripción / Pie de Foto" [(value)]="uploadForm.caption" placeholder="Ej. Prueba de sonido escenario principal" />
            <app-form-field label="Simulación de URL / Archivo Mock" [(value)]="uploadForm.url" placeholder="https://..." />
          </div>

          <ng-container modal-footer>
            <button (click)="uploadEventTarget.set(null)" class="px-4 py-2 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
            <button (click)="saveEvidence()" class="px-5 py-2 min-h-11 rounded-xl bg-emerald-500 text-black text-xs font-bold">Subir Evidencia</button>
          </ng-container>
        </app-modal-shell>
      }

    </div>
  `
})
export class EventsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  selectedCoProdEvent = signal<EventItem | null>(null);
  selectedEvent = signal<EventItem | null>(null);
  uploadEventTarget = signal<EventItem | null>(null);
  isCreating = signal(false);

  readonly uploadTypeOptions: FormFieldOption[] = [
    { label: 'Fotografía (JPG/PNG)', value: 'photo' },
    { label: 'Video Corto (MP4)', value: 'video' }
  ];

  uploadForm = {
    type: 'photo' as 'photo' | 'video',
    caption: '',
    url: ''
  };

  getPendingCoProductionEvents(): EventItem[] {
    return this.mockData.events().filter(e => e.isCoProduction && e.coProductionStatus === 'pending_review' && e.pendingChanges);
  }

  openCoProductionModal(evt: EventItem): void {
    this.selectedCoProdEvent.set(evt);
  }

  respondCoProduction(approve: boolean): void {
    const current = this.selectedCoProdEvent();
    if (current) {
      this.mockData.respondCoProductionChanges(current.id, approve);
      this.selectedCoProdEvent.set(null);
    }
  }

  openDetailModal(evt: EventItem): void {
    this.selectedEvent.set(evt);
  }

  openUploadModal(evt: EventItem): void {
    this.uploadEventTarget.set(evt);
    this.uploadForm = {
      type: 'photo',
      caption: '',
      url: ''
    };
  }

  saveEvidence(): void {
    const target = this.uploadEventTarget();
    if (target && this.uploadForm.caption) {
      this.mockData.uploadEventEvidence(
        target.id,
        this.uploadForm.type,
        this.uploadForm.caption,
        this.uploadForm.url
      );
      this.uploadEventTarget.set(null);
      // Refresh detail modal if open
      const updatedEvent = this.mockData.events().find(e => e.id === target.id);
      if (updatedEvent && this.selectedEvent()?.id === target.id) {
        this.selectedEvent.set(updatedEvent);
      }
    }
  }
}
