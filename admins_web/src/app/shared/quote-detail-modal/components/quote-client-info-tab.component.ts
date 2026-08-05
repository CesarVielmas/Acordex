import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote } from '../../../core/models/admin.models';

@Component({
  selector: 'app-quote-client-info-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
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
              <span class="material-symbols-outlined text-base text-primary">person</span> {{ quote?.clientName }}
            </p>
          </div>

          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
            <span class="text-outline text-[9px] font-bold block uppercase font-sans">Empresa / Razón Social / Organización:</span>
            <p class="font-extrabold text-on-surface text-sm flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-outline">domain</span> {{ quote?.clientCompany }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1 min-w-0">
              <span class="text-outline text-[9px] font-bold block uppercase font-sans">Correo Electrónico:</span>
              <p class="font-bold text-primary text-xs break-all flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-primary shrink-0">mail</span> {{ quote?.clientEmail }}
              </p>
            </div>

            <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1 min-w-0">
              <span class="text-outline text-[9px] font-bold block uppercase font-sans">Teléfono Directo:</span>
              <p class="font-bold text-on-surface text-xs flex items-center gap-1 font-mono">
                <span class="material-symbols-outlined text-xs text-outline shrink-0">call</span> {{ quote?.representativePhone || '+52 81 1234 5678' }}
              </p>
            </div>
          </div>

          <!-- NOTAS DEL CLIENTE -->
          <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
            <span class="text-outline text-[9px] font-bold block uppercase font-sans">Notas Adicionales del Cliente:</span>
            <p class="text-xs text-on-surface/90 italic leading-relaxed pt-0.5 font-sans break-words whitespace-normal">
              "{{ quote?.notes || 'Sin especificaciones adicionales enviadas al solicitar el presupuesto.' }}"
            </p>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: AGRUPACIÓN & ESTRUCTURA DEL SHOW SOLICITADO (6 COLS) -->
      <div class="lg:col-span-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-4 shadow-xl backdrop-blur-xl">
        <div class="border-b border-outline-variant/20 pb-2 flex flex-wrap items-center justify-between gap-2">
          <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1.5 font-sans">
            <span class="material-symbols-outlined text-sm text-amber-400">music_note</span> DETALLES DEL SHOW Y HORARIOS SOLICITADOS
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {{ quote?.eventType || 'Evento Privado' }}
          </span>
        </div>

        <!-- COVER ARTIST CARD -->
        <div class="relative rounded-2xl overflow-hidden shadow-md border border-outline-variant/30 h-28 group">
          <img
            [src]="quote?.artistImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80'"
            alt="Group Banner"
            class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-3 justify-between">
            <div>
              <span class="text-[8px] font-bold text-amber-300 uppercase tracking-widest block font-sans">AGRUPACIÓN MUSICAL</span>
              <h4 class="text-sm sm:text-base font-black text-white uppercase tracking-wider font-sans drop-shadow-md">
                {{ quote?.groupName }}
              </h4>
            </div>
            <span class="px-2.5 py-1 rounded-xl bg-black/60 text-amber-300 font-mono font-bold text-xs border border-amber-400/40 backdrop-blur-md">
              ⭐ {{ quote?.rating || 4.8 }} Rating
            </span>
          </div>
        </div>

        <div class="space-y-2.5 text-xs font-sans">
          <!-- ESTRUCTURA DE FECHA Y HORAS -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span class="text-outline text-[9px] font-bold block uppercase font-sans">FECHA ORIGINAL SOLICITADA POR EL CLIENTE:</span>
              <span class="font-extrabold text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] font-mono text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-emerald-400">calendar_today</span> {{ quote?.proposedDate }}
              </span>
            </div>

            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span class="text-outline text-[9px] font-bold block uppercase font-sans">Duración Contratada:</span>
              <span class="font-black text-amber-300 font-mono text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-amber-400">timer</span> {{ quote?.durationHours || 3 }} Horas Totales
              </span>
            </div>
          </div>

          <!-- ESTRUCTURA DE HORARIOS (TANDAS VS CONTINUO) -->
          <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2">
            <div class="flex items-center justify-between border-b border-outline-variant/10 pb-1.5">
              <span class="text-outline text-[9px] font-bold uppercase font-sans">Formato de Presentación:</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {{ hasTandas() ? 'Tandas / Bloques Fragmentados' : 'Horario Continuo' }}
              </span>
            </div>

            @if (hasTandas()) {
              <div class="space-y-1.5">
                @for (block of showBlocks(); track block.id; let bIdx = $index) {
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
            <p class="font-bold text-on-surface text-xs flex items-center gap-1 break-words whitespace-normal">
              <span class="material-symbols-outlined text-xs text-primary shrink-0">location_on</span> {{ quote?.venue }} — {{ quote?.eventAddress || quote?.city }}
            </p>
          </div>
        </div>
      </div>

    </div>
  `
})
export class QuoteClientInfoTabComponent {
  @Input() quote: Quote | null = null;

  hasTandas(): boolean {
    return this.quote?.scheduleMode === 'tandas' && !!this.quote?.showBlocks && this.quote.showBlocks.length > 0;
  }

  showBlocks() {
    return this.quote?.showBlocks || [];
  }
}
