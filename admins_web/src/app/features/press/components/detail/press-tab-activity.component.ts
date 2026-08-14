import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PressEventItem } from '../../../../core/models/press.models';
import { pressStateMeta } from '../../../../core/models/press-state.meta';
import { money } from '../../../events/event-metrics';
import { stampLabel } from '../../press-metrics';

/**
 * Trazabilidad: por dónde pasó el expediente y quién movió qué.
 *
 * Dos lecturas distintas y las dos hacen falta. La línea de tiempo contesta "¿en
 * qué fase está y cómo llegó ahí?"; la bitácora contesta "¿quién cambió este
 * dato y cuándo?", que es la pregunta que se hace cuando algo resulta estar mal.
 * Cada entrada lleva nombre y fecha visibles, sin excepción.
 */
@Component({
  selector: 'app-press-tab-activity',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ─── LÍNEA DE TIEMPO ─── -->
      <section class="p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-4 backdrop-blur-2xl">
        <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5 border-b border-outline-variant/20 pb-4">
          <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">timeline</span>
          <span>Fases por las que pasó</span>
        </h5>

        @if (!timeline().length) {
          <p class="py-5 text-center text-[11px] text-outline italic">Sin hitos registrados.</p>
        } @else {
          <div class="space-y-0">
            @for (step of timeline(); track step.id; let last = $last) {
              <div class="flex gap-3.5">
                <div class="flex flex-col items-center shrink-0">
                  <span [class]="meta(step.state).badgeClass"
                    class="w-9 h-9 rounded-xl border flex items-center justify-center shadow-sm">
                    <span class="material-symbols-outlined text-base">{{ meta(step.state).icon }}</span>
                  </span>
                  @if (!last) { <span class="w-px flex-1 bg-outline-variant/25 my-1"></span> }
                </div>

                <div class="min-w-0 flex-1 pb-5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-black text-on-surface">{{ step.phaseName }}</span>
                    <span [class]="meta(step.state).badgeClass"
                      class="px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider">
                      {{ meta(step.state).shortLabel }}
                    </span>
                  </div>
                  <p class="text-[10.5px] text-on-surface-variant leading-relaxed mt-1">{{ step.summaryNote }}</p>
                  <p class="text-[10px] text-outline mt-1 font-mono">
                    {{ step.actorName }} · {{ when(step.completedAt) }}
                  </p>
                  @if (step.snapshot; as s) {
                    <div class="flex flex-wrap gap-1.5 mt-2">
                      @if (s.requestsCount !== undefined) {
                        <span class="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9.5px] text-on-surface-variant">
                          {{ s.requestsCount }} solicitud(es)
                        </span>
                      }
                      @if (s.approvedCount !== undefined) {
                        <span class="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9.5px] text-on-surface-variant">
                          {{ s.approvedCount }} acreditada(s)
                        </span>
                      }
                      @if (s.attendedCount !== undefined) {
                        <span class="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9.5px] text-on-surface-variant">
                          {{ s.attendedCount }} asistieron
                        </span>
                      }
                      @if (s.spend !== undefined && canViewFinances()) {
                        <span class="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9.5px] text-on-surface-variant font-mono">
                          {{ money(s.spend) }}
                        </span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- ─── BITÁCORA ─── -->
      <section class="p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-3 backdrop-blur-2xl">
        <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5 border-b border-outline-variant/20 pb-4">
          <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">history</span>
          <span>Bitácora de movimientos ({{ activity().length }})</span>
        </h5>

        @if (!activity().length) {
          <p class="py-5 text-center text-[11px] text-outline italic">
            Sin movimientos registrados todavía.
          </p>
        } @else {
          <div class="space-y-2">
            @for (a of activity(); track a.id) {
              <div class="p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25 flex items-start gap-3">
                <span class="material-symbols-outlined text-[15px] text-outline shrink-0 mt-0.5">{{ kindIcon(a.kind) }}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] text-on-surface leading-relaxed">{{ a.summary }}</p>
                  <p class="text-[10px] text-outline mt-0.5 font-mono">{{ when(a.at) }}</p>
                  @if (a.changes?.length) {
                    <div class="mt-1.5 space-y-1">
                      @for (c of a.changes; track c.field) {
                        <p class="text-[10px] text-on-surface-variant">
                          <span class="font-bold">{{ c.label }}:</span>
                          <span class="line-through text-outline">{{ c.before || '(vacío)' }}</span>
                          <span class="mx-1">→</span>
                          <span class="text-emerald-300">{{ c.after || '(vacío)' }}</span>
                        </p>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `
})
export class PressTabActivityComponent {
  readonly event = input.required<PressEventItem>();
  readonly canViewFinances = input<boolean>(false);

  readonly money = money;
  readonly meta = pressStateMeta;

  readonly timeline = computed(() => this.event().timeline || []);
  readonly activity = computed(() => [...(this.event().activity || [])].reverse());

  when(iso?: string): string {
    return stampLabel(iso);
  }

  kindIcon(kind: string): string {
    switch (kind) {
      case 'creacion': return 'add_circle';
      case 'edicion': return 'edit';
      case 'alta': return 'person_add';
      case 'baja': return 'person_remove';
      case 'asignacion': return 'assignment_ind';
      case 'delegacion': return 'group_add';
      case 'respuesta': return 'reply';
      case 'completada': return 'check_circle';
      case 'estado': return 'swap_horiz';
      case 'archivo': return 'attach_file';
      default: return 'circle';
    }
  }
}
