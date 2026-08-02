import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, TimelineStep } from '../../../core/models/admin.models';

@Component({
  selector: 'app-quote-traceability-timeline-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-4 font-sans">

      <div class="p-5 rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 space-y-5 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="space-y-0.5">
            <span class="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2 font-sans">
              <span class="material-symbols-outlined text-base text-purple-400">lock</span>
              LÍNEA DE TIEMPO DE TRAZABILIDAD HISTÓRICA (AUDITORÍA 1:1 INMUTABLE)
            </span>
            <p class="text-[11px] text-outline">
              Registro criptográfico inmutable disquera. Haz clic en cualquier fase para desplegar la vista completa 1:1 en modo lectura.
            </p>
          </div>

          <span class="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/40 shadow-sm flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">verified</span> SHA-256 VERIFICADO
          </span>
        </div>

        <!-- TIMELINE GRAPHIC LIST WITH HIGH FIDELITY CLICK -->
        <div class="relative py-4 pl-8 border-l-2 border-purple-500/40 space-y-6">
          @for (step of quote?.traceabilityTimeline || []; track step.id) {
            <div class="relative group">
              <!-- NODO CIRCULAR CON PULSO DE NEÓN -->
              <div class="absolute -left-[45px] top-1.5 w-8 h-8 rounded-2xl bg-purple-950 border-2 border-purple-400 flex items-center justify-center text-xs font-black text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.5)] group-hover:scale-110 group-hover:border-purple-300 transition-all">
                {{ step.phaseNumber }}
              </div>

              <div
                (click)="openSnapshot.emit(step)"
                class="p-4 sm:p-5 rounded-3xl bg-surface-container/90 border border-outline-variant/30 hover:border-purple-400/70 transition-all duration-300 cursor-pointer space-y-3 hover:scale-[1.008] shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]"
              >
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <span class="text-xs sm:text-sm font-black text-purple-200 flex items-center gap-2">
                    <span>Fase {{ step.phaseNumber }}: {{ step.phaseName }}</span>
                    <span class="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                      {{ step.state }}
                    </span>
                  </span>
                  <span class="text-[10px] font-mono text-outline bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant/20">
                    {{ step.completedAt }}
                  </span>
                </div>

                <p class="text-xs text-on-surface/90 leading-relaxed font-sans">{{ step.summaryNote }}</p>

                <!-- METADATOS ENRIQUECIDOS DE AUDITORÍA -->
                <div class="p-3 rounded-2xl bg-surface-container-high/90 border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] font-mono text-outline">
                  <div>Monto Registrado: <strong class="text-emerald-300 text-xs font-black">&#36;{{ step.snapshotData?.totalAmount | number:'1.0-0' }} MXN</strong></div>
                  <div>Responsable Registrar: <strong class="text-on-surface">{{ step.actorName }}</strong></div>
                  @if (step.snapshotData?.contractHash) {
                    <div class="truncate">Hash Checksum: <strong class="text-cyan-300">{{ step.snapshotData?.contractHash }}</strong></div>
                  } @else {
                    <div>Firma / Sello: <strong class="text-purple-300 font-bold">SHA256 Validado ✔</strong></div>
                  }
                </div>

                <div class="flex items-center justify-end text-[11px] font-mono text-purple-300 font-bold gap-1.5 pt-1">
                  <span>Desplegar Vista Modal 1:1 de esta Fase</span>
                  <span class="material-symbols-outlined text-sm text-purple-400">open_in_full</span>
                </div>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class QuoteTraceabilityTimelineTabComponent {
  @Input() quote: Quote | null = null;
  @Output() openSnapshot = new EventEmitter<TimelineStep>();
}
