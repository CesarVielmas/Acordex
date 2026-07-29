import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, NegotiationEntry } from '../../../core/models/admin.models';

@Component({
  selector: 'app-quote-show-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl">
      
      <!-- CARD HEADER -->
      <div class="border-b border-outline-variant/20 pb-2.5 flex items-center justify-between">
        <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
          <span class="material-symbols-outlined text-base text-amber-400">event_available</span> DETALLES DEL SHOW PROPUESTO
        </span>
        <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          {{ quote?.groupName }}
        </span>
      </div>

      <div class="space-y-3 text-xs">
        
        <!-- ARTIST COVER AND SHOW DATES -->
        <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-outline text-[10px]">Agrupación Solicitada:</span>
            <strong class="text-on-surface font-black text-sm uppercase">{{ quote?.groupName }}</strong>
          </div>

          <div class="flex justify-between items-center border-t border-outline-variant/10 pt-2">
            <span class="text-outline text-[10px]">Fecha del Show Propuesta (Vigente):</span>
            <strong class="text-emerald-400 font-mono font-black text-sm flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-emerald-400">calendar_month</span>
              {{ quote?.proposedDate }}
            </strong>
          </div>

          <div class="flex justify-between items-center border-t border-outline-variant/10 pt-2">
            <span class="text-outline text-[10px]">Duración Total de Show:</span>
            <strong class="text-amber-300 font-mono font-black text-xs sm:text-sm">
              {{ quote?.durationHours || 3 }} Horas Contratadas
            </strong>
          </div>
        </div>

        <!-- ESTRUCTURA DE TANDAS Y HORARIOS CONFIGURADOS (VIGENTE) -->
        <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
          <span class="text-[9px] font-black text-amber-400 uppercase block font-sans tracking-wider">
            ESTRUCTURA DE TANDAS Y HORARIOS CONFIGURADOS (VIGENTE):
          </span>

          <div class="space-y-1.5 font-mono text-[11px]">
            @if (quote?.notes?.includes('[Propuesta de Ajuste de Horario/Fecha]')) {
              <p class="text-on-surface text-[10px] sm:text-xs italic bg-surface-container-high p-2.5 rounded-xl border border-outline-variant/20">
                {{ quote?.notes }}
              </p>
            } @else {
              <div class="p-2 rounded-xl bg-surface-container-high/80 border border-outline-variant/20 flex items-center justify-between text-on-surface">
                <span class="font-sans font-bold">• Franja Continuada Principal:</span>
                <strong class="text-amber-300">14:30 a 17:30 hrs</strong>
              </div>
            }
          </div>
        </div>

        <!-- RECINTO Y EQUIPO DE AUDIO -->
        <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-outline text-[10px]">Lugar / Recinto:</span>
            <strong class="text-on-surface text-xs font-bold truncate max-w-[220px]">
              {{ quote?.eventAddress || (quote?.venue + ', ' + quote?.city) }}
            </strong>
          </div>

          <div class="flex justify-between items-center border-t border-outline-variant/10 pt-2">
            <span class="text-outline text-[10px]">Servicio de Audio:</span>
            <strong class="text-purple-300 font-bold text-xs">
              {{ quote?.soundOption === 'proveedor' ? 'Incluye Sistema de Audio Profesional' : 'Proporcionado por el Cliente' }}
            </strong>
          </div>
        </div>

        <!-- HISTORIAL DE FECHAS Y HORARIOS POR RONDA DE NEGOCIACIÓN CON TIMESTAMPS DE RECHAZO DEL CLIENTE -->
        @if (isInNegotiation && negotiationHistory.length > 0) {
          <div class="space-y-3 pt-2">
            <span class="text-[9px] font-black text-amber-400 uppercase block font-sans tracking-wider flex items-center gap-1.5 border-b border-amber-500/20 pb-1">
              <span class="material-symbols-outlined text-xs text-amber-400">history</span>
              HISTORIAL DE FECHAS Y HORARIOS POR RONDA DE NEGOCIACIÓN:
            </span>

            @for (entry of negotiationHistory; track entry.round; let idx = $index) {
              <div class="p-3.5 rounded-2xl bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container border border-outline-variant/30 space-y-2.5 font-mono text-[11px] relative overflow-hidden group">
                
                <!-- Card Header with Round Badge and Mode -->
                <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2 font-sans pt-1">
                  <span class="font-black text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-amber-400">event_repeat</span>
                    RONDA #{{ entry.round }} DE NEGOCIACIÓN
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {{ entry.scheduleMode === 'tandas' ? 'MODO TANDAS' : 'CONTINUO' }}
                  </span>
                </div>

                <!-- Timestamps Section: Fecha de Envío y Fecha de Rechazo del Cliente -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] font-sans">
                  @if (entry.timestamp) {
                    <div class="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-cyan-400">send</span>
                      <span><strong>Enviada:</strong> {{ entry.timestamp }}</span>
                    </div>
                  }
                  
                  @if (idx < negotiationHistory.length - 1 || entry.clientRejectedAt) {
                    <div class="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-red-400">cancel</span>
                      <span><strong>Rechazada cliente:</strong> {{ entry.clientRejectedAt || 'Fecha de rechazo registrada' }}</span>
                    </div>
                  } @else {
                    <div class="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-amber-400">pending</span>
                      <span><strong>Estado:</strong> En espera de respuesta cliente</span>
                    </div>
                  }
                </div>

                <!-- FECHAS Y HORARIOS DE ESTA RONDA -->
                <div class="space-y-1.5 pt-1 border-t border-outline-variant/10">
                  <div class="flex justify-between items-center text-[10px]">
                    <span class="text-outline font-sans font-bold">• Fecha Propuesta en Ronda #{{ entry.round }}:</span>
                    <strong class="text-emerald-300 font-mono font-bold">{{ entry.proposedDate || quote?.proposedDate }}</strong>
                  </div>

                  @if (entry.scheduleMode === 'tandas' && entry.showBlocks && entry.showBlocks.length > 0) {
                    <div class="space-y-1 pt-1">
                      <span class="text-[9px] text-outline block font-sans font-bold">• Bloques de Tandas ({{ entry.showBlocks.length }} sets):</span>
                      @for (blk of entry.showBlocks; track blk.id) {
                        <div class="p-2 rounded-xl bg-surface-container-high/90 border border-outline-variant/20 flex items-center justify-between text-on-surface text-[10px]">
                          <span class="font-sans font-bold flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            {{ blk.label }}:
                          </span>
                          <strong class="text-amber-300 font-mono font-bold text-xs">{{ blk.startTime }} a {{ blk.endTime }} hrs</strong>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="p-2 rounded-xl bg-surface-container-high/90 border border-outline-variant/20 flex items-center justify-between text-on-surface text-[10px]">
                      <span class="font-sans font-bold">• Franja Continuada Principal:</span>
                      <strong class="text-amber-300 font-mono font-bold text-xs">{{ entry.startTime || '14:30' }} a {{ entry.endTime || '17:30' }} hrs</strong>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

      </div>

    </div>
  `
})
export class QuoteShowDetailsComponent {
  @Input() quote: Quote | null = null;
  @Input() isInNegotiation: boolean = false;
  @Input() negotiationHistory: NegotiationEntry[] = [];
}
