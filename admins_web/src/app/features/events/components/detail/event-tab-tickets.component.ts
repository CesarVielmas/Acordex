import { Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CroquisPlan } from '../../../../core/models/croquis.models';
import { EventItem, TicketTier } from '../../../../core/models/event.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { CroquisCanvasComponent } from '../../croquis/components/croquis-canvas.component';
import { CroquisTierDialogComponent } from '../../croquis/components/croquis-tier-dialog.component';
import { CroquisSummaryComponent } from '../../croquis/components/croquis-summary.component';
import { CROQUIS_TEMPLATES } from '../../croquis/croquis-catalog';
import { croquisId } from '../../croquis/croquis-geometry';
import {
  croquisCapacity, croquisIssues, croquisSold, planCapacity, planFromLegacyZones,
  planSeatCount, planSold, planStages, tierCroquisSummary
} from '../../croquis/croquis-metrics';
import { money, potentialTicketRevenue, serviceFee } from '../../event-metrics';

import { MandatoryTaskTagComponent } from '../../../../shared/ui/mandatory-task-tag/mandatory-task-tag.component';
import { SessionService } from '../../../../core/services/session.service';
import { markIntervention, ResolvedTask } from '../../event-tasks';
import { MandatoryFields } from '../../mandatory-fields';

/**
 * Boletaje & Croquis.
 */
@Component({
  selector: 'app-event-tab-tickets',
  standalone: true,
  imports: [
    CommonModule,
    EditableFieldComponent,
    CroquisCanvasComponent,
    CroquisTierDialogComponent,
    CroquisSummaryComponent,
    MandatoryTaskTagComponent
  ],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ─── HERO HEADER GLASSMORPHIC: AFORO Y AVANCE DE VENTA ─── -->
      <section class="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-black/40 to-black/60 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-3xl space-y-6">

        <!-- Halo brillante de fondo -->
        <div class="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div class="space-y-1">
            <span class="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Aforo Total a la Venta
            </span>
            <div class="flex items-baseline gap-2">
              <span class="font-['Epilogue'] font-black text-on-surface text-3xl sm:text-4xl font-mono leading-tight tracking-tight">
                {{ capacity().toLocaleString('es-MX') }}
              </span>
              <span class="text-xs text-outline font-medium">lugares en croquis</span>
            </div>
            <p class="text-[11px] text-outline">Calculados dinámicamente desde el plano del evento</p>
          </div>

          <div class="text-right space-y-1 bg-black/30 p-3.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Avance de Ventas</span>
            <div class="flex items-baseline justify-end gap-1.5">
              <span class="font-['Epilogue'] font-black text-emerald-400 text-3xl sm:text-4xl font-mono leading-tight">
                {{ occupancy() }}%
              </span>
            </div>
            <span class="text-[11px] font-mono text-outline block">
              {{ sold().toLocaleString('es-MX') }} / {{ capacity().toLocaleString('es-MX') }} boletos
            </span>
          </div>
        </div>

        <!-- Barra de progreso con rastro brillante -->
        <div class="relative z-10 h-3 rounded-full bg-surface-container-highest/80 overflow-hidden p-0.5 border border-white/10">
          <div
            class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.6)] transition-all duration-700 ease-out"
            [style.width.%]="occupancy()"
          ></div>
        </div>

        <!-- 4 KPI CARDS EN GRILLA DE CRISTAL -->
        <div class="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          <div class="p-3.5 rounded-2xl bg-black/30 border border-white/10 shadow-lg space-y-1 backdrop-blur-2xl hover:bg-white/5 hover:border-cyan-400/30 transition-colors">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-cyan-400">layers</span> Zonas del Croquis
            </span>
            <span class="font-black text-on-surface text-base sm:text-lg font-mono">{{ plans().length }} zona(s)</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/30 border border-white/10 shadow-lg space-y-1 backdrop-blur-2xl hover:bg-white/5 hover:border-cyan-400/30 transition-colors">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-indigo-400">event_seat</span> Butacas Numeradas
            </span>
            <span class="font-black text-on-surface text-base sm:text-lg font-mono">{{ seatCount().toLocaleString('es-MX') }}</span>
          </div>

          @if (canViewFinances()) {
            <div class="p-3.5 rounded-2xl bg-black/30 border border-white/10 shadow-lg space-y-1 backdrop-blur-2xl hover:bg-white/5 hover:border-emerald-400/30 transition-colors">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-emerald-400">payments</span> Taquilla Potencial
              </span>
              <span class="font-black text-emerald-400 text-base sm:text-lg font-mono">{{ potential() }}</span>
            </div>
          }

          <div class="p-3.5 rounded-2xl bg-black/30 border border-white/10 shadow-lg space-y-1 backdrop-blur-2xl hover:bg-white/5 hover:border-amber-400/30 transition-colors">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-amber-400">receipt_long</span> Cargo por Servicio
            </span>
            <span class="font-black text-amber-300 text-base sm:text-lg font-mono">&#36;{{ fee() }}</span>
          </div>
        </div>

      </section>

      <!-- ─── ALERTA DE VALIDACIÓN Y DETALLES PENDIENTES ─── -->
      @if (issues().length) {
        <section
          class="p-5 rounded-3xl border space-y-3 backdrop-blur-2xl shadow-xl transition-all"
          [class]="errors().length
            ? 'bg-rose-500/10 border-rose-500/40 shadow-rose-500/5'
            : 'bg-amber-500/10 border-amber-500/40 shadow-amber-500/5'"
        >
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <h5 class="text-xs font-black uppercase tracking-wider flex items-center gap-2"
              [class]="errors().length ? 'text-rose-300' : 'text-amber-300'">
              <span class="material-symbols-outlined text-base">{{ errors().length ? 'error' : 'info' }}</span>
              {{ errors().length ? errors().length + ' detalle(s) impiden poner a la venta' : issues().length + ' recomendación(es) para el boletaje' }}
            </h5>
            @if (canEdit()) {
              <button
                type="button"
                (click)="openEditor.emit(null)"
                class="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface border border-white/10 hover:border-cyan-400/40 text-xs font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <span class="material-symbols-outlined text-sm text-cyan-300">edit_square</span>
                <span>Resolver en el croquis</span>
              </button>
            }
          </div>

          <ul class="space-y-2 pt-1">
            @for (issue of visibleIssues(); track issue.message) {
              <li class="flex items-start gap-2.5 text-xs p-2.5 rounded-xl bg-black/20 border border-white/5">
                <span class="material-symbols-outlined text-sm shrink-0 mt-0.5"
                  [class]="issue.level === 'error' ? 'text-rose-400' : 'text-amber-400'">
                  {{ issue.level === 'error' ? 'priority_high' : 'info' }}
                </span>
                <div class="min-w-0 flex-1">
                  <span class="text-on-surface font-bold">{{ issue.message }}</span>
                  <span class="text-outline block text-[11px] mt-0.5">{{ issue.fix }}</span>
                </div>
              </li>
            }
          </ul>

          @if (issues().length > visibleIssues().length) {
            <p class="text-[10px] text-outline italic pl-1">
              y {{ issues().length - visibleIssues().length }} observación(es) adicional(es).
            </p>
          }
        </section>
      }

      <!-- ─── ZONAS Y CROQUIS DEL EVENTO ─── -->
      <section class="p-6 sm:p-7 rounded-3xl bg-black/20 border border-white/10 shadow-2xl backdrop-blur-3xl space-y-6">

        <!-- Cabecera de la sección -->
        <div class="flex items-center justify-between gap-4 flex-wrap border-b border-white/10 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shadow-lg">
              <span class="material-symbols-outlined text-xl">map</span>
            </div>
            <div>
              <h5 class="font-['Epilogue'] font-black text-base text-on-surface tracking-tight flex items-center gap-2">
                <span>Planos y Croquis del Evento</span>
              </h5>
              <span class="text-xs text-outline font-mono">{{ plans().length }} zona(s) configurada(s)</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <app-mandatory-task-tag ref="croquis" [event]="event()" (intervene)="onInterveneTask($event)" />
            @if (canEdit() && isTaskUnlocked('croquis') && plans().length) {
              <button
                type="button"
                (click)="openEditor.emit(null)"
                class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-black text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-2 active:scale-95"
              >
                <span class="material-symbols-outlined text-base">edit_square</span>
                <span>Abrir Editor Visual</span>
              </button>
            }
          </div>
        </div>

        @if (mandatory.warning('croquis')) {
          <div class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-bold leading-relaxed flex items-start gap-2.5 shadow-md">
            <span class="material-symbols-outlined text-base text-amber-400 shrink-0 mt-0.5">info</span>
            <span>{{ mandatory.warning('croquis') }}</span>
          </div>
        }

        @if (plans().length > 1) {
          <div class="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2.5">
            <span class="material-symbols-outlined text-lg shrink-0 text-cyan-300 mt-0.5">layers</span>
            <span>
              Este evento cuenta con <strong class="text-on-surface">{{ plans().length }} zonas independientes con croquis propio</strong>.
              El público podrá intercalar entre zonas durante su compra.
            </span>
          </div>
        }

        <!-- Grilla de Miniaturas de Zonas -->
        @if (plans().length) {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (plan of plans(); track plan.id) {
              <div class="rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-xl hover:bg-white/10 hover:border-cyan-400/40 transition-all duration-300 backdrop-blur-2xl group flex flex-col">

                <!-- Canvas Miniatura Viva -->
                <button
                  type="button"
                  (click)="canEdit() ? openEditor.emit(plan.id) : null"
                  class="block w-full h-48 bg-[#0b0e14] border-b border-white/10 relative overflow-hidden text-left"
                  [class.cursor-default]="!canEdit()"
                >
                  <app-croquis-canvas [plan]="plan" [tiers]="tiers()" [lineup]="lineupOptions()" mode="miniatura" />

                  <!-- Hover Overlay -->
                  @if (canEdit()) {
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-xs">
                      <span class="px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-black shadow-lg flex items-center gap-2 scale-95 group-hover:scale-100 transition-transform">
                        <span class="material-symbols-outlined text-sm">edit</span> Editar este croquis
                      </span>
                    </div>
                  }
                </button>

                <!-- Detalle de la Zona -->
                <div class="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <h6 class="text-sm font-black text-on-surface truncate">{{ plan.name }}</h6>
                        <span class="text-[10px] text-outline font-mono block">
                          {{ capacityOf(plan).toLocaleString('es-MX') }} aforo · {{ plan.areas.length }} área(s)
                        </span>
                      </div>
                      @if (soldOf(plan) > 0) {
                        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black shrink-0">
                          {{ soldOf(plan).toLocaleString('es-MX') }} vendidos
                        </span>
                      }
                    </div>

                    @if (plan.description) {
                      <p class="text-xs text-outline leading-snug line-clamp-2">{{ plan.description }}</p>
                    }

                    <!-- Escenarios -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      @for (stage of stagesOf(plan); track stage.id) {
                        <span class="px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 text-[10px] font-black flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">theater_comedy</span>
                          {{ groupOnStage(stage.lineupSlotId) || stage.label }}
                        </span>
                      } @empty {
                        <span class="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          Sin escenario asignado
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Categorías Presentes -->
                  <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/10">
                    @for (row of tiersOfPlan(plan); track row.tier.id) {
                      <span
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1 shadow-sm"
                        [style.background-color]="row.tier.color + '22'"
                        [style.border-color]="row.tier.color + '66'"
                        [style.color]="row.tier.color"
                      >
                        <span class="w-2 h-2 rounded-full" [style.background-color]="row.tier.color"></span>
                        {{ row.tier.name }} · {{ row.capacity.toLocaleString('es-MX') }}
                      </span>
                    }
                  </div>
                </div>

              </div>
            }
          </div>
        } @else {
          <!-- Sin Croquis: Selector de Plantillas -->
          <div class="p-6 rounded-3xl bg-white/5 backdrop-blur-2xl border border-dashed border-white/15 space-y-5 text-center">
            <div class="max-w-md mx-auto space-y-2">
              <div class="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg">
                <span class="material-symbols-outlined text-2xl">map</span>
              </div>
              <h6 class="text-sm font-black text-on-surface">Este evento aún no tiene plano de croquis</h6>
              <p class="text-xs text-outline leading-relaxed">
                Selecciona una plantilla arquitectónica base para comenzar a construir el croquis y definir tus áreas a la venta.
              </p>
            </div>

            @if (canEdit()) {
              @if (hasLegacyZones()) {
                <button
                  type="button"
                  (click)="migrateLegacy()"
                  class="w-full max-w-md mx-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-primary to-amber-300 text-black font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-102"
                >
                  <span class="material-symbols-outlined text-lg">auto_awesome</span>
                  <span>Migrar croquis con las {{ event().croquisZones.length }} zonas detectadas</span>
                </button>
              }

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto pt-2">
                @for (t of templates; track t.id) {
                  <button
                    type="button"
                    (click)="createFromTemplate(t.id)"
                    class="p-4 rounded-2xl bg-surface-container-high/80 border border-white/10 hover:border-cyan-400/40 text-left transition-all flex items-start gap-3 group hover:scale-[1.02]"
                  >
                    <span class="material-symbols-outlined text-2xl text-cyan-300 shrink-0 group-hover:scale-110 transition-transform">{{ t.icon }}</span>
                    <div class="min-w-0">
                      <span class="block text-xs font-black text-on-surface group-hover:text-cyan-300 transition-colors">{{ t.name }}</span>
                      <span class="block text-[11px] text-outline leading-relaxed mt-0.5">{{ t.description }}</span>
                    </div>
                  </button>
                }
              </div>
            }
          </div>
        }
      </section>

      <!-- ─── DESPLEGABLE: TODOS LOS NÚMEROS Y ESTADÍSTICAS DEL EVENTO ─── -->
      @if (plans().length) {
        <section class="rounded-3xl bg-black/20 border border-white/10 shadow-2xl backdrop-blur-3xl overflow-hidden transition-all">
          <button
            type="button"
            (click)="numbersOpen.set(!numbersOpen())"
            class="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left transition-colors hover:bg-white/5"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-2xl bg-primary/20 text-primary border border-primary/40 flex items-center justify-center shrink-0 shadow-lg">
                <span class="material-symbols-outlined text-xl">query_stats</span>
              </div>
              <div class="min-w-0">
                <h5 class="font-['Epilogue'] font-black text-sm text-on-surface tracking-tight truncate">
                  Todos los Números del Boletaje
                </h5>
                <p class="text-xs text-outline truncate">Desglose exhaustivo de aforo, ocupación y taquilla por zona</p>
              </div>
            </div>

            <span class="material-symbols-outlined text-2xl text-outline shrink-0 transition-transform duration-300"
              [class.rotate-180]="numbersOpen()">expand_more</span>
          </button>

          @if (numbersOpen()) {
            <div class="px-5 sm:px-6 pb-6 pt-2 border-t border-white/10 animate-fade-in">
              <app-croquis-summary
                [plans]="plans()"
                [tiers]="tiers()"
                [serviceFee]="fee()"
                [canViewFinances]="canViewFinances()"
              />
            </div>
          }
        </section>
      }

      <!-- ─── CATEGORÍAS DE BOLETO ─── -->
      <section class="p-6 sm:p-7 rounded-3xl bg-black/20 border border-white/10 shadow-2xl backdrop-blur-3xl space-y-6">

        <div class="flex items-center justify-between gap-4 flex-wrap border-b border-white/10 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-lg">
              <span class="material-symbols-outlined text-xl">confirmation_number</span>
            </div>
            <div>
              <h5 class="font-['Epilogue'] font-black text-base text-on-surface tracking-tight">
                Categorías de Boleto
              </h5>
              <span class="text-xs text-outline font-mono">{{ tiers().length }} categoría(s) registrada(s)</span>
            </div>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap">
            <!-- Sin una sola categoría con precio no hay nada que vender, así que
                 el boletaje es tan obligatorio como la fecha o el recinto. Le
                 faltaba la marca: el croquis la tenía y el boletaje no, y era el
                 único punto de esta pestaña que nadie sabía de quién era. -->
            <app-mandatory-task-tag ref="boletos" [event]="event()" (intervene)="onInterveneTask($event)" />

            @if (canEdit()) {
            <button
              type="button"
              (click)="addTier()"
              class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-black text-xs transition-all shadow-[0_0_20px_rgba(242,202,80,0.25)] flex items-center gap-2 active:scale-95 hover:scale-105"
            >
              <span class="material-symbols-outlined text-base">add</span>
              <span>Nueva Categoría</span>
            </button>
            }
          </div>
        </div>

        <p class="text-xs text-outline leading-relaxed flex items-start gap-2 bg-black/20 p-3 rounded-2xl border border-white/5">
          <span class="material-symbols-outlined text-base shrink-0 text-amber-300">sync</span>
          <span>
            Los precios e íconos se configuran aquí. Los lugares de cada categoría <strong class="text-on-surface">se cuentan dinámicamente desde el croquis</strong>.
          </span>
        </p>

        <!-- Grilla de Categorías -->
        <div class="space-y-4">
          @for (tier of tiers(); track tier.id || tier.name) {
            @let croquis = summaryOf(tier);
            <div class="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-400/30 space-y-4 shadow-xl backdrop-blur-2xl transition-all">

              <!-- Fila Superior: Icono, Nombre y Badges -->
              <div class="flex items-center gap-3 flex-wrap min-w-0">
                <span
                  class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-md"
                  [style.background-color]="tier.color + '22'"
                  [style.border-color]="tier.color + '66'"
                >
                  <span class="material-symbols-outlined text-xl" [style.color]="tier.color">{{ tier.icon || 'confirmation_number' }}</span>
                </span>

                <div class="flex-1 min-w-[10rem]">
                  <app-editable-field
                    [value]="tier.name"
                    valueClass="text-sm font-black text-on-surface break-words"
                    [readonly]="!canEdit()"
                    (save)="patchTier(tier, { name: $event })"
                  />
                </div>

                <span class="px-3 py-1.5 rounded-xl text-xs font-black border shrink-0"
                  [class]="croquis.capacity > 0
                    ? 'bg-surface-container-high text-on-surface border-white/10 font-mono'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'">
                  {{ croquis.capacity.toLocaleString('es-MX') }} en croquis
                </span>

                @if (tier.soldSeats > 0) {
                  <span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black font-mono shrink-0">
                    {{ tier.soldSeats }} vendidos
                  </span>
                }

                @if (canEdit()) {
                  <button
                    type="button"
                    (click)="tierUnderEdit.set(tier); tierDialogOpen.set(true)"
                    class="w-8 h-8 rounded-xl bg-surface-container-high text-outline border border-white/10 hover:text-amber-300 hover:border-amber-400/40 flex items-center justify-center shrink-0 transition-all shadow-md"
                    title="Editar color, ícono y descripción"
                  >
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </button>
                }

                @if (canEdit() && tier.soldSeats === 0) {
                  <button
                    type="button"
                    (click)="removeTier(tier)"
                    class="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all shadow-md"
                    title="Quitar categoría"
                  >
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                }
              </div>

              <!-- Grilla de Campos de Edición -->
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                <app-editable-field
                  label="Precio Boleto"
                  type="number"
                  prefix="$"
                  [value]="tier.price"
                  [readonly]="!canEdit()"
                  (save)="patchTier(tier, { price: toNumber($event) })"
                />

                <div class="min-w-0 p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                  <span class="block text-[10px] font-black uppercase tracking-wider text-outline">Lugares Disponibles</span>
                  <span class="text-sm font-bold text-on-surface font-mono block">
                    {{ croquis.capacity.toLocaleString('es-MX') }}
                  </span>
                  <span class="block text-[10px] text-outline">
                    {{ croquis.areaCount }} área(s) en croquis
                  </span>
                </div>

                <div class="min-w-0 p-3.5 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                  <span class="block text-[10px] font-black uppercase tracking-wider text-outline">Disponibilidad en Zonas</span>
                  <span class="text-xs font-bold text-on-surface truncate block">
                    {{ croquis.planNames.length ? croquis.planNames.join(', ') : 'Sin asignar a croquis' }}
                  </span>
                </div>

                <app-editable-field
                  label="Ícono en Ficha"
                  type="select"
                  [options]="iconOptions"
                  [value]="tier.icon || 'confirmation_number'"
                  [readonly]="!canEdit()"
                  (save)="patchTier(tier, { icon: $event })"
                />
              </div>

              <!-- Descripción -->
              <app-editable-field
                label="Qué incluye esta categoría"
                hint="Información visible para el comprador"
                type="textarea"
                [rows]="2"
                placeholder="Ej. Primeras filas frente al escenario, acceso preferencial y bebida de bienvenida."
                valueClass="text-xs font-medium text-on-surface-variant break-words"
                [value]="tier.description || ''"
                [readonly]="!canEdit()"
                (save)="patchTier(tier, { description: $event })"
              />

              <!-- Taquilla Potencial Footer -->
              @if (canViewFinances() && croquis.capacity > 0) {
                <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-2">
                  <span class="text-outline flex items-center gap-1.5 font-bold">
                    <span class="material-symbols-outlined text-sm text-emerald-400">point_of_sale</span>
                    Taquilla Potencial Estimada:
                  </span>
                  <strong class="text-emerald-400 font-mono text-sm">{{ money(croquis.capacity * (tier.price || 0)) }}</strong>
                </div>
              }
            </div>
          } @empty {
            <div class="p-8 text-center rounded-3xl bg-surface-container-high/40 border border-dashed border-white/10 space-y-2">
              <span class="material-symbols-outlined text-3xl text-outline">confirmation_number</span>
              <p class="text-xs font-bold text-on-surface">Sin categorías de boleto registradas aún.</p>
            </div>
          }
        </div>
      </section>

    </div>

    @if (tierDialogOpen()) {
      <app-croquis-tier-dialog
        [tier]="tierUnderEdit()"
        [siblings]="tiers()"
        (saved)="onTierSaved($event)"
        (cancelled)="tierDialogOpen.set(false); tierUnderEdit.set(null)"
      />
    }
  `
})
export class EventTabTicketsComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(false);
  canViewFinances = input<boolean>(false);

  patch = output<Partial<EventItem>>();
  /** Abre el editor; con un id, directo en ese croquis. */
  openEditor = output<string | null>();

  readonly templates = CROQUIS_TEMPLATES.filter(t => t.id !== 'blanco');

  readonly iconOptions: EditableOption[] = [
    { value: 'workspace_premium', label: 'Premium / VIP' },
    { value: 'star', label: 'Preferente' },
    { value: 'groups', label: 'General de pie' },
    { value: 'event_seat', label: 'Grada numerada' },
    { value: 'chair', label: 'Mesa' },
    { value: 'confirmation_number', label: 'Boleto genérico' }
  ];

  tiers = computed(() => this.event().ticketTiers || []);
  plans = computed(() => this.event().croquisPlans || []);

  capacity = computed(() => croquisCapacity(this.event()));
  sold = computed(() => croquisSold(this.event()));
  occupancy = computed(() => {
    const total = this.capacity();
    return total > 0 ? Math.round((this.sold() / total) * 100) : 0;
  });
  seatCount = computed(() => this.plans().reduce((sum, p) => sum + planSeatCount(p), 0));
  potential = computed(() => money(potentialTicketRevenue(this.event())));
  fee = computed(() => serviceFee(this.event()));

  issues = computed(() => croquisIssues(this.event()));
  errors = computed(() => this.issues().filter(i => i.level === 'error'));
  /** Se listan pocos: una lista de veinte avisos no se lee, se ignora. */
  visibleIssues = computed(() => [...this.errors(), ...this.issues().filter(i => i.level === 'aviso')].slice(0, 6));

  private summary = computed(() => tierCroquisSummary(this.plans()));

  hasLegacyZones = computed(() => (this.event().croquisZones || []).length > 0);

  lineupOptions = computed(() =>
    (this.event().lineup || []).map(s => ({ id: s.id, name: s.groupName }))
  );

  tierDialogOpen = signal(false);
  tierUnderEdit = signal<TicketTier | null>(null);
  numbersOpen = signal(false);

  money = money;
  capacityOf = (p: CroquisPlan) => planCapacity(p);
  soldOf = (p: CroquisPlan) => planSold(p);
  stagesOf = (p: CroquisPlan) => planStages(p);

  summaryOf(tier: TicketTier) {
    return this.summary().get(tier.id || '') || { capacity: 0, sold: 0, held: 0, planNames: [], areaCount: 0 };
  }

  /** Categorías que aparecen en un croquis concreto, con su tajada. */
  tiersOfPlan(plan: CroquisPlan): { tier: TicketTier; capacity: number }[] {
    const local = tierCroquisSummary([plan]);
    return this.tiers()
      .map(tier => ({ tier, capacity: local.get(tier.id || '')?.capacity || 0 }))
      .filter(row => row.capacity > 0);
  }

  groupOnStage(slotId?: string): string {
    if (!slotId) return '';
    return this.event().lineup?.find(s => s.id === slotId)?.groupName || '';
  }

  toNumber(value: string): number {
    return Math.max(0, Number(String(value).replace(/[^0-9.-]/g, '')) || 0);
  }

  // ─── Mutaciones ────────────────────────────────────────────────────────────

  createFromTemplate(templateId: string): void {
    const template = CROQUIS_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const plan = template.build(this.event().venue || 'Croquis principal');
    this.patch.emit({ croquisPlans: [plan] });
    this.openEditor.emit(plan.id);
  }

  /**
   * Arma el croquis con las zonas del modelo viejo.
   */
  migrateLegacy(): void {
    const plans = planFromLegacyZones(this.event());
    this.patch.emit({ croquisPlans: plans });
    this.openEditor.emit(plans[0]?.id ?? null);
  }

  /**
   * Una categoría nueva se captura completa en un diálogo, no en blanco.
   */
  addTier(): void {
    this.tierUnderEdit.set(null);
    this.tierDialogOpen.set(true);
  }

  onTierSaved(tier: TicketTier): void {
    const existing = this.tierUnderEdit();
    this.tierDialogOpen.set(false);
    this.tierUnderEdit.set(null);

    this.patch.emit({
      ticketTiers: existing?.id
        ? this.tiers().map(t => (t.id === existing.id ? { ...t, ...tier, id: existing.id } : t))
        : [...this.tiers(), { ...tier, id: croquisId('tt') }]
    });
  }

  patchTier(tier: TicketTier, changes: Partial<TicketTier>): void {
    this.patch.emit({ ticketTiers: this.tiers().map(t => (t === tier ? { ...t, ...changes } : t)) });
  }

  /**
   * Quita la categoría y desliga del croquis todo lo que la usaba.
   */
  removeTier(tier: TicketTier): void {
    const id = tier.id;
    this.patch.emit({
      ticketTiers: this.tiers().filter(t => t !== tier),
      croquisPlans: this.plans().map(plan => ({
        ...plan,
        areas: plan.areas.map(area => ({
          ...area,
          tierId: area.tierId === id ? undefined : area.tierId,
          rows: area.rows.map(row => ({
            ...row,
            seats: row.seats.map(seat => (seat.tierId === id ? { ...seat, tierId: undefined } : seat))
          }))
        }))
      }))
    });
  }

  private sessionService = inject(SessionService);





  /**
   * Los datos obligatorios de esta pestaña: de quién son, qué hay que advertir
   * antes de tocarlos y qué propuestas tienen encima. La lógica vive en un solo
   * sitio; aquí solo se enchufa el evento y quien lo está mirando.
   */
  readonly mandatory = new MandatoryFields(
    () => this.event(),
    () => this.sessionService.actor(),
    patch => this.patch.emit(patch)
  );

  /**
   * Si este actor puede escribir aquí.
   *
   * Un manager siempre puede —para eso está el aviso de intervención—; el staff
   * y los administradores solo dentro de la disquera que responde por el punto,
   * porque no tienen a quién responderle del dato de otra.
   */
  isTaskUnlocked(ref: string): boolean {
    // Cerrado solo mientras falte confirmar la intervención, y solo para quien
    // puede confirmarla. El staff de otra disquera no tiene esa puerta.
    if (!this.mandatory.locked(ref)) return true;
    return false;
  }

  /** Deja escrito que un manager ajeno se metió a resolver este punto. */
  onInterveneTask(task: ResolvedTask): void {
    this.patch.emit(markIntervention(this.event(), task, this.sessionService.actor()));
  }

}
