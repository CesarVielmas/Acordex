import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PressClosureReport, PressEventItem } from '../../../../core/models/press.models';
import { EditableFieldComponent } from '../../../../shared/ui/editable-field/editable-field.component';
import { money } from '../../../events/event-metrics';
import {
  accreditationStats,
  accreditedOutlets,
  coverageBreakdown,
  costPerAttendee,
  pressSpend
} from '../../press-metrics';
import { COVERAGE_LABELS } from '../../../../core/models/press.models';

/**
 * Cierre: gasto contra impacto.
 *
 * Aquí no hay margen que calcular. Un evento de prensa no cobra nada, así que lo
 * que se compara no es ingreso contra costo sino **cuánto costó y cuánta
 * cobertura salió**. Y la cifra que de verdad importa es la diferencia entre
 * acreditados y asistentes: una rueda con treinta acreditados a la que llegaron
 * cuatro no es la misma rueda, aunque el gasto sea idéntico.
 */
@Component({
  selector: 'app-press-tab-closure',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ─── ASISTENCIA REAL ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-purple-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-purple-500/25 border-l-4 border-l-purple-400/70 shadow-2xl space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-purple-200 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 flex items-center justify-center material-symbols-outlined text-lg">fact_check</span>
            <span>Quién vino de verdad</span>
          </h5>
          @if (sealed()) {
            <span class="px-3 py-1.5 rounded-2xl bg-zinc-500/20 text-zinc-300 border border-zinc-500/35 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">lock</span> Sellado
            </span>
          }
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Acreditados</span>
            <span class="text-2xl font-black font-mono text-on-surface">{{ stats().approved }}</span>
            <span class="text-[10px] text-outline block mt-0.5">{{ stats().headcount }} persona(s)</span>
          </div>
          <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Asistieron</span>
            <span class="text-2xl font-black font-mono text-emerald-300">{{ stats().attended }}</span>
          </div>
          <div class="p-4 rounded-2xl border"
            [class]="stats().noShow ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface-container/60 border-outline-variant/25'">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">No se presentaron</span>
            <span class="text-2xl font-black font-mono" [class]="stats().noShow ? 'text-rose-300' : 'text-outline'">{{ stats().noShow }}</span>
          </div>
          <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Tasa de asistencia</span>
            <span class="text-2xl font-black font-mono text-on-surface">{{ attendanceRate() }}%</span>
          </div>
        </div>

        @if (stats().noShow > 0) {
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-100 leading-relaxed">
            {{ stats().noShow }} medio(s) acreditado(s) no se presentaron. Vale la pena anotarlo: el cupo que ocuparon
            es el que le faltó a alguien más, y esa lista es la que se consulta la próxima vez.
          </div>
        }

        <div class="flex flex-wrap gap-2">
          @for (c of coverage(); track c.type) {
            <span class="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10.5px] font-bold text-on-surface-variant">
              {{ coverageLabel(c.type) }} <span class="font-mono text-on-surface">{{ c.count }}</span>
            </span>
          }
        </div>
      </section>

      <!-- ─── COBERTURA ─── -->
      <section class="p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-5 backdrop-blur-2xl">
        <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5 border-b border-outline-variant/20 pb-4">
          <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">trending_up</span>
          <span>Cobertura que salió</span>
        </h5>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <app-editable-field
            label="Medios que asistieron"
            type="number"
            [value]="closure().attendedCount ?? stats().attended"
            [readonly]="!canEdit()"
            (save)="save({ attendedCount: toNumber($event) })"
          />
          <app-editable-field
            label="Notas publicadas"
            type="number"
            [value]="closure().publishedPieces ?? ''"
            [readonly]="!canEdit()"
            (save)="save({ publishedPieces: toNumber($event) })"
          />
          <app-editable-field
            label="Alcance estimado"
            hint="personas"
            type="number"
            [value]="closure().estimatedReach ?? ''"
            [readonly]="!canEdit()"
            (save)="save({ estimatedReach: toNumber($event) })"
          />
          <app-editable-field
            label="Fotografías subidas"
            type="number"
            [value]="closure().photosUploaded ?? photoCount()"
            [readonly]="!canEdit()"
            (save)="save({ photosUploaded: toNumber($event) })"
          />
        </div>

        <app-editable-field
          label="Resumen del evento"
          type="textarea"
          [rows]="4"
          [value]="closure().summary ?? ''"
          [readonly]="!canEdit()"
          placeholder="Cómo salió, qué se anunció y qué conviene recordar para la próxima"
          (save)="save({ summary: $event })"
        />
      </section>

      <!-- ─── GASTO CONTRA IMPACTO ─── -->
      @if (canViewFinances()) {
        <section class="p-6 rounded-3xl bg-gradient-to-br from-rose-500/[0.05] via-surface-container-high/90 to-surface-container-high/90 border border-rose-500/20 border-l-4 border-l-rose-400/60 shadow-2xl space-y-5 backdrop-blur-2xl">
          <h5 class="text-xs font-black uppercase tracking-wider text-rose-200 flex items-center gap-2.5 border-b border-outline-variant/20 pb-4">
            <span class="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-center justify-center material-symbols-outlined text-lg">balance</span>
            <span>Gasto contra impacto</span>
          </h5>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Estimado del desglose</span>
              <span class="text-lg font-black font-mono text-on-surface">{{ money(estimated()) }}</span>
            </div>
            <div class="p-4 rounded-2xl bg-rose-500/[0.07] border border-rose-500/25">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Gasto real</span>
              <span class="text-lg font-black font-mono text-rose-200">{{ money(closure().finalSpend ?? estimated()) }}</span>
              @if (deviation() !== 0) {
                <span class="text-[10px] block mt-0.5" [class]="deviation() > 0 ? 'text-rose-300' : 'text-emerald-300'">
                  {{ deviation() > 0 ? '+' : '' }}{{ money(deviation()) }} contra lo estimado
                </span>
              }
            </div>
            <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Costo por medio que llegó</span>
              @if (perAttendee() === null) {
                <span class="text-sm font-black text-outline italic">Sin asistentes</span>
              } @else {
                <span class="text-lg font-black font-mono text-on-surface">{{ money(perAttendee()!) }}</span>
              }
            </div>
          </div>

          <app-editable-field
            label="Gasto real del evento"
            type="number"
            [value]="closure().finalSpend ?? estimated()"
            [readonly]="!canEdit()"
            (save)="save({ finalSpend: toNumber($event) })"
          />
        </section>
      }

      <!-- ─── MEDIOS ACREDITADOS ─── -->
      @if (outlets().length) {
        <section class="p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-3 backdrop-blur-2xl">
          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
            <span class="material-symbols-outlined text-lg text-outline">newspaper</span>
            <span>Medios acreditados ({{ outlets().length }})</span>
          </h5>
          <div class="flex flex-wrap gap-1.5">
            @for (m of outlets(); track m) {
              <span class="px-2.5 py-1 rounded-lg bg-surface-bright text-on-surface text-[11px] font-medium border border-outline-variant/30">{{ m }}</span>
            }
          </div>
        </section>
      }
    </div>
  `
})
export class PressTabClosureComponent {
  readonly event = input.required<PressEventItem>();
  readonly canEdit = input<boolean>(false);
  readonly canViewFinances = input<boolean>(false);

  readonly patch = output<Partial<PressEventItem>>();

  readonly money = money;

  readonly stats = computed(() => accreditationStats(this.event()));
  readonly closure = computed<PressClosureReport>(() => this.event().closure || {});
  readonly outlets = computed(() => accreditedOutlets(this.event()));
  readonly coverage = computed(() => coverageBreakdown(this.event()));
  readonly estimated = computed(() => pressSpend(this.event()));
  readonly perAttendee = computed(() => costPerAttendee(this.event()));
  readonly sealed = computed(() => !!this.event().closure?.isSealed);
  readonly photoCount = computed(() => (this.event().evidenceMedia || []).filter(m => m.type === 'photo').length);

  readonly attendanceRate = computed(() => {
    const s = this.stats();
    return s.approved ? Math.round((s.attended / s.approved) * 100) : 0;
  });

  readonly deviation = computed(() => (this.closure().finalSpend ?? this.estimated()) - this.estimated());

  coverageLabel(c: keyof typeof COVERAGE_LABELS): string {
    return COVERAGE_LABELS[c] || c;
  }

  toNumber(value: string): number {
    return Number(value) || 0;
  }

  /** El reporte va anidado: se fusiona para no borrar lo demás al escribir un campo. */
  save(changes: Partial<PressClosureReport>): void {
    this.patch.emit({ closure: { ...this.closure(), ...changes } });
  }
}
