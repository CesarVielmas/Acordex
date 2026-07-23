import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { EventItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Gestor de Eventos & Cartelera</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
              Co-producción & Croquis Zonal
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Diseñador de eventos, aprobaciones compartidas y carga de evidencia de campo</p>
        </div>

        @if (roleService.canEditEvents()) {
          <button 
            (click)="isCreating.set(true)"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 self-start"
          >
            <span class="material-symbols-outlined text-lg">add_circle</span> Crear Nuevo Evento
          </button>
        }
      </div>

      <!-- CO-PRODUCTION WARNING & APPROVAL BANNER (CRITICAL REQUIREMENT #3) -->
      @for (evt of getPendingCoProductionEvents(); track evt.id) {
        <div class="p-5 rounded-2xl bg-purple-950/60 border-2 border-purple-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl animate-pulse">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-2xl">handshake</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200">
                  Aviso de Co-producción Pendiente
                </span>
                <span class="text-xs font-bold text-purple-200">{{ evt.title }}</span>
              </div>
              <p class="text-xs text-purple-200/90 mt-1">
                La disquera socia <strong>{{ evt.pendingChanges?.proposedBy }}</strong> ha solicitado cambios en el evento: 
                <em>"{{ evt.pendingChanges?.reason }}"</em>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 self-end md:self-center">
            <button 
              (click)="openCoProductionModal(evt)"
              class="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-purple-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-base">rate_review</span> Revisar y Aprobar/Rechazar
            </button>
          </div>
        </div>
      }

      <!-- EVENTS LIST -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-primary">location_on</span> {{ evt.venue }}, {{ evt.location }}
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
            <div class="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-2">
              <button 
                (click)="openDetailModal(evt)"
                class="flex-1 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">visibility</span> Ver Croquis & Evidencias
              </button>

              <!-- EXCLUSIVE UPLOAD ACTION FOR USUARIO ROLE (CRITICAL REQUIREMENT #4) -->
              @if (roleService.isUsuarioOnly()) {
                <button 
                  (click)="openUploadModal(evt)"
                  class="px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1 shrink-0"
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
      @if (selectedCoProdEvent()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 sm:p-8 rounded-3xl border border-purple-500/40 max-w-xl w-full space-y-6 shadow-2xl">
            
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <span class="material-symbols-outlined text-xl">handshake</span>
                </span>
                <h3 class="text-lg font-bold text-on-surface">Revisión de Co-producción</h3>
              </div>
              <button (click)="selectedCoProdEvent.set(null)" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              <div class="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                <p class="font-bold text-purple-200 text-sm mb-1">{{ selectedCoProdEvent()?.title }}</p>
                <p class="text-outline">Socio Propugnante: <strong class="text-on-surface">{{ selectedCoProdEvent()?.pendingChanges?.proposedBy }}</strong></p>
              </div>

              <div class="space-y-2 bg-surface-container-high p-4 rounded-2xl border border-outline-variant/30">
                <h4 class="font-bold text-on-surface text-xs uppercase tracking-wider">Modificaciones Solicitadas:</h4>
                <p><strong>Fecha Propuesta:</strong> {{ selectedCoProdEvent()?.pendingChanges?.proposedDate }}</p>
                <p><strong>Recinto Propuesto:</strong> {{ selectedCoProdEvent()?.pendingChanges?.proposedVenue }}</p>
                <p><strong>Reparto de Utilidades:</strong> {{ selectedCoProdEvent()?.pendingChanges?.proposedSplitPercent }}% / {{ 100 - (selectedCoProdEvent()?.pendingChanges?.proposedSplitPercent || 50) }}%</p>
                <p class="mt-2 text-outline"><strong>Justificación:</strong> {{ selectedCoProdEvent()?.pendingChanges?.reason }}</p>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button 
                (click)="respondCoProduction(false)"
                class="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white font-bold text-xs transition-all"
              >
                Rechazar Propuesta
              </button>
              <button 
                (click)="respondCoProduction(true)"
                class="px-5 py-2.5 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 font-black text-xs shadow-lg transition-all"
              >
                Aprobar Cambios en Evento
              </button>
            </div>

          </div>
        </div>
      }

      <!-- EVENT DETAIL & CROQUIS MODAL -->
      @if (selectedEvent()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline-variant/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 shadow-2xl">
            
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <h3 class="text-xl font-bold text-on-surface">{{ selectedEvent()?.title }}</h3>
                <p class="text-xs text-outline">{{ selectedEvent()?.venue }}, {{ selectedEvent()?.location }} ({{ selectedEvent()?.date }})</p>
              </div>
              <button (click)="selectedEvent.set(null)" class="text-outline hover:text-on-surface p-1 rounded-xl bg-surface-container-high">
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <!-- SIMULATED CROQUIS MAP ZONES -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-base">map</span> Croquis Zonal Interactivo (Simulado)
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                @for (zone of selectedEvent()?.croquisZones; track zone.id) {
                  <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-on-surface">{{ zone.name }}</span>
                      <span class="w-3 h-3 rounded-full" [style.background-color]="zone.color"></span>
                    </div>
                    <p class="text-xs text-outline">Capacidad: {{ zone.capacity }} personas</p>

                    <!-- Occupancy Bar -->
                    <div class="w-full h-2 rounded-full bg-surface-bright overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500" [style.width.%]="zone.occupancyPercent" [style.background-color]="zone.color"></div>
                    </div>
                    <span class="text-[10px] text-outline block text-right font-bold">{{ zone.occupancyPercent }}% Ocupado</span>
                  </div>
                }
              </div>
            </div>

            <!-- EVIDENCE MEDIA GALLERY -->
            <div class="space-y-3 pt-3 border-t border-outline-variant/20">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-400 text-base">photo_library</span> 
                  Evidencia Multimedia de Campo ({{ selectedEvent()?.evidenceMedia?.length || 0 }})
                </h4>

                <button 
                  (click)="openUploadModal(selectedEvent()!)"
                  class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-xs transition-all flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-sm">add_a_photo</span> Subir Evidencia
                </button>
              </div>

              @if ((selectedEvent()?.evidenceMedia?.length || 0) === 0) {
                <div class="p-6 rounded-2xl bg-surface-container-high text-center text-xs text-outline border border-dashed border-outline-variant/40">
                  No se ha adjuntado evidencia aún. El rol Usuario puede subir fotos/videos de la prueba de sonido.
                </div>
              } @else {
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  @for (ev of selectedEvent()?.evidenceMedia; track ev.id) {
                    <div class="rounded-2xl overflow-hidden bg-surface-container-high border border-outline-variant/30 space-y-2 p-2">
                      <img [src]="ev.url" [alt]="ev.caption" class="w-full aspect-video object-cover rounded-xl" />
                      <p class="text-[11px] font-semibold text-on-surface px-1">{{ ev.caption }}</p>
                      <div class="flex items-center justify-between text-[10px] text-outline px-1">
                        <span>{{ ev.uploaderName }}</span>
                        <span>{{ ev.uploadedAt }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="flex justify-end pt-4 border-t border-outline-variant/30">
              <button (click)="selectedEvent.set(null)" class="px-5 py-2.5 rounded-xl bg-surface-bright text-on-surface font-semibold text-xs">
                Cerrar Detalle
              </button>
            </div>

          </div>
        </div>
      }

      <!-- USUARIO EVIDENCE UPLOAD MODAL (CRITICAL REQUIREMENT #4) -->
      @if (uploadEventTarget()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 rounded-3xl border border-emerald-500/40 max-w-md w-full space-y-4 shadow-2xl">
            
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-400">add_a_photo</span>
                Subir Evidencia (Fotos / Videos)
              </h3>
              <button (click)="uploadEventTarget.set(null)" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs">
              <strong>Acción de Campo Habilitada:</strong> Subida de evidencia autorizada para el evento {{ uploadEventTarget()?.title }}. No se modifican costos ni fechas.
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-outline font-medium mb-1">Tipo de Archivo</label>
                <select [(ngModel)]="uploadForm.type" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface">
                  <option value="photo">Fotografía (JPG/PNG)</option>
                  <option value="video">Video Corto (MP4)</option>
                </select>
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Descripción / Pie de Foto</label>
                <input [(ngModel)]="uploadForm.caption" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Ej. Prueba de sonido escenario principal" />
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Simulación de URL / Archivo Mock</label>
                <input [(ngModel)]="uploadForm.url" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="https://..." />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button (click)="uploadEventTarget.set(null)" class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
              <button (click)="saveEvidence()" class="px-5 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold">Subir Evidencia</button>
            </div>

          </div>
        </div>
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
