import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PressEventItem } from '../../../core/models/press.models';
import { pressStateMeta } from '../../../core/models/press-state.meta';
import { money } from '../../events/event-metrics';
import { canConvoke, pressCompleteness } from '../press-completeness';
import {
  accreditationStats,
  daysUntilPress,
  isSingleManager,
  isStaleUnconvoked,
  participatingManagers,
  pressSpend,
  pressWhenLabel,
  registrationWindow
} from '../press-metrics';

/**
 * Tarjeta de una firma o rueda de prensa en el tablero.
 *
 * Enseña lo que hace falta para decidir si hay que abrirla: en qué fase está,
 * cuántas solicitudes esperan respuesta y qué le impide avanzar. Una tarjeta que
 * solo pinta el título obliga a abrir las quince para encontrar la que tiene algo
 * pendiente.
 */
@Component({
  selector: 'app-press-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block h-full' },
  template: `
    <article
      [class]="meta().borderLeftClass"
      class="h-full flex flex-col rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 border-l-4 shadow-xl backdrop-blur-xl overflow-hidden hover:border-primary/40 transition-all"
    >
      <!-- Portada -->
      <button type="button" (click)="open.emit(event())" class="relative h-28 w-full overflow-hidden bg-black/40 text-left group">
        @if (coverUrl()) {
          <img [src]="coverUrl()" [alt]="event().title" class="w-full h-full object-cover brightness-[0.55] group-hover:brightness-75 transition-all" />
        } @else {
          <div class="w-full h-full flex items-center justify-center">
            <span class="material-symbols-outlined text-4xl text-outline/40">newspaper</span>
          </div>
        }
        <div class="absolute inset-0 bg-gradient-to-t from-surface-container-high via-transparent to-transparent"></div>
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <span [class]="meta().badgeClass" class="px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px]">{{ meta().icon }}</span>
            {{ meta().shortLabel }}
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-black/50 border border-white/15 text-[9px] font-black uppercase tracking-wider text-white/80">
            {{ event().pressType === 'Firma de Autógrafos' ? 'Firma' : 'Rueda' }}
          </span>
        </div>
      </button>

      <div class="p-4 flex flex-col gap-3 flex-1">
        <button type="button" (click)="open.emit(event())" class="text-left min-w-0">
          <h4 class="text-sm font-black text-on-surface leading-tight line-clamp-2 hover:text-primary transition-colors">{{ event().title }}</h4>
          <p class="text-[10.5px] text-outline mt-1 truncate">{{ event().venue }} · {{ event().location }}</p>
          <p class="text-[10.5px] text-on-surface-variant mt-0.5 font-mono">{{ whenLabel() }} · {{ daysLabel() }}</p>
        </button>

        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-on-surface-variant truncate max-w-full">
            {{ event().groupName }}
          </span>
          @if (!singleManager()) {
            <span class="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9.5px] font-black uppercase tracking-wider">
              {{ managers().length }} disqueras
            </span>
          }
        </div>

        <!-- Cifras de acreditación -->
        <div class="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-black/25 border border-white/8">
          <div class="text-center">
            <span class="block text-sm font-black font-mono text-on-surface">{{ stats().total }}</span>
            <span class="block text-[9px] text-outline uppercase tracking-wider">Solicitudes</span>
          </div>
          <div class="text-center">
            <span class="block text-sm font-black font-mono" [class]="stats().pending ? 'text-amber-300' : 'text-outline'">
              {{ stats().pending }}
            </span>
            <span class="block text-[9px] text-outline uppercase tracking-wider">Por revisar</span>
          </div>
          <div class="text-center">
            <span class="block text-sm font-black font-mono text-emerald-300">{{ stats().approved }}</span>
            <span class="block text-[9px] text-outline uppercase tracking-wider">Acreditadas</span>
          </div>
        </div>

        <!-- Avance del expediente -->
        @if (showProgress()) {
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-outline uppercase tracking-wider font-bold">Expediente</span>
              <span class="font-mono font-black text-on-surface">{{ report().percent }}%</span>
            </div>
            <div class="h-1.5 rounded-full bg-black/40 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all" [style.width.%]="report().percent"></div>
            </div>
          </div>
        }

        @if (canViewFinances()) {
          <div class="flex items-center justify-between text-[10.5px]">
            <span class="text-outline">Gasto</span>
            <span class="font-mono font-black text-on-surface">{{ money(spend()) }}</span>
          </div>
        }

        <!-- La alarma de la tarjeta -->
        @if (alert(); as a) {
          <div class="p-2.5 rounded-xl border text-[10.5px] leading-relaxed flex items-start gap-1.5" [class]="a.class">
            <span class="material-symbols-outlined text-[13px] shrink-0 mt-0.5">{{ a.icon }}</span>
            <span>{{ a.text }}</span>
          </div>
        }

        <div class="mt-auto pt-2 flex items-center gap-2">
          <button type="button" (click)="open.emit(event())"
            class="flex-1 px-3 py-2 min-h-10 rounded-xl bg-surface-container-highest hover:bg-primary hover:text-on-primary text-[11px] font-black transition-all flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[14px]">folder_open</span> Abrir expediente
          </button>
          @if (pressKitUrl()) {
            <a [href]="pressKitUrl()" target="_blank"
              title="Kit de prensa"
              class="px-3 py-2 min-h-10 rounded-xl bg-white/5 text-outline border border-white/12 hover:text-on-surface text-[11px] font-black transition-all flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">description</span>
            </a>
          }
        </div>
      </div>
    </article>
  `
})
export class PressCardComponent {
  readonly event = input.required<PressEventItem>();
  readonly canViewFinances = input<boolean>(false);

  readonly open = output<PressEventItem>();

  readonly money = money;

  readonly meta = computed(() => pressStateMeta(this.event().state));
  readonly stats = computed(() => accreditationStats(this.event()));
  readonly report = computed(() => pressCompleteness(this.event()));
  readonly spend = computed(() => pressSpend(this.event()));
  readonly singleManager = computed(() => isSingleManager(this.event()));
  readonly managers = computed(() => participatingManagers(this.event()));
  readonly coverUrl = computed(() => this.event().publicProfile?.coverUrl || this.event().flyerUrl);
  readonly pressKitUrl = computed(() => this.event().accreditation?.pressKitUrl || '');

  readonly showProgress = computed(() =>
    this.event().state === 'Borrador' || this.event().state === 'En Revisión');

  whenLabel(): string {
    return pressWhenLabel(this.event());
  }

  daysLabel(): string {
    const dias = daysUntilPress(this.event());
    if (!isFinite(dias)) return 'sin fecha';
    if (dias === 0) return 'hoy';
    if (dias === 1) return 'mañana';
    if (dias > 0) return `en ${dias} días`;
    return `hace ${Math.abs(dias)} días`;
  }

  /**
   * Lo único que hay que saber sin abrir la tarjeta.
   *
   * Va en orden de urgencia y solo sale una: tres avisos apilados en una tarjeta
   * se leen igual que ninguno.
   */
  alert(): { text: string; icon: string; class: string } | null {
    const e = this.event();

    if (e.convocation?.blockedReason) {
      return {
        text: `La convocatoria programada no salió: ${e.convocation.blockedReason}`,
        icon: 'error',
        class: 'bg-rose-500/12 border-rose-500/40 text-rose-100'
      };
    }

    if (isStaleUnconvoked(e)) {
      return {
        text: 'Se le pasó la fecha sin convocarse. No ocurrió y nadie lo canceló: decide qué hacer con él.',
        icon: 'running_with_errors',
        class: 'bg-rose-500/12 border-rose-500/40 text-rose-100'
      };
    }

    if (e.state === 'Convocado' && this.stats().pending > 0) {
      return {
        text: `${this.stats().pending} solicitud(es) esperando respuesta.`,
        icon: 'hourglass_top',
        class: 'bg-amber-500/12 border-amber-500/35 text-amber-100'
      };
    }

    if (e.state === 'En Revisión') {
      const check = canConvoke(e);
      return check.can
        ? {
          text: 'Listo para convocar: expediente completo y sin solicitudes pendientes.',
          icon: 'check_circle',
          class: 'bg-emerald-500/12 border-emerald-500/35 text-emerald-100'
        }
        : {
          text: check.reason || '',
          icon: 'pending',
          class: 'bg-amber-500/10 border-amber-500/30 text-amber-100'
        };
    }

    if (e.state === 'Realizado' && this.stats().noShow > 0) {
      return {
        text: `${this.stats().noShow} acreditado(s) no se presentaron. Captura la cobertura y cierra.`,
        icon: 'fact_check',
        class: 'bg-purple-500/12 border-purple-500/30 text-purple-100'
      };
    }

    if (e.state === 'Convocado' && registrationWindow(e) === 'cerrado') {
      return {
        text: 'El registro ya cerró: no se admiten altas nuevas.',
        icon: 'lock',
        class: 'bg-white/5 border-white/12 text-on-surface-variant'
      };
    }

    return null;
  }
}
