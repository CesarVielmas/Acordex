import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { LayoutStateService } from '../../core/services/layout_state.service';
import { Quote, QuoteState, PaymentStatus, NegotiationEntry } from '../../core/models/admin.models';

export interface GroupEventSchedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Confirmado' | 'Anticipo 50%' | 'En Logística' | 'Pendiente';
  location: string;
  clientName: string;
  color: string;
}

export interface ShowBlock {
  id: string;
  label: string;
  date?: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-quote-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (selectedQuote()) {
      <div 
        data-modal-portal
        (wheel)="$event.stopPropagation()"
        (touchmove)="$event.stopPropagation()"
        class="fixed inset-0 w-screen h-screen z-[99999999] bg-black/95 backdrop-blur-3xl p-2 sm:p-4 md:p-6 flex items-center justify-center font-['Be_Vietnam_Pro'] select-none overflow-hidden"
      >
        
        <!-- AMBIENT NEON GLOW LIGHT ORBS IN BACKGROUND -->
        <div class="absolute top-5 left-5 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div class="absolute bottom-5 right-5 w-64 sm:w-96 h-64 sm:h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <!-- MAIN MODAL CONTAINER (FIXED HEIGHT CONTAINER, PERFECTLY RESPONSIVE TO SCREEN HEIGHT) -->
        <div 
          [class]="getStateModalBorderClass(selectedQuote()!.state)"
          class="relative w-full max-w-7xl mx-auto bg-surface-container/95 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-[0_0_70px_rgba(0,0,0,0.95)] border-2 h-[92vh] max-h-[92vh] flex flex-col backdrop-blur-2xl transition-all duration-300 overflow-hidden"
        >
          
          <!-- FIXED TOP HEADER ROW (NEVER SCROLLS) -->
          <div class="space-y-2.5 sm:space-y-3 border-b border-outline-variant/30 pb-3 shrink-0">
            
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div [class]="getStateBadgeIconBg(selectedQuote()!.state)" class="p-2.5 sm:p-3.5 rounded-2xl border text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-xl sm:text-3xl md:text-4xl">{{ getStateIcon(selectedQuote()!.state) }}</span>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    @if (selectedQuote()?.state !== 'En revisión') {
                      <span class="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-surface-bright text-on-surface border border-outline-variant/30 shadow-sm font-mono tracking-wider">
                        FOLIO: {{ selectedQuote()?.id }}
                      </span>
                    }
                    <span class="text-[10px] sm:text-[11px] font-extrabold text-outline uppercase tracking-widest flex items-center gap-1.5">
                      <strong [class]="getStateTextColor(selectedQuote()!.state)" class="font-black uppercase tracking-widest drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                        {{ selectedQuote()?.state }}
                      </strong>
                    </span>
                  </div>
                  <h3 class="text-base sm:text-lg md:text-xl font-black text-on-surface mt-0.5 tracking-tight">
                    {{ getStatePhaseTitle(selectedQuote()!.state) }}
                  </h3>
                </div>
              </div>

              <!-- TOP RIGHT ACTION BUTTONS: REJECT BUTTON + MODAL CLOSE BUTTON (ALWAYS FIXED & VISIBLE) -->
              <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                @if (selectedQuote()?.state !== 'Aceptada') {
                  <button 
                    (click)="openRejectionDialog()"
                    class="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/40 font-extrabold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:scale-105"
                    title="Rechazar o cancelar esta cotización"
                  >
                    <span class="material-symbols-outlined text-sm sm:text-base text-red-400">cancel</span> Rechazar Cotización
                  </button>
                }

                <button 
                  (click)="closeModal()" 
                  class="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface transition-all shadow-lg shrink-0 border border-outline-variant/30 hover:scale-105"
                  title="Cerrar modal"
                >
                  <span class="material-symbols-outlined text-lg sm:text-xl">close</span>
                </button>
              </div>

            </div>

            <!-- STATE SPECIFIC STEP NAVIGATION TABS FOR 'Propuesta enviada' (CLEAN 2 TAB BAR + EN NEGOCIACIÓN BADGE) -->
            @if (selectedQuote()?.state === 'Propuesta enviada') {
              <div class="p-1 sm:p-1.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-between gap-2 text-xs shadow-inner">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button 
                    (click)="phase2Tab.set('cotizacion_enviada')"
                    [class]="phase2Tab() === 'cotizacion_enviada' ? (isInNegotiationRound() ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black shadow-[0_0_25px_rgba(251,191,36,0.5)] scale-[1.02]' : 'bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black shadow-[0_0_25px_rgba(6,182,212,0.5)] scale-[1.02]') : 'text-outline hover:text-on-surface'"
                    class="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <span class="material-symbols-outlined text-base sm:text-lg">receipt_long</span> Cotización Enviada
                  </button>

                  <button 
                    (click)="phase2Tab.set('informacion_cliente')"
                    [class]="phase2Tab() === 'informacion_cliente' ? (isInNegotiationRound() ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black shadow-[0_0_25px_rgba(251,191,36,0.5)] scale-[1.02]' : 'bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black shadow-[0_0_25px_rgba(6,182,212,0.5)] scale-[1.02]') : 'text-outline hover:text-on-surface'"
                    class="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <span class="material-symbols-outlined text-base sm:text-lg">badge</span> Información del Cliente
                    <!-- Badge de mensajes de rechazo del cliente -->
                    @if (negotiationHistory().length > 0) {
                      <span class="w-4 h-4 rounded-full bg-amber-400 text-black font-black text-[9px] flex items-center justify-center">
                        {{ negotiationHistory().length }}
                      </span>
                    }
                  </button>
                </div>

                <div class="flex items-center gap-2 pr-1">
                  <!-- TAG 'EN NEGOCIACIÓN' cuando hay rondas activas -->
                  @if (isInNegotiationRound()) {
                    <span class="px-2.5 py-1 rounded-xl bg-amber-500/25 border border-amber-400/60 text-amber-300 font-black text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse">
                      <span class="material-symbols-outlined text-xs text-amber-400">handshake</span>
                      EN NEGOCIACIÓN
                    </span>
                    <span class="px-2 py-1 rounded-xl bg-surface-container border border-amber-500/30 text-amber-400 font-black text-[9px] font-mono">
                      {{ negotiationRoundLabel() }}
                    </span>
                  } @else {
                    <span class="text-xs font-mono font-extrabold text-cyan-300 hidden md:inline">
                      TOTAL: <strong class="text-amber-300 font-black text-sm">&#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</strong>
                    </span>
                  }
                </div>
              </div>
            }

            <!-- STATE SPECIFIC STEP NAVIGATION TABS (FOR OTHER STATES OTHER THAN 'En revisión', 'Propuesta enviada', 'Negociación' AND 'Aceptada') -->
            @if (selectedQuote()?.state !== 'En revisión' && selectedQuote()?.state !== 'Propuesta enviada' && selectedQuote()?.state !== 'Negociación' && selectedQuote()?.state !== 'Aceptada') {
              <div class="p-1 sm:p-1.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-between gap-2 text-xs shadow-inner">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button 
                    (click)="modalTab.set('estado_actual')"
                    [class]="modalTab() === 'estado_actual' ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/20 scale-[1.02]' : 'text-outline hover:text-on-surface'"
                    class="px-3 sm:px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-[10px] sm:text-xs"
                  >
                    <span class="material-symbols-outlined text-sm">bolt</span> Expediente
                  </button>

                  <button 
                    (click)="modalTab.set('solicitud')"
                    [class]="modalTab() === 'solicitud' ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/20 scale-[1.02]' : 'text-outline hover:text-on-surface'"
                    class="px-3 sm:px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-[10px] sm:text-xs"
                  >
                    <span class="material-symbols-outlined text-sm">assignment</span> Solicitud Original
                  </button>

                  <button 
                    (click)="modalTab.set('cobranza')"
                    [class]="modalTab() === 'cobranza' ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/20 scale-[1.02]' : 'text-outline hover:text-on-surface'"
                    class="px-3 sm:px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-[10px] sm:text-xs"
                  >
                    <span class="material-symbols-outlined text-sm">credit_card</span> Cobranza & Pagos
                  </button>

                  <button 
                    (click)="modalTab.set('contrato')"
                    [class]="modalTab() === 'contrato' ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/20 scale-[1.02]' : 'text-outline hover:text-on-surface'"
                    class="px-3 sm:px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-[10px] sm:text-xs"
                  >
                    <span class="material-symbols-outlined text-sm">description</span> Contrato PDF
                  </button>
                </div>
              </div>
            }

          </div>

          <!-- MAIN WORKFLOW SPLIT BODY -->
          <div class="flex-1 min-h-0 pt-3 sm:pt-4 overflow-hidden">
            
            <!-- ========================================================================= -->
            <!-- SPECIALIZED WORKFLOW FOR STATE: 'En revisión' (PREMIUM 2-COLUMN SPLIT) -->
            <!-- ========================================================================= -->
            @if (selectedQuote()?.state === 'En revisión') {
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 h-full items-start overflow-hidden">
                
                <!-- LEFT COLUMN: SOLICITUD DE CLIENTE BASE (6 COLS) -->
                <div class="lg:col-span-6 h-full min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-3 bg-gradient-to-br from-surface-container-high/80 via-surface-container/90 to-surface-container-high/70 p-3.5 sm:p-4.5 md:p-5 rounded-2xl sm:rounded-3xl border-2 border-amber-500/40 shadow-[0_0_35px_rgba(251,191,36,0.15)] backdrop-blur-2xl">
                  
                  <div class="border-b border-outline-variant/30 pb-2 shrink-0">
                    <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-amber-400">verified</span> BASE DE SOLICITUD DEL CLIENTE
                    </span>
                    <h4 class="text-xs sm:text-sm md:text-base font-black text-on-surface">Requerimiento Original de Contratación</h4>
                  </div>

                  <div class="h-0.5 w-full bg-gradient-to-r from-amber-400 via-purple-500 to-transparent rounded-full -mt-2 shrink-0"></div>

                  <div class="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl group border-2 border-amber-400/60 shrink-0">
                    <img 
                      [src]="selectedQuote()?.artistImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80'" 
                      alt="Artist Cover"
                      class="w-full h-28 sm:h-32 md:h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                    <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <div>
                        <span class="text-[8px] sm:text-[9px] font-bold text-amber-300 uppercase tracking-widest block">AGRUPACIÓN SOLICITADA</span>
                        <h4 class="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] truncate">
                          {{ selectedQuote()?.groupName }}
                        </h4>
                      </div>
                      <span class="px-2 sm:px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-amber-300 font-black text-[9px] sm:text-xs border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center gap-1 shrink-0">
                        <span class="material-symbols-outlined text-amber-400 text-xs">star</span> {{ selectedQuote()?.rating || '4.8' }} / 5.0
                      </span>
                    </div>
                  </div>

                  <div class="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container/90 border border-outline-variant/30 space-y-2 text-xs shadow-md backdrop-blur-xl relative overflow-hidden shrink-0">
                    <span class="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest block flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-blue-400">badge</span> DATOS DEL CLIENTE CONTRATANTE
                    </span>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-outline text-[9px] block">Nombre Completo:</span>
                        <p class="font-bold text-on-surface text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-outline">person</span> {{ selectedQuote()?.clientName }}
                        </p>
                      </div>
                      <div>
                        <span class="text-outline text-[9px] block">Empresa / Razón Social:</span>
                        <p class="font-bold text-on-surface text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-outline">domain</span> {{ selectedQuote()?.clientCompany }}
                        </p>
                      </div>
                      <div>
                        <span class="text-outline text-[9px] block">Correo Electrónico:</span>
                        <p class="font-bold text-primary text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-primary">mail</span> {{ selectedQuote()?.clientEmail }}
                        </p>
                      </div>
                      <div>
                        <span class="text-outline text-[9px] block">Teléfono / Celular:</span>
                        <p class="font-bold text-on-surface text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-outline">call</span> {{ selectedQuote()?.representativePhone || '+52 81 1234 5678' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container/90 border border-outline-variant/30 space-y-2.5 text-xs shadow-md relative overflow-hidden shrink-0">
                    <div class="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                      <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs text-amber-400">confirmation_number</span> TICKET DE ESPECIFICACIONES
                      </span>
                      <span class="font-mono text-[8px] sm:text-[9px] tracking-widest text-amber-300/60 uppercase">
                        #SOL-{{ selectedQuote()?.id }}
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-outline text-[9px] block">Tipo de Evento:</span>
                        <span class="font-black text-on-surface text-xs sm:text-sm flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-amber-400">celebration</span> {{ selectedQuote()?.eventType || 'Boda' }}
                        </span>
                      </div>

                      <div>
                        <span class="text-outline text-[9px] block">Fecha Solicitada por Cliente:</span>
                        <span class="font-black text-emerald-400 font-mono text-xs sm:text-sm flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-emerald-400">calendar_today</span> {{ selectedQuote()?.proposedDate }}
                        </span>
                      </div>

                      <div class="col-span-1 sm:col-span-2 space-y-1">
                        <span class="text-outline text-[9px] block">Duración Solicitada por Cliente:</span>
                        <div class="p-2 sm:p-2.5 rounded-xl bg-surface-container-high border border-amber-500/30 flex items-center justify-between shadow-inner">
                          <span class="font-black text-amber-300 font-mono text-xs sm:text-sm flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm text-amber-400">timer</span> {{ selectedQuote()?.durationHours || 3 }} Horas Solicitadas
                          </span>
                          <span class="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Base Cliente
                          </span>
                        </div>
                        <span class="text-[10px] sm:text-xs text-on-surface font-mono font-bold block opacity-90 pt-0.5 flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-amber-400">schedule</span> Horario: 14:30 a 17:30 hrs (Franja Continuada)
                        </span>
                      </div>

                      <div class="col-span-1 sm:col-span-2 border-t border-outline-variant/10 pt-1.5">
                        <span class="text-outline text-[9px] block">Ubicación / Recinto:</span>
                        <p class="font-bold text-on-surface text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-primary">location_on</span> {{ selectedQuote()?.eventAddress || (selectedQuote()?.venue + ', ' + selectedQuote()?.city) }}
                        </p>
                      </div>

                      <div class="col-span-1 sm:col-span-2 pt-1 border-t border-outline-variant/10">
                        <span class="text-outline text-[9px] block">Notas Especiales / Repertorio:</span>
                        <p class="text-xs text-on-surface/90 italic bg-surface-container-high/60 p-2 sm:p-2.5 rounded-xl border border-outline-variant/20 shadow-inner">
                          "{{ selectedQuote()?.notes || 'Sin especificaciones adicionales enviadas por el cliente' }}"
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    (click)="contactWhatsApp()"
                    class="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] shrink-0"
                  >
                    <span class="material-symbols-outlined text-base sm:text-lg">chat</span> CONTACTAR AL CLIENTE POR WHATSAPP
                  </button>

                </div>

                <!-- RIGHT COLUMN: WIZARD INTERACTIVO DE ADMINISTRACIÓN -->
                <div class="lg:col-span-6 flex flex-col h-full min-h-0 space-y-3 overflow-hidden">
                  
                  <div class="p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-surface-container-high border border-outline-variant/30 grid grid-cols-3 gap-1 text-xs shadow-inner shrink-0">
                    <button 
                      (click)="adminStep.set(1)"
                      [class]="adminStep() === 1 ? 'bg-primary text-on-primary font-black shadow-[0_0_20px_rgba(147,51,234,0.5)] scale-[1.02]' : 'text-outline hover:text-on-surface'"
                      class="py-2 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-all text-center font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center gap-1 truncate"
                    >
                      <span>1.</span> Agenda & Horarios
                    </button>

                    <button 
                      (click)="adminStep.set(2)"
                      [class]="adminStep() === 2 ? 'bg-primary text-on-primary font-black shadow-[0_0_20px_rgba(147,51,234,0.5)] scale-[1.02]' : 'text-outline hover:text-on-surface'"
                      class="py-2 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-all text-center font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center gap-1 truncate"
                    >
                      <span>2.</span> Costos & Comisiones
                    </button>

                    <button 
                      (click)="adminStep.set(3)"
                      [class]="adminStep() === 3 ? 'bg-primary text-on-primary font-black shadow-[0_0_20px_rgba(147,51,234,0.5)] scale-[1.02]' : 'text-outline hover:text-on-surface'"
                      class="py-2 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-all text-center font-bold text-[10px] sm:text-xs md:text-sm flex items-center justify-center gap-1 truncate"
                    >
                      <span>3.</span> Revisión & Envío
                    </button>
                  </div>

                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 sm:space-y-4">
                    
                    @if (adminStep() === 1) {
                      <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3.5 sm:space-y-4 shadow-2xl backdrop-blur-xl">
                        
                        <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                          <div>
                            <span class="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest block">PASO 1 DE 3</span>
                            <h4 class="text-xs sm:text-sm md:text-base font-black text-on-surface">Agenda & Configuración de Tiempos</h4>
                          </div>

                          <button 
                            (click)="openFullCalendarModal()"
                            class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:scale-105 shrink-0"
                          >
                            <span class="material-symbols-outlined text-sm">calendar_month</span> Ver Mes / Año
                          </button>
                        </div>

                        <div class="h-0.5 w-full bg-gradient-to-r from-primary via-amber-400 to-transparent rounded-full -mt-2.5"></div>

                        <div class="space-y-2">
                          <div class="flex items-center justify-between">
                            <label class="text-[9px] sm:text-[10px] font-black text-outline uppercase tracking-wider block flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-primary">event_available</span>
                              AGENDA DE {{ selectedQuote()?.groupName }} EL {{ proposalDate() }}:
                            </label>
                            <span class="text-[9px] sm:text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Agenda Disquera
                            </span>
                          </div>

                          <div class="space-y-1.5 bg-surface-container p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-outline-variant/30 shadow-inner relative">
                            @for (ev of mockGroupEvents; track ev.id) {
                              <div [class]="ev.color" class="p-2 sm:p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono shadow-sm">
                                <div class="space-y-0.5">
                                  <div class="flex items-center gap-1.5 font-sans font-black text-on-surface text-[10px] sm:text-xs">
                                    <span>{{ ev.title }}</span>
                                    <span class="px-1 py-0.5 rounded text-[7px] font-mono font-bold uppercase bg-black/40 border border-current">
                                      {{ ev.status }}
                                    </span>
                                  </div>
                                  <span class="text-[9px] opacity-80 block font-sans">Contratante: <strong>{{ ev.clientName }}</strong> • {{ ev.location }}</span>
                                </div>
                                <div class="text-right shrink-0">
                                  <span class="font-black text-[10px] sm:text-xs block text-amber-300 font-mono">{{ ev.startTime }} - {{ ev.endTime }}</span>
                                </div>
                              </div>
                            }
                          </div>
                        </div>

                        <div class="space-y-1.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 shadow-inner">
                          <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block">Estructura Propuesta por Administración</span>
                          
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button 
                              (click)="scheduleMode.set('continuo')"
                              [class]="scheduleMode() === 'continuo' ? 'bg-primary text-on-primary font-black shadow-[0_0_15px_rgba(147,51,234,0.4)] border-primary' : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'"
                              class="py-2 px-2.5 rounded-xl border text-[10px] sm:text-xs text-center transition-all flex items-center justify-center gap-1.5"
                            >
                              <span class="material-symbols-outlined text-xs sm:text-sm">schedule</span> Franja Única Continuada
                            </button>

                            <button 
                              (click)="scheduleMode.set('tandas')"
                              [class]="scheduleMode() === 'tandas' ? 'bg-primary text-on-primary font-black shadow-[0_0_15px_rgba(147,51,234,0.4)] border-primary' : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'"
                              class="py-2 px-2.5 rounded-xl border text-[10px] sm:text-xs text-center transition-all flex items-center justify-center gap-1.5"
                            >
                              <span class="material-symbols-outlined text-xs sm:text-sm">layers</span> Tandas / Bloques Fragmentados
                            </button>
                          </div>
                        </div>

                        @if (scheduleMode() === 'continuo') {
                          <div class="space-y-3">
                            <div class="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1.5 shadow-inner">
                              <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-wider block">Fecha Propuesta para el Show</span>
                              
                              <div class="flex items-center gap-3">
                                <div class="flex-1">
                                  <input 
                                    type="date" 
                                    [ngModel]="proposalDate()"
                                    (ngModelChange)="proposalDate.set($event)"
                                    class="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-all"
                                  />
                                </div>
                                <span class="text-[10px] text-outline hidden sm:inline-block">Modifica si la fecha difiere de la solicitada.</span>
                              </div>
                            </div>

                            <div class="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2.5 shadow-md">
                              <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block">Configuración de Franja Única Continuada</span>
                              
                              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span class="text-outline text-[9px] block mb-1">Hora Inicio:</span>
                                  <input 
                                    type="time" 
                                    [ngModel]="singleStartTime()"
                                    (ngModelChange)="singleStartTime.set($event)"
                                    class="w-full px-2 py-1 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono font-bold text-xs focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all"
                                  />
                                </div>

                                <div>
                                  <span class="text-outline text-[9px] block mb-1">Duración (Horas):</span>
                                  <select 
                                    [ngModel]="singleDurationHours()"
                                    (ngModelChange)="singleDurationHours.set(Number($event))"
                                    class="w-full px-2 py-1 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all"
                                  >
                                    <option [value]="0.5">0.5 hrs (30 min)</option>
                                    <option [value]="1.0">1.0 hr (60 min)</option>
                                    <option [value]="1.5">1.5 hrs (90 min)</option>
                                    <option [value]="2.0">2.0 hrs (120 min)</option>
                                    <option [value]="2.5">2.5 hrs (150 min)</option>
                                    <option [value]="3.0">3.0 hrs (180 min)</option>
                                    <option [value]="3.5">3.5 hrs (210 min)</option>
                                    <option [value]="4.0">4.0 hrs (240 min)</option>
                                    <option [value]="5.0">5.0 hrs</option>
                                  </select>
                                </div>

                                <div>
                                  <span class="text-outline text-[9px] block mb-1">Hora Fin (Auto):</span>
                                  <input 
                                    type="time" 
                                    readonly
                                    [ngModel]="calculatedSingleEndTime()"
                                    class="w-full px-2 py-1 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-amber-300 font-mono font-bold text-xs cursor-not-allowed opacity-90"
                                  />
                                </div>
                              </div>

                              @if (isSingleModeConflicting()) {
                                <div class="p-2 rounded-xl bg-red-500/20 border-2 border-red-500/60 text-red-300 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
                                  <span class="material-symbols-outlined text-sm text-red-400">warning</span>
                                  <span>⚠️ ¡Traslape detectado en esta franja continuada!</span>
                                </div>
                              }
                            </div>
                          </div>
                        }

                        @if (scheduleMode() === 'tandas') {
                          <div class="space-y-2.5 p-3 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 shadow-inner">
                            <div class="flex items-center justify-between">
                              <div>
                                <span class="text-xs font-black text-amber-400 uppercase tracking-wider block">Configuración de Tandas</span>
                                <span class="text-[9px] text-outline">Agrega franjas de tiempo fraccionadas</span>
                              </div>
                              <button 
                                (click)="addShowBlock()"
                                class="px-2.5 py-1 rounded-xl bg-amber-500 text-black font-extrabold text-[10px] sm:text-xs hover:bg-amber-400 transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(251,191,36,0.35)] hover:scale-105 shrink-0"
                              >
                                <span class="material-symbols-outlined text-xs">add</span> + Tanda
                              </button>
                            </div>

                            <div class="space-y-2">
                              @for (block of showBlocks(); track block.id; let idx = $index) {
                                <div 
                                  [class]="isBlockConflicting(block) ? 'border-red-500/80 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 'border-outline-variant/30 bg-surface-container-high/80'"
                                  class="p-2.5 rounded-xl border space-y-1.5 transition-all relative shadow-sm"
                                >
                                  <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-1.5 flex-1 mr-2">
                                      <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0">
                                        {{ idx + 1 }}
                                      </span>
                                      <input 
                                        type="text" 
                                        [(ngModel)]="block.label"
                                        placeholder="Nombre de la tanda (ej. Set 1)"
                                        class="w-full px-2 py-1 rounded-xl bg-surface-container border border-outline-variant/20 text-on-surface font-bold text-xs focus:outline-none focus:border-amber-400 transition-all"
                                      />
                                    </div>

                                    <div class="flex items-center gap-1.5 shrink-0">
                                      <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-[10px] border border-amber-500/30">
                                        {{ getBlockDuration(block.startTime, block.endTime) }} hrs
                                      </span>

                                      @if (showBlocks().length > 1) {
                                        <button 
                                          (click)="removeShowBlock(idx)"
                                          class="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                                          title="Eliminar esta tanda"
                                        >
                                          <span class="material-symbols-outlined text-xs">delete</span>
                                        </button>
                                      }
                                    </div>
                                  </div>

                                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                                    <div>
                                      <span class="text-[9px] text-outline block mb-0.5">Fecha del Set:</span>
                                      <input 
                                        type="date" 
                                        [(ngModel)]="block.date"
                                        class="w-full px-2 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono font-bold text-[10px] focus:outline-none focus:border-amber-400 transition-all"
                                      />
                                    </div>
                                    <div>
                                      <span class="text-[9px] text-outline block mb-0.5">Hora Inicio:</span>
                                      <input 
                                        type="time" 
                                        [(ngModel)]="block.startTime"
                                        class="w-full px-2 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono font-bold text-xs focus:outline-none focus:border-amber-400 transition-all"
                                      />
                                    </div>

                                    <div>
                                      <span class="text-[9px] text-outline block mb-0.5">Hora Fin:</span>
                                      <input 
                                        type="time" 
                                        [(ngModel)]="block.endTime"
                                        class="w-full px-2 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono font-bold text-xs focus:outline-none focus:border-amber-400 transition-all"
                                      />
                                    </div>
                                  </div>

                                  @if (isBlockConflicting(block)) {
                                    <div class="p-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-[9px] font-bold flex items-center gap-1">
                                      <span class="material-symbols-outlined text-xs text-red-400">warning</span>
                                      <span>⚠️ ¡Traslape detectado en esta tanda!</span>
                                    </div>
                                  }
                                </div>
                              }
                            </div>

                            <div class="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 border-2 border-amber-400/60 flex items-center justify-between text-xs font-bold text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                              <span class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm text-amber-400">timer</span> Total Horas:
                              </span>
                              <span class="text-xs sm:text-sm font-black font-mono text-amber-400">
                                {{ totalCalculatedShowHours() }} Horas ({{ showBlocks().length }} Tandas)
                              </span>
                            </div>

                          </div>
                        }

                        <div class="space-y-1">
                          <label class="text-[9px] font-black text-outline uppercase tracking-wider block flex items-center justify-between">
                            <span>Explicación / Propuesta de Horarios Sugeridos</span>
                            <span class="text-amber-400 font-bold">(Opcional)</span>
                          </label>
                          <textarea 
                            [ngModel]="scheduleChangeExplanation()"
                            (ngModelChange)="scheduleChangeExplanation.set($event)"
                            rows="2"
                            placeholder="Ej. Se propone ajustar el show a las 19:30 hrs..."
                            class="w-full p-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-amber-400 transition-all resize-none shadow-inner"
                          ></textarea>
                        </div>

                        <div class="pt-2 border-t border-outline-variant/20 flex items-center justify-end">
                          <button 
                            (click)="adminStep.set(2)"
                            class="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-hover font-black text-[11px] sm:text-xs shadow-lg shadow-primary/20 transition-all flex items-center gap-1 ml-auto"
                          >
                            Siguiente: Costos <span class="material-symbols-outlined text-xs sm:text-sm">arrow_forward</span>
                          </button>
                        </div>

                      </div>
                    }

                    @if (adminStep() === 2) {
                      <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3.5 sm:space-y-4 shadow-2xl backdrop-blur-xl">
                        <div class="border-b border-outline-variant/20 pb-2.5">
                          <span class="text-[9px] font-black text-primary uppercase tracking-widest block">PASO 2 DE 3</span>
                          <h4 class="text-xs sm:text-sm md:text-base font-black text-on-surface">Asignación de Honorarios & Comisiones</h4>
                        </div>

                        <div class="h-0.5 w-full bg-gradient-to-r from-purple-400 via-cyan-400 to-transparent rounded-full -mt-2"></div>

                        <div class="space-y-2.5 text-xs">
                          
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div class="space-y-1">
                              <label class="text-[9px] font-black text-outline uppercase tracking-wider block">Honorarios Grupo ($ MXN)</label>
                              <input 
                                type="number" 
                                [ngModel]="proposalArtistFee()"
                                (ngModelChange)="proposalArtistFee.set($event)"
                                step="1000"
                                class="w-full px-2.5 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-all"
                              />
                            </div>

                            <div class="space-y-1">
                              <label class="text-[9px] font-black text-outline uppercase tracking-wider block">Viáticos & Hospedaje ($ MXN)</label>
                              <input 
                                type="number" 
                                [ngModel]="proposalViaticosCost()"
                                (ngModelChange)="proposalViaticosCost.set($event)"
                                step="500"
                                class="w-full px-2.5 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-all"
                              />
                            </div>
                          </div>

                          <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2 shadow-md">
                            
                            <div class="flex items-center justify-between gap-2">
                              <div>
                                <span class="text-xs font-black text-purple-300 block flex items-center gap-1">
                                  <span class="material-symbols-outlined text-xs text-purple-400">payments</span> Comisión Disquera (%):
                                </span>
                                <span class="text-[9px] text-outline">Utilidad por gestión comercial</span>
                              </div>
                              <div class="flex items-center gap-1 shrink-0">
                                <input 
                                  type="number" 
                                  [ngModel]="proposalMarginPercent()"
                                  (ngModelChange)="proposalMarginPercent.set($event)"
                                  min="0" max="100"
                                  class="w-14 px-2 py-1 text-center rounded-xl bg-surface-container-high border border-purple-500/40 text-purple-300 font-black text-xs focus:outline-none focus:border-purple-400 transition-all"
                                />
                                <span class="font-bold text-purple-300">%</span>
                              </div>
                            </div>

                            <div class="flex items-center justify-between border-t border-outline-variant/20 pt-2 text-xs">
                              <div class="flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-sm text-cyan-400">verified</span>
                                <div>
                                  <span class="font-black text-cyan-400 block text-[11px]">Uso de Plataforma (5% Fijo):</span>
                                  <span class="text-[9px] text-outline">Gestión de cotización en línea</span>
                                </div>
                              </div>
                              <span class="font-black text-cyan-300 text-xs font-mono">+&#36;{{ calculatedPlatformFee() | number:'1.0-0' }} MXN</span>
                            </div>

                          </div>

                          <div class="space-y-1.5 pt-1 border-t border-outline-variant/10">
                            <label class="text-[9px] font-black text-outline uppercase tracking-wider block">Equipo de Audio & Soundcheck</label>
                            
                            <div class="grid grid-cols-2 gap-2">
                              <button 
                                (click)="proposalSoundOption.set('proveedor')"
                                [class]="proposalSoundOption() === 'proveedor' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-surface-container text-outline border-outline-variant/20'"
                                class="py-1.5 px-2 rounded-xl border text-[10px] sm:text-xs text-center transition-all"
                              >
                                Con Equipo ($ Costo)
                              </button>

                              <button 
                                (click)="proposalSoundOption.set('cliente')"
                                [class]="proposalSoundOption() === 'cliente' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-surface-container text-outline border-outline-variant/20'"
                                class="py-1.5 px-2 rounded-xl border text-[10px] sm:text-xs text-center transition-all"
                              >
                                Sin Equipo ($0 MXN)
                              </button>
                            </div>

                            @if (proposalSoundOption() === 'proveedor') {
                              <input 
                                type="number" 
                                [ngModel]="proposalSoundCost()"
                                (ngModelChange)="proposalSoundCost.set($event)"
                                step="1000"
                                placeholder="Costo de Equipo de Audio"
                                class="w-full px-2.5 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs focus:outline-none focus:border-purple-400 transition-all mt-1"
                              />
                            }
                          </div>

                          <div class="flex items-center gap-2 pt-1.5 border-t border-outline-variant/10">
                            <input 
                              type="checkbox" 
                              id="includeIva" 
                              [ngModel]="proposalIncludeIva()"
                              (ngModelChange)="proposalIncludeIva.set($event)"
                              class="w-3.5 h-3.5 rounded accent-amber-400 cursor-pointer"
                            />
                            <label for="includeIva" class="text-[11px] font-bold text-on-surface cursor-pointer select-none">
                              Incluir Impuesto IVA (+16% Facturado)
                            </label>
                          </div>

                        </div>

                        <div class="p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container border-2 border-amber-400/60 space-y-1.5 shadow-[0_0_35px_rgba(251,191,36,0.35)] relative overflow-hidden">
                          <div class="flex items-center justify-between text-[11px] text-outline">
                            <span>Subtotal Servicios:</span>
                            <span class="font-bold text-on-surface font-mono">&#36;{{ calculatedSubtotal() | number:'1.0-0' }} MXN</span>
                          </div>
                          <div class="flex items-center justify-between text-[11px] text-purple-300">
                            <span>Margen Disquera ({{ proposalMarginPercent() }}%):</span>
                            <span class="font-bold font-mono">&#36;{{ calculatedDisqueraMargin() | number:'1.0-0' }} MXN</span>
                          </div>
                          <div class="flex items-center justify-between text-[11px] text-cyan-400">
                            <span>Uso de Plataforma (5%):</span>
                            <span class="font-bold font-mono">&#36;{{ calculatedPlatformFee() | number:'1.0-0' }} MXN</span>
                          </div>
                          @if (proposalIncludeIva()) {
                            <div class="flex items-center justify-between text-[11px] text-blue-300">
                              <span>Impuesto IVA (16%):</span>
                              <span class="font-bold font-mono">&#36;{{ calculatedIvaAmount() | number:'1.0-0' }} MXN</span>
                            </div>
                          }
                          <div class="flex items-center justify-between text-xs sm:text-sm font-black pt-2 border-t border-outline-variant/20">
                            <span class="text-amber-300 font-sans uppercase tracking-wider">TOTAL COMERCIAL FINAL:</span>
                            <span class="text-lg sm:text-2xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                              &#36;{{ calculatedTotalAmount() | number:'1.0-0' }} MXN
                            </span>
                          </div>
                        </div>

                        <div class="pt-2.5 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                          <button 
                            (click)="adminStep.set(1)"
                            class="px-3.5 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-[11px] sm:text-xs hover:bg-surface-container-highest transition-all flex items-center gap-1"
                          >
                            <span class="material-symbols-outlined text-xs">arrow_back</span> Anterior
                          </button>

                          <button 
                            (click)="adminStep.set(3)"
                            class="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-hover font-black text-[11px] sm:text-xs shadow-lg shadow-primary/20 transition-all flex items-center gap-1 ml-auto"
                          >
                            Siguiente: Envío <span class="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    }

                    @if (adminStep() === 3) {
                      <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3.5 sm:space-y-4 shadow-2xl backdrop-blur-xl">
                        <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                          <div>
                            <span class="text-[9px] font-black text-primary uppercase tracking-widest block">PASO 3 DE 3</span>
                            <h4 class="text-xs sm:text-sm md:text-base font-black text-on-surface">Revisión Completa & Envío Comercial</h4>
                          </div>
                          <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            VERIFICADO
                          </span>
                        </div>

                        <div class="h-0.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-transparent rounded-full -mt-2"></div>

                        <div class="p-3.5 sm:p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-3 text-xs shadow-inner">
                          <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                            <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs">receipt_long</span> RESUMEN EJECUTIVO DE LA PROPUESTA
                            </span>
                          </div>

                          @if (scheduleMode() === 'continuo') {
                            <div class="p-2.5 rounded-xl bg-surface-container-high border border-amber-500/30 flex items-center justify-between font-mono text-xs">
                              <span class="text-outline font-sans">Fecha Propuesta:</span>
                              <strong class="text-amber-300 font-black text-xs sm:text-sm flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs text-amber-400">calendar_today</span> {{ proposalDate() }}
                              </strong>
                            </div>
                          }

                          <div class="space-y-1 bg-surface-container-high/50 p-2.5 rounded-xl border border-outline-variant/20 font-mono text-[10px] sm:text-[11px]">
                            <span class="text-[8px] font-black text-amber-300 uppercase block font-sans">ESTRUCTURA Y HORARIOS CONFIGURADOS:</span>
                            @if (scheduleMode() === 'continuo') {
                              <div class="flex justify-between text-on-surface">
                                <span>• Franja Única Continuada:</span>
                                <strong class="text-amber-300">{{ singleStartTime() }} a {{ calculatedSingleEndTime() }} ({{ singleDurationHours() }} hrs)</strong>
                              </div>
                            } @else {
                              @for (blk of showBlocks(); track blk.id) {
                                <div class="flex justify-between text-on-surface">
                                  <span>• {{ blk.label }}:</span>
                                  <strong class="text-amber-300">
                                    {{ blk.date || proposalDate() }} | {{ blk.startTime }} a {{ blk.endTime }} ({{ getBlockDuration(blk.startTime, blk.endTime) }} hrs)
                                  </strong>
                                </div>
                              }
                            }
                          </div>

                          <div class="space-y-1.5 text-[10px] sm:text-[11px] text-outline font-mono pt-1 border-t border-outline-variant/10">
                            <div class="flex justify-between"><span>Honorarios Grupo:</span> <strong class="text-on-surface">&#36;{{ proposalArtistFee() | number:'1.0-0' }} MXN</strong></div>
                            <div class="flex justify-between"><span>Viáticos & Hospedaje:</span> <strong class="text-on-surface">&#36;{{ proposalViaticosCost() | number:'1.0-0' }} MXN</strong></div>
                            <div class="flex justify-between"><span>Equipo Audio:</span> <strong class="text-purple-300">&#36;{{ (proposalSoundOption() === 'proveedor' ? proposalSoundCost() : 0) | number:'1.0-0' }} MXN ({{ proposalSoundOption() === 'proveedor' ? 'Incluido' : 'Por Cliente' }})</strong></div>
                            <div class="flex justify-between text-purple-300"><span>Margen Disquera ({{ proposalMarginPercent() }}%):</span> <strong>&#36;{{ calculatedDisqueraMargin() | number:'1.0-0' }} MXN</strong></div>
                            <div class="flex justify-between text-cyan-400"><span>Plataforma Acordex (5% Fijo):</span> <strong>&#36;{{ calculatedPlatformFee() | number:'1.0-0' }} MXN</strong></div>
                            @if (proposalIncludeIva()) {
                              <div class="flex justify-between text-blue-300"><span>IVA (+16% Facturado):</span> <strong>&#36;{{ calculatedIvaAmount() | number:'1.0-0' }} MXN</strong></div>
                            }
                            <div class="flex justify-between text-amber-400 text-xs sm:text-sm font-black pt-2 border-t border-outline-variant/20 font-sans">
                              <span>MONTO TOTAL COMERCIAL:</span>
                              <span>&#36;{{ calculatedTotalAmount() | number:'1.0-0' }} MXN</span>
                            </div>
                          </div>

                          @if (scheduleChangeExplanation()) {
                            <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1 font-sans">
                              <span class="text-[9px] font-black uppercase block">EXPLICACIÓN DE HORARIOS / FECHA:</span>
                              <p class="italic text-[10px] sm:text-[11px]">"{{ scheduleChangeExplanation() }}"</p>
                            </div>
                          }
                        </div>

                        <!-- PLATAFORMAS DE NOTIFICACIÓN INTERACTIVAS (REEMPLAZO DE LISTA DE VERIFICACIÓN) -->
                        <div class="p-3 sm:p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2.5 text-xs shadow-sm">
                          <div class="flex items-center justify-between">
                            <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs">send</span> PLATAFORMAS DE ENVÍO DE NOTIFICACIÓN
                            </span>
                            <span class="text-[9px] text-outline font-bold">Mínimo 1 requerida</span>
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <!-- PLATAFORMA 1: WHATSAPP -->
                            <button 
                              (click)="sendNotificationWhatsApp.set(!sendNotificationWhatsApp())"
                              [class]="sendNotificationWhatsApp() ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                              class="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2"
                            >
                              <span class="material-symbols-outlined text-base text-emerald-400">chat</span>
                              <div class="truncate">
                                <span class="font-black block text-[11px]">WhatsApp</span>
                                <span class="text-[8px] opacity-80">Aviso directo al cliente</span>
                              </div>
                            </button>

                            <!-- PLATAFORMA 2: EMAIL -->
                            <button 
                              (click)="sendNotificationEmail.set(!sendNotificationEmail())"
                              [class]="sendNotificationEmail() ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.25)]' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                              class="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2"
                            >
                              <span class="material-symbols-outlined text-base text-blue-400">mail</span>
                              <div class="truncate">
                                <span class="font-black block text-[11px]">Correo Email</span>
                                <span class="text-[8px] opacity-80">Formato formal PDF</span>
                              </div>
                            </button>

                            <!-- PLATAFORMA 3: PLATAFORMA ACORDEX -->
                            <button 
                              (click)="sendNotificationAcordex.set(!sendNotificationAcordex())"
                              [class]="sendNotificationAcordex() ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                              class="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2"
                            >
                              <span class="material-symbols-outlined text-base text-cyan-400">space_dashboard</span>
                              <div class="truncate">
                                <span class="font-black block text-[11px]">Portal Acordex</span>
                                <span class="text-[8px] opacity-80">Notificación In-App</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        <div class="space-y-1">
                          <label class="text-[9px] font-black text-outline uppercase tracking-wider block">Comentarios Adicionales / Cláusulas Especiales</label>
                          <textarea 
                            [ngModel]="additionalComments()"
                            (ngModelChange)="additionalComments.set($event)"
                            rows="2"
                            placeholder="Ingresa notas sobre el show, horario de soundcheck, viáticos..."
                            class="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-cyan-400 transition-all resize-none"
                          ></textarea>
                        </div>

                        <div class="pt-2.5 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
                          <button 
                            (click)="adminStep.set(2)"
                            class="px-3.5 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-[11px] sm:text-xs hover:bg-surface-container-highest transition-all flex items-center gap-1"
                          >
                            <span class="material-symbols-outlined text-xs">arrow_back</span> Anterior
                          </button>

                          <button 
                            (click)="sendProposal()"
                            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-white font-black text-[11px] sm:text-xs shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 flex items-center gap-1.5 ml-auto hover:scale-105"
                          >
                            <span class="material-symbols-outlined text-base">send</span> ENVIAR PROPUESTA SELECCIONADA
                          </button>
                        </div>
                      </div>
                    }

                  </div>

                </div>

              </div>
            }

            <!-- ========================================================================= -->
            <!-- SPECIALIZED WORKFLOW FOR STATE: 'Negociación' (COMMERCIAL RE-NEGOTIATION) -->
            <!-- ========================================================================= -->
            @if (selectedQuote()?.state === 'Negociación') {
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 h-full items-start overflow-hidden">
                
                <!-- LEFT COLUMN: FULL CLIENT CREDENTIALS + REJECTION FEEDBACK + SPECIFICATIONS (6 COLS) -->
                <div class="lg:col-span-6 h-full min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-3 bg-gradient-to-br from-surface-container-high/80 via-surface-container/90 to-surface-container-high/70 p-3.5 sm:p-4.5 md:p-5 rounded-2xl sm:rounded-3xl border-2 border-amber-500/50 shadow-[0_0_35px_rgba(251,191,36,0.2)] backdrop-blur-2xl">
                  
                  <div class="border-b border-outline-variant/30 pb-2 shrink-0">
                    <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-amber-400">handshake</span> FASE DE NEGOCIACIÓN COMERCIAL
                    </span>
                    <h4 class="text-xs sm:text-sm md:text-base font-black text-on-surface">Expediente de Respuesta del Cliente</h4>
                  </div>

                  <div class="h-0.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-transparent rounded-full -mt-2 shrink-0"></div>

                  <!-- ARTIST COVER PICTURE AND RATING -->
                  <div class="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl group border-2 border-amber-400/60 shrink-0">
                    <img 
                      [src]="selectedQuote()?.artistImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80'" 
                      alt="Artist Cover"
                      class="w-full h-28 sm:h-32 md:h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                    <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <div>
                        <span class="text-[8px] sm:text-[9px] font-bold text-amber-300 uppercase tracking-widest block">AGRUPACIÓN SOLICITADA</span>
                        <h4 class="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] truncate">
                          {{ selectedQuote()?.groupName }}
                        </h4>
                      </div>
                      <span class="px-2 sm:px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-amber-300 font-black text-[9px] sm:text-xs border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center gap-1 shrink-0">
                        <span class="material-symbols-outlined text-amber-400 text-xs">star</span> {{ selectedQuote()?.rating || '4.8' }} / 5.0
                      </span>
                    </div>
                  </div>

                  <!-- HIGHLIGHTED CLIENT REJECTION / COUNTER-PROPOSAL FEEDBACK CARD -->
                  <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-surface-container to-amber-500/10 border-2 border-amber-400/70 space-y-2.5 shadow-[0_0_30px_rgba(251,191,36,0.25)] relative overflow-hidden shrink-0">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-base text-amber-400">feedback</span> MOTIVO DE RECHAZO / CONTRAPROPUESTA
                      </span>
                      <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/30 text-amber-200 border border-amber-400/50">
                        RECIBIDO DEL CLIENTE
                      </span>
                    </div>

                    <p class="text-xs sm:text-sm text-on-surface font-medium italic leading-relaxed bg-black/40 p-3 rounded-xl border border-amber-400/30 shadow-inner">
                      "{{ clientRejectionFeedback() }}"
                    </p>

                    <div class="flex items-center justify-between text-[10px] text-amber-200/80 pt-1 font-mono">
                      <span>• Cotización Enviada Previa: <strong>&#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</strong></span>
                    </div>
                  </div>

                  <!-- CLIENT CONTACT INFORMATION -->
                  <div class="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container/90 border border-outline-variant/30 space-y-2 text-xs shadow-md backdrop-blur-xl relative overflow-hidden shrink-0">
                    <span class="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest block flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-blue-400">badge</span> DATOS DEL CLIENTE CONTRATANTE
                    </span>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-outline text-[9px] block">Nombre Completo:</span>
                        <p class="font-bold text-on-surface text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-outline">person</span> {{ selectedQuote()?.clientName }}
                        </p>
                      </div>
                      <div>
                        <span class="text-outline text-[9px] block">Empresa / Razón Social:</span>
                        <p class="font-bold text-on-surface text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-outline">domain</span> {{ selectedQuote()?.clientCompany }}
                        </p>
                      </div>
                      <div>
                        <span class="text-outline text-[9px] block">Correo Electrónico:</span>
                        <p class="font-bold text-primary text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-primary">mail</span> {{ selectedQuote()?.clientEmail }}
                        </p>
                      </div>
                      <div>
                        <span class="text-outline text-[9px] block">Teléfono / Celular:</span>
                        <p class="font-bold text-on-surface text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-outline">call</span> {{ selectedQuote()?.representativePhone || '+52 81 1234 5678' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- ORIGINAL BASE REQUEST RECAP SPECIFICATIONS TICKET -->
                  <div class="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container/90 border border-outline-variant/30 space-y-2.5 text-xs shadow-md shrink-0">
                    <div class="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                      <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs text-amber-400">confirmation_number</span> REQUERIMIENTO BASE ORIGINAL
                      </span>
                      <span class="font-mono text-[8px] sm:text-[9px] tracking-widest text-amber-300/60 uppercase">
                        #SOL-{{ selectedQuote()?.id }}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-outline text-[9px] block">Tipo de Evento:</span>
                        <span class="font-black text-on-surface text-xs sm:text-sm flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-amber-400">celebration</span> {{ selectedQuote()?.eventType || 'Boda' }}
                        </span>
                      </div>

                      <div>
                        <span class="text-outline text-[9px] block">Fecha Solicitada por Cliente:</span>
                        <span class="font-black text-emerald-400 font-mono text-xs sm:text-sm flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-emerald-400">calendar_today</span> {{ selectedQuote()?.proposedDate }}
                        </span>
                      </div>

                      <div class="col-span-1 sm:col-span-2 space-y-1">
                        <span class="text-outline text-[9px] block">Duración Solicitada por Cliente:</span>
                        <div class="p-2 sm:p-2.5 rounded-xl bg-surface-container-high border border-amber-500/30 flex items-center justify-between shadow-inner">
                          <span class="font-black text-amber-300 font-mono text-xs sm:text-sm flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm text-amber-400">timer</span> {{ selectedQuote()?.durationHours || 3 }} Horas Solicitadas
                          </span>
                          <span class="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Base Cliente
                          </span>
                        </div>
                        <span class="text-[10px] sm:text-xs text-on-surface font-mono font-bold block opacity-90 pt-0.5 flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-amber-400">schedule</span> Horario: 14:30 a 17:30 hrs (Franja Continuada)
                        </span>
                      </div>

                      <div class="col-span-1 sm:col-span-2 border-t border-outline-variant/10 pt-1.5">
                        <span class="text-outline text-[9px] block">Ubicación / Recinto:</span>
                        <p class="font-bold text-on-surface text-xs sm:text-sm truncate flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-primary">location_on</span> {{ selectedQuote()?.eventAddress || (selectedQuote()?.venue + ', ' + selectedQuote()?.city) }}
                        </p>
                      </div>

                      <div class="col-span-1 sm:col-span-2 pt-1 border-t border-outline-variant/10">
                        <span class="text-outline text-[9px] block">Notas Especiales del Cliente:</span>
                        <p class="text-xs text-on-surface/90 italic bg-surface-container-high/60 p-2 sm:p-2.5 rounded-xl border border-outline-variant/20 shadow-inner">
                          "{{ selectedQuote()?.notes || 'Sin especificaciones adicionales enviadas por el cliente' }}"
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    (click)="contactWhatsApp()"
                    class="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] shrink-0"
                  >
                    <span class="material-symbols-outlined text-base sm:text-lg">chat</span> NEGOCIAR DIRECTAMENTE POR WHATSAPP
                  </button>

                </div>

                <!-- RIGHT COLUMN: INTERACTIVE RE-NEGOTIATION WIZARD FOR ADMIN (6 COLS) -->
                <div class="lg:col-span-6 flex flex-col h-full min-h-0 space-y-3 overflow-hidden">
                  
                  <!-- STEP NAVIGATION TABS FOR NEGOTIATION WIZARD -->
                  <div class="p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-surface-container-high border border-outline-variant/30 grid grid-cols-3 gap-1 text-xs shadow-inner shrink-0">
                    <button 
                      (click)="negotiationStep.set(1)"
                      [class]="negotiationStep() === 1 ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-[1.02]' : 'text-outline hover:text-on-surface'"
                      class="py-2 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-all text-center font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 truncate"
                    >
                      <span>1.</span> Agenda & Horarios
                    </button>

                    <button 
                      (click)="negotiationStep.set(2)"
                      [class]="negotiationStep() === 2 ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-[1.02]' : 'text-outline hover:text-on-surface'"
                      class="py-2 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-all text-center font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 truncate"
                    >
                      <span>2.</span> Descuento Atractivo
                    </button>

                    <button 
                      (click)="negotiationStep.set(3)"
                      [class]="negotiationStep() === 3 ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-[1.02]' : 'text-outline hover:text-on-surface'"
                      class="py-2 sm:py-2.5 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-all text-center font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 truncate"
                    >
                      <span>3.</span> Re-enviar Propuesta
                    </button>
                  </div>

                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 sm:space-y-4">
                    
                    <!-- STEP 1: HORARIOS Y AJUSTE EN NEGOCIACIÓN (COMPLETO CON EDITOR DE TANDAS Y BUSCADOR DE AGENDA) -->
                    @if (negotiationStep() === 1) {
                      <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3.5 sm:space-y-4 shadow-2xl backdrop-blur-xl">
                        
                        <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                          <div>
                            <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest block">PASO 1 DE 3 DE NEGOCIACIÓN</span>
                            <h4 class="text-xs sm:text-sm md:text-base font-black text-on-surface">Agenda & Configuración de Tiempos</h4>
                          </div>

                          <button 
                            (click)="openFullCalendarModal()"
                            class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 shadow-sm shrink-0"
                          >
                            <span class="material-symbols-outlined text-sm">calendar_month</span> Ver Mes / Año
                          </button>
                        </div>

                        <div class="h-0.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-transparent rounded-full -mt-2.5"></div>

                        <!-- AGENDA CALENDAR BUSY SLOTS FOR ARTIST -->
                        <div class="space-y-2">
                          <div class="flex items-center justify-between">
                            <label class="text-[9px] sm:text-[10px] font-black text-outline uppercase tracking-wider block flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-primary">event_available</span>
                              AGENDA DE {{ selectedQuote()?.groupName }} EL {{ proposalDate() }}:
                            </label>
                            <span class="text-[9px] sm:text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Agenda Disquera
                            </span>
                          </div>

                          <div class="space-y-1.5 bg-surface-container p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-outline-variant/30 shadow-inner relative">
                            @for (ev of mockGroupEvents; track ev.id) {
                              <div [class]="ev.color" class="p-2 sm:p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono shadow-sm">
                                <div class="space-y-0.5">
                                  <div class="flex items-center gap-1.5 font-sans font-black text-on-surface text-[10px] sm:text-xs">
                                    <span>{{ ev.title }}</span>
                                    <span class="px-1 py-0.5 rounded text-[7px] font-mono font-bold uppercase bg-black/40 border border-current">
                                      {{ ev.status }}
                                    </span>
                                  </div>
                                  <span class="text-[9px] opacity-80 block font-sans">Contratante: <strong>{{ ev.clientName }}</strong> • {{ ev.location }}</span>
                                </div>
                                <div class="text-right shrink-0">
                                  <span class="font-black text-[10px] sm:text-xs block text-amber-300 font-mono">{{ ev.startTime }} - {{ ev.endTime }}</span>
                                </div>
                              </div>
                            }
                          </div>
                        </div>

                        <!-- STRUCTURE TOGGLE: CONTINUOUS VS TANDAS -->
                        <div class="space-y-1.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 shadow-inner">
                          <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block">Estructura Propuesta en Negociación</span>
                          
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button 
                              (click)="scheduleMode.set('continuo')"
                              [class]="scheduleMode() === 'continuo' ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-md' : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'"
                              class="py-2 px-2.5 rounded-xl border text-[10px] sm:text-xs text-center transition-all flex items-center justify-center gap-1.5"
                            >
                              <span class="material-symbols-outlined text-xs sm:text-sm">schedule</span> Franja Única Continuada
                            </button>

                            <button 
                              (click)="scheduleMode.set('tandas')"
                              [class]="scheduleMode() === 'tandas' ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-md' : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'"
                              class="py-2 px-2.5 rounded-xl border text-[10px] sm:text-xs text-center transition-all flex items-center justify-center gap-1.5"
                            >
                              <span class="material-symbols-outlined text-xs sm:text-sm">layers</span> Tandas / Bloques Fragmentados
                            </button>
                          </div>
                        </div>

                        <!-- CONTINUOUS MODE CONFIGURATION -->
                        @if (scheduleMode() === 'continuo') {
                          <div class="space-y-3">
                            <div class="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1.5 shadow-inner">
                              <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-wider block">Fecha Propuesta para el Show</span>
                              
                              <div class="flex items-center gap-3">
                                <div class="flex-1">
                                  <input 
                                    type="date" 
                                    [ngModel]="proposalDate()"
                                    (ngModelChange)="proposalDate.set($event)"
                                    class="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-all"
                                  />
                                </div>
                              </div>
                            </div>

                            <div class="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2.5 shadow-md">
                              <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block">Configuración de Franja Única Continuada</span>
                              
                              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span class="text-outline text-[9px] block mb-1">Hora Inicio:</span>
                                  <input 
                                    type="time" 
                                    [ngModel]="singleStartTime()"
                                    (ngModelChange)="singleStartTime.set($event)"
                                    class="w-full px-2 py-1 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono font-bold text-xs focus:outline-none focus:border-amber-400 transition-all"
                                  />
                                </div>

                                <div>
                                  <span class="text-outline text-[9px] block mb-1">Duración (Horas):</span>
                                  <select 
                                    [ngModel]="singleDurationHours()"
                                    (ngModelChange)="singleDurationHours.set(Number($event))"
                                    class="w-full px-2 py-1 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs focus:outline-none focus:border-amber-400 transition-all"
                                  >
                                    <option [value]="0.5">0.5 hrs (30 min)</option>
                                    <option [value]="1.0">1.0 hr (60 min)</option>
                                    <option [value]="1.5">1.5 hrs (90 min)</option>
                                    <option [value]="2.0">2.0 hrs (120 min)</option>
                                    <option [value]="2.5">2.5 hrs (150 min)</option>
                                    <option [value]="3.0">3.0 hrs (180 min)</option>
                                    <option [value]="3.5">3.5 hrs (210 min)</option>
                                    <option [value]="4.0">4.0 hrs (240 min)</option>
                                    <option [value]="5.0">5.0 hrs</option>
                                  </select>
                                </div>

                                <div>
                                  <span class="text-outline text-[9px] block mb-1">Hora Fin (Auto):</span>
                                  <input 
                                    type="time" 
                                    readonly
                                    [ngModel]="calculatedSingleEndTime()"
                                    class="w-full px-2 py-1 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 text-amber-300 font-mono font-bold text-xs cursor-not-allowed"
                                  />
                                </div>
                              </div>

                              @if (isSingleModeConflicting()) {
                                <div class="p-2 rounded-xl bg-red-500/20 border-2 border-red-500/60 text-red-300 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
                                  <span class="material-symbols-outlined text-sm text-red-400">warning</span>
                                  <span>⚠️ ¡Traslape detectado en esta franja continuada!</span>
                                </div>
                              }
                            </div>
                          </div>
                        }

                        <!-- TANDAS MODE CONFIGURATION WITH FULL ADD/EDIT/DELETE CONTROLS -->
                        @if (scheduleMode() === 'tandas') {
                          <div class="space-y-2.5 p-3 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 shadow-inner">
                            <div class="flex items-center justify-between">
                              <div>
                                <span class="text-xs font-black text-amber-400 uppercase tracking-wider block">Configuración de Tandas</span>
                                <span class="text-[9px] text-outline">Agrega franjas de tiempo fraccionadas</span>
                              </div>
                              <button 
                                (click)="addShowBlock()"
                                class="px-2.5 py-1 rounded-xl bg-amber-500 text-black font-extrabold text-[10px] sm:text-xs hover:bg-amber-400 transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(251,191,36,0.35)] hover:scale-105 shrink-0"
                              >
                                <span class="material-symbols-outlined text-xs">add</span> + Tanda
                              </button>
                            </div>

                            <div class="space-y-2">
                              @for (block of showBlocks(); track block.id; let idx = $index) {
                                <div 
                                  [class]="isBlockConflicting(block) ? 'border-red-500/80 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 'border-outline-variant/30 bg-surface-container-high/80'"
                                  class="p-2.5 rounded-xl border space-y-1.5 transition-all relative shadow-sm"
                                >
                                  <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-1.5 flex-1 mr-2">
                                      <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center shrink-0">
                                        {{ idx + 1 }}
                                      </span>
                                      <input 
                                        type="text" 
                                        [(ngModel)]="block.label"
                                        placeholder="Nombre de la tanda (ej. Set 1)"
                                        class="w-full px-2 py-1 rounded-xl bg-surface-container border border-outline-variant/20 text-on-surface font-bold text-xs focus:outline-none focus:border-amber-400 transition-all"
                                      />
                                    </div>

                                    <div class="flex items-center gap-1.5 shrink-0">
                                      <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-[10px] border border-amber-500/30">
                                        {{ getBlockDuration(block.startTime, block.endTime) }} hrs
                                      </span>

                                      @if (showBlocks().length > 1) {
                                        <button 
                                          (click)="removeShowBlock(idx)"
                                          class="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                                          title="Eliminar esta tanda"
                                        >
                                          <span class="material-symbols-outlined text-xs">delete</span>
                                        </button>
                                      }
                                    </div>
                                  </div>

                                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                                    <div>
                                      <span class="text-[9px] text-outline block mb-0.5">Fecha del Set:</span>
                                      <input 
                                        type="date" 
                                        [(ngModel)]="block.date"
                                        class="w-full px-2 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono font-bold text-[10px] focus:outline-none focus:border-amber-400 transition-all"
                                      />
                                    </div>
                                    <div>
                                      <span class="text-[9px] text-outline block mb-0.5">Hora Inicio:</span>
                                      <input 
                                        type="time" 
                                        [(ngModel)]="block.startTime"
                                        class="w-full px-2 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono font-bold text-xs focus:outline-none focus:border-amber-400 transition-all"
                                      />
                                    </div>

                                    <div>
                                      <span class="text-[9px] text-outline block mb-0.5">Hora Fin:</span>
                                      <input 
                                        type="time" 
                                        [(ngModel)]="block.endTime"
                                        class="w-full px-2 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono font-bold text-xs focus:outline-none focus:border-amber-400 transition-all"
                                      />
                                    </div>
                                  </div>

                                  @if (isBlockConflicting(block)) {
                                    <div class="p-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-[9px] font-bold flex items-center gap-1">
                                      <span class="material-symbols-outlined text-xs text-red-400">warning</span>
                                      <span>⚠️ ¡Traslape detectado en esta tanda!</span>
                                    </div>
                                  }
                                </div>
                              }
                            </div>

                            <div class="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 border-2 border-amber-400/60 flex items-center justify-between text-xs font-bold text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                              <span class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm text-amber-400">timer</span> Total Horas:
                              </span>
                              <span class="text-xs sm:text-sm font-black font-mono text-amber-400">
                                {{ totalCalculatedShowHours() }} Horas ({{ showBlocks().length }} Tandas)
                              </span>
                            </div>

                          </div>
                        }

                        <div class="space-y-1">
                          <label class="text-[9px] font-black text-amber-400 uppercase tracking-wider block">Propuesta / Mensaje Escrito para la Negociación</label>
                          <textarea 
                            [ngModel]="scheduleChangeExplanation()"
                            (ngModelChange)="scheduleChangeExplanation.set($event)"
                            rows="2"
                            placeholder="Ej. Ofrecemos este precio especial ajustando la hora de inicio a las 20:00 hrs y absorbiendo parte del viático..."
                            class="w-full p-2.5 rounded-xl bg-surface-container border border-amber-500/30 text-xs text-on-surface focus:outline-none focus:border-amber-400 transition-all resize-none shadow-inner"
                          ></textarea>
                        </div>

                        <div class="pt-2 border-t border-outline-variant/20 flex items-center justify-end">
                          <button 
                            (click)="negotiationStep.set(2)"
                            class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[11px] sm:text-xs shadow-md transition-all flex items-center gap-1 ml-auto"
                          >
                            Siguiente: Ajuste & Descuento Comercial <span class="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        </div>

                      </div>
                    }

                    <!-- STEP 2: RE-ESTRUCTURACIÓN DE PRECIO & VARIACIONES CONCEPTUALES POR PORCENTAJE -->
                    @if (negotiationStep() === 2) {
                      <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3.5 sm:space-y-4 shadow-2xl backdrop-blur-xl">
                        
                        <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                          <div>
                            <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest block">PASO 2 DE 3 DE NEGOCIACIÓN</span>
                            <h4 class="text-xs sm:text-sm md:text-base font-black text-on-surface">Re-estructuración de Precio & Variación por Concepto</h4>
                          </div>
                        </div>

                        <div class="h-0.5 w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-transparent rounded-full -mt-2.5"></div>

                        <!-- ITEM BY ITEM ADJUSTMENT INPUTS WITH ORIGINAL AMOUNT ABOVE & PERCENTAGE VARIATION BELOW -->
                        <div class="space-y-3">
                          <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                            Ajuste de Costos por Concepto ($ MXN):
                          </span>

                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            
                            <!-- ITEM 1: HONORARIOS DEL GRUPO -->
                            <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1.5 shadow-sm">
                              <div class="flex items-center justify-between">
                                <span class="font-black text-on-surface text-[11px]">Honorarios Artísticos:</span>
                                <div class="text-right">
                                  <span class="text-[9px] text-outline block font-mono">Original: &#36;{{ (selectedQuote()?.artistFee || 35000) | number:'1.0-0' }} MXN</span>
                                </div>
                              </div>

                              <input 
                                type="number" 
                                [ngModel]="proposalArtistFee()"
                                (ngModelChange)="proposalArtistFee.set($event)"
                                step="1000"
                                class="w-full px-2.5 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-amber-300 font-mono font-black text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                              />

                              <!-- INDIVIDUAL PERCENTAGE VARIATION BELOW -->
                              <div class="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-outline-variant/10">
                                <span class="text-outline">Variación de Costo:</span>
                                @if (artistFeeDiffPercent() < 0) {
                                  <span class="font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    Descuento {{ artistFeeDiffPercent() }}% 🔻
                                  </span>
                                } @else if (artistFeeDiffPercent() > 0) {
                                  <span class="font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    Aumento +{{ artistFeeDiffPercent() }}% 🔺
                                  </span>
                                } @else {
                                  <span class="font-bold text-outline">Sin Cambio (0%)</span>
                                }
                              </div>
                            </div>

                            <!-- ITEM 2: VIÁTICOS Y HOSPEDAJE -->
                            <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1.5 shadow-sm">
                              <div class="flex items-center justify-between">
                                <span class="font-black text-on-surface text-[11px]">Viáticos & Hospedaje:</span>
                                <div class="text-right">
                                  <span class="text-[9px] text-outline block font-mono">Original: &#36;{{ (selectedQuote()?.viaticosCost || 8500) | number:'1.0-0' }} MXN</span>
                                </div>
                              </div>

                              <input 
                                type="number" 
                                [ngModel]="proposalViaticosCost()"
                                (ngModelChange)="proposalViaticosCost.set($event)"
                                step="500"
                                class="w-full px-2.5 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-amber-300 font-mono font-black text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                              />

                              <!-- INDIVIDUAL PERCENTAGE VARIATION BELOW -->
                              <div class="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-outline-variant/10">
                                <span class="text-outline">Variación de Costo:</span>
                                @if (viaticosDiffPercent() < 0) {
                                  <span class="font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    Descuento {{ viaticosDiffPercent() }}% 🔻
                                  </span>
                                } @else if (viaticosDiffPercent() > 0) {
                                  <span class="font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    Aumento +{{ viaticosDiffPercent() }}% 🔺
                                  </span>
                                } @else {
                                  <span class="font-bold text-outline">Sin Cambio (0%)</span>
                                }
                              </div>
                            </div>

                          </div>

                          <!-- SOUND EQUIPMENT SELECTION & COST ADJUSTMENT WITH PERCENTAGE VARIATION -->
                          <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2 shadow-sm">
                            <div class="flex items-center justify-between">
                              <span class="font-black text-purple-300 text-[11px] flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">speaker</span> Equipo de Audio & Rider Técnico:
                              </span>
                              <span class="text-[9px] text-outline font-mono">Original: &#36;{{ (selectedQuote()?.soundCost || 0) | number:'1.0-0' }} MXN</span>
                            </div>

                            <div class="grid grid-cols-2 gap-2">
                              <button 
                                (click)="proposalSoundOption.set('proveedor')"
                                [class]="proposalSoundOption() === 'proveedor' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold shadow-sm' : 'bg-surface-container-high text-outline border-outline-variant/20'"
                                class="py-1.5 px-2 rounded-xl border text-[10px] sm:text-xs text-center transition-all"
                              >
                                Con Equipo ($ Costo)
                              </button>

                              <button 
                                (click)="proposalSoundOption.set('cliente')"
                                [class]="proposalSoundOption() === 'cliente' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold shadow-sm' : 'bg-surface-container-high text-outline border-outline-variant/20'"
                                class="py-1.5 px-2 rounded-xl border text-[10px] sm:text-xs text-center transition-all"
                              >
                                Sin Equipo ($0 MXN)
                              </button>
                            </div>

                            @if (proposalSoundOption() === 'proveedor') {
                              <input 
                                type="number" 
                                [ngModel]="proposalSoundCost()"
                                (ngModelChange)="proposalSoundCost.set($event)"
                                step="1000"
                                placeholder="Costo de Equipo de Audio"
                                class="w-full px-2.5 py-1.5 rounded-xl bg-surface-container-high border border-purple-500/40 text-purple-300 font-mono font-black text-xs focus:outline-none focus:border-purple-400 mt-1"
                              />
                            }

                            <!-- INDIVIDUAL PERCENTAGE VARIATION FOR SOUND BELOW -->
                            <div class="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-outline-variant/10">
                              <span class="text-outline">Variación en Audio:</span>
                              @if (soundDiffPercent() < 0) {
                                <span class="font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  Descuento {{ soundDiffPercent() }}% 🔻
                                </span>
                              } @else if (soundDiffPercent() > 0) {
                                <span class="font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                  Aumento +{{ soundDiffPercent() }}% 🔺
                                </span>
                              } @else {
                                <span class="font-bold text-outline">Sin Cambio (0%)</span>
                              }
                            </div>
                          </div>

                          <!-- DISQUERA MARGIN WITH ONLY ORIGINAL PERCENTAGE % ABOVE AND PERCENTAGE POINT ADJUSTMENT BELOW -->
                          <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2 shadow-sm">
                            <div class="flex items-center justify-between">
                              <div>
                                <span class="font-black text-purple-300 text-[11px] block">Comisión Disquera Comercial (%):</span>
                                <span class="text-[9px] text-outline">Margen de ganancia disquera</span>
                              </div>
                              <div class="text-right">
                                <span class="text-[9px] text-outline font-mono block">Original: {{ originalMarginPercent() }}%</span>
                              </div>
                            </div>

                            <div class="flex items-center gap-1">
                              <input 
                                type="number" 
                                [ngModel]="proposalMarginPercent()"
                                (ngModelChange)="proposalMarginPercent.set($event)"
                                min="0" max="100"
                                class="w-full px-2.5 py-1.5 rounded-xl bg-surface-container-high border border-purple-500/40 text-purple-300 font-mono font-black text-xs sm:text-sm focus:outline-none"
                              />
                              <span class="font-bold text-purple-300 text-xs shrink-0">% Margen</span>
                            </div>

                            <!-- INDIVIDUAL PERCENTAGE VARIATION FOR DISQUERA MARGIN BELOW (BASED DIRECTLY ON ORIGINAL %) -->
                            <div class="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-outline-variant/10">
                              <span class="text-outline">Ajuste en Comisión:</span>
                              @if (marginDiffPoints() < 0) {
                                <span class="font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  Reducción {{ marginDiffPoints() }}% 🔻
                                </span>
                              } @else if (marginDiffPoints() > 0) {
                                <span class="font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                  Incremento +{{ marginDiffPoints() }}% 🔺
                                </span>
                              } @else {
                                <span class="font-bold text-outline">Sin Cambio (0%)</span>
                              }
                            </div>
                          </div>

                          <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 text-xs font-mono">
                            <span class="text-cyan-400 font-sans font-bold">Plataforma Acordex (5% Fijo):</span>
                            <span class="text-cyan-300 font-black">+&#36;{{ calculatedPlatformFee() | number:'1.0-0' }} MXN</span>
                          </div>

                          <div class="flex items-center gap-2 pt-1 border-t border-outline-variant/10">
                            <input 
                              type="checkbox" 
                              id="includeIvaNeg" 
                              [ngModel]="proposalIncludeIva()"
                              (ngModelChange)="proposalIncludeIva.set($event)"
                              class="w-3.5 h-3.5 rounded accent-amber-400 cursor-pointer"
                            />
                            <label for="includeIvaNeg" class="text-[11px] font-bold text-on-surface cursor-pointer select-none">
                              Incluir Impuesto IVA (+16% Facturado)
                            </label>
                          </div>

                        </div>

                        <!-- ITEMIZABLE COMPARATIVE FINANCIAL SUMMARY TABLE -->
                        <div class="p-3.5 rounded-2xl bg-surface-container border-2 border-amber-400/60 space-y-2 font-mono text-xs shadow-inner">
                          <div class="flex justify-between text-outline">
                            <span>Subtotal Servicios Base:</span>
                            <span class="font-bold text-on-surface">&#36;{{ calculatedSubtotal() | number:'1.0-0' }} MXN</span>
                          </div>
                          <div class="flex justify-between text-purple-300">
                            <span>Margen Disquera ({{ proposalMarginPercent() }}%):</span>
                            <span class="font-bold">&#36;{{ calculatedDisqueraMargin() | number:'1.0-0' }} MXN</span>
                          </div>
                          <div class="flex justify-between text-cyan-400"><span>Plataforma Acordex (5% Fijo):</span> <span class="font-bold">&#36;{{ calculatedPlatformFee() | number:'1.0-0' }} MXN</span></div>
                          @if (proposalIncludeIva()) {
                            <div class="flex justify-between text-blue-300"><span>Impuesto IVA (16%):</span> <span class="font-bold">&#36;{{ calculatedIvaAmount() | number:'1.0-0' }} MXN</span></div>
                          }
                          <div class="flex justify-between text-amber-300 text-sm font-black pt-2 border-t border-outline-variant/20 font-sans">
                            <span>NUEVO TOTAL NEGOCIADO:</span>
                            <span class="text-lg font-black font-mono text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                              &#36;{{ calculatedTotalAmount() | number:'1.0-0' }} MXN
                            </span>
                          </div>
                        </div>

                        <div class="pt-2.5 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                          <button 
                            (click)="negotiationStep.set(1)"
                            class="px-3.5 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-[11px] sm:text-xs flex items-center gap-1"
                          >
                            <span class="material-symbols-outlined text-xs">arrow_back</span> Anterior
                          </button>

                          <button 
                            (click)="negotiationStep.set(3)"
                            class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[11px] sm:text-xs shadow-md transition-all flex items-center gap-1 ml-auto"
                          >
                            Siguiente: Re-enviar <span class="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    }

                    <!-- STEP 3: REVISIÓN COMPLETA Y DESGLOSE DETALLADO DE AJUSTES EN NEGOCIACIÓN (REMOVED 'DESTINO' & ADDED INTERACTIVE PLATFORM SELECTOR) -->
                    @if (negotiationStep() === 3) {
                      <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3.5 sm:space-y-4 shadow-2xl backdrop-blur-xl">
                        
                        <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                          <div>
                            <span class="text-[9px] font-black text-amber-400 uppercase tracking-widest block">PASO 3 DE 3 DE NEGOCIACIÓN</span>
                            <h4 class="text-xs sm:text-sm md:text-base font-black text-on-surface">Revisión & Desglose de Ajustes Negociados</h4>
                          </div>
                          <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            LISTO PARA RE-ENVIAR
                          </span>
                        </div>

                        <div class="h-0.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-transparent rounded-full -mt-2"></div>

                        <!-- FULL EXECUTIVE RECAP COMPARISON CARD (WITHOUT 'DESTINO' HEADER TEXT) -->
                        <div class="p-4 rounded-2xl bg-surface-container border-2 border-amber-400/60 space-y-3 text-xs shadow-inner">
                          
                          <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                            <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs">receipt_long</span> DESGLOSE COMPLETO DE AJUSTES NEGOCIADOS
                            </span>
                          </div>

                          <!-- SCHEDULE RECAP -->
                          <div class="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-1 font-mono text-[11px]">
                            <span class="text-[8px] font-black text-amber-300 uppercase block font-sans">ESTRUCTURA DE HORARIOS PROPUESTA:</span>
                            @if (scheduleMode() === 'continuo') {
                              <div class="flex justify-between text-on-surface">
                                <span>• Franja Única Continuada:</span>
                                <strong class="text-amber-300">{{ singleStartTime() }} a {{ calculatedSingleEndTime() }} ({{ singleDurationHours() }} hrs)</strong>
                              </div>
                            } @else {
                              @for (blk of showBlocks(); track blk.id) {
                                <div class="flex justify-between text-on-surface">
                                  <span>• {{ blk.label }}:</span>
                                  <strong class="text-amber-300">
                                    {{ blk.date || proposalDate() }} | {{ blk.startTime }} a {{ blk.endTime }} ({{ getBlockDuration(blk.startTime, blk.endTime) }} hrs)
                                  </strong>
                                </div>
                              }
                            }
                          </div>

                          <!-- ITEMIZED ITEM BY ITEM COMPARATIVE ADJUSTMENT BREAKDOWN TABLE -->
                          <div class="space-y-1.5 text-[10px] sm:text-[11px] font-mono pt-1 border-t border-outline-variant/10">
                            <span class="text-[8px] font-black text-amber-300 uppercase block font-sans pb-1">
                              DESGLOSE CONCEPTUAL (ORIGINAL vs. NUEVO NEGOCIADO):
                            </span>

                            <!-- ITEM 1: HONORARIOS -->
                            <div class="p-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center justify-between">
                              <div>
                                <span class="font-sans font-bold text-on-surface block">• Honorarios Grupo:</span>
                                <span class="text-outline text-[9px]">Original: &#36;{{ (selectedQuote()?.artistFee || 35000) | number:'1.0-0' }} MXN</span>
                              </div>
                              <div class="text-right">
                                <strong class="text-amber-300 block">&#36;{{ proposalArtistFee() | number:'1.0-0' }} MXN</strong>
                                <span [class]="artistFeeDiffPercent() < 0 ? 'text-emerald-400' : (artistFeeDiffPercent() > 0 ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                  {{ artistFeeDiffPercent() < 0 ? ('- ' + Math.abs(artistFeeDiffPercent()) + '% 🔻') : (artistFeeDiffPercent() > 0 ? ('+ ' + artistFeeDiffPercent() + '% 🔺') : '0%') }}
                                </span>
                              </div>
                            </div>

                            <!-- ITEM 2: VIÁTICOS -->
                            <div class="p-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center justify-between">
                              <div>
                                <span class="font-sans font-bold text-on-surface block">• Viáticos & Hospedaje:</span>
                                <span class="text-outline text-[9px]">Original: &#36;{{ (selectedQuote()?.viaticosCost || 8500) | number:'1.0-0' }} MXN</span>
                              </div>
                              <div class="text-right">
                                <strong class="text-amber-300 block">&#36;{{ proposalViaticosCost() | number:'1.0-0' }} MXN</strong>
                                <span [class]="viaticosDiffPercent() < 0 ? 'text-emerald-400' : (viaticosDiffPercent() > 0 ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                  {{ viaticosDiffPercent() < 0 ? ('- ' + Math.abs(viaticosDiffPercent()) + '% 🔻') : (viaticosDiffPercent() > 0 ? ('+ ' + viaticosDiffPercent() + '% 🔺') : '0%') }}
                                </span>
                              </div>
                            </div>

                            <!-- ITEM 3: EQUIPO DE AUDIO -->
                            <div class="p-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center justify-between">
                              <div>
                                <span class="font-sans font-bold text-purple-300 block">• Equipo de Audio:</span>
                                <span class="text-outline text-[9px]">Original: &#36;{{ (selectedQuote()?.soundCost || 0) | number:'1.0-0' }} MXN</span>
                              </div>
                              <div class="text-right">
                                <strong class="text-purple-300 block">&#36;{{ (proposalSoundOption() === 'proveedor' ? proposalSoundCost() : 0) | number:'1.0-0' }} MXN</strong>
                                <span [class]="soundDiffPercent() < 0 ? 'text-emerald-400' : (soundDiffPercent() > 0 ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                  {{ soundDiffPercent() < 0 ? ('- ' + Math.abs(soundDiffPercent()) + '% 🔻') : (soundDiffPercent() > 0 ? ('+ ' + soundDiffPercent() + '% 🔺') : '0%') }}
                                </span>
                              </div>
                            </div>

                            <!-- ITEM 4: MARGEN DISQUERA CON CÁLCULO DE PERDIDA/GANANCIA DE DINERO CEDIDO EN BASE AL % ORIGINAL -->
                            <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                              <div class="flex items-center justify-between">
                                <div>
                                  <span class="font-sans font-bold text-purple-300 block">• Margen Disquera ({{ proposalMarginPercent() }}%):</span>
                                  <span class="text-outline text-[9px]">Original: {{ originalMarginPercent() }}% (&#36;{{ originalDisqueraMarginAmount() | number:'1.0-0' }} MXN)</span>
                                </div>
                                <div class="text-right">
                                  <strong class="text-purple-300 block">&#36;{{ calculatedDisqueraMargin() | number:'1.0-0' }} MXN</strong>
                                  <span [class]="marginDiffPoints() < 0 ? 'text-emerald-400' : (marginDiffPoints() > 0 ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                    {{ marginDiffPoints() < 0 ? ('- ' + Math.abs(marginDiffPoints()) + '%') : (marginDiffPoints() > 0 ? ('+ ' + marginDiffPoints() + '%') : '0%') }}
                                  </span>
                                </div>
                              </div>

                              <!-- MONTO CEDIDO / PERDIDO EN MARGEN DISQUERA -->
                              <div class="flex items-center justify-between text-[9px] pt-1 border-t border-purple-500/20 font-sans">
                                <span class="text-purple-200">Diferencia de Ganancia Disquera en Negociación:</span>
                                @if (disqueraMarginLostAmount() > 0) {
                                  <strong class="text-emerald-400 font-mono">
                                    -&#36;{{ disqueraMarginLostAmount() | number:'1.0-0' }} MXN (Margen Concedido) 🔻
                                  </strong>
                                } @else if (disqueraMarginLostAmount() < 0) {
                                  <strong class="text-amber-400 font-mono">
                                    +&#36;{{ Math.abs(disqueraMarginLostAmount()) | number:'1.0-0' }} MXN (Margen Incrementado) 🔺
                                  </strong>
                                } @else {
                                  <strong class="text-outline font-mono">$0 MXN (Sin Cambio)</strong>
                                }
                              </div>
                            </div>

                            <!-- OTHER FEES -->
                            <div class="flex justify-between text-cyan-400 pt-1">
                              <span>• Plataforma Acordex (5% Fijo):</span> 
                              <strong>&#36;{{ calculatedPlatformFee() | number:'1.0-0' }} MXN</strong>
                            </div>
                            @if (proposalIncludeIva()) {
                              <div class="flex justify-between text-blue-300">
                                <span>• IVA (+16% Facturado):</span> 
                                <strong>&#36;{{ calculatedIvaAmount() | number:'1.0-0' }} MXN</strong>
                              </div>
                            }

                            <div class="flex justify-between text-amber-400 text-xs sm:text-sm font-black pt-2 border-t border-outline-variant/20 font-sans">
                              <span>OFERTA RE-NEGOCIADA FINAL:</span>
                              <span class="text-base sm:text-lg font-black font-mono text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                                &#36;{{ calculatedTotalAmount() | number:'1.0-0' }} MXN
                              </span>
                            </div>
                          </div>

                          @if (scheduleChangeExplanation()) {
                            <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1 font-sans">
                              <span class="text-[9px] font-black uppercase block">MENSAJE DE NEGOCIACIÓN PARA EL CLIENTE:</span>
                              <p class="italic text-[10px] sm:text-[11px]">"{{ scheduleChangeExplanation() }}"</p>
                            </div>
                          }
                        </div>

                        <!-- PLATAFORMAS DE NOTIFICACIÓN INTERACTIVAS (REEMPLAZO DE LISTA DE VERIFICACIÓN) -->
                        <div class="p-3 sm:p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2.5 text-xs shadow-sm">
                          <div class="flex items-center justify-between">
                            <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs">send</span> PLATAFORMAS DE ENVÍO DE NOTIFICACIÓN
                            </span>
                            <span class="text-[9px] text-outline font-bold">Mínimo 1 requerida</span>
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <!-- PLATAFORMA 1: WHATSAPP -->
                            <button 
                              (click)="sendNotificationWhatsApp.set(!sendNotificationWhatsApp())"
                              [class]="sendNotificationWhatsApp() ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                              class="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2"
                            >
                              <span class="material-symbols-outlined text-base text-emerald-400">chat</span>
                              <div class="truncate">
                                <span class="font-black block text-[11px]">WhatsApp</span>
                                <span class="text-[8px] opacity-80">Aviso directo al cliente</span>
                              </div>
                            </button>

                            <!-- PLATAFORMA 2: EMAIL -->
                            <button 
                              (click)="sendNotificationEmail.set(!sendNotificationEmail())"
                              [class]="sendNotificationEmail() ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.25)]' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                              class="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2"
                            >
                              <span class="material-symbols-outlined text-base text-blue-400">mail</span>
                              <div class="truncate">
                                <span class="font-black block text-[11px]">Correo Email</span>
                                <span class="text-[8px] opacity-80">Formato formal PDF</span>
                              </div>
                            </button>

                            <!-- PLATAFORMA 3: PLATAFORMA ACORDEX -->
                            <button 
                              (click)="sendNotificationAcordex.set(!sendNotificationAcordex())"
                              [class]="sendNotificationAcordex() ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                              class="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2"
                            >
                              <span class="material-symbols-outlined text-base text-cyan-400">space_dashboard</span>
                              <div class="truncate">
                                <span class="font-black block text-[11px]">Portal Acordex</span>
                                <span class="text-[8px] opacity-80">Notificación In-App</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        <div class="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
                          <button 
                            (click)="negotiationStep.set(2)"
                            class="px-3.5 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-[11px] sm:text-xs flex items-center gap-1"
                          >
                            <span class="material-symbols-outlined text-xs">arrow_back</span> Anterior
                          </button>

                          <button 
                            (click)="sendNegotiatedProposal()"
                            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-[11px] sm:text-xs shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all duration-300 flex items-center gap-1.5 ml-auto hover:scale-105"
                          >
                            <span class="material-symbols-outlined text-base">send</span> RE-ENVIAR PROPUESTA SELECCIONADA
                          </button>
                        </div>
                      </div>
                    }

                  </div>

                </div>

              </div>
            }

            <!-- LUXURY SPECIALIZED WORKFLOW FOR STATE: 'Propuesta enviada' -->
            @if (selectedQuote()?.state === 'Propuesta enviada') {
              <div class="h-full flex flex-col min-h-0 space-y-4">
                
                <!-- TAB 1: COTIZACIÓN ENVIADA (VISTA LUXURY DE LECTURA COMPLETA) -->
                @if (phase2Tab() === 'cotizacion_enviada') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                    
                    <!-- TOP DUAL STATUS CARDS: DELIVERY & CLIENT READ RECEIPT TRACKING STATUS -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                      
                      <!-- CARD 1: DELIVERY & NOTIFICATION STATUS (3 OFFICIAL CHANNELS) -->
                      <div class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-surface-container-high/90 via-surface-container to-surface-container-high/90 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-between gap-3 relative overflow-hidden">
                        <div class="flex items-center gap-3">
                          <div class="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0 shadow-lg">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl">mark_email_read</span>
                          </div>
                          <div class="space-y-0.5">
                            <span class="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">NOTIFICACIÓN TRIPLE CANAL ENTREGADA</span>
                            <h4 class="text-xs sm:text-sm font-black text-on-surface truncate max-w-[220px]">
                              {{ selectedQuote()?.clientEmail }}
                            </h4>
                            <span class="text-[10px] text-outline font-mono block">Canales: WhatsApp • Correo Electrónico • Plataforma Acordex</span>
                          </div>
                        </div>

                        <span class="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-400/30 shrink-0 hidden sm:inline-block">
                          ENTREGADO 3/3
                        </span>
                      </div>

                      <!-- CARD 2: REAL-TIME CLIENT VIEWED RECEIPT TRACKING STATUS -->
                      <div [class]="clientViewed() ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-surface-container to-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-surface-container to-amber-500/5 shadow-[0_0_30px_rgba(251,191,36,0.15)]'" class="p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 relative overflow-hidden transition-all">
                        <div class="flex items-center gap-3">
                          <div [class]="clientViewed() ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border-amber-400/40'" class="p-3 rounded-2xl border shrink-0 shadow-lg">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl">
                              {{ clientViewed() ? 'visibility' : 'visibility_off' }}
                            </span>
                          </div>
                          <div class="space-y-0.5">
                            <span [class]="clientViewed() ? 'text-emerald-400' : 'text-amber-400'" class="text-[9px] font-black uppercase tracking-widest block">
                              {{ clientViewed() ? 'VISTO POR EL CLIENTE' : 'EN ESPERA DE LECTURA' }}
                            </span>
                            <h4 class="text-xs sm:text-sm font-black text-on-surface">
                              {{ clientViewed() ? ('Visto: ' + clientViewedTime()) : 'El cliente aún no abre la cotización' }}
                            </h4>
                            <span class="text-[10px] text-outline block">
                              {{ clientViewed() ? 'Acceso confirmado desde Acordex Web Portal' : 'Puedes revertir a revisión silenciosamente sin notificar al cliente' }}
                            </span>
                          </div>
                        </div>

                        <!-- TOGGLE SIMULATION FOR DEMO PURPOSES -->
                        <button 
                          (click)="clientViewed.set(!clientViewed())"
                          [class]="clientViewed() ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border-amber-400/40'"
                          class="px-2.5 py-1 rounded-xl text-[9px] font-bold border transition-all hover:scale-105 shrink-0"
                          title="Alternar estado de visto para pruebas"
                        >
                          {{ clientViewed() ? 'Visto ✔' : 'Pendiente ⏳' }}
                        </button>
                      </div>

                    </div>

                    <!-- MAIN RICH CONTENT GRID (2 COLUMNS) -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      
                      <!-- LEFT COLUMN: FULL PROPOSED SHOW SPECIFICATION DETAILS (6 COLS) -->
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl">
                        
                        <!-- CARD HEADER -->
                        <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                          <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base text-amber-400">event_available</span> DETALLES DEL SHOW PROPUESTO
                          </span>
                          <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {{ selectedQuote()?.groupName }}
                          </span>
                        </div>

                        <div class="space-y-3 text-xs">
                          
                          <!-- ARTIST COVER AND SHOW DATES -->
                          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
                            <div class="flex justify-between items-center">
                              <span class="text-outline text-[10px]">Agrupación Solicitada:</span>
                              <strong class="text-on-surface font-black text-sm uppercase">{{ selectedQuote()?.groupName }}</strong>
                            </div>

                            <div class="flex justify-between items-center border-t border-outline-variant/10 pt-2">
                              <span class="text-outline text-[10px]">FECHA ORIGINAL SOLICITADA POR EL CLIENTE:</span>
                              <span class="text-on-surface font-mono font-bold text-xs">{{ selectedQuote()?.proposedDate }}</span>
                            </div>
                          </div>

                          <!-- SI ESTÁ EN NEGOCIACIÓN: HISTORIAL DE HORARIOS Y TANDAS SEPARADO POR RONDA -->
                          @if (isInNegotiationRound() && negotiationHistory().length > 0) {
                            <div class="space-y-3">
                              <span class="text-[9px] font-black text-amber-400 uppercase block font-sans tracking-wider flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-xs text-amber-400">schedule</span>
                                FECHAS Y HORARIOS CONFIGURADOS POR RONDA DE NEGOCIACIÓN:
                              </span>

                              @for (entry of negotiationHistory(); track entry.round) {
                                <div class="p-3.5 rounded-2xl bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container border-2 border-cyan-500/40 space-y-2.5 font-mono text-[11px] shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden group">
                                  <!-- Top glow accent bar -->
                                  <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400"></div>

                                  <div class="flex items-center justify-between border-b border-cyan-500/20 pb-2 font-sans pt-1">
                                    <span class="font-black text-[10px] text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                                      <span class="material-symbols-outlined text-sm text-cyan-400">event_repeat</span>
                                      RONDA #{{ entry.round }} DE NEGOCIACIÓN
                                    </span>
                                    <span class="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
                                      {{ entry.scheduleMode === 'tandas' ? 'MODO TANDAS' : 'CONTINUO' }}
                                    </span>
                                  </div>

                                  <!-- FECHAS COMPARATIVAS POR RONDA -->
                                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                    <!-- FECHA PROPUESTA (Glow resplandeciente en verde/esmeralda) -->
                                    <div class="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/50 flex flex-col justify-center shadow-[0_0_12px_rgba(52,211,153,0.25)]">
                                      <span class="text-[9px] text-emerald-300 uppercase font-black font-sans block mb-0.5 tracking-wider">FECHA PROPUESTA:</span>
                                      <strong class="text-emerald-300 font-mono font-black text-xs sm:text-sm flex items-center gap-1 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                                        <span class="material-symbols-outlined text-xs text-emerald-400">calendar_month</span>
                                        {{ selectedQuote()?.proposedDate }}
                                      </strong>
                                    </div>

                                    <!-- FECHA DE NEGOCIACIÓN (Estilo sobrio para no confundir al administrador) -->
                                    <div class="p-2.5 rounded-xl bg-surface-container-high/90 border border-cyan-500/30 flex flex-col justify-center">
                                      <span class="text-[9px] text-cyan-300 uppercase font-extrabold font-sans block mb-0.5 tracking-wider">FECHA DE NEGOCIACIÓN (RONDA #{{ entry.round }}):</span>
                                      <strong class="text-cyan-200 font-mono font-bold text-xs flex items-center gap-1">
                                        <span class="material-symbols-outlined text-xs text-cyan-400">edit_calendar</span>
                                        {{ entry.proposedDate || selectedQuote()?.proposedDate }}
                                        @if (entry.timestamp && getEntryTime(entry.timestamp)) {
                                          <span class="text-[9px] text-cyan-300/80 font-mono font-normal">({{ getEntryTime(entry.timestamp) }})</span>
                                        }
                                      </strong>
                                    </div>
                                  </div>

                                  <!-- TANDAS O FRANJA CONTINUA DE ESTA RONDA -->
                                  <div class="space-y-1.5 pt-1">
                                    <span class="text-[9px] font-bold text-amber-400 uppercase tracking-wider block font-sans">
                                      ESTRUCTURA DE SHOW Y HORARIOS (RONDA #{{ entry.round }}):
                                    </span>

                                    @if (entry.scheduleMode === 'tandas' && entry.showBlocks && entry.showBlocks.length > 0) {
                                      <div class="space-y-1">
                                        @for (blk of entry.showBlocks; track blk.id) {
                                          <div class="p-2 rounded-xl bg-surface-container-high/90 border border-outline-variant/20 flex items-center justify-between text-on-surface text-[10px]">
                                            <span class="font-sans font-bold flex items-center gap-1">
                                              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                              {{ blk.label }}
                                              @if (blk.date) {
                                                <span class="text-[9px] font-bold text-emerald-400 font-mono">({{ blk.date }})</span>
                                              }
                                              :
                                            </span>
                                            <strong class="text-cyan-300 font-mono font-bold text-xs">{{ blk.startTime }} a {{ blk.endTime }} hrs</strong>
                                          </div>
                                        }
                                        <div class="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] text-right font-sans flex items-center justify-between">
                                          <span class="text-[9px] uppercase font-bold text-outline">Formato: Tandas Fragmentadas</span>
                                          <span>Total: <strong class="text-cyan-200 font-mono font-black">{{ entry.totalShowHours }} Horas</strong></span>
                                        </div>
                                      </div>
                                    } @else if (entry.startTime) {
                                      <div class="p-2 rounded-xl bg-surface-container-high/90 border border-outline-variant/20 flex items-center justify-between text-on-surface text-[10px]">
                                        <span class="font-sans font-bold">• Franja Continuada Principal:</span>
                                        <strong class="text-amber-300 font-mono font-bold text-xs">{{ entry.startTime }} a {{ entry.endTime }} hrs ({{ entry.totalShowHours }}h continuas)</strong>
                                      </div>
                                    } @else {
                                      <div class="p-2 rounded-xl bg-surface-container-high/90 border border-outline-variant/20 flex items-center justify-between text-on-surface text-[10px]">
                                        <span class="font-sans font-bold">• Franja Continuada Principal:</span>
                                        <strong class="text-amber-300 font-mono font-bold text-xs">14:30 a 17:30 hrs</strong>
                                      </div>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          } @else {
                            <!-- PROPUESTA NORMAL DE HORARIOS (SIN NEGOCIACIÓN) -->
                            <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
                              <div class="flex justify-between items-center">
                                <span class="text-outline text-[10px]">Fecha del Show Propuesta:</span>
                                <strong class="text-emerald-400 font-mono font-black text-sm flex items-center gap-1">
                                  <span class="material-symbols-outlined text-xs text-emerald-400">calendar_month</span>
                                  {{ selectedQuote()?.proposedDate }}
                                </strong>
                              </div>

                              <div class="flex justify-between items-center border-t border-outline-variant/10 pt-2">
                                <span class="text-outline text-[10px]">Duración Total de Show:</span>
                                <strong class="text-amber-300 font-mono font-black text-xs sm:text-sm">
                                  {{ selectedQuote()?.durationHours || 3 }} Horas Contratadas
                                </strong>
                              </div>
                            </div>

                            <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
                              <span class="text-[9px] font-black text-amber-400 uppercase block font-sans tracking-wider">
                                ESTRUCTURA DE TANDAS Y HORARIOS CONFIGURADOS:
                              </span>

                              <div class="space-y-1.5 font-mono text-[11px]">
                                @if (selectedQuote()?.notes?.includes('[Propuesta de Ajuste de Horario/Fecha]')) {
                                  <p class="text-on-surface text-[10px] sm:text-xs italic bg-surface-container-high p-2.5 rounded-xl border border-outline-variant/20">
                                    {{ selectedQuote()?.notes }}
                                  </p>
                                } @else {
                                  <div class="p-2 rounded-xl bg-surface-container-high/80 border border-outline-variant/20 flex items-center justify-between text-on-surface">
                                    <span class="font-sans font-bold">• Franja Continuada Principal:</span>
                                    <strong class="text-amber-300">14:30 a 17:30 hrs</strong>
                                  </div>
                                }
                              </div>
                            </div>
                          }

                          <!-- RECINTO Y EQUIPO DE AUDIO -->
                          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
                            <div class="flex justify-between items-center">
                              <span class="text-outline text-[10px]">Lugar / Recinto:</span>
                              <strong class="text-on-surface text-xs font-bold truncate max-w-[220px]">
                                {{ selectedQuote()?.eventAddress || (selectedQuote()?.venue + ', ' + selectedQuote()?.city) }}
                              </strong>
                            </div>

                            <div class="flex justify-between items-center border-t border-outline-variant/10 pt-2">
                              <span class="text-outline text-[10px]">Servicio de Audio:</span>
                              <strong class="text-purple-300 font-bold text-xs">
                                {{ selectedQuote()?.soundOption === 'proveedor' ? 'Incluye Sistema de Audio Profesional' : 'Proporcionado por el Cliente' }}
                              </strong>
                            </div>
                          </div>

                        </div>

                      </div>

                      <!-- RIGHT COLUMN: FINANCIAL ITEMIZATION RECEIPT & ROLLBACK ACTION (6 COLS) -->
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                        
                        <div class="space-y-3.5">
                          <!-- CARD HEADER -->
                          <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                            <span class="text-[10px] font-black text-purple-300 uppercase tracking-wider block flex items-center gap-1.5">
                              <span class="material-symbols-outlined text-base text-purple-400">payments</span> DESGLOSE FINANCIERO ENTREGADO
                            </span>
                            <span class="font-mono text-[9px] font-extrabold text-cyan-400 uppercase">
                              5% TARIFARIO FIJO
                            </span>
                          </div>

                          <!-- ITEMIZED ITEM RECEIPT -->
                          <div class="p-4 rounded-2xl bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container border-2 border-amber-400/60 space-y-2 text-xs font-mono shadow-inner relative overflow-hidden">
                            <div class="flex justify-between text-outline">
                              <span>Honorarios del Grupo:</span>
                              <strong class="text-on-surface">&#36;{{ (selectedQuote()?.artistFee || 35000) | number:'1.0-0' }} MXN</strong>
                            </div>

                            <div class="flex justify-between text-outline">
                              <span>Viáticos & Hospedaje:</span>
                              <strong class="text-on-surface">&#36;{{ (selectedQuote()?.viaticosCost || 8500) | number:'1.0-0' }} MXN</strong>
                            </div>

                            <div class="flex justify-between text-outline">
                              <span>Equipo de Audio:</span>
                              <strong class="text-purple-300">&#36;{{ (selectedQuote()?.soundCost || 0) | number:'1.0-0' }} MXN</strong>
                            </div>

                            <div class="flex justify-between text-purple-300">
                              <span>Margen Disquera:</span>
                              <strong>&#36;{{ (selectedQuote()?.marginAmount || 7000) | number:'1.0-0' }} MXN</strong>
                            </div>

                            <div class="flex justify-between text-cyan-400">
                              <span>Plataforma Acordex (5% Fijo):</span>
                              <strong>&#36;{{ ((selectedQuote()?.totalAmount || 50000) * 0.05) | number:'1.0-0' }} MXN</strong>
                            </div>

                            @if (selectedQuote()?.includeIva) {
                              <div class="flex justify-between text-blue-300">
                                <span>Impuesto IVA (+16% Facturado):</span>
                                <strong>&#36;{{ ((selectedQuote()?.totalAmount || 50000) * 0.16) | number:'1.0-0' }} MXN</strong>
                              </div>
                            }

                            <div class="flex justify-between text-amber-400 text-xs sm:text-base font-black pt-2.5 border-t border-outline-variant/20 font-sans">
                              <span class="uppercase tracking-wider">TOTAL COMERCIAL FINAL:</span>
                              <span class="text-xl sm:text-2xl font-black font-mono text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                                &#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN
                              </span>
                            </div>
                          </div>
                        </div>

                        <!-- DESGLOSE COMPARATIVO DE NEGOCIACIÓN DESGLOSADO POR RONDA (VISIBLE CUANDO ESTÁ EN NEGOCIACIÓN) -->
                        @if (isInNegotiationRound() && negotiationHistory().length > 0) {
                          <div class="space-y-3">
                            <div class="flex items-center gap-2">
                              <span class="material-symbols-outlined text-amber-400 text-base">compare_arrows</span>
                              <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider">HISTORIAL DE PROPUESTAS ENVIADAS POR RONDA</span>
                              <span class="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[9px] flex items-center justify-center">
                                {{ negotiationHistory().length }}
                              </span>
                            </div>

                            @for (entry of negotiationHistory(); track entry.round; let idx = $index) {
                              @let baseline = getPreviousRoundBaseline(idx);
                              <div class="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-surface-container to-amber-500/10 border-2 border-amber-400/50 space-y-2.5 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                                <div class="flex items-center justify-between border-b border-amber-400/20 pb-2">
                                  <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-sm text-amber-400">send</span>
                                    PROPUESTA DISQUERA — RONDA #{{ entry.round }}
                                  </span>
                                  <div class="flex items-center gap-1.5">
                                    <span class="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-amber-500/20 text-amber-200 border border-amber-400/40">
                                      {{ baseline.label }} vs. Ronda #{{ entry.round }}
                                    </span>
                                  </div>
                                </div>

                                <div class="space-y-1.5 text-[10px] font-mono">
                                  <!-- Honorarios -->
                                  <div class="p-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center justify-between">
                                    <div>
                                      <span class="font-sans font-bold text-on-surface block text-[10px]">• Honorarios Grupo:</span>
                                      <span class="text-outline text-[9px]">{{ baseline.label }}: &#36;{{ baseline.artistFee | number:'1.0-0' }} MXN</span>
                                    </div>
                                    <div class="text-right">
                                      <strong class="text-amber-300 block">&#36;{{ entry.artistFee | number:'1.0-0' }} MXN</strong>
                                      <span [class]="(entry.artistFee - baseline.artistFee) < 0 ? 'text-emerald-400' : ((entry.artistFee > baseline.artistFee) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                        {{ (entry.artistFee - baseline.artistFee) < 0 ? ('- ' + (((baseline.artistFee - entry.artistFee) / (baseline.artistFee || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.artistFee > baseline.artistFee) ? '🔺 +%' : '0%') }}
                                      </span>
                                    </div>
                                  </div>

                                  <!-- Viáticos -->
                                  <div class="p-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center justify-between">
                                    <div>
                                      <span class="font-sans font-bold text-on-surface block text-[10px]">• Viáticos & Hospedaje:</span>
                                      <span class="text-outline text-[9px]">{{ baseline.label }}: &#36;{{ baseline.viaticosCost | number:'1.0-0' }} MXN</span>
                                    </div>
                                    <div class="text-right">
                                      <strong class="text-amber-300 block">&#36;{{ entry.viaticosCost | number:'1.0-0' }} MXN</strong>
                                      <span [class]="(entry.viaticosCost - baseline.viaticosCost) < 0 ? 'text-emerald-400' : ((entry.viaticosCost > baseline.viaticosCost) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                        {{ (entry.viaticosCost - baseline.viaticosCost) < 0 ? ('- ' + (((baseline.viaticosCost - entry.viaticosCost) / (baseline.viaticosCost || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.viaticosCost > baseline.viaticosCost) ? '🔺 +%' : '0%') }}
                                      </span>
                                    </div>
                                  </div>

                                  <!-- Equipo de Audio Profesional -->
                                  <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                                    <div>
                                      <span class="font-sans font-bold text-purple-300 block text-[10px]">• Equipo de Audio Profesional:</span>
                                      <span class="text-outline text-[9px]">
                                        {{ entry.soundOption === 'proveedor' || (entry.soundCost && entry.soundCost > 0) ? 'Proveedor Disquera' : 'Proporcionado por Cliente' }} — {{ baseline.label }}: &#36;{{ baseline.soundCost | number:'1.0-0' }} MXN
                                      </span>
                                    </div>
                                    <div class="text-right">
                                      <strong class="text-purple-300 block">&#36;{{ (entry.soundCost || 0) | number:'1.0-0' }} MXN</strong>
                                      <span [class]="(entry.soundCost - baseline.soundCost) < 0 ? 'text-emerald-400' : ((entry.soundCost > baseline.soundCost) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                        {{ (entry.soundCost - baseline.soundCost) < 0 ? ('- ' + (((baseline.soundCost - entry.soundCost) / (baseline.soundCost || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.soundCost > baseline.soundCost) ? '🔺 +%' : '0%') }}
                                      </span>
                                    </div>
                                  </div>

                                  <!-- Margen -->
                                  <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                                    <div>
                                      <span class="font-sans font-bold text-purple-300 block text-[10px]">• Margen Disquera:</span>
                                      <span class="text-outline text-[9px]">{{ baseline.label }}: {{ baseline.marginPercent }}% — Ronda #{{ entry.round }}: {{ entry.marginPercent }}%</span>
                                    </div>
                                    <div class="text-right">
                                      <strong class="text-purple-300 block">{{ entry.marginPercent }}%</strong>
                                      <span [class]="entry.marginPercent < baseline.marginPercent ? 'text-emerald-400' : 'text-outline'" class="text-[9px] font-bold">
                                        {{ entry.marginPercent < baseline.marginPercent ? ('- ' + (baseline.marginPercent - entry.marginPercent) + '% pts 🔻') : '0%' }}
                                      </span>
                                    </div>
                                  </div>

                                  <!-- Total Oferta -->
                                  <div class="flex justify-between text-amber-400 text-xs font-black pt-1.5 border-t border-amber-400/20 font-sans">
                                    <span>OFERTA NEGOCIADA ENVIADA:</span>
                                    <span class="font-mono">&#36;{{ entry.totalOffered | number:'1.0-0' }} MXN</span>
                                  </div>

                                  <!-- Nota de disquera -->
                                  @if (entry.adminProposalNote) {
                                    <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-[10px] font-sans">
                                      <span class="font-black uppercase text-[9px] block mb-0.5">MENSAJE ENVIADO EN RONDA #{{ entry.round }}:</span>
                                      <p class="italic">&ldquo;{{ entry.adminProposalNote }}&rdquo;</p>
                                    </div>
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        }

                        <!-- ROLLBACK ACTION CARD — CAMBIA SEGÚN SI ESTÁ EN NEGOCIACIÓN O NO -->
                        @if (isInNegotiationRound()) {
                          <!-- ROLLBACK A NEGOCIACIÓN (sin notificar cliente, solo comentario opcional) -->
                          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 pt-3">
                            <div class="flex items-center justify-between">
                              <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm text-amber-400">undo</span> CORRECCIÓN O AJUSTE DE NEGOCIACIÓN
                              </span>
                              <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase border bg-amber-500/20 text-amber-300 border-amber-500/40">
                                SIN NOTIFICAR AL CLIENTE
                              </span>
                            </div>
                            <p class="text-[10px] sm:text-xs text-outline leading-relaxed">
                              Regresarás al wizard de Negociación para corregir cualquier ajuste de precio, horario o concepto enviado. Solo se pedirá un comentario interno opcional para la bitácora.
                            </p>
                            <button 
                              (click)="openNegotiationRollbackDialog()"
                              class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
                            >
                              <span class="material-symbols-outlined text-base">undo</span> Regresar a Negociación
                            </button>
                          </div>
                        } @else {
                          <!-- ROLLBACK A REVISIÓN (comportamiento original con validación de visto) -->
                          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 pt-3">
                            <div class="flex items-center justify-between">
                              <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm text-amber-400">undo</span> CORRECCIÓN O MODIFICACIÓN DE PROPUESTA
                              </span>
                              <span [class]="clientViewed() ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'" class="px-2 py-0.5 rounded text-[8px] font-bold uppercase border">
                                {{ clientViewed() ? 'NOTIFICACIÓN REQUERIDA' : 'REVERSIÓN SILENCIOSA' }}
                              </span>
                            </div>
                            <p class="text-[10px] sm:text-xs text-outline leading-relaxed">
                              {{ clientViewed() 
                                ? 'El cliente ya vio la propuesta. Al regresar a revisión se le requerirá seleccionar una etiqueta de motivo y un mensaje explicativo obligatorio.' 
                                : 'El cliente aún no ha visto la propuesta. Puedes regresar a revisión de forma silenciosa ingresando un comentario interno opcional.' }}
                            </p>
                            <button 
                              (click)="openRollbackDialog()"
                              class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
                            >
                              <span class="material-symbols-outlined text-base">undo</span> Regresar a Revisión (Fase 1)
                            </button>
                          </div>
                        }

                      </div>

                    </div>

                  </div>
                }

                <!-- TAB 2: INFORMACIÓN DEL CLIENTE -->
                @if (phase2Tab() === 'informacion_cliente') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <!-- CLIENT CREDENTIALS CARD -->
                      <div class="p-4 sm:p-5 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3 shadow-xl backdrop-blur-xl">
                        <span class="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest block flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-xs text-blue-400">badge</span> EXPEDIENTE DEL CONTRATANTE
                        </span>

                        <div class="space-y-2.5 text-xs">
                          <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                            <span class="text-outline text-[9px] block">Nombre del Cliente:</span>
                            <p class="font-bold text-on-surface text-xs sm:text-sm flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-outline">person</span> {{ selectedQuote()?.clientName }}
                            </p>
                          </div>

                          <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                            <span class="text-outline text-[9px] block">Empresa / Razón Social:</span>
                            <p class="font-bold text-on-surface text-xs sm:text-sm flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-outline">domain</span> {{ selectedQuote()?.clientCompany }}
                            </p>
                          </div>

                          <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                            <span class="text-outline text-[9px] block">Correo Electrónico:</span>
                            <p class="font-bold text-primary text-xs sm:text-sm flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-primary">mail</span> {{ selectedQuote()?.clientEmail }}
                            </p>
                          </div>

                          <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                            <span class="text-outline text-[9px] block">Teléfono / Celular:</span>
                            <p class="font-bold text-on-surface text-xs sm:text-sm flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-outline">call</span> {{ selectedQuote()?.representativePhone || '+52 81 1234 5678' }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- ORIGINAL CLIENT REQUEST SPECIFICATIONS CARD -->
                      <div class="p-4 sm:p-5 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                        <div class="space-y-3">
                          <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                            <span class="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1.5">
                              <span class="material-symbols-outlined text-xs text-amber-400">confirmation_number</span> SOLICITUD ORIGINAL DEL CLIENTE
                            </span>
                            <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                              REQUERIMIENTO BASE
                            </span>
                          </div>

                          <div class="space-y-2.5 text-xs">
                            <div class="grid grid-cols-2 gap-2">
                              <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                                <span class="text-outline text-[9px] block">Tipo de Evento:</span>
                                <span class="font-black text-on-surface text-xs flex items-center gap-1">
                                  <span class="material-symbols-outlined text-xs text-amber-400">celebration</span> {{ selectedQuote()?.eventType || 'Boda' }}
                                </span>
                              </div>

                              <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                                <span class="text-outline text-[9px] block">Fecha Solicitada Original:</span>
                                <span class="font-black text-emerald-400 font-mono text-xs flex items-center gap-1">
                                  <span class="material-symbols-outlined text-xs text-emerald-400">calendar_today</span> {{ selectedQuote()?.proposedDate }}
                                </span>
                              </div>
                            </div>

                            <!-- ORIGINAL CLIENT DURATION & SCHEDULE TANDA BREAKDOWN -->
                            <div class="p-3 rounded-2xl bg-surface-container border border-amber-500/30 space-y-2 shadow-inner">
                              <span class="text-outline text-[9px] block font-extrabold uppercase text-amber-400 flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs text-amber-400">schedule</span> DURACIÓN Y TANDA ORIGINAL DEL CLIENTE:
                              </span>
                              
                              <div class="flex items-center justify-between text-xs font-mono font-bold text-on-surface">
                                <span class="flex items-center gap-1.5 text-amber-300">
                                  <span class="material-symbols-outlined text-sm text-amber-400">timer</span> {{ selectedQuote()?.durationHours || 3 }} Horas Solicitadas por Cliente
                                </span>
                              </div>

                              <div class="p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 text-[11px] font-mono text-on-surface/90">
                                <span>• Horario Solicitado: <strong>14:30 a 17:30 hrs</strong> (Franja Única Continuada)</span>
                              </div>
                            </div>

                            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                              <span class="text-outline text-[9px] block">Ubicación / Recinto:</span>
                              <p class="font-bold text-on-surface text-xs flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs text-primary">location_on</span> {{ selectedQuote()?.eventAddress || (selectedQuote()?.venue + ', ' + selectedQuote()?.city) }}
                              </p>
                            </div>

                            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                              <span class="text-outline text-[9px] block">Notas del Cliente:</span>
                              <p class="text-xs text-on-surface/90 italic pt-0.5">
                                "{{ selectedQuote()?.notes || 'Sin especificaciones adicionales enviadas por el cliente' }}"
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- UNIFIED SINGLE HIGH-IMPACT WHATSAPP ACTION BUTTON -->
                        <button 
                          (click)="contactWhatsApp()"
                          class="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] mt-3"
                        >
                          <span class="material-symbols-outlined text-lg sm:text-xl">chat</span> CONTACTAR AL CLIENTE POR WHATSAPP
                        </button>
                      </div>

                    </div>

                    <!-- HISTORIAL DE RECHAZOS DEL CLIENTE — SEPARADO POR RONDA (DEBAJO DEL EXPEDIENTE) -->
                    @if (isInNegotiationRound() && negotiationHistory().length > 0) {
                      <div class="space-y-2 pt-2 border-t border-outline-variant/20">
                        <div class="flex items-center justify-between">
                          <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            <span class="material-symbols-outlined text-sm text-amber-400">forum</span>
                            MOTIVOS DE RECHAZO DEL CLIENTE POR RONDA
                          </span>
                          <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/40">
                            {{ negotiationHistory().length }} Rondas Registradas
                          </span>
                        </div>

                        <div class="space-y-2">
                          @for (entry of negotiationHistory(); track entry.round) {
                            <div class="p-2.5 sm:p-3 rounded-xl bg-surface-container-high/90 border border-amber-500/30 space-y-1.5 shadow-sm text-xs">
                              <!-- Header de ronda compacto -->
                              <div class="flex items-center justify-between text-[9px] font-mono">
                                <span class="font-black text-amber-300 uppercase flex items-center gap-1">
                                  <span class="material-symbols-outlined text-xs text-amber-400">rate_review</span>
                                  RONDA #{{ entry.round }}
                                </span>
                                @if (entry.timestamp) {
                                  <span class="text-outline text-[8px]">{{ entry.timestamp }}</span>
                                }
                              </div>

                              <!-- Mensaje de rechazo del cliente -->
                              <p class="text-[11px] sm:text-xs text-on-surface/90 italic bg-black/40 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed font-sans">
                                &ldquo;{{ entry.clientRejectionMessage }}&rdquo;
                              </p>
                            </div>
                          }
                        </div>
                      </div>
                    }

                  </div>
                }


              </div>
            }

            <!-- DYNAMIC WORKFLOW ACTION CONTROL BAR (FOR OTHER STATES OTHER THAN 'En revisión', 'Propuesta enviada', 'Negociación' AND 'Aceptada') -->
            @if (selectedQuote()?.state !== 'En revisión' && selectedQuote()?.state !== 'Propuesta enviada' && selectedQuote()?.state !== 'Negociación' && selectedQuote()?.state !== 'Aceptada') {
              <div class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-lg">
                <div class="space-y-0.5">
                  <span class="text-xs font-extrabold text-primary uppercase tracking-wider block">Acción Operativa para el Estado Actual</span>
                  <p class="text-xs text-outline">{{ getStateActionDescription(selectedQuote()!.state) }}</p>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <button 
                    [disabled]="isFirstState(selectedQuote()!.state)"
                    (click)="moveState(selectedQuote()!, -1)"
                    class="px-3.5 sm:px-4 py-2 rounded-xl bg-surface-bright hover:bg-primary/20 text-on-surface font-bold text-xs disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span class="material-symbols-outlined text-sm">arrow_back</span> Retroceder
                  </button>

                  <button 
                    [disabled]="isLastState(selectedQuote()!.state)"
                    (click)="moveState(selectedQuote()!, 1)"
                    class="px-4 sm:px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-hover font-extrabold text-xs shadow-lg shadow-primary/20 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 sm:gap-2"
                  >
                    Avanzar de Estado <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            }

            <!-- SPECIALIZED WORKFLOW FOR STATE: 'Aceptada' -->
            @if (selectedQuote()?.state === 'Aceptada') {
              <div class="h-full flex flex-col min-h-0 space-y-4">
                
                <!-- TOP SUB-TABS NAVIGATION FOR ACEPTADA STATE -->
                <div class="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 shrink-0">
                  <button 
                    (click)="acceptedTab.set('gestion_aceptada')"
                    [class]="acceptedTab() === 'gestion_aceptada' ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-outline hover:text-on-surface border-transparent'"
                    class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 flex-1 justify-center"
                  >
                    <span class="material-symbols-outlined text-base">verified</span>
                    <span>Gestión de Aceptación & Contrato</span>
                  </button>

                  <button 
                    (click)="acceptedTab.set('info_original_cliente')"
                    [class]="acceptedTab() === 'info_original_cliente' ? 'bg-surface-bright text-on-surface border-outline-variant/40 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
                    class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 flex-1 justify-center"
                  >
                    <span class="material-symbols-outlined text-base">assignment_ind</span>
                    <span>Información Original del Cliente</span>
                  </button>

                  @if (isInNegotiationRound() || (negotiationHistory() && negotiationHistory().length > 0)) {
                    <button 
                      (click)="acceptedTab.set('historial_negociaciones')"
                      [class]="acceptedTab() === 'historial_negociaciones' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'text-outline hover:text-on-surface border-transparent'"
                      class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 flex-1 justify-center"
                    >
                      <span class="material-symbols-outlined text-base">history</span>
                      <span>Historial de Negociaciones ({{ negotiationHistory().length }})</span>
                    </button>
                  }
                </div>

                <!-- SUB-TAB 1: GESTIÓN DE ACEPTACIÓN & CONTRATO -->
                @if (acceptedTab() === 'gestion_aceptada') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                    
                    <!-- CONFIRMED ACCEPTANCE STATUS BANNER & COLLAPSIBLE CONTRACT SPECS -->
                    <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-3 relative overflow-hidden">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                          <div class="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0 shadow-lg">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl">task_alt</span>
                          </div>
                          <div class="space-y-0.5">
                            <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">PROPUESTA COMERCIAL ACEPTADA POR EL CLIENTE</span>
                            <h4 class="text-xs sm:text-sm font-black text-on-surface flex items-center gap-2">
                              <span>{{ selectedQuote()?.groupName }}</span>
                              <span class="text-emerald-400 font-mono">&#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</span>
                            </h4>
                            <span class="text-[10px] text-outline font-mono block">
                              Fecha Confirmada: <strong>{{ selectedQuote()?.proposedDate }}</strong> • Duración: <strong class="text-amber-300">{{ selectedQuote()?.durationHours || 3 }} Horas de Show</strong> • Recinto: <strong>{{ selectedQuote()?.venue }}</strong>
                            </span>
                          </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                          <span class="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-bold text-xs border border-purple-400/40">
                            {{ hasQuoteTandas(selectedQuote()) ? 'Tandas / Sets' : 'Horario Continuo' }}
                          </span>

                          <button 
                            (click)="showAcceptedSummaryDetails.set(!showAcceptedSummaryDetails())"
                            class="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-extrabold text-xs border border-emerald-400/40 transition-all flex items-center gap-1.5 shadow-sm hover:scale-105"
                          >
                            <span class="material-symbols-outlined text-sm">
                              {{ showAcceptedSummaryDetails() ? 'unfold_less' : 'unfold_more' }}
                            </span>
                            <span>{{ showAcceptedSummaryDetails() ? 'Ocultar Datos de Contrato ▴' : 'Ver Datos de Contrato ▾' }}</span>
                          </button>
                        </div>
                      </div>

                      <!-- COLLAPSIBLE CONTRACT SPECIFICATIONS DETAILS PANEL -->
                      @if (showAcceptedSummaryDetails()) {
                        <div class="pt-3 border-t border-emerald-500/30 space-y-3 animate-fadeIn">
                          <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1 font-sans">
                              <span class="material-symbols-outlined text-sm text-emerald-400">verified</span>
                              ESPECIFICACIONES COMERCIALES Y TÉCNICAS ACEPTADAS PARA EL CONTRATO
                            </span>
                            <span class="text-[9px] font-mono text-outline">Información Definitiva Aceptada por Cliente y Disquera</span>
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <!-- BLOQUE 1: DURACIÓN Y HORARIOS DEL SHOW -->
                            <div class="p-3 rounded-xl bg-surface-container/90 border border-emerald-500/30 space-y-2">
                              <span class="text-emerald-400 text-[9px] font-bold uppercase block font-sans">1. Duración & Horario del Show:</span>
                              <div class="space-y-1">
                                <div class="flex justify-between text-[11px]">
                                  <span class="text-outline">Duración Contratada:</span>
                                  <strong class="text-amber-300 font-mono font-black">{{ selectedQuote()?.durationHours || 3 }} Horas Totales</strong>
                                </div>
                                <div class="flex justify-between text-[11px]">
                                  <span class="text-outline">Formato Presentation:</span>
                                  <strong class="text-purple-300 font-sans font-bold">
                                    {{ hasQuoteTandas(selectedQuote()) ? 'Tandas / Bloques' : 'Show Continuo' }}
                                  </strong>
                                </div>
                              </div>

                              <!-- DESGLOSE DE TANDAS O CONTINUO -->
                              <div class="p-2 rounded-lg bg-surface-container-high border border-outline-variant/20 space-y-1 font-mono text-[10px]">
                                @if (hasQuoteTandas(selectedQuote())) {
                                  @for (block of getQuoteShowBlocks(selectedQuote()); track block.id; let bIdx = $index) {
                                    <div class="flex justify-between text-on-surface">
                                      <span class="text-amber-300 font-sans">• Tanda #{{ bIdx + 1 }}:</span>
                                      <strong class="font-bold">{{ block.startTime }} - {{ block.endTime }} hrs</strong>
                                    </div>
                                  }
                                } @else {
                                  <div class="flex justify-between text-cyan-300">
                                    <span class="font-sans">• Show Continuo:</span>
                                    <strong class="font-bold">21:00 a 00:00 hrs</strong>
                                  </div>
                                }
                              </div>
                            </div>

                            <!-- BLOQUE 2: SERVICIO DE AUDIO & LOGÍSTICA -->
                            <div class="p-3 rounded-xl bg-surface-container/90 border border-purple-500/30 space-y-2">
                              <span class="text-purple-300 text-[9px] font-bold uppercase block font-sans">2. Servicio de Audio & Recinto:</span>
                              <div class="space-y-1">
                                <div class="flex justify-between text-[11px]">
                                  <span class="text-outline">Servicio de Audio:</span>
                                  <strong class="text-purple-300 font-sans font-bold">
                                    {{ selectedQuote()?.soundOption === 'proveedor' || (selectedQuote()?.soundCost && selectedQuote()!.soundCost! > 0) ? 'Incluye Audio Disquera' : 'Trae el Cliente' }}
                                  </strong>
                                </div>
                                <div class="flex justify-between text-[11px]">
                                  <span class="text-outline">Recinto / Lugar:</span>
                                  <strong class="text-on-surface truncate max-w-[140px] font-sans">{{ selectedQuote()?.venue }}</strong>
                                </div>
                              </div>

                              <div class="p-2 rounded-lg bg-surface-container-high border border-outline-variant/20 space-y-1 font-sans text-[10px]">
                                <span class="text-outline block text-[9px]">Dirección Completa:</span>
                                <p class="font-bold text-on-surface truncate">{{ selectedQuote()?.eventAddress || (selectedQuote()?.venue + ', ' + selectedQuote()?.city) }}</p>
                              </div>
                            </div>

                            <!-- BLOQUE 3: DESGLOSE FINANCIERO ACEPTADO -->
                            <div class="p-3 rounded-xl bg-surface-container/90 border-2 border-amber-400/50 space-y-2 font-mono shadow-inner">
                              <div class="flex items-center justify-between border-b border-amber-400/20 pb-1">
                                <span class="text-amber-400 text-[9px] font-black uppercase tracking-wider font-sans flex items-center gap-1">
                                  <span class="material-symbols-outlined text-xs text-amber-400">receipt_long</span> 3. DESGLOSE FINANCIERO ACEPTADO:
                                </span>
                                <span class="text-[8px] font-bold text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30">5% ACORDEX</span>
                              </div>

                              <div class="space-y-1.5 text-[10px]">
                                <div class="flex justify-between text-outline">
                                  <span>Honorarios del Grupo:</span>
                                  <strong class="text-on-surface">&#36;{{ (selectedQuote()?.artistFee || 35000) | number:'1.0-0' }} MXN</strong>
                                </div>

                                <div class="flex justify-between text-outline">
                                  <span>Viáticos & Hospedaje:</span>
                                  <strong class="text-on-surface">&#36;{{ (selectedQuote()?.viaticosCost || 8500) | number:'1.0-0' }} MXN</strong>
                                </div>

                                <div class="flex justify-between text-outline">
                                  <span>Equipo de Audio Profesional:</span>
                                  <strong class="text-purple-300">&#36;{{ (selectedQuote()?.soundCost || 0) | number:'1.0-0' }} MXN</strong>
                                </div>

                                <div class="flex justify-between text-purple-300">
                                  <span>Margen Disquera / Agencia:</span>
                                  <strong>&#36;{{ (selectedQuote()?.marginAmount || 7000) | number:'1.0-0' }} MXN</strong>
                                </div>

                                <div class="flex justify-between text-cyan-400">
                                  <span>Comisión Plataforma (5% Fijo):</span>
                                  <strong>&#36;{{ ((selectedQuote()?.totalAmount || 50000) * 0.05) | number:'1.0-0' }} MXN</strong>
                                </div>

                                @if (selectedQuote()?.includeIva) {
                                  <div class="flex justify-between text-blue-300">
                                    <span>Impuesto IVA (+16% Facturado):</span>
                                    <strong>&#36;{{ ((selectedQuote()?.totalAmount || 50000) * 0.16) | number:'1.0-0' }} MXN</strong>
                                  </div>
                                }

                                <div class="flex justify-between text-amber-400 font-bold border-t border-amber-400/30 pt-2 font-sans text-xs sm:text-sm">
                                  <span class="uppercase tracking-wider font-black">TOTAL COMERCIAL ACEPTADO:</span>
                                  <span class="font-mono font-black text-amber-300 text-sm sm:text-base drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                                    &#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- MAIN 2-COLUMN GRID FOR ACCEPTED QUOTE MANAGEMENT -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      
                      <!-- LEFT COLUMN: CONTRATO COMERCIAL & VISUALIZACIÓN PREVIA (6 COLS) -->
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                        <div class="space-y-3.5">
                          <!-- CARD HEADER -->
                          <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                            <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                              <span class="material-symbols-outlined text-base text-emerald-400">description</span>
                              CONTRATO PRIVADO & DOCUMENTACIÓN
                            </span>
                            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {{ contractGenerationMode() === 'manual' ? 'DOCUMENTO SUBIDO MANUAL' : (contractGenerated() ? 'CONTRATO GENERADO' : 'PLANTILLAS DISPONIBLES') }}
                            </span>
                          </div>

                          <!-- MODO A: GENERACIÓN AUTOMÁTICA CON PLANTILLAS (SE MUESTRA SÓLO EN MODO AUTOMÁTICO) -->
                          @if (contractGenerationMode() === 'auto') {
                            <!-- SELECTOR CAROUSEL DE PLANTILLAS Y BORRADORES DE CONTRATO (CON FLECHAS < y >) -->
                            <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2.5 font-sans animate-fadeIn">
                              <div class="flex items-center justify-between">
                                <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block">
                                  PLANTILLA / BORRADOR DE CONTRATO A USAR:
                                </span>
                                <div class="flex items-center gap-1">
                                  <button 
                                    (click)="scrollTemplates('left')"
                                    class="p-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/20 transition-all text-xs flex items-center justify-center"
                                    title="Ver plantillas anteriores"
                                  >
                                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                                  </button>
                                  <button 
                                    (click)="scrollTemplates('right')"
                                    class="p-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/20 transition-all text-xs flex items-center justify-center"
                                    title="Ver más plantillas"
                                  >
                                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                                  </button>
                                </div>
                              </div>

                              <!-- CAROUSEL SCROLL CONTAINER -->
                              <div 
                                id="template-carousel-container"
                                class="flex items-center gap-2 overflow-x-auto scroll-smooth custom-scrollbar py-1"
                              >
                                @for (tpl of contractTemplates(); track tpl.id) {
                                  <button 
                                    (click)="selectedTemplateId.set(tpl.id); selectedContractTemplate.set(tpl.isManual ? 'manual' : (tpl.id === 'tpl_2' ? 'masivo' : (tpl.id === 'tpl_3' ? 'vip' : 'estandar')))"
                                    [class]="selectedTemplateId() === tpl.id ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-md font-black ring-1 ring-amber-400/50' : 'bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/20 font-bold'"
                                    class="px-3 py-2 rounded-xl text-[10px] border transition-all shrink-0 flex items-center gap-2 text-left hover:scale-105"
                                  >
                                    <div class="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                                      <span class="material-symbols-outlined text-base">description</span>
                                    </div>
                                    <div class="space-y-0.5">
                                      <strong class="block text-xs leading-none font-bold text-on-surface">{{ tpl.name }}</strong>
                                      <span class="text-[9px] text-outline block leading-none font-mono">{{ tpl.tag }}</span>
                                    </div>
                                  </button>
                                }
                              </div>

                              <!-- BOTÓN PRINCIPAL: GENERAR CONTRATO DE ESTA PLANTILLA -->
                              <button 
                                (click)="generateContractFromTemplate()"
                                [disabled]="isGeneratingContract()"
                                class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50"
                              >
                                <span class="material-symbols-outlined text-lg">auto_awesome</span>
                                <span>{{ isGeneratingContract() ? 'Generando Documento...' : 'GENERAR CONTRATO PDF CON ESTA PLANTILLA' }}</span>
                              </button>
                            </div>

                            <!-- CONTRACT FILE DISPLAY CARD (SÓLO TRAS GENERAR) -->
                            @if (contractGenerated()) {
                              <div class="p-4 rounded-2xl bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container border-2 border-emerald-500/40 space-y-3 text-xs shadow-inner animate-fadeIn font-sans">
                                <div class="flex items-center justify-between">
                                  <div class="flex items-center gap-3">
                                    <div class="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                                      <span class="material-symbols-outlined text-2xl">picture_as_pdf</span>
                                    </div>
                                    <div>
                                      <strong class="text-on-surface font-bold text-xs block truncate max-w-[200px]">
                                        Contrato_Privado_{{ selectedQuote()?.id }}.pdf
                                      </strong>
                                      <span class="text-outline text-[10px] block font-mono">
                                        Tamaño: 1.4 MB • PDF Firma Digital • {{ selectedTemplateId() | uppercase }}
                                      </span>
                                    </div>
                                  </div>

                                  <!-- VISTA PREVIA INTERACTIVA BUTTON -->
                                  <button 
                                    (click)="showContractPreviewModal.set(true)"
                                    class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/30 to-teal-500/30 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-300 font-extrabold text-xs border border-emerald-400/50 transition-all flex items-center gap-1.5 hover:scale-105 shrink-0 shadow-md"
                                  >
                                    <span class="material-symbols-outlined text-base text-emerald-400">visibility</span>
                                    <span>Abrir Vista Previa</span>
                                  </button>
                                </div>

                                <!-- AVISO DE REVISIÓN OBLIGATORIA DEL CONTRATO GENERADO -->
                                <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed space-y-1">
                                  <div class="flex items-center gap-1.5 text-amber-400 font-black uppercase text-[10px]">
                                    <span class="material-symbols-outlined text-sm text-amber-400">warning</span>
                                    <span>AVISO DE REVISIÓN DE CONTRATO AUTOMÁTICO:</span>
                                  </div>
                                  <p>
                                    Este borrador ha sido generado <strong>automáticamente por el sistema</strong> con base en la cotización acordada por <strong>&#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</strong> para el show de <strong>{{ selectedQuote()?.groupName }}</strong>.
                                  </p>
                                  <p class="text-[10px] text-amber-300 font-bold italic pt-0.5">
                                    📌 Se solicita al administrador REVISAR detalladamente las cláusulas y especificaciones en la Vista Previa antes de proceder con el envío al cliente.
                                  </p>
                                </div>
                              </div>
                            }
                          }

                          <!-- MODO B: MODO MANUAL DE CARGA (SI contractGenerationMode() === 'manual') -->
                          @if (contractGenerationMode() === 'manual') {
                            <!-- BOTÓN ARRIBA: VOLVER A GENERACIÓN AUTOMÁTICA -->
                            <div class="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-2 font-sans animate-fadeIn">
                              <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-cyan-400 text-lg">file_present</span>
                                <span class="text-[10px] font-bold text-cyan-300">Documento Manual Activo</span>
                              </div>

                              <button 
                                (click)="switchToAutoMode()"
                                class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-[10px] shadow-sm transition-all flex items-center gap-1 hover:scale-105 shrink-0"
                              >
                                <span class="material-symbols-outlined text-sm">auto_awesome</span>
                                <span>VOLVER A GENERACIÓN AUTOMÁTICA CON PLANTILLAS</span>
                              </button>
                            </div>
                          }

                          <!-- UPLOAD / REPLACE CONTRACT FILE ACTIONS -->
                          <div class="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2.5">
                            <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block font-sans">
                              SUBIR O REEMPLAZAR DOCUMENTO DE CONTRATO (PDF/DOCX):
                            </span>

                            <label class="p-4 rounded-xl border-2 border-dashed border-outline-variant/40 hover:border-cyan-400/60 bg-surface-container-high/60 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group">
                              <span class="material-symbols-outlined text-2xl text-cyan-400 group-hover:scale-110 transition-all">cloud_upload</span>
                              <span class="text-xs font-bold text-on-surface">Haz clic para examinar o arrastra tu archivo aquí</span>
                              <span class="text-[9px] text-outline font-mono">Formatos aceptados: PDF, DOCX (Máx. 10 MB)</span>
                              <input type="file" (change)="handleSimulatedContractUpload($event)" accept=".pdf,.docx" class="hidden">
                            </label>

                            <!-- BOTÓN DE VISTA PREVIA DIRECTA HASTA ABAJO (SÓLO APARECE CUANDO SE SUBE UN PDF MANUAL) -->
                            @if (contractGenerationMode() === 'manual' && uploadedContractFile()) {
                              <div class="p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-between gap-2 animate-fadeIn font-sans mt-2 shadow-lg">
                                <div class="flex items-center gap-2.5 truncate">
                                  <div class="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                                    <span class="material-symbols-outlined text-2xl">picture_as_pdf</span>
                                  </div>
                                  <div class="truncate">
                                    <span class="text-[9px] font-black text-emerald-400 uppercase block font-mono">CONTRATO CARGADO POR EL USUARIO:</span>
                                    <strong class="text-xs text-on-surface font-bold truncate block">{{ uploadedContractFile()?.name }}</strong>
                                  </div>
                                </div>

                                <button 
                                  (click)="selectedContractTemplate.set('manual'); showContractPreviewModal.set(true)"
                                  class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-black font-black text-xs shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all flex items-center gap-1.5 shrink-0 hover:scale-105"
                                >
                                  <span class="material-symbols-outlined text-base">visibility</span>
                                  <span>VISTA PREVIA</span>
                                </button>
                              </div>
                            }
                          </div>
                        </div>

                      </div>

                      <!-- RIGHT COLUMN: NOTIFICAR AL GRUPO & ACCIONES COMERCIALES (6 COLS) -->
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                        
                        <div class="space-y-4">
                          
                          <!-- NOTIFICAR AL GRUPO MUSICAL CARD -->
                          <div class="p-4 rounded-2xl bg-surface-container border border-cyan-500/30 space-y-3 shadow-inner">
                            <div class="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                              <span class="text-[10px] font-black text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-base text-cyan-400">campaign</span>
                                NOTIFICACIÓN AL GRUPO MUSICAL
                              </span>
                              @if (artistNotificationSent() || selectedQuote()?.artistNotified) {
                                <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  GRUPO NOTIFICADO ✔
                                </span>
                              }
                            </div>

                            <p class="text-[10px] sm:text-xs text-outline leading-relaxed">
                              Notifica al representante y miembros de <strong>{{ selectedQuote()?.groupName }}</strong> para que bloqueen de forma definitiva la fecha <strong>{{ selectedQuote()?.proposedDate }}</strong> en su agenda máster.
                            </p>

                            <!-- CANALES DE NOTIFICACIÓN MULTICANAL -->
                            <div class="grid grid-cols-3 gap-2">
                              <button 
                                (click)="sendArtistWhatsApp.set(!sendArtistWhatsApp())"
                                [class]="sendArtistWhatsApp() ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                                class="p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1"
                              >
                                <span class="material-symbols-outlined text-lg text-emerald-400">chat</span>
                                <span class="text-[9px] font-bold">WhatsApp</span>
                              </button>

                              <button 
                                (click)="sendArtistEmail.set(!sendArtistEmail())"
                                [class]="sendArtistEmail() ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                                class="p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1"
                              >
                                <span class="material-symbols-outlined text-lg text-blue-400">mail</span>
                                <span class="text-[9px] font-bold">Correo</span>
                              </button>

                              <button 
                                (click)="sendArtistApp.set(!sendArtistApp())"
                                [class]="sendArtistApp() ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-surface-container-high text-outline border-outline-variant/20 opacity-60'"
                                class="p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1"
                              >
                                <span class="material-symbols-outlined text-lg text-cyan-400">space_dashboard</span>
                                <span class="text-[9px] font-bold">App Acordex</span>
                              </button>
                            </div>

                            <button 
                              (click)="notifyArtistGroup()"
                              class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 hover:from-cyan-400 hover:to-teal-300 text-black font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
                            >
                              <span class="material-symbols-outlined text-base">send</span> ENVIAR ALERTA DE CONFIRMACIÓN AL GRUPO
                            </button>

                            @if (artistNotificationSent() || selectedQuote()?.artistNotified) {
                              <div class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[9px] text-center font-mono">
                                Notificación enviada: <strong>{{ artistNotificationTime() || selectedQuote()?.artistNotifiedTime || 'Hoy' }}</strong>
                              </div>
                            }
                          </div>

                          <!-- ACCIONES COMERCIALES DE SEGURIDAD Y APROBACIÓN DE CONTRATO -->
                          <div class="space-y-2.5 pt-2 border-t border-outline-variant/20">
                            <span class="text-[9px] font-black text-emerald-400 uppercase tracking-wider block font-sans">
                              APROBACIÓN & ENVÍO DE CONTRATO AL CLIENTE:
                            </span>

                            <!-- BOTÓN PRINCIPAL DE ENVÍO DE CONTRATO -->
                            <button 
                              (click)="sendContractToClient()"
                              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(52,211,153,0.4)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
                            >
                              <span class="material-symbols-outlined text-lg">mark_email_read</span>
                              <span>ENVIAR CONTRATO AL CLIENTE</span>
                            </button>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <!-- BOTÓN REGRESAR A REVISIÓN -->
                              <button 
                                (click)="showAcceptedRollbackModal.set(true)"
                                class="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 text-center hover:scale-105"
                              >
                                <span class="material-symbols-outlined text-base text-amber-400">undo</span>
                                Regresar a Revisión (Fase 1)
                              </button>

                              <!-- BOTÓN RECHAZAR / CANCELAR COTIZACIÓN ACEPTADA -->
                              <button 
                                (click)="showAcceptedRejectionModal.set(true)"
                                class="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 text-center hover:scale-105"
                              >
                                <span class="material-symbols-outlined text-base text-red-400">cancel</span>
                                Rechazar Cotización Aceptada
                              </button>
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                }

                <!-- SUB-TAB 2: INFORMACIÓN ORIGINAL DEL CLIENTE -->
                @if (acceptedTab() === 'info_original_cliente') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      
                      <!-- LEFT COLUMN: EXPEDIENTE Y CONTRATANTE (6 COLS) -->
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl">
                        <div class="border-b border-outline-variant/20 pb-2 flex items-center justify-between">
                          <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest block flex items-center gap-1.5 font-sans">
                            <span class="material-symbols-outlined text-sm text-blue-400">badge</span> EXPEDIENTE DEL CONTRATANTE
                          </span>
                          <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            CLIENTE VERIFICADO
                          </span>
                        </div>

                        <div class="space-y-3 text-xs">
                          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                            <span class="text-outline text-[9px] font-bold block uppercase font-sans">Nombre del Cliente / Representante:</span>
                            <p class="font-extrabold text-on-surface text-sm flex items-center gap-2">
                              <span class="material-symbols-outlined text-base text-primary">person</span> {{ selectedQuote()?.clientName }}
                            </p>
                          </div>

                          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                            <span class="text-outline text-[9px] font-bold block uppercase font-sans">Empresa / Razón Social / Organización:</span>
                            <p class="font-extrabold text-on-surface text-sm flex items-center gap-2">
                              <span class="material-symbols-outlined text-base text-outline">domain</span> {{ selectedQuote()?.clientCompany }}
                            </p>
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                              <span class="text-outline text-[9px] font-bold block uppercase font-sans">Correo Electrónico:</span>
                              <p class="font-bold text-primary text-xs truncate flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs text-primary">mail</span> {{ selectedQuote()?.clientEmail }}
                              </p>
                            </div>

                            <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                              <span class="text-outline text-[9px] font-bold block uppercase font-sans">Teléfono Directo:</span>
                              <p class="font-bold text-on-surface text-xs flex items-center gap-1 font-mono">
                                <span class="material-symbols-outlined text-xs text-outline">call</span> {{ selectedQuote()?.representativePhone || '+52 81 1234 5678' }}
                              </p>
                            </div>
                          </div>

                          <!-- NOTAS DEL CLIENTE -->
                          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                            <span class="text-outline text-[9px] font-bold block uppercase font-sans">Notas Adicionales del Cliente:</span>
                            <p class="text-xs text-on-surface/90 italic leading-relaxed pt-0.5 font-sans">
                              "{{ selectedQuote()?.notes || 'Sin especificaciones adicionales enviadas al solicitar el presupuesto.' }}"
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- RIGHT COLUMN: AGRUPACIÓN & ESTRUCTURA DEL SHOW SOLICITADO (6 COLS) -->
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl">
                        <div class="border-b border-outline-variant/20 pb-2 flex items-center justify-between">
                          <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1.5 font-sans">
                            <span class="material-symbols-outlined text-sm text-amber-400">music_note</span> DETALLES DEL SHOW Y HORARIOS SOLICITADOS
                          </span>
                          <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {{ selectedQuote()?.eventType || 'Evento Privado' }}
                          </span>
                        </div>

                        <!-- COVER ARTIST CARD -->
                        <div class="relative rounded-2xl overflow-hidden shadow-md border border-outline-variant/30 h-28 group">
                          <img 
                            [src]="selectedQuote()?.artistImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80'" 
                            alt="Group Banner" 
                            class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          />
                          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-3 justify-between">
                            <div>
                              <span class="text-[8px] font-bold text-amber-300 uppercase tracking-widest block font-sans">AGRUPACIÓN MUSICAL</span>
                              <h4 class="text-sm sm:text-base font-black text-white uppercase tracking-wider font-sans drop-shadow-md">
                                {{ selectedQuote()?.groupName }}
                              </h4>
                            </div>
                            <span class="px-2.5 py-1 rounded-xl bg-black/60 text-amber-300 font-mono font-bold text-xs border border-amber-400/40 backdrop-blur-md">
                              ⭐ {{ selectedQuote()?.rating || 4.8 }} Rating
                            </span>
                          </div>
                        </div>

                        <div class="space-y-2.5 text-xs font-sans">
                          <!-- ESTRUCTURA DE FECHA Y HORAS -->
                          <div class="grid grid-cols-2 gap-2">
                            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                              <span class="text-outline text-[9px] font-bold block uppercase font-sans">FECHA ORIGINAL SOLICITADA POR EL CLIENTE:</span>
                              <span class="font-extrabold text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] font-mono text-xs flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs text-emerald-400">calendar_today</span> {{ selectedQuote()?.proposedDate }}
                              </span>
                            </div>

                            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                              <span class="text-outline text-[9px] font-bold block uppercase font-sans">Duración Contratada:</span>
                              <span class="font-black text-amber-300 font-mono text-xs flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs text-amber-400">timer</span> {{ selectedQuote()?.durationHours || 3 }} Horas Totales
                              </span>
                            </div>
                          </div>

                          <!-- ESTRUCTURA DE HORARIOS (TANDAS VS CONTINUO) -->
                          <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2">
                            <div class="flex items-center justify-between border-b border-outline-variant/10 pb-1.5">
                              <span class="text-outline text-[9px] font-bold uppercase font-sans">Formato de Presentación:</span>
                              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                {{ hasQuoteTandas(selectedQuote()) ? 'Tandas / Bloques Fragmentados' : 'Horario Continuo' }}
                              </span>
                            </div>

                            @if (hasQuoteTandas(selectedQuote())) {
                              <div class="space-y-1.5">
                                @for (block of getQuoteShowBlocks(selectedQuote()); track block.id; let bIdx = $index) {
                                  <div class="p-2 rounded-lg bg-surface-container-high/80 border border-outline-variant/20 flex items-center justify-between text-[11px] font-mono">
                                    <span class="font-bold text-amber-300 font-sans">• Tanda #{{ bIdx + 1 }}: {{ block.label || 'Set Musical' }}</span>
                                    <span class="text-on-surface font-extrabold">{{ block.startTime }} a {{ block.endTime }} hrs</span>
                                  </div>
                                }
                              </div>
                            } @else {
                              <div class="p-2 rounded-lg bg-surface-container-high/80 border border-outline-variant/20 flex items-center justify-between text-[11px] font-mono">
                                <span class="font-bold text-cyan-300 font-sans">• Show Continuo Sin Pausas</span>
                                <span class="text-on-surface font-extrabold">21:00 a 00:00 hrs</span>
                              </div>
                            }
                          </div>

                          <!-- RECINTO Y UBICACIÓN -->
                          <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                            <span class="text-outline text-[9px] font-bold block uppercase font-sans">Recinto & Dirección del Evento:</span>
                            <p class="font-bold text-on-surface text-xs flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-primary">location_on</span> {{ selectedQuote()?.venue }} — {{ selectedQuote()?.eventAddress || selectedQuote()?.city }}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                }

                <!-- SUB-TAB 3: HISTORIAL DE NEGOCIACIONES -->
                @if (acceptedTab() === 'historial_negociaciones') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
                    <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                        <span class="material-symbols-outlined text-sm text-amber-400">history</span>
                        CRONOLOGÍA COMPLETA DE RONDAS NEGOCIADAS HASTA LA ACEPTACIÓN
                      </span>
                      <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/40">
                        {{ negotiationHistory().length }} Rondas de Negociación Registradas
                      </span>
                    </div>

                    @for (entry of negotiationHistory(); track entry.round; let idx = $index) {
                      @let baseline = getPreviousRoundBaseline(idx);

                      <!-- ROUND ITEM CONTAINER -->
                      <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border-2 border-amber-400/50 space-y-4 shadow-[0_0_30px_rgba(251,191,36,0.12)] backdrop-blur-xl">
                        
                        <!-- ROUND HEADER BANNER -->
                        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/30 pb-3">
                          <div class="flex items-center gap-2">
                            <span class="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-400/40 flex items-center gap-1 shadow-sm">
                              <span class="material-symbols-outlined text-sm text-amber-400">event_repeat</span>
                              RONDA #{{ entry.round }}
                            </span>
                            <span class="text-xs font-bold text-on-surface hidden sm:inline">| Cotización en Negociación</span>
                          </div>

                          <div class="flex items-center gap-2">
                            <span class="px-3 py-1 rounded-xl text-cyan-200 bg-surface-container-high/90 border border-cyan-500/30 font-mono text-xs font-bold flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-cyan-400">schedule</span>
                              FECHA DE NEGOCIACIÓN (RONDA #{{ entry.round }}): {{ entry.timestamp }}
                            </span>
                          </div>
                        </div>

                        <!-- MOTIVO DE RECHAZO DEL CLIENTE EN ESTA RONDA -->
                        <div class="p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 space-y-1.5 shadow-inner">
                          <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1 font-sans">
                            <span class="material-symbols-outlined text-xs text-amber-400">feedback</span>
                            MOTIVO DE RECHAZO DEL CLIENTE EN RONDA #{{ entry.round }}:
                          </span>
                          <p class="text-xs text-on-surface/90 italic font-sans leading-relaxed">
                            &ldquo;{{ entry.clientRejectionMessage }}&rdquo;
                          </p>
                        </div>

                        <!-- 2-COLUMN SPLIT FOR ROUND #N DETAILS -->
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          
                          <!-- LEFT COLUMN: DETALLES DEL SHOW PROPUESTO EN RONDA #N (6 COLS) -->
                          <div class="lg:col-span-6 p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-3.5">
                            <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1 font-sans">
                              <span class="material-symbols-outlined text-xs text-emerald-400">event</span>
                              DETALLES DEL SHOW PROPUESTO EN RONDA #{{ entry.round }}
                            </span>

                            <div class="space-y-2 text-xs font-sans">
                              <!-- FECHAS -->
                              <div class="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-1">
                                <span class="text-outline text-[9px] font-bold block uppercase font-sans">FECHA ORIGINAL SOLICITADA POR EL CLIENTE:</span>
                                <span class="text-on-surface font-mono font-bold text-xs block">{{ selectedQuote()?.proposedDate }}</span>
                              </div>

                              <div class="p-2.5 rounded-xl bg-surface-container-high border border-emerald-500/40 space-y-1">
                                <span class="text-outline text-[9px] font-bold block uppercase font-sans">FECHA PROPUESTA (RONDA #{{ entry.round }}):</span>
                                <span class="text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] font-black font-mono text-xs block">
                                  {{ entry.proposedDate || selectedQuote()?.proposedDate }}
                                </span>
                              </div>

                              <!-- DURACIÓN Y ESTRUCTURA -->
                              <div class="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-2">
                                <div class="flex items-center justify-between">
                                  <span class="text-outline text-[9px] font-bold uppercase font-sans">Estructura de Horarios:</span>
                                  <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                    {{ entry.scheduleMode === 'tandas' || (entry.showBlocks && entry.showBlocks.length > 0) ? 'Tandas / Bloques Fragmentados' : 'Horario Continuo' }}
                                  </span>
                                </div>

                                @if (entry.showBlocks && entry.showBlocks.length > 0) {
                                  <div class="space-y-1">
                                    @for (block of entry.showBlocks; track block.id; let bIdx = $index) {
                                      <div class="p-1.5 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-between text-[10px] font-mono">
                                        <span class="font-bold text-amber-300 font-sans">• Tanda #{{ bIdx + 1 }}: {{ block.label || 'Set Musical' }}</span>
                                        <span class="text-on-surface font-extrabold">{{ block.startTime }} a {{ block.endTime }} hrs</span>
                                      </div>
                                    }
                                  </div>
                                } @else {
                                  <div class="p-1.5 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-between text-[10px] font-mono">
                                    <span class="font-bold text-cyan-300 font-sans">• Show Continuo Sin Pausas</span>
                                    <span class="text-on-surface font-extrabold">{{ entry.startTime || '21:00' }} a {{ entry.endTime || '00:00' }} hrs</span>
                                  </div>
                                }
                              </div>

                              <!-- SERVICIO DE AUDIO EN ESTA RONDA -->
                              <div class="p-2.5 rounded-xl bg-surface-container-high border border-purple-500/30 space-y-1">
                                <span class="text-outline text-[9px] font-bold block uppercase font-sans">Servicio de Equipo de Audio (Ronda #{{ entry.round }}):</span>
                                <div class="flex items-center justify-between">
                                  <span class="font-bold text-purple-300 font-sans text-xs flex items-center gap-1">
                                    <span class="material-symbols-outlined text-xs text-purple-400">speaker_group</span>
                                    {{ entry.soundOption === 'proveedor' || (entry.soundCost && entry.soundCost > 0) ? 'Incluye Sistema de Audio Profesional Disquera' : 'Proporcionado por el Cliente' }}
                                  </span>
                                  <span class="font-mono text-xs font-black text-on-surface">
                                    &#36;{{ (entry.soundCost || 0) | number:'1.0-0' }} MXN
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- RIGHT COLUMN: DETALLES DE LA PROPUESTA DISQUERA EN RONDA #N (6 COLS) -->
                          <div class="lg:col-span-6 p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-3.5">
                            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                              <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1 font-sans">
                                <span class="material-symbols-outlined text-xs text-amber-400">payments</span>
                                DETALLES DE LA PROPUESTA DISQUERA EN RONDA #{{ entry.round }}
                              </span>
                              <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {{ baseline.label }} vs Ronda #{{ entry.round }}
                              </span>
                            </div>

                            <div class="space-y-1.5 text-[10px] font-mono">
                              <!-- Honorarios -->
                              <div class="p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between">
                                <div>
                                  <span class="font-sans font-bold text-on-surface block text-[10px]">• Honorarios Grupo:</span>
                                  <span class="text-outline text-[9px]">{{ baseline.label }}: &#36;{{ baseline.artistFee | number:'1.0-0' }} MXN</span>
                                </div>
                                <div class="text-right">
                                  <strong class="text-amber-300 block">&#36;{{ entry.artistFee | number:'1.0-0' }} MXN</strong>
                                  <span [class]="(entry.artistFee - baseline.artistFee) < 0 ? 'text-emerald-400' : ((entry.artistFee > baseline.artistFee) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                    {{ (entry.artistFee - baseline.artistFee) < 0 ? ('- ' + (((baseline.artistFee - entry.artistFee) / (baseline.artistFee || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.artistFee > baseline.artistFee) ? '🔺 +%' : '0%') }}
                                  </span>
                                </div>
                              </div>

                              <!-- Viáticos -->
                              <div class="p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between">
                                <div>
                                  <span class="font-sans font-bold text-on-surface block text-[10px]">• Viáticos & Hospedaje:</span>
                                  <span class="text-outline text-[9px]">{{ baseline.label }}: &#36;{{ baseline.viaticosCost | number:'1.0-0' }} MXN</span>
                                </div>
                                <div class="text-right">
                                  <strong class="text-amber-300 block">&#36;{{ entry.viaticosCost | number:'1.0-0' }} MXN</strong>
                                  <span [class]="(entry.viaticosCost - baseline.viaticosCost) < 0 ? 'text-emerald-400' : ((entry.viaticosCost > baseline.viaticosCost) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                    {{ (entry.viaticosCost - baseline.viaticosCost) < 0 ? ('- ' + (((baseline.viaticosCost - entry.viaticosCost) / (baseline.viaticosCost || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.viaticosCost > baseline.viaticosCost) ? '🔺 +%' : '0%') }}
                                  </span>
                                </div>
                              </div>

                              <!-- Equipo de Audio Profesional -->
                              <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                                <div>
                                  <span class="font-sans font-bold text-purple-300 block text-[10px]">• Equipo de Audio Profesional:</span>
                                  <span class="text-outline text-[9px]">
                                    {{ entry.soundOption === 'proveedor' || (entry.soundCost && entry.soundCost > 0) ? 'Proveedor Disquera' : 'Proporcionado por Cliente' }} — {{ baseline.label }}: &#36;{{ baseline.soundCost | number:'1.0-0' }} MXN
                                  </span>
                                </div>
                                <div class="text-right">
                                  <strong class="text-purple-300 block">&#36;{{ (entry.soundCost || 0) | number:'1.0-0' }} MXN</strong>
                                  <span [class]="(entry.soundCost - baseline.soundCost) < 0 ? 'text-emerald-400' : ((entry.soundCost > baseline.soundCost) ? 'text-amber-400' : 'text-outline')" class="text-[9px] font-bold">
                                    {{ (entry.soundCost - baseline.soundCost) < 0 ? ('- ' + (((baseline.soundCost - entry.soundCost) / (baseline.soundCost || 1)) * 100 | number:'1.0-1') + '% 🔻') : ((entry.soundCost > baseline.soundCost) ? '🔺 +%' : '0%') }}
                                  </span>
                                </div>
                              </div>

                              <!-- Margen -->
                              <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                                <div>
                                  <span class="font-sans font-bold text-purple-300 block text-[10px]">• Margen Disquera:</span>
                                  <span class="text-outline text-[9px]">{{ baseline.label }}: {{ baseline.marginPercent }}% — Ronda #{{ entry.round }}: {{ entry.marginPercent }}%</span>
                                </div>
                                <div class="text-right">
                                  <strong class="text-purple-300 block">{{ entry.marginPercent }}%</strong>
                                  <span [class]="entry.marginPercent < baseline.marginPercent ? 'text-emerald-400' : 'text-outline'" class="text-[9px] font-bold">
                                    {{ entry.marginPercent < baseline.marginPercent ? ('- ' + (baseline.marginPercent - entry.marginPercent) + '% pts 🔻') : '0%' }}
                                  </span>
                                </div>
                              </div>

                              <!-- Total Oferta Final -->
                              <div class="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-surface-container-high to-amber-500/20 border-2 border-amber-400/50 flex items-center justify-between mt-2 shadow-sm">
                                <span class="font-sans font-black text-amber-300 text-xs uppercase tracking-wider">OFERTA TOTAL EN RONDA #{{ entry.round }}:</span>
                                <strong class="text-amber-300 font-mono font-black text-base sm:text-lg drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                                  &#36;{{ entry.totalOffered | number:'1.0-0' }} MXN
                                </strong>
                              </div>

                              @if (entry.adminProposalNote) {
                                <div class="p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 text-[10px] font-sans pt-1.5">
                                  <span class="text-[9px] font-black text-amber-300 uppercase block mb-0.5">NOTA DE NEGOCIACIÓN DISQUERA:</span>
                                  <p class="italic text-on-surface/80">&ldquo;{{ entry.adminProposalNote }}&rdquo;</p>
                                </div>
                              }
                            </div>
                          </div>

                        </div>

                      </div>
                    }
                  </div>
                }

              </div>
            }

            <!-- WORKFLOW ESPECIALIZADO PARA FASE 4: 'Contrato en espera de firma' -->
            @if (selectedQuote()?.state === 'Contrato en espera de firma') {
              <div class="h-full flex flex-col min-h-0 space-y-4 font-sans">
                
                <!-- SUB-TABS NAVEGACIÓN DE FASE 4 -->
                <div class="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 shrink-0">
                  <button 
                    (click)="awaitingSignatureTab.set('seguimiento_contrato')"
                    [class]="awaitingSignatureTab() === 'seguimiento_contrato' ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 text-purple-300 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]' : 'text-outline hover:text-on-surface border-transparent'"
                    class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 flex-1 justify-center"
                  >
                    <span class="material-symbols-outlined text-base">draw</span>
                    <span>Vista de Contrato Enviado & Seguimiento</span>
                  </button>

                  <button 
                    (click)="awaitingSignatureTab.set('info_acuerdo')"
                    [class]="awaitingSignatureTab() === 'info_acuerdo' ? 'bg-surface-bright text-on-surface border-outline-variant/40 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
                    class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 flex-1 justify-center"
                  >
                    <span class="material-symbols-outlined text-base">verified</span>
                    <span>Información Inmutable del Acuerdo</span>
                  </button>

                  <button 
                    (click)="awaitingSignatureTab.set('info_cliente')"
                    [class]="awaitingSignatureTab() === 'info_cliente' ? 'bg-surface-bright text-on-surface border-outline-variant/40 shadow-sm' : 'text-outline hover:text-on-surface border-transparent'"
                    class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 flex-1 justify-center"
                  >
                    <span class="material-symbols-outlined text-base">assignment_ind</span>
                    <span>Información Original del Cliente</span>
                  </button>

                  @if (isInNegotiationRound() || (negotiationHistory() && negotiationHistory().length > 0)) {
                    <button 
                      (click)="awaitingSignatureTab.set('historial')"
                      [class]="awaitingSignatureTab() === 'historial' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'text-outline hover:text-on-surface border-transparent'"
                      class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 flex-1 justify-center"
                    >
                      <span class="material-symbols-outlined text-base">history</span>
                      <span>Historial de Negociaciones ({{ negotiationHistory().length }})</span>
                    </button>
                  }
                </div>

                <!-- SUB-TAB 1: VISTA DE CONTRATO ENVIADO & SEGUIMIENTO -->
                @if (awaitingSignatureTab() === 'seguimiento_contrato') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                    
                    <!-- BANNER SUPERIOR DE ESTADO DE CONTRATO & LECTURA DEL CLIENTE -->
                    <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-purple-500/15 border-2 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] space-y-3 relative overflow-hidden">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                          <div class="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                            <span class="material-symbols-outlined text-2xl">mark_email_read</span>
                          </div>
                          <div>
                            <span class="text-[9px] font-black text-purple-300 uppercase tracking-widest block font-mono">
                              FASE 4 • CONTRATO ENVIADO EN ESPERA DE FIRMA DIGITAL
                            </span>
                            <h2 class="text-sm sm:text-base font-black text-on-surface flex items-center gap-2">
                              <span>DOCUMENTO ENVIADO A {{ selectedQuote()?.clientName | uppercase }}</span>
                              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                {{ selectedQuote()?.id }}
                              </span>
                            </h2>
                          </div>
                        </div>

                        <!-- BADGE DE SEGUIMIENTO DE LECTURA DEL CLIENTE -->
                        <div class="flex items-center gap-2">
                          @if (clientViewed()) {
                            <div class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                              <span class="material-symbols-outlined text-sm text-emerald-400">visibility</span>
                              <span>VISTO POR EL CLIENTE ✔</span>
                            </div>
                          } @else {
                            <div class="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black flex items-center gap-1.5 shadow-sm">
                              <span class="material-symbols-outlined text-sm text-amber-400">hourglass_top</span>
                              <span>PENDIENTE DE LECTURA ⏳</span>
                            </div>
                          }
                        </div>
                      </div>

                      <div class="p-3 rounded-xl bg-surface-container-high/90 border border-outline-variant/20 text-xs text-on-surface/90 flex flex-wrap items-center justify-between gap-2">
                        <span class="text-outline">
                          @if (clientViewed()) {
                            <span>• El cliente abrió y revisó el borrador de contrato el <strong>{{ clientViewedTime() }}</strong>.</span>
                          } @else {
                            <span>• Notificación enviada al cliente. El documento aún no ha sido abierto en el portal.</span>
                          }
                        </span>
                        <span class="font-mono text-[10px] text-purple-300 font-bold">Estado: Pendiente de Firma Digital</span>
                      </div>
                    </div>

                    <!-- GRID DE 2 COLUMNAS PARA FASE 4 -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      
                      <!-- COLUMNA IZQUIERDA: DETALLES DEL CONTRATO ENVIADO & VISUALIZACIÓN (6 COLS) -->
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                        <div class="space-y-3.5">
                          <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
                            <span class="text-[10px] font-black text-purple-300 uppercase tracking-wider block flex items-center gap-1.5">
                              <span class="material-symbols-outlined text-base text-purple-400">picture_as_pdf</span>
                              CONTRATO ENVIADO A FIRMA
                            </span>
                            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              DOCUMENTO FIRMABLE
                            </span>
                          </div>

                          <!-- TARJETA DEL ARCHIVO DE CONTRATO INMUTABLE -->
                          <div class="p-4 rounded-2xl bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container border-2 border-purple-500/40 space-y-3 text-xs shadow-inner">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-3">
                                <div class="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                                  <span class="material-symbols-outlined text-2xl">picture_as_pdf</span>
                                </div>
                                <div>
                                  <strong class="text-on-surface font-bold text-xs block truncate max-w-[200px]">
                                    {{ selectedQuote()?.contractFileName || ('Contrato_Privado_' + selectedQuote()?.id + '.pdf') }}
                                  </strong>
                                  <span class="text-outline text-[10px] block font-mono">
                                    Plantilla: {{ selectedTemplateId() | uppercase }} • Sello Digital Verificado
                                  </span>
                                </div>
                              </div>

                              <!-- BOTÓN VISTA PREVIA -->
                              <button 
                                (click)="showContractPreviewModal.set(true)"
                                class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 hover:from-purple-500/40 hover:to-indigo-500/40 text-purple-200 font-extrabold text-xs border border-purple-400/50 transition-all flex items-center gap-1.5 hover:scale-105 shrink-0 shadow-md"
                              >
                                <span class="material-symbols-outlined text-base text-purple-300">visibility</span>
                                <span>Abrir Vista Previa</span>
                              </button>
                            </div>

                            <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-1 text-[11px]">
                              <div class="flex justify-between">
                                <span class="text-outline">• Agrupación:</span>
                                <strong class="text-amber-300">{{ selectedQuote()?.groupName }}</strong>
                              </div>
                              <div class="flex justify-between">
                                <span class="text-outline">• Recinto:</span>
                                <strong class="text-on-surface">{{ selectedQuote()?.venue }}</strong>
                              </div>
                              <div class="flex justify-between border-t border-outline-variant/20 pt-1">
                                <span class="text-outline">• Total Firmable Pactado:</span>
                                <strong class="text-emerald-400 font-mono text-xs font-black">$ {{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</strong>
                              </div>
                            </div>
                          </div>

                          <div class="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2 text-xs">
                            <span class="text-[9px] font-black text-purple-300 uppercase tracking-wider block font-sans">
                              ESTADO DE FIRMAS DIGITALES:
                            </span>

                            <div class="space-y-1.5">
                              <div class="flex items-center justify-between p-2 rounded-xl bg-surface-container-high border border-emerald-500/30 text-[11px]">
                                <span class="font-bold text-on-surface">1. Acordex Music (Disquera):</span>
                                <span class="text-emerald-400 font-mono font-bold text-[10px]">FIRMADO ✔</span>
                              </div>
                              <div class="flex items-center justify-between p-2 rounded-xl bg-surface-container-high border border-amber-500/30 text-[11px]">
                                <span class="font-bold text-on-surface">2. Cliente ({{ selectedQuote()?.clientName }}):</span>
                                <span class="text-amber-300 font-mono font-bold text-[10px]">ESPERANDO FIRMA ⏳</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- ACCIÓN DE REGRESO A FASE 3 (COTIZACIÓN ACEPTADA) -->
                        <div class="pt-3 border-t border-outline-variant/20 space-y-2">
                          <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider block font-sans">
                            CORRECCIÓN DE CONTRATO Y CONTROL DE FASE:
                          </span>

                          <button 
                            (click)="showContractRollbackModal.set(true)"
                            class="w-full py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] shadow-sm"
                          >
                            <span class="material-symbols-outlined text-base text-amber-400">undo</span>
                            <span>REGRESAR A FASE 3 (COTIZACIÓN ACEPTADA)</span>
                          </button>
                        </div>
                      </div>

                      <!-- COLUMNA DERECHA: NOTIFICACIONES & RESUMEN DE SEGUIMIENTO (6 COLS) -->
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                        <div class="space-y-4">
                          <div class="p-4 rounded-2xl bg-surface-container border border-cyan-500/30 space-y-3 shadow-inner">
                            <div class="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                              <span class="text-[10px] font-black text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-base text-cyan-400">chat</span>
                                CONTACTO Y RECORDATORIO AL CLIENTE
                              </span>
                              <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                RECORDATORIO
                              </span>
                            </div>

                            <p class="text-xs text-on-surface/90 leading-relaxed font-sans">
                              Puedes enviar un recordatorio directo a <strong>{{ selectedQuote()?.clientName }}</strong> por WhatsApp para agilizar la firma digital del contrato.
                            </p>

                            <button 
                              (click)="contactWhatsApp()"
                              class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-black font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                            >
                              <span class="material-symbols-outlined text-lg">chat</span>
                              <span>ENVIAR RECORDATORIO DE FIRMA POR WHATSAPP</span>
                            </button>
                          </div>

                          <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2.5 text-xs">
                            <span class="text-[10px] font-black text-purple-300 uppercase tracking-wider block">
                              DETALLES DE LA SOLICITUD DE FIRMA
                            </span>
                            <div class="space-y-1.5 text-[11px]">
                              <div class="flex justify-between">
                                <span class="text-outline">• Correo Notificado:</span>
                                <strong class="text-on-surface">{{ selectedQuote()?.clientEmail || 'cliente@ejemplo.com' }}</strong>
                              </div>
                              <div class="flex justify-between">
                                <span class="text-outline">• Teléfono / WhatsApp:</span>
                                <strong class="text-on-surface">{{ selectedQuote()?.phone }}</strong>
                              </div>
                              <div class="flex justify-between">
                                <span class="text-outline">• Código de Seguridad HASH:</span>
                                <strong class="text-purple-300 font-mono text-[10px]">SHA256-{{ selectedQuote()?.id }}-VERIFIED</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- FOOTER ACTION BACK BUTTON -->
                        <div class="pt-3 border-t border-outline-variant/20">
                          <button 
                            (click)="showContractRollbackModal.set(true)"
                            class="w-full py-2.5 px-3 rounded-xl bg-surface-bright hover:bg-surface-container-high text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-1.5"
                          >
                            <span class="material-symbols-outlined text-sm text-amber-400">history_toggle_off</span>
                            <span>Reversar Contrato y Modificar en Fase 3</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                }

                <!-- SUB-TAB 2: INFORMACIÓN INMUTABLE DEL ACUERDO -->
                @if (awaitingSignatureTab() === 'info_acuerdo') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                    <div class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl">
                      <div class="border-b border-outline-variant/20 pb-2 flex items-center justify-between">
                        <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-base text-emerald-400">verified</span>
                          INFORMACIÓN INMUTABLE DEL ACUERDO PACTADO (FASE 4)
                        </span>
                        <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          DATOS CONTRATADOS
                        </span>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div class="p-3.5 rounded-2xl bg-surface-container border border-emerald-500/30 space-y-2">
                          <span class="text-emerald-400 text-[9px] font-bold uppercase block font-sans">1. Show & Horarios Contratados:</span>
                          <div class="space-y-1 text-[11px]">
                            <div class="flex justify-between">
                              <span class="text-outline">Duración:</span>
                              <strong class="text-amber-300 font-mono font-bold">{{ selectedQuote()?.durationHours || 3 }} Horas</strong>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-outline">Formato:</span>
                              <strong class="text-purple-300 uppercase font-bold">{{ hasQuoteTandas(selectedQuote()) ? 'Tandas' : 'Continuo' }}</strong>
                            </div>
                          </div>
                        </div>

                        <div class="p-3.5 rounded-2xl bg-surface-container border border-purple-500/30 space-y-2">
                          <span class="text-purple-300 text-[9px] font-bold uppercase block font-sans">2. Equipo de Audio:</span>
                          <div class="space-y-1 text-[11px]">
                            <div class="flex justify-between">
                              <span class="text-outline">Sistema:</span>
                              <strong class="text-purple-300 font-bold">
                                {{ selectedQuote()?.soundOption === 'proveedor' || (selectedQuote()?.soundCost && selectedQuote()!.soundCost! > 0) ? 'Incluido por Acordex' : 'Proporcionado por Cliente' }}
                              </strong>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-outline">Costo Audio:</span>
                              <strong class="text-on-surface font-mono">$ {{ (selectedQuote()?.soundCost || 0) | number:'1.0-0' }} MXN</strong>
                            </div>
                          </div>
                        </div>

                        <div class="p-3.5 rounded-2xl bg-surface-container border border-cyan-500/30 space-y-2">
                          <span class="text-cyan-300 text-[9px] font-bold uppercase block font-sans">3. Recinto & Lugar:</span>
                          <p class="font-bold text-on-surface text-xs pt-0.5 truncate">
                            {{ selectedQuote()?.venue }} — {{ selectedQuote()?.eventAddress || selectedQuote()?.city }}
                          </p>
                        </div>
                      </div>

                      <!-- DESGLOSE FINANCIERO INMUTABLE COMPLETO -->
                      <div class="p-4 rounded-2xl bg-surface-container border-2 border-amber-400/50 space-y-3 font-mono">
                        <div class="flex items-center justify-between border-b border-amber-400/30 pb-2">
                          <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider font-sans">
                            DESGLOSE FINANCIERO COMPLETO PACTADO EN CONTRATO
                          </span>
                          <span class="text-[9px] font-bold text-cyan-400">TARIFARIO OFICIAL</span>
                        </div>

                        <div class="space-y-1.5 text-xs">
                          <div class="flex justify-between text-outline">
                            <span>• Honorarios del Grupo Musical:</span>
                            <strong class="text-on-surface">&#36;{{ (selectedQuote()?.artistFee || 35000) | number:'1.0-0' }} MXN</strong>
                          </div>

                          <div class="flex justify-between text-outline">
                            <span>• Viáticos & Hospedaje:</span>
                            <strong class="text-on-surface">&#36;{{ (selectedQuote()?.viaticosCost || 8500) | number:'1.0-0' }} MXN</strong>
                          </div>

                          <div class="flex justify-between text-outline">
                            <span>• Equipo de Audio Profesional:</span>
                            <strong class="text-purple-300">&#36;{{ (selectedQuote()?.soundCost || 0) | number:'1.0-0' }} MXN</strong>
                          </div>

                          <div class="flex justify-between text-purple-300">
                            <span>• Margen Disquera / Agencia:</span>
                            <strong>&#36;{{ (selectedQuote()?.marginAmount || 7000) | number:'1.0-0' }} MXN</strong>
                          </div>

                          <div class="flex justify-between text-cyan-400">
                            <span>• Comisión Plataforma (5% Fijo):</span>
                            <strong>&#36;{{ ((selectedQuote()?.totalAmount || 50000) * 0.05) | number:'1.0-0' }} MXN</strong>
                          </div>

                          @if (selectedQuote()?.includeIva) {
                            <div class="flex justify-between text-blue-300">
                              <span>• Impuesto IVA (+16% Facturado):</span>
                              <strong>&#36;{{ ((selectedQuote()?.totalAmount || 50000) * 0.16) | number:'1.0-0' }} MXN</strong>
                            </div>
                          }

                          <div class="flex justify-between text-amber-400 font-black border-t-2 border-amber-400/40 pt-2 font-sans text-sm sm:text-base">
                            <span class="uppercase tracking-wider">TOTAL FIRMABLE:</span>
                            <span class="font-mono text-amber-300 font-black drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                              &#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- SUB-TAB 3: INFORMACIÓN ORIGINAL DEL CLIENTE -->
                @if (awaitingSignatureTab() === 'info_cliente') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl">
                        <div class="border-b border-outline-variant/20 pb-2 flex items-center justify-between">
                          <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest block flex items-center gap-1.5 font-sans">
                            <span class="material-symbols-outlined text-sm text-blue-400">badge</span> EXPEDIENTE DEL CONTRATANTE
                          </span>
                        </div>

                        <div class="space-y-3 text-xs">
                          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
                            <div class="flex items-center gap-3">
                              <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-base">
                                {{ selectedQuote()?.clientName?.charAt(0) || 'C' }}
                              </div>
                              <div>
                                <strong class="text-on-surface font-black text-sm block">{{ selectedQuote()?.clientName }}</strong>
                                <span class="text-outline text-[10px] block font-mono">{{ selectedQuote()?.clientCompany }}</span>
                              </div>
                            </div>
                          </div>

                          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1.5 font-mono text-[11px]">
                            <div class="flex justify-between">
                              <span class="text-outline">Teléfono:</span>
                              <strong class="text-on-surface">{{ selectedQuote()?.phone }}</strong>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-outline">Email:</span>
                              <strong class="text-on-surface">{{ selectedQuote()?.clientEmail || 'cliente@ejemplo.com' }}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl">
                        <div class="border-b border-outline-variant/20 pb-2 flex items-center justify-between">
                          <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1.5 font-sans">
                            <span class="material-symbols-outlined text-sm text-amber-400">event</span> REQUERIMIENTO ORIGINAL
                          </span>
                        </div>

                        <div class="space-y-2.5 text-xs">
                          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1 text-[11px]">
                            <div class="flex justify-between">
                              <span class="text-outline">• Recinto:</span>
                              <strong class="text-on-surface">{{ selectedQuote()?.venue }}</strong>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-outline">• Fecha:</span>
                              <strong class="text-emerald-400 font-mono font-bold">{{ selectedQuote()?.proposedDate }}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- SUB-TAB 4: HISTORIAL DE NEGOCIACIONES -->
                @if (awaitingSignatureTab() === 'historial') {
                  <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
                    <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                      <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                        <span class="material-symbols-outlined text-sm text-amber-400">history</span>
                        CRONOLOGÍA DE RONDAS NEGOCIADAS (FIRMABLE)
                      </span>
                    </div>

                    @for (entry of negotiationHistory(); track entry.round; let idx = $index) {
                      <div class="p-4 rounded-2xl bg-surface-container-high/90 border border-amber-400/30 space-y-2 text-xs">
                        <div class="flex justify-between font-mono text-[10px]">
                          <strong class="text-amber-300 font-bold">• Ronda #{{ entry.round }}</strong>
                          <span class="text-outline">{{ entry.timestamp }}</span>
                        </div>
                        <p class="text-[11px] text-on-surface/90 italic">&ldquo;{{ entry.clientRejectionMessage }}&rdquo;</p>
                      </div>
                    }
                  </div>
                }

              </div>
            }

            <!-- TAB: EXPEDIENTE DE FASE ACTUAL (FOR OTHER STATES) -->
            @if (selectedQuote()?.state !== 'En revisión' && selectedQuote()?.state !== 'Propuesta enviada' && selectedQuote()?.state !== 'Negociación' && selectedQuote()?.state !== 'Aceptada' && selectedQuote()?.state !== 'Contrato en espera de firma' && modalTab() === 'estado_actual') {
              <div class="space-y-6">
                @if (selectedQuote()?.state === 'Cancelada') {
                  <div class="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-red-500/10 border border-red-500/30 space-y-3 text-center">
                    <span class="text-xs font-black text-red-400 uppercase tracking-wider block">Cotización Cancelada / Rechazada</span>
                    <p class="text-xs text-outline max-w-xl mx-auto">{{ selectedQuote()?.notes || 'Esta fecha ha sido liberada en la agenda del grupo.' }}</p>
                  </div>
                } @else {
                  <div class="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3 text-center">
                    <span class="text-xs font-black text-primary uppercase tracking-wider block">Expediente en Seguimiento</span>
                    <p class="text-xs text-outline max-w-xl mx-auto">Fase comercial activa en el pipeline disquera para {{ selectedQuote()?.groupName }}.</p>
                  </div>
                }
              </div>
            }

            <!-- TAB: SOLICITUD ORIGINAL DEL CLIENTE (FOR OTHER STATES) -->
            @if (selectedQuote()?.state !== 'En revisión' && selectedQuote()?.state !== 'Propuesta enviada' && selectedQuote()?.state !== 'Negociación' && selectedQuote()?.state !== 'Aceptada' && selectedQuote()?.state !== 'Contrato en espera de firma' && modalTab() === 'solicitud') {
              <div class="space-y-4">
                <div class="p-4 sm:p-6 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-4">
                  <h4 class="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-base">person</span>
                    Datos del Cliente Contratante
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span class="text-outline block">Nombre:</span>
                      <p class="font-bold text-on-surface text-sm">{{ selectedQuote()?.clientName }}</p>
                      <p class="text-outline">{{ selectedQuote()?.clientCompany }}</p>
                    </div>

                    <div>
                      <span class="text-outline block">Contacto:</span>
                      <p class="font-bold text-on-surface">{{ selectedQuote()?.clientEmail }}</p>
                      <p class="text-outline">{{ selectedQuote()?.representativePhone || '+52 81 1234 5678' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- TAB: CONTROL DE COBRANZA & PAGOS -->
            @if (selectedQuote()?.state !== 'En revisión' && selectedQuote()?.state !== 'Propuesta enviada' && selectedQuote()?.state !== 'Negociación' && selectedQuote()?.state !== 'Aceptada' && modalTab() === 'cobranza') {
              <div class="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-5 sm:space-y-6">
                <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div>
                    <h4 class="text-sm font-black text-on-surface">Estatus de Cobranza Tesorería</h4>
                    <p class="text-xs text-outline">Gestión del 50% de anticipo y 50% de finiquito previo a concierto.</p>
                  </div>
                  <span [class]="getPaymentStatusBadgeClass(selectedQuote()!.paymentStatus)" class="px-3.5 py-1 rounded-xl text-xs font-black border shadow-sm">
                    {{ selectedQuote()?.paymentStatus }}
                  </span>
                </div>

                @if (roleService.canViewFinances()) {
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div class="p-3.5 sm:p-4 rounded-2xl bg-surface-container border border-outline-variant/20 text-center space-y-1">
                      <span class="text-[10px] font-bold text-outline uppercase tracking-wider block">Monto Total Pactado</span>
                      <span class="text-lg sm:text-xl font-black text-on-surface">&#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</span>
                    </div>

                    <div class="p-3.5 sm:p-4 rounded-2xl bg-surface-container border border-outline-variant/20 text-center space-y-1">
                      <span class="text-[10px] font-bold text-outline uppercase tracking-wider block">Anticipo 50% (Reserva)</span>
                      <span class="text-lg sm:text-xl font-black text-amber-400">&#36;{{ (selectedQuote()?.totalAmount || 0) * 0.5 | number:'1.0-0' }} MXN</span>
                    </div>

                    <div class="p-3.5 sm:p-4 rounded-2xl bg-surface-container border border-outline-variant/20 text-center space-y-1">
                      <span class="text-[10px] font-bold text-outline uppercase tracking-wider block">Liquidación 50% (Finiquito)</span>
                      <span class="text-lg sm:text-xl font-black text-emerald-400">&#36;{{ (selectedQuote()?.totalAmount || 0) * 0.5 | number:'1.0-0' }} MXN</span>
                    </div>
                  </div>
                }

                <div class="space-y-3 pt-2">
                  <span class="text-xs font-extrabold text-on-surface uppercase tracking-wider block">Cambiar Estatus de Pago Manualmente</span>
                  <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    <button 
                      (click)="updatePaymentStatus('Pendiente')"
                      class="px-3.5 sm:px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-bold transition-all"
                    >
                      Marcar Pendiente
                    </button>

                    <button 
                      (click)="updatePaymentStatus('Anticipo 50%')"
                      class="px-3.5 sm:px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-xs font-bold transition-all"
                    >
                      Marcar Anticipo 50% Recibido
                    </button>

                    <button 
                      (click)="updatePaymentStatus('Pago Confirmado 100%')"
                      class="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold transition-all"
                    >
                      Marcar Pago Confirmado 100%
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- TAB: GENERADOR DE CONTRATO PDF -->
            @if (selectedQuote()?.state !== 'En revisión' && selectedQuote()?.state !== 'Propuesta enviada' && selectedQuote()?.state !== 'Negociación' && selectedQuote()?.state !== 'Aceptada' && modalTab() === 'contrato') {
              <div class="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-5 sm:space-y-6">
                <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div>
                    <h4 class="text-sm font-black text-on-surface flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">description</span>
                      Generación de Documento Legal Privado
                    </h4>
                    <p class="text-xs text-outline">Contrato formal 1 a 1 de prestación de servicios artísticos musicales.</p>
                  </div>

                  <button 
                    (click)="downloadMockPdf()"
                    class="px-3.5 sm:px-4 py-2 rounded-xl bg-primary text-on-primary font-black text-xs hover:bg-primary-hover transition-all flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <span class="material-symbols-outlined text-base">download</span> Descargar PDF
                  </button>
                </div>

                <div class="p-4 sm:p-6 rounded-2xl bg-surface-container border border-outline-variant/20 text-xs space-y-4 font-mono leading-relaxed max-h-60 overflow-y-auto custom-scrollbar text-outline">
                  <p class="font-bold text-on-surface text-center uppercase tracking-widest text-xs sm:text-sm">CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS ARTÍSTICOS</p>
                  <p>En la ciudad de {{ selectedQuote()?.city }}, con fecha {{ selectedQuote()?.proposedDate }}, celebran el presente contrato por una parte <strong>ACORDEX MUSIC S.A. DE C.V.</strong> en representación del grupo musical <strong>{{ selectedQuote()?.groupName }}</strong>, y por la otra parte el contratante <strong>{{ selectedQuote()?.clientName }}</strong> ({{ selectedQuote()?.clientCompany }})...</p>
                  <p>CLÁUSULA PRIMERA: El grupo musical se compromete a presentar un show en vivo de 2 horas y 30 minutos en el recinto {{ selectedQuote()?.venue }}.</p>
                  @if (roleService.canViewFinances()) {
                    <p>CLÁUSULA SEGUNDA: El monto total pactado es de &#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN, pagadero en 2 exhibiciones del 50% cada una.</p>
                  }
                </div>
              </div>
            }

          </div>

        </div>

        <!-- NEGOTIATION ROLLBACK DIALOG MODAL (PROPUESTA ENVIADA EN NEGOCIACIÓN -> NEGOCIACIÓN) -->
        @if (showNegotiationRollbackModal()) {
          <div class="fixed inset-0 z-[999999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-['Be_Vietnam_Pro']">
            <div class="w-full max-w-md bg-surface-container rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-amber-500/50 shadow-2xl space-y-4">

              <div class="flex items-center gap-3 text-amber-400 border-b border-outline-variant/20 pb-3">
                <span class="material-symbols-outlined text-2xl sm:text-3xl">handshake</span>
                <div>
                  <h4 class="text-sm sm:text-base font-black text-on-surface">Regresar a Mesa de Negociación</h4>
                  <p class="text-xs text-outline">Corregirás los ajustes de {{ negotiationRoundLabel() }} sin notificar al cliente.</p>
                </div>
              </div>

              <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 space-y-1">
                <span class="font-black uppercase block text-[10px] flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-amber-400">info</span> REVERSIÓN INTERNA SIN NOTIFICACIÓN AL CLIENTE
                </span>
                <p class="text-[11px] leading-relaxed">
                  El cliente no será notificado de este cambio. Podrás ajustar los valores de precio, horarios y conceptos en la mesa de negociación y re-enviar.
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-outline uppercase tracking-wider block flex items-center justify-between">
                  <span>Nota Interna para Bitácora Disquera</span>
                  <span class="text-amber-400 font-bold">(Opcional)</span>
                </label>
                <textarea 
                  [ngModel]="negotiationRollbackNote()"
                  (ngModelChange)="negotiationRollbackNote.set($event)"
                  rows="3"
                  placeholder="Ej. Se corrige el monto de viáticos propuesto en la ronda anterior..."
                  class="w-full p-3 rounded-xl sm:rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-amber-400 resize-none shadow-inner"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-outline-variant/20">
                <button 
                  (click)="closeNegotiationRollbackDialog()"
                  class="px-3.5 sm:px-4 py-2 rounded-xl bg-surface-bright text-outline hover:text-on-surface font-bold text-xs"
                >
                  Cancelar
                </button>
                <button 
                  (click)="confirmNegotiationRollback()"
                  class="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-sm">handshake</span>
                  Confirmar — Regresar a Negociación
                </button>
              </div>
            </div>
          </div>
        }

        <!-- CONDITIONAL ROLLBACK DIALOG MODAL (FASE 2 -> FASE 1) BASED ON CLIENT VIEWED STATUS -->
        @if (showRollbackModal()) {
          <div class="fixed inset-0 z-[999999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-['Be_Vietnam_Pro']">
            <div class="w-full max-w-lg bg-surface-container rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-amber-500/50 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              <div class="flex items-center gap-3 text-amber-400 border-b border-outline-variant/20 pb-3">
                <span class="material-symbols-outlined text-2xl sm:text-3xl">undo</span>
                <div>
                  <h4 class="text-sm sm:text-base font-black text-on-surface">Regresar Cotización a Revisión (Fase 1)</h4>
                  <p class="text-xs text-outline">
                    {{ clientViewed() ? 'El cliente ya abrió la cotización. Se requiere justificación formal.' : 'El cliente aún no abre la cotización. Reversión silenciosa de borrador.' }}
                  </p>
                </div>
              </div>

              <!-- CASE A: CLIENT HAS NOT VIEWED THE PROPOSAL (SILENT ROLLBACK, OPTIONAL COMMENT) -->
              @if (!clientViewed()) {
                <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1.5">
                  <span class="font-black uppercase block text-[10px] flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-emerald-400">check_circle</span> REVERSIÓN SILENCIOSA (EL CLIENTE NO HA VISTO LA PROPUESTA)
                  </span>
                  <p class="text-[11px] leading-relaxed text-emerald-200/90">
                    Como el cliente aún no abre ni consulta esta propuesta comercial en el portal Acordex, puedes regresarla a Fase de Revisión sin enviarle notificaciones.
                  </p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[10px] font-black text-outline uppercase tracking-wider block flex items-center justify-between">
                    <span>Comentario o Nota Interna Disquera</span>
                    <span class="text-amber-400 font-bold">(Opcional)</span>
                  </label>
                  <textarea 
                    [ngModel]="rollbackInternalNote()"
                    (ngModelChange)="rollbackInternalNote.set($event)"
                    rows="3"
                    placeholder="Ej. Ajuste menor de viáticos previo a que el cliente la consulte..."
                    class="w-full p-3 rounded-xl sm:rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-amber-400 resize-none shadow-inner"
                  ></textarea>
                </div>
              }

              <!-- CASE B: CLIENT HAS ALREADY VIEWED THE PROPOSAL (MANDATORY REASON TAG & MANDATORY FORMAL CLIENT MESSAGE) -->
              @if (clientViewed()) {
                <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1.5">
                  <span class="font-black uppercase block text-[10px] flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-amber-400">visibility</span> VISTO POR EL CLIENTE: JUSTIFICACIÓN FORMAL REQUERIDA
                  </span>
                  <p class="text-[11px] leading-relaxed text-amber-200/90">
                    El cliente ya visualizó esta cotización. Para mantener una comunicación transparente y cordial, selecciona la etiqueta del motivo y escribe una explicación clara para el cliente.
                  </p>
                </div>

                <!-- CATEGORY TAG SELECTION (MANDATORY) -->
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                    Etiqueta / Clasificación del Motivo *
                  </label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    @for (tag of rollbackTags; track tag.id) {
                      <button 
                        (click)="rollbackTag.set(tag.label)"
                        [class]="rollbackTag() === tag.label ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-black shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-surface-container-high text-outline border-outline-variant/20 hover:text-on-surface'"
                        class="p-2 rounded-xl border text-[10px] sm:text-xs text-left transition-all flex items-center gap-1.5"
                      >
                        <span class="material-symbols-outlined text-xs text-amber-400">{{ tag.icon }}</span>
                        <span class="truncate">{{ tag.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- FORMAL CLIENT MESSAGE (MANDATORY) -->
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                    Mensaje Explicativo para el Cliente *
                  </label>
                  <textarea 
                    [ngModel]="rollbackClientMessage()"
                    (ngModelChange)="rollbackClientMessage.set($event)"
                    rows="3"
                    placeholder="Ej. Estimado cliente, realizamos un ajuste temporal en la fecha propuesta debido a un cambio en la disponibilidad del equipo de audio..."
                    class="w-full p-3 rounded-xl sm:rounded-2xl bg-surface-container-high border border-amber-500/40 text-xs text-on-surface focus:outline-none focus:border-amber-400 resize-none shadow-inner"
                  ></textarea>
                </div>

                <!-- INTERNAL DISQUERA NOTE (OPTIONAL) -->
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black text-outline uppercase tracking-wider block flex items-center justify-between">
                    <span>Comentario o Nota Interna para Bitácora Disquera</span>
                    <span class="text-amber-400 font-bold">(Opcional)</span>
                  </label>
                  <textarea 
                    [ngModel]="rollbackInternalNote()"
                    (ngModelChange)="rollbackInternalNote.set($event)"
                    rows="2"
                    placeholder="Ej. Nota interna: seguimiento con producción para coordinar rider..."
                    class="w-full p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-amber-400 resize-none shadow-inner"
                  ></textarea>
                </div>
              }

              <div class="flex items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-outline-variant/20">
                <button 
                  (click)="closeRollbackDialog()"
                  class="px-3.5 sm:px-4 py-2 rounded-xl bg-surface-bright text-outline hover:text-on-surface font-bold text-xs"
                >
                  Cancelar
                </button>
                <button 
                  (click)="confirmRollback()"
                  class="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-sm">undo</span>
                  {{ clientViewed() ? 'Confirmar y Notificar al Cliente' : 'Confirmar Retorno a Revisión' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- REJECTION / CANCELLATION MOTIVE DIALOG MODAL -->
        @if (showRejectionModal()) {
          <div class="fixed inset-0 z-[999999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div class="w-full max-w-md bg-surface-container rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-red-500/50 shadow-2xl space-y-4">
              <div class="flex items-center gap-3 text-red-400">
                <span class="material-symbols-outlined text-2xl sm:text-3xl">warning</span>
                <div>
                  <h4 class="text-sm sm:text-base font-black text-on-surface">Motivo de Rechazo o Cancelación</h4>
                  <p class="text-xs text-outline">Justificación para cancelar la cotización.</p>
                </div>
              </div>

              <textarea 
                [ngModel]="rejectionReason()"
                (ngModelChange)="rejectionReason.set($event)"
                rows="4"
                placeholder="Ingresa los motivos (ej. Fecha ocupada en agenda...)"
                class="w-full p-3 rounded-xl sm:rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-red-400 resize-none shadow-inner"
              ></textarea>

              <div class="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
                <button 
                  (click)="closeRejectionDialog()"
                  class="px-3.5 sm:px-4 py-2 rounded-xl bg-surface-bright text-outline hover:text-on-surface font-bold text-xs"
                >
                  Cancelar
                </button>
                <button 
                  (click)="confirmRejection()"
                  class="px-4 sm:px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-lg shadow-red-500/20"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        }

        <!-- FULL MONTHLY/YEARLY GROUP CALENDAR INSPECTOR MODAL WITH INTERACTIVE DAY CLICK DETAILS -->
        @if (showFullCalendarModal()) {
          <div class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 font-['Be_Vietnam_Pro']">
            <div class="w-full max-w-4xl bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-amber-500/40 shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
              
              <!-- CALENDAR MODAL HEADER -->
              <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <div class="flex items-center gap-2.5 sm:gap-3">
                  <div class="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shrink-0">
                    <span class="material-symbols-outlined text-xl sm:text-2xl">calendar_month</span>
                  </div>
                  <div>
                    <h4 class="text-sm sm:text-lg font-black text-on-surface">Agenda Mensual: {{ selectedQuote()?.groupName }}</h4>
                    <p class="text-[10px] sm:text-xs text-outline">Haz clic en cualquier día para ver cotizaciones y eventos</p>
                  </div>
                </div>

                <button 
                  (click)="closeFullCalendarModal()"
                  class="p-2 sm:p-2.5 rounded-xl bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/30 shrink-0"
                >
                  <span class="material-symbols-outlined text-lg sm:text-xl">close</span>
                </button>
              </div>

              <!-- MONTH NAVIGATION ROW -->
              <div class="flex items-center justify-between bg-surface-container-high p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-outline-variant/30 shadow-inner">
                <button 
                  (click)="prevMonth()"
                  class="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-surface-bright text-on-surface font-bold text-[10px] sm:text-xs hover:bg-primary/20 flex items-center gap-1 transition-all"
                >
                  <span class="material-symbols-outlined text-xs sm:text-sm">chevron_left</span> Anterior
                </button>

                <span class="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider font-mono">
                  {{ monthNames[currentCalendarMonth()] }} {{ currentCalendarYear() }}
                </span>

                <button 
                  (click)="nextMonth()"
                  class="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-surface-bright text-on-surface font-bold text-[10px] sm:text-xs hover:bg-primary/20 flex items-center gap-1 transition-all"
                >
                  Siguiente <span class="material-symbols-outlined text-xs sm:text-sm">chevron_right</span>
                </button>
              </div>

              <!-- MONTHLY CALENDAR GRID (7 COLS) WITH CLICKABLE DAY CELLS -->
              <div class="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold">
                <span class="text-outline text-[9px] sm:text-[10px] py-1 uppercase">Dom</span>
                <span class="text-outline text-[9px] sm:text-[10px] py-1 uppercase">Lun</span>
                <span class="text-outline text-[9px] sm:text-[10px] py-1 uppercase">Mar</span>
                <span class="text-outline text-[9px] sm:text-[10px] py-1 uppercase">Mié</span>
                <span class="text-outline text-[9px] sm:text-[10px] py-1 uppercase">Jue</span>
                <span class="text-outline text-[9px] sm:text-[10px] py-1 uppercase">Vie</span>
                <span class="text-outline text-[9px] sm:text-[10px] py-1 uppercase">Sáb</span>

                @for (day of calendarDays(); track $index) {
                  <button 
                    [disabled]="!day"
                    (click)="selectCalendarDay(day)"
                    [class]="getDayCardClass(day)"
                    class="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border min-h-[55px] sm:min-h-[80px] flex flex-col justify-between text-left transition-all relative overflow-hidden focus:outline-none hover:scale-[1.02] cursor-pointer disabled:cursor-default"
                  >
                    @if (day) {
                      <div class="flex items-center justify-between w-full">
                        <span class="font-mono font-black text-[10px] sm:text-xs">{{ day }}</span>
                        @if (isRequestedDate(day)) {
                          <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-ping" title="Fecha solicitada"></span>
                        }
                      </div>

                      @if (getEventsForDay(day).length > 0) {
                        <div class="space-y-0.5 sm:space-y-1 mt-1 w-full">
                          @for (ev of getEventsForDay(day); track ev.id) {
                            <div class="px-1 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[8px] sm:text-[9px] font-bold truncate">
                              {{ ev.startTime }} • {{ ev.title }}
                            </div>
                          }
                        </div>
                      } @else {
                        <span class="text-[8px] sm:text-[9px] text-emerald-400/80 font-bold block mt-auto flex items-center gap-0.5 sm:gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Libre
                        </span>
                      }
                    }
                  </button>
                }
              </div>

              <!-- INTERACTIVE DAY DETAILS CARD DISPLAY (SHOWS ON DAY CLICK) -->
              @if (selectedCalendarDay()) {
                <div class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-surface-container-high border-2 border-amber-500/40 space-y-3 shadow-xl">
                  <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <div class="flex items-center gap-1.5 sm:gap-2">
                      <span class="material-symbols-outlined text-amber-400 text-base sm:text-lg">event_available</span>
                      <span class="text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-wider">
                        EVENTOS DÍA {{ selectedCalendarDay() }} DE {{ monthNames[currentCalendarMonth()] }} {{ currentCalendarYear() }}
                      </span>
                    </div>
                    <span class="text-[9px] sm:text-[10px] font-bold text-outline font-mono">
                      {{ getEventsForDay(selectedCalendarDay()).length }} Compromiso(s)
                    </span>
                  </div>

                  @if (getEventsForDay(selectedCalendarDay()).length > 0) {
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      @for (ev of getEventsForDay(selectedCalendarDay()); track ev.id) {
                        <div class="p-3 rounded-xl sm:rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1 text-xs shadow-md">
                          <div class="flex items-center justify-between">
                            <span class="font-black text-on-surface text-[11px] sm:text-xs">{{ ev.title }}</span>
                            <span class="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {{ ev.status }}
                            </span>
                          </div>
                          <span class="text-[10px] sm:text-[11px] text-amber-400 font-mono font-black block flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-amber-400">schedule</span> Horario: {{ ev.startTime }} a {{ ev.endTime }} hrs
                          </span>
                          <span class="text-[9px] sm:text-[10px] text-outline block flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-primary">location_on</span> Recinto: <strong>{{ ev.location }}</strong>
                          </span>
                          <span class="text-[9px] sm:text-[10px] text-outline block flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-blue-400">person</span> Contratante: <strong>{{ ev.clientName }}</strong>
                          </span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                      <span class="text-[11px] sm:text-xs font-black text-emerald-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-sm sm:text-base">check_circle</span> DÍA COMPLETAMENTE DISPONIBLE
                      </span>
                      <p class="text-[10px] sm:text-[11px] text-outline">No hay eventos ni presentaciones agendadas para {{ selectedQuote()?.groupName }} en esta fecha.</p>
                    </div>
                  }
                </div>
              }

              <!-- FOOTER MODAL CLOSE BUTTON -->
              <div class="pt-3 border-t border-outline-variant/30 flex justify-end">
                <button 
                  (click)="closeFullCalendarModal()"
                  class="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-primary text-on-primary font-black text-xs shadow-lg"
                >
                  Volver a la Cotización
                </button>
              </div>

            </div>
          </div>
        }

      </div>
        <!-- MODAL 1: VISTA PREVIA INTERACTIVA DEL CONTRATO Y SELECTOR DE BORRADORES -->
        @if (showContractPreviewModal()) {
          <div class="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
            <div class="bg-surface-container-high border border-outline-variant/30 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
              
              <!-- Header Modal Bar -->
              <div class="p-4 sm:p-5 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 bg-surface-container">
                <div class="flex items-center gap-3">
                  <div class="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                    <span class="material-symbols-outlined text-2xl sm:text-3xl">picture_as_pdf</span>
                  </div>
                  <div>
                    <h3 class="text-sm sm:text-base font-black text-on-surface flex items-center gap-2 font-sans">
                      <span>VISTA PREVIA DE CONTRATO PRIVADO DE COTIZACIÓN</span>
                      <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {{ selectedQuote()?.id }}
                      </span>
                    </h3>
                    <span class="text-xs text-outline block font-mono">Generador Dinámico de Contratos & Borradores — Acordex Music Group</span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    (click)="sendContractToClient()"
                    class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-black font-black text-xs shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all flex items-center gap-1.5 hover:scale-105"
                  >
                    <span class="material-symbols-outlined text-base">send</span>
                    <span>ENVIAR CONTRATO AL CLIENTE</span>
                  </button>

                  <button 
                    (click)="showContractPreviewModal.set(false)"
                    class="p-2 rounded-xl bg-surface-bright text-outline hover:text-on-surface transition-all"
                  >
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              <!-- BARRA SELECTORA CAROUSEL DE PLANTILLAS Y BORRADORES DE CONTRATO (MODAL) -->
              <div class="px-4 py-2 bg-surface-container border-b border-outline-variant/20 flex items-center justify-between gap-3 text-xs font-sans">
                <div class="flex items-center gap-2 overflow-hidden flex-1">
                  <span class="text-[9px] font-black text-amber-400 uppercase tracking-widest block shrink-0">
                    PLANTILLA ACTIVA:
                  </span>

                  <!-- ARROW NAVIGATION BUTTONS -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button 
                      (click)="scrollTemplatesModal('left')"
                      class="p-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/20 transition-all flex items-center justify-center"
                      title="Ver plantillas anteriores"
                    >
                      <span class="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button 
                      (click)="scrollTemplatesModal('right')"
                      class="p-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/20 transition-all flex items-center justify-center"
                      title="Ver más plantillas"
                    >
                      <span class="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>

                  <!-- CAROUSEL SCROLL CONTAINER -->
                  <div 
                    id="template-carousel-modal-container"
                    class="flex items-center gap-2 overflow-x-auto scroll-smooth custom-scrollbar py-1 flex-1"
                  >
                    @for (tpl of contractTemplates(); track tpl.id) {
                      <button 
                        (click)="selectedTemplateId.set(tpl.id); selectedContractTemplate.set(tpl.isManual ? 'manual' : (tpl.id === 'tpl_2' ? 'masivo' : (tpl.id === 'tpl_3' ? 'vip' : 'estandar')))"
                        [class]="selectedTemplateId() === tpl.id ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-sm font-black ring-1 ring-amber-400/50' : 'bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/20 font-bold'"
                        class="px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-2 shrink-0 hover:scale-105"
                      >
                        <span class="material-symbols-outlined text-sm text-amber-400">description</span>
                        <span>{{ tpl.name }}</span>
                        <span class="text-[9px] opacity-70 font-mono">({{ tpl.tag }})</span>
                      </button>
                    }
                  </div>
                </div>

                <span class="text-[10px] font-mono text-outline shrink-0">
                  Documento: <strong class="text-amber-300 font-bold uppercase">{{ selectedTemplateId() }}</strong>
                </span>
              </div>

              <!-- BARRA DE HERRAMIENTAS DE VISOR PDF DE EJEMPLO -->
              <div class="px-4 py-2 bg-surface-container-high border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/20 text-on-surface">
                    <span class="material-symbols-outlined text-sm text-red-400">description</span>
                    <span>Página <strong>1</strong> de <strong>2</strong></span>
                  </div>

                  <div class="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-xl border border-outline-variant/20 text-on-surface">
                    <button class="px-1.5 hover:text-amber-400 font-bold text-sm text-outline font-sans" title="Alejar zoom">-</button>
                    <span class="text-[11px] font-bold">100%</span>
                    <button class="px-1.5 hover:text-amber-400 font-bold text-sm text-outline font-sans" title="Acercar zoom">+</button>
                  </div>

                  <span class="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-sans">
                    Vista Previa de Ejemplo (Plantilla: {{ selectedTemplateId() }})
                  </span>
                </div>

                <div class="flex items-center gap-2 font-sans">
                  <button 
                    (click)="downloadMockPdf()"
                    class="px-3 py-1 rounded-lg bg-surface-bright text-outline hover:text-on-surface transition-all text-[11px] flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-sm">print</span> Imprimir
                  </button>
                  <button 
                    (click)="downloadMockPdf()"
                    class="px-3 py-1 rounded-lg bg-surface-bright text-outline hover:text-on-surface transition-all text-[11px] flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-sm">download</span> Descargar
                  </button>
                </div>
              </div>

              <!-- Contract Document Preview Body (Virtual Paper Sheet) -->
              <div class="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-stone-900/90 font-serif text-xs text-on-surface/90 leading-relaxed custom-scrollbar relative">
                
                <!-- MARCA DE AGUA VISTA PREVIA DE EJEMPLO -->
                <div class="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none overflow-hidden">
                  <span class="text-7xl sm:text-9xl font-black text-white uppercase -rotate-45 font-sans tracking-widest text-center">
                    DOCUMENTO DE EJEMPLO
                  </span>
                </div>

                <!-- PAPER CONTAINER -->
                <div class="p-6 sm:p-10 rounded-2xl bg-surface-container-high/95 border border-outline-variant/40 space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-w-3xl mx-auto backdrop-blur-xl relative">
                  
                  <!-- HEADER BRANDING -->
                  <div class="text-center space-y-2 border-b-2 border-outline-variant/30 pb-5 font-sans">
                    <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-mono">
                      ACORDEX MUSIC GROUP S.A. DE C.V. • REGISTRO CONTRATOS N° {{ selectedQuote()?.id }}
                    </span>
                    <h2 class="text-base sm:text-xl font-black text-on-surface uppercase tracking-wider">
                      CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS ARTÍSTICOS Y MUSICALES EN VIVO
                    </h2>
                    <div class="flex items-center justify-center gap-3 text-[11px] text-outline font-mono pt-1">
                      <span>Celebrado en: <strong class="text-on-surface">{{ selectedQuote()?.city }}</strong></span>
                      <span>•</span>
                      <span>Fecha de Firma: <strong class="text-on-surface">{{ selectedQuote()?.proposedDate }}</strong></span>
                    </div>
                  </div>

                  <!-- REUNIDOS Y DECLARACIONES -->
                  <div class="space-y-4 text-xs font-sans">
                    <p class="leading-relaxed text-on-surface/90">
                      En la ciudad de <strong class="text-on-surface">{{ selectedQuote()?.city }}</strong>, a los <strong class="text-on-surface">{{ selectedQuote()?.proposedDate }}</strong>, comparecen por una parte la empresa <strong class="text-primary font-bold">ACORDEX MUSIC GROUP S.A. DE C.V.</strong>, en representación legal y comercial exclusiva de la agrupación musical denominada <strong class="text-amber-300 font-extrabold">{{ selectedQuote()?.groupName }}</strong> (en lo sucesivo "EL ARTISTA"), y por la otra parte el C. <strong class="text-on-surface font-bold">{{ selectedQuote()?.clientName }}</strong> (en representación de <strong class="text-on-surface font-bold">{{ selectedQuote()?.clientCompany }}</strong>, en lo sucesivo "EL CONTRATANTE"), sujetándose a las siguientes cláusulas contractuales:
                    </p>

                    <!-- CLÁUSULA 1: OBJETO DEL CONTRATO -->
                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
                      <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider block font-mono">
                        CLÁUSULA PRIMERA: OBJETO DEL CONTRATO Y PRESENTACIÓN ARTÍSTICA
                      </span>
                      <p class="text-xs text-on-surface/90 leading-relaxed">
                        "EL ARTISTA" se compromete a realizar una presentación musical profesional en vivo durante el evento de tipo <strong class="text-amber-300">{{ selectedQuote()?.eventType || 'Evento Privado' }}</strong>, en las instalaciones del recinto denominado <strong class="text-on-surface">{{ selectedQuote()?.venue }}</strong>, ubicado en <em class="text-outline">{{ selectedQuote()?.eventAddress || selectedQuote()?.city }}</em>.
                      </p>
                    </div>

                    <!-- CLÁUSULA 2: HORARIOS Y ESTRUCTURA DEL SHOW -->
                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
                      <span class="text-[10px] font-black text-purple-300 uppercase tracking-wider block font-mono">
                        CLÁUSULA SEGUNDA: DURACIÓN Y ESTRUCTURA DE HORARIOS DEL SHOW
                      </span>
                      <p class="text-xs text-on-surface/90 leading-relaxed">
                        La duración total pactada para la presentación es de <strong class="text-amber-300 font-mono">{{ selectedQuote()?.durationHours || 3 }} Horas de Show</strong> bajo el formato de <strong class="text-purple-300 uppercase">{{ hasQuoteTandas(selectedQuote()) ? 'Tandas / Bloques Fragmentados' : 'Horario Continuo' }}</strong>.
                      </p>

                      <!-- TABLA DE DESGLOSE DE HORARIOS -->
                      <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 font-mono text-[10px] space-y-1 mt-2">
                        @if (hasQuoteTandas(selectedQuote())) {
                          @for (block of getQuoteShowBlocks(selectedQuote()); track block.id; let bIdx = $index) {
                            <div class="flex items-center justify-between text-on-surface">
                              <span class="font-bold text-amber-300 font-sans">• Set / Tanda #{{ bIdx + 1 }}: {{ block.label || 'Bloque Musical' }}</span>
                              <span class="font-bold text-cyan-300">{{ block.startTime }} a {{ block.endTime }} hrs</span>
                            </div>
                          }
                        } @else {
                          <div class="flex items-center justify-between text-cyan-300">
                            <span class="font-sans">• Presentación Continua Sin Pausas</span>
                            <span class="font-bold">21:00 a 00:00 hrs</span>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- CLÁUSULA 3: AUDIO & RIDER TÉCNICO -->
                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
                      <span class="text-[10px] font-black text-cyan-300 uppercase tracking-wider block font-mono">
                        CLÁUSULA TERCERA: SERVICIO DE AUDIO Y RIDER TÉCNICO
                      </span>
                      <p class="text-xs text-on-surface/90 leading-relaxed">
                        El sistema de audio profesional para el escenario queda clasificado como: <strong class="text-purple-300">{{ selectedQuote()?.soundOption === 'proveedor' || (selectedQuote()?.soundCost && selectedQuote()!.soundCost! > 0) ? 'Incluido y montado por Acordex Music ($' + (selectedQuote()?.soundCost | number:'1.0-0') + ' MXN)' : 'Proporcionado directamente por El Contratante ($0 MXN)' }}</strong>.
                      </p>

                      @if (selectedContractTemplate() === 'masivo') {
                        <div class="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-200/90 font-sans space-y-1">
                          <span class="font-bold text-purple-300 block uppercase font-mono">• Adendum Eventos Masivos:</span>
                          <p>Se requiere planta de luz industrial dedicada, 2 camerinos climatizados con baño privado, seguridad privada en fosa de escenario y soundcheck 4 horas antes del inicio.</p>
                        </div>
                      } @else if (selectedContractTemplate() === 'vip') {
                        <div class="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-200/90 font-sans space-y-1">
                          <span class="font-bold text-cyan-300 block uppercase font-mono">• Adendum Exclusividad VIP Disquera:</span>
                          <p>Derechos preferenciales de transmisión en vivo restringidos. Hospedaje 5 estrellas para 12 integrantes y traslados privados contratados.</p>
                        </div>
                      }
                    </div>

                    <!-- CLÁUSULA 4: DESGLOSE FINANCIERO COMPLETO Y CONTRAPRESTACIÓN -->
                    <div class="p-4 rounded-2xl bg-surface-container border-2 border-amber-400/50 space-y-3 font-mono">
                      <div class="flex items-center justify-between border-b border-amber-400/30 pb-2">
                        <span class="text-[10px] font-black text-amber-300 uppercase tracking-wider font-sans">
                          CLÁUSULA CUARTA: DESGLOSE FINANCIERO COMPLETO Y PAGOS
                        </span>
                        <span class="text-[9px] font-bold text-cyan-400">TARIFARIO ACORDEX</span>
                      </div>

                      <div class="space-y-1.5 text-xs">
                        <div class="flex justify-between text-outline">
                          <span>• Honorarios del Grupo Musical:</span>
                          <strong class="text-on-surface">&#36;{{ (selectedQuote()?.artistFee || 35000) | number:'1.0-0' }} MXN</strong>
                        </div>

                        <div class="flex justify-between text-outline">
                          <span>• Viáticos & Hospedaje:</span>
                          <strong class="text-on-surface">&#36;{{ (selectedQuote()?.viaticosCost || 8500) | number:'1.0-0' }} MXN</strong>
                        </div>

                        <div class="flex justify-between text-outline">
                          <span>• Equipo de Audio Profesional:</span>
                          <strong class="text-purple-300">&#36;{{ (selectedQuote()?.soundCost || 0) | number:'1.0-0' }} MXN</strong>
                        </div>

                        <div class="flex justify-between text-purple-300">
                          <span>• Margen Disquera / Agencia:</span>
                          <strong>&#36;{{ (selectedQuote()?.marginAmount || 7000) | number:'1.0-0' }} MXN</strong>
                        </div>

                        <div class="flex justify-between text-cyan-400">
                          <span>• Comisión Plataforma (5% Fijo):</span>
                          <strong>&#36;{{ ((selectedQuote()?.totalAmount || 50000) * 0.05) | number:'1.0-0' }} MXN</strong>
                        </div>

                        @if (selectedQuote()?.includeIva) {
                          <div class="flex justify-between text-blue-300">
                            <span>• Impuesto IVA (+16% Facturado):</span>
                            <strong>&#36;{{ ((selectedQuote()?.totalAmount || 50000) * 0.16) | number:'1.0-0' }} MXN</strong>
                          </div>
                        }

                        <div class="flex justify-between text-amber-400 font-black border-t-2 border-amber-400/40 pt-2 font-sans text-sm sm:text-base">
                          <span class="uppercase tracking-wider">TOTAL MONTO ACEPTADO:</span>
                          <span class="font-mono text-amber-300 font-black drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                            &#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- FIRMAS DIGITALES DE AMBAS PARTES -->
                    <div class="pt-6 grid grid-cols-2 gap-8 text-center font-sans border-t border-outline-variant/30">
                      <div class="border-t-2 border-outline-variant/40 pt-2 space-y-1">
                        <strong class="text-xs text-on-surface block uppercase font-black">ACORDEX MUSIC GROUP S.A. DE C.V.</strong>
                        <span class="text-[10px] text-emerald-400 block font-mono font-bold">Firma Digital Verificada ✔</span>
                        <span class="text-[9px] text-outline block">Representación Legal Exclusiva</span>
                      </div>

                      <div class="border-t-2 border-outline-variant/40 pt-2 space-y-1">
                        <strong class="text-xs text-on-surface block uppercase font-black">{{ selectedQuote()?.clientName }}</strong>
                        <span class="text-[10px] text-emerald-400 block font-mono font-bold">Aceptado Electrónicamente ✔</span>
                        <span class="text-[9px] text-outline block">{{ selectedQuote()?.clientCompany }}</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              <!-- Footer Modal Actions Bar -->
              <div class="p-4 border-t border-outline-variant/20 bg-surface-container flex flex-wrap items-center justify-between gap-3">
                <span class="text-[10px] text-outline font-mono">DOCUMENTO HASH: SHA256-{{ selectedQuote()?.id }}-ACCEPTED-LEGAL</span>
                
                <div class="flex items-center gap-2">
                  <button 
                    (click)="downloadMockPdf()"
                    class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-xs hover:bg-surface-container-high transition-all flex items-center gap-1.5"
                  >
                    <span class="material-symbols-outlined text-base">download</span> Descargar PDF
                  </button>

                  <button 
                    (click)="sendContractToClient()"
                    class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-black font-black text-xs shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all flex items-center gap-1.5 hover:scale-105"
                  >
                    <span class="material-symbols-outlined text-base">send</span>
                    <span>ENVIAR CONTRATO AL CLIENTE</span>
                  </button>
                </div>
              </div>
            </div>
          }

        <!-- MODAL 2: REGRESAR A REVISIÓN (DESDE ACEPTADA) -->
        @if (showAcceptedRollbackModal()) {
          <div class="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="bg-surface-container-high border border-amber-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4">
              <div class="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <span class="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg text-amber-400">undo</span>
                  REGRESAR COTIZACIÓN ACEPTADA A REVISIÓN
                </span>
                <button (click)="showAcceptedRollbackModal.set(false)" class="p-1 rounded-lg text-outline hover:text-on-surface">
                  <span class="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <p class="text-xs text-outline leading-relaxed">
                Esta acción regresará la cotización <strong>{{ selectedQuote()?.id }}</strong> al estado <strong>"En revisión"</strong> para realizar ajustes administrativos en costos o especificaciones. Se notificará al cliente sobre la revisión en curso.
              </p>

              <!-- Motivo / Tag de Reversión -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-amber-400 uppercase tracking-wider block font-sans">Selecciona el Motivo Principal de Reversión:</label>
                <select 
                  [value]="acceptedRollbackTag()"
                  (change)="acceptedRollbackTag.set($any($event.target).value)"
                  class="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="Error Administrativo en Datos de Cotización">Error Administrativo en Datos de Cotización</option>
                  <option value="Ajuste de Logística / Horario">Ajuste de Logística / Horario</option>
                  <option value="Conflicto de Agenda / Fecha del Grupo">Conflicto de Agenda / Fecha del Grupo</option>
                  <option value="Revisión Solicitada por el Cliente">Revisión Solicitada por el Cliente</option>
                </select>
              </div>

              <!-- Mensaje explicativo para el cliente -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-amber-400 uppercase tracking-wider block font-sans">Mensaje de Explicación para el Cliente (Obligatorio):</label>
                <textarea 
                  [value]="acceptedRollbackClientNote()"
                  (input)="acceptedRollbackClientNote.set($any($event.target).value)"
                  placeholder="Estimado cliente, regresamos su cotización a revisión debido a..."
                  rows="3"
                  class="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-amber-400"
                ></textarea>
              </div>

              <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button 
                  (click)="showAcceptedRollbackModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-xs"
                >
                  Cancelar
                </button>
                <button 
                  (click)="confirmAcceptedRollback()"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs shadow-md hover:scale-105 transition-all"
                >
                  Confirmar Reversión a Revisión
                </button>
              </div>
            </div>
          </div>
        }

        <!-- MODAL 3: RECHAZAR / CANCELAR COTIZACIÓN ACEPTADA CON CUPÓN OPCIONAL -->
        @if (showAcceptedRejectionModal()) {
          <div class="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="bg-surface-container-high border border-red-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div class="flex items-center justify-between border-b border-red-500/20 pb-3">
                <span class="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <span class="material-symbols-outlined text-lg text-red-400">cancel</span>
                  RECHAZAR / CANCELAR COTIZACIÓN ACEPTADA
                </span>
                <button (click)="showAcceptedRejectionModal.set(false)" class="p-1 rounded-lg text-outline hover:text-on-surface">
                  <span class="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <p class="text-xs text-outline leading-relaxed">
                El cliente ya había aceptado de conformidad esta cotización. Al cancelarla a última hora, es obligatorio enviar un mensaje formal de disculpa.
              </p>

              <!-- Mensaje de Disculpas para el cliente -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-black text-red-400 uppercase tracking-wider block font-sans">Mensaje Formal de Disculpa para el Cliente (Obligatorio):</label>
                <textarea 
                  [value]="acceptedRejectionApology()"
                  (input)="acceptedRejectionApology.set($any($event.target).value)"
                  placeholder="Lamentamos sinceramente informarle que por razones de causa mayor no será posible llevar a cabo..."
                  rows="3"
                  class="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-red-400"
                ></textarea>
              </div>

              <!-- OPCIÓN DE CUPÓN DE DESCUENTO DE COMPENSACIÓN -->
              <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    [checked]="includeCompensationCoupon()"
                    (change)="includeCompensationCoupon.set($any($event.target).checked)"
                    class="rounded border-amber-400 text-amber-500 focus:ring-amber-400"
                  >
                  <span class="text-xs font-black text-amber-300 uppercase font-sans">Generar Cupón de Descuento / Compensación Especial</span>
                </label>

                @if (includeCompensationCoupon()) {
                  <div class="space-y-2.5 text-xs font-sans pt-1 border-t border-amber-500/20">
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <span class="text-[9px] font-bold text-outline block">Tipo de Beneficio:</span>
                        <select 
                          [value]="compensationDiscountType()"
                          (change)="compensationDiscountType.set($any($event.target).value)"
                          class="w-full p-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface font-bold"
                        >
                          <option value="percentage">% Porcentaje Descuento</option>
                          <option value="fixed">$ Monto Fijo en MXN</option>
                        </select>
                      </div>

                      <div>
                        <span class="text-[9px] font-bold text-outline block">Valor del Beneficio:</span>
                        <input 
                          type="number" 
                          [value]="compensationDiscountValue()"
                          (input)="compensationDiscountValue.set($any($event.target).valueAsNumber || 0)"
                          class="w-full p-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-amber-300 font-black font-mono"
                        >
                      </div>
                    </div>

                    <div class="p-2 rounded-xl bg-surface-container border border-amber-400/30 text-[10px] flex items-center justify-between font-mono">
                      <span class="text-outline">Código Promocional Generado:</span>
                      <strong class="text-amber-300 font-bold text-xs">{{ generatedCouponCode() }}</strong>
                    </div>
                  </div>
                }
              </div>

              <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button 
                  (click)="showAcceptedRejectionModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-xs"
                >
                  Cancelar
                </button>
                <button 
                  (click)="confirmAcceptedRejection()"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-xs shadow-md hover:scale-105 transition-all"
                >
                  Confirmar Rechazo y Enviar Disculpas
                </button>
              </div>
            </div>
          </div>
        <!-- MODAL 4: REGRESAR DE FASE 4 A FASE 3 (COTIZACIÓN ACEPTADA) -->
        @if (showContractRollbackModal()) {
          <div class="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans">
            <div class="bg-surface-container-high border border-amber-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 animate-fadeIn">
              
              <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div class="flex items-center gap-2.5">
                  <div class="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <span class="material-symbols-outlined text-2xl">undo</span>
                  </div>
                  <div>
                    <h3 class="text-base font-black text-on-surface">REGRESAR A FASE 3 (COTIZACIÓN ACEPTADA)</h3>
                    <span class="text-[10px] font-mono text-outline block">Reversión de Fase 4 a Fase 3 para Corrección de Contrato</span>
                  </div>
                </div>

                <button 
                  (click)="showContractRollbackModal.set(false)"
                  class="p-2 rounded-xl bg-surface-bright text-outline hover:text-on-surface transition-all"
                >
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>

              <!-- ALERTA SI EL CLIENTE YA VIO EL CONTRATO -->
              @if (clientViewed()) {
                <div class="p-3.5 rounded-2xl bg-red-500/15 border-2 border-red-500/50 space-y-2 text-xs">
                  <div class="flex items-center gap-2 text-red-400 font-black text-xs uppercase">
                    <span class="material-symbols-outlined text-lg">warning</span>
                    <span>⚠️ ATENCIÓN: EL CLIENTE YA VISUALIZÓ ESTE CONTRATO</span>
                  </div>
                  <p class="text-red-200/90 text-[11px] leading-relaxed">
                    El cliente <strong>{{ selectedQuote()?.clientName }}</strong> ya abrió y leyó este contrato el <strong>{{ clientViewedTime() }}</strong>. Al regresar a Fase 3:
                  </p>
                  <ul class="list-disc pl-4 text-[10px] text-red-300 font-mono space-y-0.5">
                    <li>El archivo <strong>{{ selectedQuote()?.contractFileName }}</strong> quedará marcado como <strong>ANULADO / INVÁLIDO POR ERROR ADMINISTRATIVO</strong>.</li>
                    <li>Se notificará formalmente al cliente que el borrador anterior fue invalidado y que recibirá uno corregido a la brevedad.</li>
                  </ul>
                </div>
              } @else {
                <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs text-amber-200/90">
                  <div class="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
                    <span class="material-symbols-outlined text-base">info</span>
                    <span>EL CLIENTE AÚN NO HA APERTURADO EL CONTRATO</span>
                  </div>
                  <p class="text-[11px]">
                    El documento aún no ha sido visto por el cliente. Al reversar a Fase 3 podrás corregir cualquier plantilla, horario o tarifa antes de volverlo a emitir.
                  </p>
                </div>
              }

              <div class="space-y-3 text-xs">
                <div>
                  <span class="text-[10px] font-bold text-outline block mb-1">Motivo Principal del Regreso a Fase 3:</span>
                  <select 
                    [value]="contractRollbackReason()"
                    (change)="contractRollbackReason.set($any($event.target).value)"
                    class="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface font-bold"
                  >
                    <option value="Corrección de Datos Comerciales / Horarios">Corrección de Datos Comerciales / Horarios</option>
                    <option value="Ajuste en Cláusula Legal / Plantilla">Ajuste en Cláusula Legal / Plantilla</option>
                    <option value="Cambio de Equipo de Audio o Rider">Cambio de Equipo de Audio o Rider</option>
                    <option value="Re-estructuración de Desglose Financiero">Re-estructuración de Desglose Financiero</option>
                    <option value="Error Administrativo en Envío">Error Administrativo en Envío</option>
                  </select>
                </div>

                <div>
                  <span class="text-[10px] font-bold text-outline block mb-1">Nota Interna o Mensaje de Invalidación:</span>
                  <textarea 
                    [value]="contractRollbackNote()"
                    (input)="contractRollbackNote.set($any($event.target).value)"
                    rows="2"
                    placeholder="Escribe un comentario adicional sobre la corrección..."
                    class="w-full p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface"
                  ></textarea>
                </div>
              </div>

              <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button 
                  (click)="showContractRollbackModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-xs"
                >
                  Cancelar
                </button>
                <button 
                  (click)="confirmContractRollbackToAccepted()"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-xs shadow-lg transition-all hover:scale-105"
                >
                  CONFIRMAR REGRESO A FASE 3
                </button>
              </div>

            </div>
          </div>
        }

    }
  `
})
export class QuoteDetailModalComponent {
  layoutState = inject(LayoutStateService);
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  // Helper Math property for template access
  Math = Math;

  getQuoteShowBlocks(q?: Quote | null): ShowBlock[] {
    if (!q) return [];
    if (q.showBlocks && q.showBlocks.length > 0) return q.showBlocks as ShowBlock[];
    if (q.negotiationHistory && q.negotiationHistory.length > 0) {
      const lastWithBlocks = [...q.negotiationHistory].reverse().find(entry => entry.showBlocks && entry.showBlocks.length > 0);
      if (lastWithBlocks && lastWithBlocks.showBlocks) {
        return lastWithBlocks.showBlocks as ShowBlock[];
      }
    }
    return [];
  }

  hasQuoteTandas(q?: Quote | null): boolean {
    return this.getQuoteShowBlocks(q).length > 0;
  }

  selectedQuote = computed(() => this.layoutState.activeQuote());
  modalTab = signal<'estado_actual' | 'solicitud' | 'cobranza' | 'contrato'>('estado_actual');

  // Phase 2 tab navigation signal
  phase2Tab = signal<'cotizacion_enviada' | 'informacion_cliente'>('cotizacion_enviada');

  // ─── FASE 3: COTIZACIÓN ACEPTADA SIGNALS ─────────────────────────────────────
  acceptedTab = signal<'gestion_aceptada' | 'info_original_cliente' | 'historial_negociaciones'>('gestion_aceptada');
  showAcceptedSummaryDetails = signal<boolean>(false);
  contractGenerationMode = signal<'auto' | 'manual'>('auto');
  contractGenerated = signal<boolean>(false);
  isGeneratingContract = signal<boolean>(false);

  contractTemplates = signal<{ id: string; name: string; tag: string; isManual?: boolean }[]>([
    { id: 'tpl_1', name: 'Plantilla #1', tag: 'Estándar Acordex' },
    { id: 'tpl_2', name: 'Plantilla #2', tag: 'Eventos Masivos' },
    { id: 'tpl_3', name: 'Plantilla #3', tag: 'Exclusividad VIP' },
    { id: 'tpl_4', name: 'Plantilla #4', tag: 'Formato Rápido' },
    { id: 'tpl_5', name: 'Plantilla #5', tag: 'Festival & Rider' },
    { id: 'tpl_6', name: 'Plantilla #6', tag: 'Corporativo' }
  ]);
  selectedTemplateId = signal<string>('tpl_1');
  selectedContractTemplate = signal<'estandar' | 'masivo' | 'vip' | 'manual'>('estandar');
  uploadedContractFile = signal<{ name: string; url: string; size: string; date: string } | null>(null);
  showContractPreviewModal = signal<boolean>(false);

  generateContractFromTemplate(): void {
    this.isGeneratingContract.set(true);
    setTimeout(() => {
      this.isGeneratingContract.set(false);
      this.contractGenerated.set(true);
    }, 300);
  }

  switchToAutoMode(): void {
    this.contractGenerationMode.set('auto');
    this.uploadedContractFile.set(null);
  }

  scrollTemplates(direction: 'left' | 'right'): void {
    const container = document.getElementById('template-carousel-container');
    if (container) {
      container.scrollBy({ left: direction === 'left' ? -220 : 220, behavior: 'smooth' });
    }
  }

  scrollTemplatesModal(direction: 'left' | 'right'): void {
    const container = document.getElementById('template-carousel-modal-container');
    if (container) {
      container.scrollBy({ left: direction === 'left' ? -220 : 220, behavior: 'smooth' });
    }
  }
  artistNotificationSent = signal<boolean>(false);
  artistNotificationTime = signal<string>('');
  sendArtistWhatsApp = signal<boolean>(true);
  sendArtistEmail = signal<boolean>(true);
  sendArtistApp = signal<boolean>(true);

  // Accepted Rollback Modal Signals
  showAcceptedRollbackModal = signal<boolean>(false);
  acceptedRollbackTag = signal<string>('Ajuste de Logística / Horario');
  acceptedRollbackClientNote = signal<string>('');
  acceptedRollbackInternalNote = signal<string>('');

  // Accepted Rejection Modal Signals (with Compensation Coupon)
  showAcceptedRejectionModal = signal<boolean>(false);
  acceptedRejectionApology = signal<string>('');
  includeCompensationCoupon = signal<boolean>(true);
  compensationDiscountType = signal<'percentage' | 'fixed'>('percentage');
  compensationDiscountValue = signal<number>(10);
  compensationCouponNote = signal<string>('Bono de disculpas por cancelación comercial a última hora.');
  generatedCouponCode = signal<string>('ACORDEX-APOLOGY-10OFF');

  // Client view tracking signal
  clientViewed = signal<boolean>(true);
  clientViewedTime = signal<string>('Hoy a las 11:42 AM (Portal Web)');

  // ─── FASE 4: CONTRATO EN ESPERA DE FIRMA SIGNALS ─────────────────────────────
  awaitingSignatureTab = signal<'seguimiento_contrato' | 'info_acuerdo' | 'info_cliente' | 'historial'>('seguimiento_contrato');
  showContractRollbackModal = signal<boolean>(false);
  contractRollbackReason = signal<string>('Corrección de Datos Comerciales / Horarios');
  contractRollbackNote = signal<string>('');
  contractRollbackNotifyClient = signal<boolean>(true);

  confirmContractRollbackToAccepted(): void {
    const q = this.selectedQuote();
    if (!q) return;

    const isViewed = this.clientViewed();
    const updated = {
      ...q,
      state: 'Aceptada' as const,
      contractStatus: 'Pendiente' as const
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.updateQuoteState(q.id, 'Aceptada');
    
    const auditMsg = isViewed
      ? `Se regresó la cotización ${q.id} de Fase 4 a Fase 3 ('Aceptada'). El cliente YA HABÍA VISTO el contrato anterior; se emitió notificación de ANULACIÓN POR CORRECCIÓN. Motivo: ${this.contractRollbackReason()}`
      : `Se regresó la cotización ${q.id} de Fase 4 a Fase 3 ('Aceptada'). Motivo: ${this.contractRollbackReason()}`;

    this.mockData.addAudit('Regreso a Cotización Aceptada (Fase 3)', 'Cotizaciones', auditMsg);

    this.showContractRollbackModal.set(false);
    this.layoutState.openQuoteModal(updated);
  }

  // Admin wizard state for 'En revisión'
  adminStep = signal<number>(1);
  scheduleMode = signal<'continuo' | 'tandas'>('continuo');

  // Interactive Platform Delivery Channels Signals (At least 1 required)
  sendNotificationWhatsApp = signal<boolean>(true);
  sendNotificationEmail = signal<boolean>(true);
  sendNotificationAcordex = signal<boolean>(true);

  // ─── NEGOCIACIÓN MULTI-RONDA ───────────────────────────────────────────────
  // Número de ronda actual (0 = primera propuesta normal, 1+ = proviene de una negociación)
  negotiationRound = signal<number>(0);

  // Historial de negociaciones acumuladas (vacío por defecto; se llena al re-enviar desde Negociación)
  negotiationHistory = signal<NegotiationEntry[]>([]);

  // Signals para el dialog de rollback simplificado a Negociación
  showNegotiationRollbackModal = signal<boolean>(false);
  negotiationRollbackNote = signal<string>('');

  // Computed: ¿Está en negociación activa? (true solo si negotiationRound > 0)
  isInNegotiationRound = computed(() => (this.negotiationRound() ?? 0) > 0);

  // Computed: Label de ronda actual (ej. "Ronda #1")
  negotiationRoundLabel = computed(() => `Ronda #${this.negotiationRound()}`);
  
  getEntryTime(timestamp?: string): string {
    if (!timestamp) return '';
    const parts = timestamp.trim().split(' ');
    if (parts.length >= 2) {
      return parts.slice(1).join(' ');
    }
    return timestamp;
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // Negotiation Wizard State & Signals
  negotiationStep = signal<number>(1);
  clientRejectionFeedback = signal<string>(
    'El cliente considera que el presupuesto original de $50,000 MXN supera su presupuesto límite por $5,000 MXN. Solicita una rebaja comercial o ajuste en el costo del equipo de audio, y ajustar la hora de inicio a las 20:00 hrs.'
  );

  // MODE 1: HORARIO CONTINUO SIGNALS
  singleStartTime = signal<string>('19:00');
  singleDurationHours = signal<number>(3.0);
  
  proposalDate = signal<string>('2026-07-10');
  scheduleChangeExplanation = signal<string>('');

  // MODE 2: TANDAS / BLOQUES FRAGMENTADOS SIGNALS
  showBlocks = signal<ShowBlock[]>([
    { id: 'b1', label: 'Set 1: Bienvenida & Recepción', date: '2026-07-10', startTime: '14:30', endTime: '15:30' },
    { id: 'b2', label: 'Set 2: Show Principal', date: '2026-07-10', startTime: '17:00', endTime: '18:00' },
    { id: 'b3', label: 'Set 3: Cierre & Despedida', date: '2026-07-10', startTime: '20:00', endTime: '20:30' }
  ]);

  proposalArtistFee = signal<number>(30000); // Adjusted for discount
  proposalViaticosCost = signal<number>(7500); // Adjusted for discount
  proposalSoundCost = signal<number>(12000);
  proposalSoundOption = signal<'cliente' | 'proveedor'>('proveedor');
  proposalMarginPercent = signal<number>(15); // Adjusted customizable disquera margin %
  proposalIncludeIva = signal<boolean>(false);
  
  additionalComments = signal<string>('');
  showRejectionModal = signal<boolean>(false);
  rejectionReason = signal<string>('');

  // Rollback dialog signals (Phase 2 -> Phase 1)
  showRollbackModal = signal<boolean>(false);
  rollbackTag = signal<string>('Ajuste Administrativo / Costos');
  rollbackClientMessage = signal<string>('');
  rollbackInternalNote = signal<string>('');

  readonly rollbackTags = [
    { id: 'admin', label: 'Ajuste Administrativo / Costos', icon: 'gavel' },
    { id: 'dates', label: 'Conflicto de Fechas / Agenda', icon: 'event_busy' },
    { id: 'force', label: 'Fuerza Mayor / Imprevisto Técnico', icon: 'warning' },
    { id: 'venue', label: 'Cambio de Recinto / Logística', icon: 'location_off' },
    { id: 'client', label: 'Solicitud Directa del Cliente', icon: 'support_agent' }
  ];

  showFullCalendarModal = signal<boolean>(false);
  selectedCalendarDay = signal<number | null>(10); // Defaults to day 10
  currentCalendarMonth = signal<number>(6); // July (0-indexed)
  currentCalendarYear = signal<number>(2026);

  readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  readonly mockGroupEvents: GroupEventSchedule[] = [
    {
      id: 'EV-101',
      title: 'Boda Privada San Pedro',
      date: '2026-07-10',
      startTime: '14:00',
      endTime: '15:00',
      status: 'Confirmado',
      location: 'Hotel Live Aqua MTY',
      clientName: 'Lic. Roberto Garza',
      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
    },
    {
      id: 'EV-102',
      title: 'Prueba de Sonido & Traslado',
      date: '2026-07-10',
      startTime: '18:30',
      endTime: '19:30',
      status: 'En Logística',
      location: 'Valle Oriente, MTY',
      clientName: 'Producción Acordex',
      color: 'border-amber-500/50 bg-amber-500/10 text-amber-300'
    }
  ];

  constructor() {
    effect(() => {
      const current = this.selectedQuote();
      if (current) {
        this.negotiationRound.set(current.negotiationRound ?? 0);
        this.negotiationHistory.set(current.negotiationHistory ?? []);
        if (current.proposedDate) {
          this.proposalDate.set(current.proposedDate);
        }
      } else {
        this.negotiationRound.set(0);
        this.negotiationHistory.set([]);
      }
    });
  }

  getPreviousRoundBaseline(idx: number): {
    artistFee: number;
    viaticosCost: number;
    soundCost: number;
    marginPercent: number;
    totalOffered: number;
    label: string;
  } {
    const history = this.negotiationHistory();
    if (idx > 0 && history[idx - 1]) {
      const prev = history[idx - 1];
      return {
        artistFee: prev.artistFee,
        viaticosCost: prev.viaticosCost,
        soundCost: prev.soundCost,
        marginPercent: prev.marginPercent,
        totalOffered: prev.totalOffered,
        label: `Ronda #${prev.round}`
      };
    }
    const q = this.selectedQuote();
    return {
      artistFee: q?.artistFee || 35000,
      viaticosCost: q?.viaticosCost || 8500,
      soundCost: q?.soundCost || 0,
      marginPercent: 20,
      totalOffered: q?.totalAmount || 0,
      label: 'Original'
    };
  }

  // Helper method for template Number conversion
  Number(val: any): number {
    return Number(val) || 0;
  }

  selectCalendarDay(day: number | null): void {
    if (day) {
      this.selectedCalendarDay.set(day);
    }
  }

  // COMPUTED SINGLE MODE END TIME
  calculatedSingleEndTime = computed(() => {
    const start = this.singleStartTime();
    const duration = Number(this.singleDurationHours()) || 3.0;
    const [hStr, mStr] = start.split(':');
    let totalMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
    totalMinutes += Math.round(duration * 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  });

  // CHECK CONFLICT FOR SINGLE CONTINUOUS MODE
  isSingleModeConflicting(): boolean {
    const startStr = this.singleStartTime();
    const endStr = this.calculatedSingleEndTime();

    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const reqStartMins = sh * 60 + sm;
    const reqEndMins = eh * 60 + em;

    for (const ev of this.mockGroupEvents) {
      if (ev.date === this.proposalDate()) {
        const [evSh, evSm] = ev.startTime.split(':').map(Number);
        const [evEh, evEm] = ev.endTime.split(':').map(Number);
        const evStartMins = evSh * 60 + evSm;
        const evEndMins = evEh * 60 + evEm;

        if (reqStartMins < evEndMins && reqEndMins > evStartMins) {
          return true;
        }
      }
    }
    return false;
  }

  // COMPUTED TOTAL SHOW HOURS (CONTINUOUS VS TANDAS)
  totalCalculatedShowHours = computed(() => {
    if (this.scheduleMode() === 'continuo') {
      return Number(this.singleDurationHours()) || 3.0;
    }

    let totalMins = 0;
    for (const b of this.showBlocks()) {
      if (b.startTime && b.endTime) {
        const [sh, sm] = b.startTime.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        const startMins = (sh || 0) * 60 + (sm || 0);
        const endMins = (eh || 0) * 60 + (em || 0);
        if (endMins > startMins) {
          totalMins += (endMins - startMins);
        }
      }
    }
    return Math.round((totalMins / 60) * 10) / 10;
  });

  getBlockDuration(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = (sh || 0) * 60 + (sm || 0);
    const endMins = (eh || 0) * 60 + (em || 0);
    if (endMins > startMins) {
      return Math.round(((endMins - startMins) / 60) * 10) / 10;
    }
    return 0;
  }

  addShowBlock(): void {
    const current = this.showBlocks();
    const lastBlock = current.length > 0 ? current[current.length - 1] : null;
    let nextStart = '21:00';
    let nextEnd = '22:00';

    if (lastBlock && lastBlock.endTime) {
      const [h, m] = lastBlock.endTime.split(':').map(Number);
      const newStartH = (h + 1) % 24;
      const newEndH = (h + 2) % 24;
      nextStart = `${newStartH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      nextEnd = `${newEndH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    const newBlock: ShowBlock = {
      id: 'blk_' + Date.now(),
      label: `Set ${current.length + 1}: Tanda Adicional`,
      date: this.proposalDate(),
      startTime: nextStart,
      endTime: nextEnd
    };

    this.showBlocks.set([...current, newBlock]);
  }

  removeShowBlock(index: number): void {
    const current = [...this.showBlocks()];
    if (current.length > 1) {
      current.splice(index, 1);
      this.showBlocks.set(current);
    }
  }

  isBlockConflicting(block: ShowBlock): boolean {
    if (!block.startTime || !block.endTime) return false;
    const blockDate = block.date || this.proposalDate();
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    const reqStartMins = sh * 60 + sm;
    const reqEndMins = eh * 60 + em;

    for (const ev of this.mockGroupEvents) {
      if (ev.date === blockDate) {
        const [evSh, evSm] = ev.startTime.split(':').map(Number);
        const [evEh, evEm] = ev.endTime.split(':').map(Number);
        const evStartMins = evSh * 60 + evSm;
        const evEndMins = evEh * 60 + evEm;

        if (reqStartMins < evEndMins && reqEndMins > evStartMins) {
          return true;
        }
      }
    }
    return false;
  }

  // ─── FASE 3: ACEPTADA ACTIONS ──────────────────────────────────────────────
  notifyArtistGroup(): void {
    const q = this.selectedQuote();
    if (!q) return;
    const nowStr = 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.artistNotificationSent.set(true);
    this.artistNotificationTime.set(nowStr);
    this.mockData.updateQuoteDetails(q.id, {
      artistNotified: true,
      artistNotifiedTime: nowStr
    });
    this.mockData.addAudit('Notificación al Grupo', 'Cotizaciones', `Se notificó la fecha confirmada de ${q.id} al grupo musical ${q.groupName}`);
  }

  handleSimulatedContractUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const uploadedObj = {
        name: file.name,
        url: URL.createObjectURL(file),
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        date: new Date().toLocaleString()
      };
      this.uploadedContractFile.set(uploadedObj);
      this.selectedContractTemplate.set('manual');
      this.contractGenerationMode.set('manual');
      this.contractGenerated.set(true);

      const newTplId = `tpl_manual_${Date.now()}`;
      const currentTpls = this.contractTemplates();
      const updatedTpls = [
        ...currentTpls,
        { id: newTplId, name: `Plantilla #${currentTpls.length + 1}`, tag: `Subido: ${file.name}`, isManual: true }
      ];
      this.contractTemplates.set(updatedTpls);
      this.selectedTemplateId.set(newTplId);

      const q = this.selectedQuote();
      if (q) {
        const updated = {
          ...q,
          contractFileName: file.name,
          contractStatus: 'Subido' as const
        };
        this.mockData.updateQuoteDetails(q.id, updated);
        this.layoutState.openQuoteModal(updated);
      }
    }
  }

  sendContractToClient(): void {
    const q = this.selectedQuote();
    if (!q) return;
    const tplNames: Record<string, string> = {
      estandar: 'Plantilla Estándar Acordex',
      masivo: 'Plantilla Eventos Masivos & Festivales',
      vip: 'Plantilla Exclusiva VIP / Disquera',
      manual: `Documento Manual Subido: ${this.uploadedContractFile()?.name || 'Contrato_Privado.pdf'}`
    };
    const tplLabel = tplNames[this.selectedContractTemplate()] || 'Plantilla Estándar Acordex';

    const updated = {
      ...q,
      contractStatus: 'Subido' as const,
      contractFileName: this.uploadedContractFile()?.name || `Contrato_${q.id}.pdf`,
      state: 'Contrato en espera de firma' as const
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.updateQuoteState(q.id, 'Contrato en espera de firma');
    this.mockData.addAudit('Envío de Contrato', 'Cotizaciones', `Se envió el contrato (${tplLabel}) al cliente ${q.clientName} para firma digital. Cotización ${q.id} avanza a 'Contrato en espera de firma'.`);

    this.showContractPreviewModal.set(false);
    this.layoutState.openQuoteModal(updated);
  }

  confirmAcceptedRollback(): void {
    const q = this.selectedQuote();
    if (!q) return;
    this.mockData.updateQuoteState(q.id, 'En revisión');
    this.mockData.addAudit('Reversión desde Aceptada', 'Cotizaciones', `Se regresó la cotización ${q.id} a En revisión. Motivo: ${this.acceptedRollbackTag()}`);
    this.showAcceptedRollbackModal.set(false);
    this.layoutState.closeQuoteModal();
  }

  confirmAcceptedRejection(): void {
    const q = this.selectedQuote();
    if (!q) return;
    const updates: Partial<Quote> = {
      state: 'Cancelada',
      notes: `Cancelada por la administración. Disculpa enviada: "${this.acceptedRejectionApology()}"`
    };
    if (this.includeCompensationCoupon()) {
      updates.compensationCoupon = {
        code: this.generatedCouponCode(),
        discountValue: this.compensationDiscountValue(),
        type: this.compensationDiscountType(),
        note: this.compensationCouponNote(),
        generatedAt: new Date().toISOString()
      };
    }
    this.mockData.updateQuoteDetails(q.id, updates);
    this.mockData.updateQuoteState(q.id, 'Cancelada');
    this.mockData.addAudit('Cancelación de Cotización Aceptada', 'Cotizaciones', `Se canceló la cotización aceptada ${q.id} con envío de disculpas${this.includeCompensationCoupon() ? ' y cupón ' + this.generatedCouponCode() : ''}`);
    this.showAcceptedRejectionModal.set(false);
    this.layoutState.closeQuoteModal();
  }

  calculatedSubtotal = computed(() => {
    const fee = Number(this.proposalArtistFee()) || 0;
    const viaticos = Number(this.proposalViaticosCost()) || 0;
    const sound = this.proposalSoundOption() === 'proveedor' ? (Number(this.proposalSoundCost()) || 0) : 0;
    return fee + viaticos + sound;
  });

  calculatedDisqueraMargin = computed(() => {
    const sub = this.calculatedSubtotal();
    const percent = Number(this.proposalMarginPercent()) || 0;
    return Math.round(sub * (percent / 100));
  });

  calculatedPlatformFee = computed(() => {
    const sub = this.calculatedSubtotal();
    return Math.round(sub * 0.05); // Fixed 5% Platform usage fee
  });

  calculatedSubtotalComercial = computed(() => {
    return this.calculatedSubtotal() + this.calculatedDisqueraMargin() + this.calculatedPlatformFee();
  });

  calculatedIvaAmount = computed(() => {
    return this.proposalIncludeIva() ? Math.round(this.calculatedSubtotalComercial() * 0.16) : 0;
  });

  calculatedTotalAmount = computed(() => {
    return this.calculatedSubtotalComercial() + this.calculatedIvaAmount();
  });

  // DYNAMIC DISCOUNT CALCULATED BY DIFFERENCE FROM PREVIOUS PROPOSAL PRICE
  calculatedDiscountDifferenceAmount = computed(() => {
    const previous = this.selectedQuote()?.totalAmount || 50000;
    const currentNew = this.calculatedTotalAmount();
    return previous - currentNew;
  });

  calculatedDiscountDifferencePercent = computed(() => {
    const previous = this.selectedQuote()?.totalAmount || 50000;
    if (previous <= 0) return 0;
    const diff = this.calculatedDiscountDifferenceAmount();
    return Math.round((diff / previous) * 1000) / 10; // 1 decimal precision %
  });

  // ITEM BY ITEM INDIVIDUAL PERCENTAGE VARIATION SIGNALS
  artistFeeDiffPercent = computed(() => {
    const prev = this.selectedQuote()?.artistFee || 35000;
    if (prev <= 0) return 0;
    const curr = Number(this.proposalArtistFee()) || 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  });

  viaticosDiffPercent = computed(() => {
    const prev = this.selectedQuote()?.viaticosCost || 8500;
    if (prev <= 0) return 0;
    const curr = Number(this.proposalViaticosCost()) || 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  });

  soundDiffPercent = computed(() => {
    const prev = this.selectedQuote()?.soundCost || 0;
    const curr = this.proposalSoundOption() === 'proveedor' ? (Number(this.proposalSoundCost()) || 0) : 0;
    if (prev === 0) {
      return curr > 0 ? 100 : 0;
    }
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  });

  // ORIGINAL MARGIN PERCENTAGE (ONLY PERCENTAGE SHOWN ABOVE INPUT)
  originalMarginPercent = computed(() => {
    return 20; // Default original margin percentage (20%)
  });

  // DISQUERA MARGIN PERCENTAGE POINT DIFFERENCE BELOW INPUT IN STEP 2
  marginDiffPoints = computed(() => {
    const orig = this.originalMarginPercent();
    const curr = Number(this.proposalMarginPercent()) || 0;
    return curr - orig; // e.g. 15 - 20 = -5%
  });

  // ORIGINAL DISQUERA MARGIN AMOUNT BASED ON ORIGINAL BASE SUBTOTAL AND ORIGINAL MARGIN %
  originalDisqueraMarginAmount = computed(() => {
    const origFee = this.selectedQuote()?.artistFee || 35000;
    const origViaticos = this.selectedQuote()?.viaticosCost || 8500;
    const origSound = this.selectedQuote()?.soundCost || 0;
    const origSubtotal = origFee + origViaticos + origSound;
    return Math.round(origSubtotal * (this.originalMarginPercent() / 100));
  });

  // DISQUERA MARGIN SACRIFICED / LOST AMOUNT (CALCULATED IN STEP 3 FOR EXECUTIVE BREAKDOWN)
  disqueraMarginLostAmount = computed(() => {
    const origMarginAmt = this.originalDisqueraMarginAmount();
    const newMarginAmt = this.calculatedDisqueraMargin();
    return origMarginAmt - newMarginAmt; // Positive value means label gave up / conceded this amount of money
  });

  readonly allStates: QuoteState[] = [
    'En revisión',
    'Propuesta enviada',
    'Negociación',
    'Aceptada',
    'Contrato en espera de firma',
    'Contrato firmado',
    'Pago pendiente',
    'Anticipo 50% recibido',
    'Logística & Soundcheck',
    'Pago confirmado',
    'En presentación',
    'Evento realizado',
    'Finalizada',
    'Cancelada'
  ];

  openFullCalendarModal(): void {
    this.showFullCalendarModal.set(true);
  }

  closeFullCalendarModal(): void {
    this.showFullCalendarModal.set(false);
  }

  prevMonth(): void {
    if (this.currentCalendarMonth() === 0) {
      this.currentCalendarMonth.set(11);
      this.currentCalendarYear.update(y => y - 1);
    } else {
      this.currentCalendarMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.currentCalendarMonth() === 11) {
      this.currentCalendarMonth.set(0);
      this.currentCalendarYear.update(y => y + 1);
    } else {
      this.currentCalendarMonth.update(m => m + 1);
    }
  }

  calendarDays = computed(() => {
    const days: (number | null)[] = [];
    const firstDay = new Date(this.currentCalendarYear(), this.currentCalendarMonth(), 1).getDay();
    const daysInMonth = new Date(this.currentCalendarYear(), this.currentCalendarMonth() + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  });

  getEventsForDay(day: number | null): GroupEventSchedule[] {
    if (!day) return [];
    const monthStr = (this.currentCalendarMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const targetDate = `${this.currentCalendarYear()}-${monthStr}-${dayStr}`;

    return this.mockGroupEvents.filter(e => e.date === targetDate);
  }

  isRequestedDate(day: number | null): boolean {
    if (!day) return false;
    const monthStr = (this.currentCalendarMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const targetDate = `${this.currentCalendarYear()}-${monthStr}-${dayStr}`;
    return targetDate === this.proposalDate();
  }

  getDayCardClass(day: number | null): string {
    if (!day) return 'bg-transparent border-transparent';
    if (this.selectedCalendarDay() === day) {
      return 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-[0_0_25px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/80 scale-[1.03] z-10';
    }
    if (this.isRequestedDate(day)) {
      return 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold shadow-md';
    }
    if (this.getEventsForDay(day).length > 0) {
      return 'bg-surface-container-high border-amber-500/30 text-on-surface';
    }
    return 'bg-surface-container/60 border-outline-variant/20 text-outline hover:border-outline-variant/50';
  }

  closeModal(): void {
    this.layoutState.closeQuoteModal();
  }

  // Validate notification channel selection (at least 1 channel required)
  validateNotificationChannels(): boolean {
    if (!this.sendNotificationWhatsApp() && !this.sendNotificationEmail() && !this.sendNotificationAcordex()) {
      alert('Debes seleccionar al menos 1 canal de notificación (WhatsApp, Email o Portal Acordex) para enviar la propuesta al cliente.');
      return false;
    }
    return true;
  }

  sendProposal(): void {
    if (!this.validateNotificationChannels()) return;

    const current = this.selectedQuote();
    if (!current) return;

    let notesText = current.notes || '';
    if (this.scheduleChangeExplanation().trim()) {
      notesText += `\n\n[Propuesta de Ajuste de Horario/Fecha]: ${this.scheduleChangeExplanation().trim()}`;
    }
    if (this.additionalComments().trim()) {
      notesText += `\n\n[Notas Admin]: ${this.additionalComments().trim()}`;
    }

    const updatedQuote: Quote = {
      ...current,
      state: 'Propuesta enviada',
      totalAmount: this.calculatedTotalAmount(),
      marginAmount: this.calculatedDisqueraMargin(),
      artistFee: this.proposalArtistFee(),
      viaticosCost: this.proposalViaticosCost(),
      soundCost: this.proposalSoundOption() === 'proveedor' ? this.proposalSoundCost() : 0,
      soundOption: this.proposalSoundOption(),
      includeIva: this.proposalIncludeIva(),
      durationHours: this.totalCalculatedShowHours(),
      proposedDate: this.proposalDate() || current.proposedDate,
      notes: notesText,
      // Propuesta inicial: sin rondas de negociación
      negotiationRound: 0,
      negotiationHistory: []
    };

    // Resetear signals de negociación al enviar propuesta inicial
    this.negotiationRound.set(0);
    this.negotiationHistory.set([]);

    this.mockData.updateQuoteState(current.id, 'Propuesta enviada');
    this.layoutState.openQuoteModal(updatedQuote);
  }


  // Send re-negotiated proposal back to client ('Negociación' -> 'Propuesta enviada' EN NEGOCIACIÓN)
  sendNegotiatedProposal(): void {
    if (!this.validateNotificationChannels()) return;

    const current = this.selectedQuote();
    if (!current) return;

    const diffAmt = this.calculatedDiscountDifferenceAmount();
    const diffPct = this.calculatedDiscountDifferencePercent();
    const newRound = (current.negotiationRound ?? 0) + 1;

    // Crear entry de esta ronda de negociación (incluyendo horario propuesto)
    const newEntry: NegotiationEntry = {
      round: newRound,
      clientRejectionMessage: this.clientRejectionFeedback(),
      adminProposalNote: this.scheduleChangeExplanation().trim() || undefined,
      totalOffered: this.calculatedTotalAmount(),
      artistFee: this.proposalArtistFee(),
      viaticosCost: this.proposalViaticosCost(),
      soundCost: this.proposalSoundOption() === 'proveedor' ? this.proposalSoundCost() : 0,
      marginPercent: this.proposalMarginPercent(),
      timestamp: 'Enviado ahora',
      // Horario propuesto en esta ronda
      proposedDate: this.proposalDate(),
      scheduleMode: this.scheduleMode(),
      startTime: this.scheduleMode() === 'continuo' ? this.singleStartTime() : undefined,
      endTime: this.scheduleMode() === 'continuo' ? this.calculatedSingleEndTime() : undefined,
      durationHours: this.scheduleMode() === 'continuo' ? Number(this.singleDurationHours()) : undefined,
      showBlocks: this.scheduleMode() === 'tandas' ? [...this.showBlocks()] : undefined,
      totalShowHours: this.totalCalculatedShowHours()
    };


    const updatedHistory: NegotiationEntry[] = [
      ...(current.negotiationHistory ?? []),
      newEntry
    ];

    let notesText = current.notes || '';
    notesText += `\n\n[Re-Negociación Ronda #${newRound}]: Ajuste neto calculado: $${diffAmt} MXN (${diffPct}%). Nuevo Total: $${this.calculatedTotalAmount()} MXN.`;
    if (this.scheduleChangeExplanation().trim()) {
      notesText += ` Nota: "${this.scheduleChangeExplanation().trim()}"`;
    }

    const updatedQuote: Quote = {
      ...current,
      state: 'Propuesta enviada',
      totalAmount: this.calculatedTotalAmount(),
      marginAmount: this.calculatedDisqueraMargin(),
      artistFee: this.proposalArtistFee(),
      viaticosCost: this.proposalViaticosCost(),
      soundCost: this.proposalSoundOption() === 'proveedor' ? this.proposalSoundCost() : 0,
      soundOption: this.proposalSoundOption(),
      includeIva: this.proposalIncludeIva(),
      durationHours: this.totalCalculatedShowHours(),
      proposedDate: this.proposalDate() || current.proposedDate,
      notes: notesText,
      negotiationRound: newRound,
      negotiationHistory: updatedHistory
    };

    // Actualizar el signal local de historial y ronda
    this.negotiationHistory.set(updatedHistory);
    this.negotiationRound.set(newRound);

    this.mockData.updateQuoteDetails(current.id, updatedQuote);
    this.mockData.updateQuoteState(current.id, 'Propuesta enviada');
    this.layoutState.openQuoteModal(updatedQuote);
  }

  // Abre el dialog simplificado de rollback a Negociación (sin notificar al cliente)
  openNegotiationRollbackDialog(): void {
    this.negotiationRollbackNote.set('');
    this.showNegotiationRollbackModal.set(true);
  }

  closeNegotiationRollbackDialog(): void {
    this.showNegotiationRollbackModal.set(false);
  }

  confirmNegotiationRollback(): void {
    const current = this.selectedQuote();
    if (!current) return;

    let notesEntry = `[Regreso a Negociación desde Ronda #${this.negotiationRound()} — Sin notificar cliente]`;
    if (this.negotiationRollbackNote().trim()) {
      notesEntry += `\n• Nota Interna: "${this.negotiationRollbackNote().trim()}"`;
    }

    const updatedQuote: Quote = {
      ...current,
      state: 'Negociación',
      notes: current.notes ? `${current.notes}\n\n${notesEntry}` : notesEntry
    };

    this.mockData.updateQuoteState(current.id, 'Negociación');
    this.layoutState.openQuoteModal(updatedQuote);
    this.negotiationStep.set(1);
    this.showNegotiationRollbackModal.set(false);
  }

  openRejectionDialog(): void {
    this.rejectionReason.set('');
    this.showRejectionModal.set(true);
  }

  closeRejectionDialog(): void {
    this.showRejectionModal.set(false);
  }

  confirmRejection(): void {
    const reason = this.rejectionReason().trim();
    if (!reason) {
      alert('Por favor ingresa un motivo para rechazar o cancelar la cotización.');
      return;
    }

    const current = this.selectedQuote();
    if (current) {
      const updatedQuote: Quote = {
        ...current,
        state: 'Cancelada',
        notes: `[Motivo de Cancelación]: ${reason}`
      };
      this.mockData.updateQuoteState(current.id, 'Cancelada');
      this.layoutState.openQuoteModal(updatedQuote);
    }
    this.showRejectionModal.set(false);
  }

  // Rollback logic (Phase 2 -> Phase 1) with conditional client notification requirements & tags
  openRollbackDialog(): void {
    this.rollbackClientMessage.set('');
    this.rollbackInternalNote.set('');
    this.rollbackTag.set('Ajuste Administrativo / Costos');
    this.showRollbackModal.set(true);
  }

  closeRollbackDialog(): void {
    this.showRollbackModal.set(false);
  }

  confirmRollback(): void {
    const current = this.selectedQuote();
    if (!current) return;

    const isViewed = this.clientViewed();

    // If client HAS viewed, the formal client message is mandatory
    if (isViewed && !this.rollbackClientMessage().trim()) {
      alert('Dado que el cliente ya abrió la cotización, es obligatorio redactar un mensaje explicativo cordial para el cliente.');
      return;
    }

    let rollbackEntry = `[Retorno a Revisión]`;
    if (isViewed) {
      rollbackEntry += `\n• Tag/Categoría: ${this.rollbackTag()}`;
      rollbackEntry += `\n• Mensaje al Cliente: "${this.rollbackClientMessage().trim()}"`;
    } else {
      rollbackEntry += ` (Silencioso - El cliente no vio la propuesta)`;
    }

    if (this.rollbackInternalNote().trim()) {
      rollbackEntry += `\n• Nota Interna Disquera: "${this.rollbackInternalNote().trim()}"`;
    }

    const updatedNotes = current.notes ? `${current.notes}\n\n${rollbackEntry}` : rollbackEntry;
    
    const updatedQuote: Quote = {
      ...current,
      state: 'En revisión',
      notes: updatedNotes
    };

    this.mockData.updateQuoteState(current.id, 'En revisión');
    this.layoutState.openQuoteModal(updatedQuote);
    this.adminStep.set(1); // Set back to step 1 of wizard
    this.showRollbackModal.set(false);
  }

  getStateIcon(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'history_edu';
      case 'Propuesta enviada': return 'send';
      case 'Negociación': return 'handshake';
      case 'Aceptada': return 'check_circle';
      case 'Contrato en espera de firma': return 'edit_note';
      case 'Contrato firmado': return 'draw';
      case 'Pago pendiente': return 'hourglass_empty';
      case 'Anticipo 50% recibido': return 'savings';
      case 'Logística & Soundcheck': return 'equalizer';
      case 'Pago confirmado': return 'verified';
      case 'En presentación': return 'graphic_eq';
      case 'Evento realizado': return 'theater_comedy';
      case 'Finalizada': return 'task_alt';
      case 'Cancelada': return 'cancel';
      default: return 'bookmark';
    }
  }

  getStatePhaseTitle(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'Fase 1: Evaluación Inicial & Revisión de Solicitud';
      case 'Propuesta enviada': {
        // Diferencia el título si hay rondas de negociación activas
        if (this.isInNegotiationRound()) {
          return `Fase 2: Negociación Comercial Enviada — ${this.negotiationRoundLabel()}`;
        }
        return 'Fase 2: Propuesta Comercial Enviada al Cliente';
      }
      case 'Negociación': return 'Fase 2.5: Mesa de Negociación & Re-estructuración Comercial';
      case 'Aceptada': return 'Fase 3: Cotización Aceptada por el Cliente';
      case 'Contrato en espera de firma': return 'Fase 2: Contrato Enviado en Espera de Firma Digital';
      case 'Contrato firmado': return 'Fase 3: Contrato Privado Firmado Digitalmente';
      case 'Pago pendiente': return 'Fase 3: Pago de Anticipo 50% Pendiente de Recepción';
      case 'Anticipo 50% recibido': return 'Fase 3: Recepción Registrada de Anticipo del 50%';
      case 'Logística & Soundcheck': return 'Fase 4: Preparación Logística, Rider Técnico & Soundcheck';
      case 'Pago confirmado': return 'Fase 4: Verificación Financiera 100% & Reservas VIP';
      case 'En presentación': return 'Fase 4: Presentación Artística En Vivo En Escenario';
      case 'Evento realizado': return 'Fase 5: Presentación Artística Concluida en Recinto';
      case 'Finalizada': return 'Fase 5: Contratación Finalizada y Archivada en Histórico';
      case 'Cancelada': return 'Expediente Cancelado: Fecha Liberada en Calendario';
      default: return 'Expediente de Cotización';
    }
  }

  getStateModalBorderClass(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'border-blue-500/50 shadow-blue-500/10';
      case 'Propuesta enviada': return 'border-cyan-500/50 shadow-cyan-500/10';
      case 'Negociación': return 'border-amber-500/50 shadow-amber-500/10';
      case 'Aceptada': return 'border-emerald-500/50 shadow-emerald-500/10';
      case 'Contrato en espera de firma': return 'border-purple-400/50 shadow-purple-400/10';
      case 'Contrato firmado': return 'border-purple-500/50 shadow-purple-500/10';
      case 'Pago pendiente': return 'border-yellow-500/50 shadow-yellow-500/10';
      case 'Anticipo 50% recibido': return 'border-teal-500/50 shadow-teal-500/10';
      case 'Logística & Soundcheck': return 'border-orange-500/50 shadow-orange-500/10';
      case 'Pago confirmado': return 'border-emerald-400 shadow-emerald-500/20';
      case 'En presentación': return 'border-rose-500/50 shadow-rose-500/10';
      case 'Evento realizado': return 'border-indigo-500/50 shadow-indigo-500/10';
      case 'Finalizada': return 'border-slate-500/50 shadow-slate-500/10';
      case 'Cancelada': return 'border-red-500/50 shadow-red-500/10';
      default: return 'border-outline-variant/40';
    }
  }

  getStateBadgeIconBg(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Propuesta enviada': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Negociación': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Aceptada': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Contrato en espera de firma': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Contrato firmado': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Pago pendiente': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Anticipo 50% recibido': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Logística & Soundcheck': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Pago confirmado': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'En presentación': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Evento realizado': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Finalizada': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'Cancelada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  }

  getStateTextColor(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'text-blue-400';
      case 'Propuesta enviada': return 'text-cyan-400';
      case 'Negociación': return 'text-amber-400';
      case 'Aceptada': return 'text-emerald-400';
      case 'Contrato en espera de firma': return 'text-purple-300';
      case 'Contrato firmado': return 'text-purple-300';
      case 'Pago pendiente': return 'text-yellow-400';
      case 'Anticipo 50% recibido': return 'text-teal-300';
      case 'Logística & Soundcheck': return 'text-orange-300';
      case 'Pago confirmado': return 'text-emerald-300';
      case 'En presentación': return 'text-rose-300';
      case 'Evento realizado': return 'text-indigo-300';
      case 'Finalizada': return 'text-slate-300';
      case 'Cancelada': return 'text-red-400';
      default: return 'text-primary';
    }
  }

  getStateActionDescription(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'Revisar datos de solicitud y verificar fecha en la agenda exclusiva del artista';
      case 'Propuesta enviada': return 'Hacer seguimiento a la lectura del correo con la propuesta comercial';
      case 'Negociación': return 'Evaluar la contrapropuesta del cliente, aplicar descuento y re-enviar propuesta';
      case 'Aceptada': return 'Confirmar aceptación y redactar borrador preliminar de contrato';
      case 'Contrato en espera de firma': return 'Revisar cláusulas legales y solicitar firma digital de las partes';
      case 'Contrato firmado': return 'Verificar firma de ambas partes y solicitar comprobante de anticipo';
      case 'Pago pendiente': return 'Validar transferencia de depósito del 50% enviada por el cliente';
      case 'Anticipo 50% recibido': return 'Acreditar anticipo en tesorería e iniciar logística técnica';
      case 'Logística & Soundcheck': return 'Coordinar prueba de sonido (16:00 hrs), rider de audio y pases VIP';
      case 'Pago confirmado': return 'Validar 100% de liquidación y preparar llamada a escenario';
      case 'En presentación': return 'Supervisar ejecución en vivo del concierto y seguridad en escenario';
      case 'Evento realizado': return 'Verificar cumplimiento de horas de show y registrar aforo real';
      case 'Finalizada': return 'Expediente histórico archivado y encuesta de satisfacción concluida';
      case 'Cancelada': return 'Liberar fecha en el calendario disquera y verificar reembolsos';
      default: return 'Transicionar la cotización al siguiente paso del flujo comercial';
    }
  }

  getStateIndex(state: QuoteState): number {
    return this.allStates.indexOf(state);
  }

  isFirstState(state: QuoteState): boolean {
    return this.allStates.indexOf(state) === 0;
  }

  isLastState(state: QuoteState): boolean {
    return this.allStates.indexOf(state) === this.allStates.length - 1;
  }

  moveState(quote: Quote, delta: number): void {
    const currentIndex = this.allStates.indexOf(quote.state);
    const newIndex = currentIndex + delta;
    if (newIndex >= 0 && newIndex < this.allStates.length) {
      const newState = this.allStates[newIndex];
      this.mockData.updateQuoteState(quote.id, newState);
      this.layoutState.openQuoteModal({ ...quote, state: newState });
    }
  }

  updatePaymentStatus(newStatus: PaymentStatus): void {
    const current = this.selectedQuote();
    if (current) {
      this.mockData.updateQuotePaymentStatus(current.id, newStatus);
      this.layoutState.openQuoteModal({ ...current, paymentStatus: newStatus });
    }
  }

  getPaymentStatusBadgeClass(status: PaymentStatus): string {
    switch (status) {
      case 'Pago Confirmado 100%': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm';
      case 'Anticipo 50%': return 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-sm';
      case 'Pendiente': return 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm';
      default: return 'bg-surface-bright text-outline';
    }
  }

  contactWhatsApp(): void {
    const q = this.selectedQuote();
    const phone = q?.representativePhone || '+528112345678';
    const text = encodeURIComponent(`Hola ${q?.representativeName || 'Ing. Luis Donaldo'}, me interesa la cotización para el grupo ${q?.groupName}.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  }

  downloadMockPdf(): void {
    const id = this.selectedQuote()?.id || 'COT-000';
    alert('Simulación de Descarga: Se generó el archivo contrato_' + id + '.pdf correctamente en tu equipo.');
  }
}
