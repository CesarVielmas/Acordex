import { Component, input, output, computed, signal } from '@angular/core';
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

/**
 * Boletaje & Croquis.
 *
 * La pestaña no captura el boletaje: lo resume. El boletaje se arma dibujando,
 * en el editor de croquis, y de ahí salen todos los números que se ven aquí.
 *
 * Antes esto era al revés —se capturaban lugares, filas y butacas por fila a
 * mano y el croquis era un dato aparte— y por eso hacía falta un validador que
 * avisara cuando las dos cosas no coincidían. Con el plano como única fuente de
 * verdad ese error deja de existir: lo que está dibujado es lo que se vende.
 *
 * Lo que sí se captura aquí es lo que el croquis no puede saber: cuánto cuesta
 * cada categoría, qué incluye y con qué ícono se anuncia.
 */
@Component({
  selector: 'app-event-tab-tickets',
  standalone: true,
  imports: [
    CommonModule,
    EditableFieldComponent,
    CroquisCanvasComponent,
    CroquisTierDialogComponent,
    CroquisSummaryComponent
  ],
  host: { class: 'block' },
  template: `
    <div class="space-y-5">

      <!-- ─── AFORO Y AVANCE DE VENTA ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-cyan-500/25 border-l-4 border-l-cyan-500/70 shadow-2xl shadow-cyan-500/5 space-y-4 backdrop-blur-2xl">
        <div class="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Aforo a la venta</span>
            <span class="font-black text-on-surface text-2xl sm:text-3xl font-mono leading-tight">
              {{ capacity().toLocaleString('es-MX') }}
            </span>
            <span class="text-[11px] text-outline block">contados del croquis, no capturados a mano</span>
          </div>

          <div class="text-right">
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Vendidos</span>
            <span class="font-black text-emerald-400 text-2xl sm:text-3xl font-mono leading-tight">
              {{ occupancy() }}%
            </span>
            <span class="text-[11px] text-outline block">
              {{ sold().toLocaleString('es-MX') }} de {{ capacity().toLocaleString('es-MX') }}
            </span>
          </div>
        </div>

        <div class="h-2.5 rounded-full bg-surface-container-highest/80 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-500"
            [style.width.%]="occupancy()"
          ></div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Croquis del evento</span>
            <span class="font-black text-on-surface text-sm">{{ plans().length }} zona(s)</span>
          </div>
          <div class="p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Butacas numeradas</span>
            <span class="font-black text-on-surface text-sm">{{ seatCount().toLocaleString('es-MX') }}</span>
          </div>
          @if (canViewFinances()) {
            <div class="p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Taquilla potencial</span>
              <span class="font-black text-on-surface text-sm">{{ potential() }}</span>
            </div>
          }
          <div class="p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Cargo por servicio</span>
            <span class="font-black text-on-surface text-sm">&#36;{{ fee() }}</span>
          </div>
        </div>
      </section>

      <!-- ─── QUÉ FALTA ─── -->
      @if (issues().length) {
        <section class="p-4 sm:p-5 rounded-3xl border space-y-2.5 backdrop-blur-xl"
          [class]="errors().length
            ? 'bg-rose-500/[0.07] border-rose-500/30'
            : 'bg-amber-500/[0.06] border-amber-500/30'">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h5 class="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
              [class]="errors().length ? 'text-rose-300' : 'text-amber-300'">
              <span class="material-symbols-outlined text-[14px]">{{ errors().length ? 'error' : 'info' }}</span>
              {{ errors().length ? errors().length + ' cosa(s) impiden vender' : issues().length + ' detalle(s) por pulir' }}
            </h5>
            @if (canEdit()) {
              <button type="button" (click)="openEditor.emit(null)"
                class="px-2.5 py-1.5 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant/35 hover:border-primary/50 text-[10px] font-black transition-all flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">edit</span> Resolver en el croquis
              </button>
            }
          </div>

          <ul class="space-y-1.5">
            @for (issue of visibleIssues(); track issue.message) {
              <li class="flex items-start gap-2 text-[11px]">
                <span class="material-symbols-outlined text-[13px] shrink-0 mt-0.5"
                  [class]="issue.level === 'error' ? 'text-rose-400' : 'text-amber-400'">
                  {{ issue.level === 'error' ? 'priority_high' : 'remove' }}
                </span>
                <span class="min-w-0">
                  <span class="text-on-surface font-bold">{{ issue.message }}</span>
                  <span class="text-outline"> {{ issue.fix }}</span>
                </span>
              </li>
            }
          </ul>

          @if (issues().length > visibleIssues().length) {
            <p class="text-[10px] text-outline italic">
              y {{ issues().length - visibleIssues().length }} más.
            </p>
          }
        </section>
      }

      <!-- ─── CROQUIS DEL EVENTO ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-cyan-500/25 border-l-4 border-l-cyan-500/70 shadow-2xl shadow-cyan-500/5 space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">map</span>
            <span>Croquis del evento ({{ plans().length }})</span>
          </h5>

          @if (canEdit() && plans().length) {
            <button type="button" (click)="openEditor.emit(null)"
              class="px-3.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black text-[11px] font-black transition-all shadow-md active:scale-95 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">edit_square</span> Abrir editor
            </button>
          }
        </div>

        @if (plans().length > 1) {
          <p class="text-[11px] text-outline leading-relaxed flex items-start gap-2">
            <span class="material-symbols-outlined text-sm shrink-0 mt-0.5 text-cyan-300">layers</span>
            <span>
              Este evento tiene <strong class="text-on-surface">{{ plans().length }} zonas con croquis propio</strong>.
              El cliente las cambia con un selector y compra dentro de la que le interesa, con su propio boletaje
              y sus propios escenarios.
            </span>
          </p>
        }

        @if (plans().length) {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (plan of plans(); track plan.id) {
              <div class="rounded-3xl bg-surface-container/70 border border-outline-variant/25 overflow-hidden shadow-lg hover:border-cyan-500/40 transition-all group">
                <!-- Miniatura viva: es el mismo dibujo del editor, a escala. -->
                <button
                  type="button"
                  (click)="canEdit() ? openEditor.emit(plan.id) : null"
                  class="block w-full h-44 bg-[#141414] border-b border-outline-variant/20 relative"
                  [class.cursor-default]="!canEdit()"
                >
                  <app-croquis-canvas [plan]="plan" [tiers]="tiers()" [lineup]="lineupOptions()" mode="miniatura" />
                  @if (canEdit()) {
                    <span class="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span class="px-3 py-1.5 rounded-xl bg-primary text-black text-[11px] font-black flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">edit</span> Editar croquis
                      </span>
                    </span>
                  }
                </button>

                <div class="p-4 space-y-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-xs font-black text-on-surface truncate">{{ plan.name }}</p>
                      <p class="text-[10px] text-outline font-mono">
                        {{ capacityOf(plan).toLocaleString('es-MX') }} lugares · {{ plan.areas.length }} área(s)
                      </p>
                    </div>
                    @if (soldOf(plan) > 0) {
                      <span class="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black shrink-0">
                        {{ soldOf(plan).toLocaleString('es-MX') }} vendidos
                      </span>
                    }
                  </div>

                  @if (plan.description) {
                    <p class="text-[11px] text-on-surface-variant leading-snug line-clamp-2">{{ plan.description }}</p>
                  }

                  <div class="flex items-center gap-1.5 flex-wrap">
                    @for (stage of stagesOf(plan); track stage.id) {
                      <span class="px-2 py-0.5 rounded-lg bg-primary/12 text-primary border border-primary/25 text-[9px] font-black flex items-center gap-1">
                        <span class="material-symbols-outlined text-[11px]">theater_comedy</span>
                        {{ groupOnStage(stage.lineupSlotId) || stage.label }}
                      </span>
                    } @empty {
                      <span class="px-2 py-0.5 rounded-lg bg-rose-500/12 text-rose-300 border border-rose-500/25 text-[9px] font-black">
                        Sin escenario marcado
                      </span>
                    }
                  </div>

                  <div class="flex items-center gap-1 flex-wrap pt-1 border-t border-outline-variant/15">
                    @for (row of tiersOfPlan(plan); track row.tier.id) {
                      <span class="px-2 py-0.5 rounded-lg text-[9px] font-black border flex items-center gap-1"
                        [style.background-color]="row.tier.color + '1f'"
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
          <!-- Sin croquis: empezar por una plantilla, no por un lienzo en blanco -->
          <div class="p-5 rounded-2xl bg-surface-container/50 border border-dashed border-outline-variant/35 space-y-4">
            <div class="text-center">
              <span class="material-symbols-outlined text-3xl text-outline block mb-1">map</span>
              <p class="text-xs font-black text-on-surface">Este evento todavía no tiene croquis</p>
              <p class="text-[11px] text-outline max-w-lg mx-auto leading-relaxed mt-1">
                El croquis define qué se vende: las zonas, las butacas y a qué categoría de boleto pertenece cada
                lugar. Sin él no hay nada que poner a la venta.
              </p>
            </div>

            @if (canEdit()) {
              @if (hasLegacyZones()) {
                <button type="button" (click)="migrateLegacy()"
                  class="w-full px-3 py-3 rounded-2xl bg-primary/15 text-primary border border-primary/35 hover:bg-primary hover:text-black text-[11px] font-black transition-all flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-base">auto_awesome</span>
                  Armar el croquis con las {{ event().croquisZones.length }} zonas ya capturadas
                </button>
              }

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                @for (t of templates; track t.id) {
                  <button type="button" (click)="createFromTemplate(t.id)"
                    class="p-3 rounded-2xl bg-surface-container-high/70 border border-outline-variant/25 hover:border-cyan-500/45 text-left transition-all flex items-start gap-2.5">
                    <span class="material-symbols-outlined text-lg text-cyan-300 shrink-0">{{ t.icon }}</span>
                    <span class="min-w-0">
                      <span class="block text-[11px] font-black text-on-surface">{{ t.name }}</span>
                      <span class="block text-[10px] text-outline leading-snug">{{ t.description }}</span>
                    </span>
                  </button>
                }
              </div>
            }
          </div>
        }
      </section>

      <!-- ─── TODOS LOS NÚMEROS ─── -->
      <!-- Plegado por defecto: son datos de consulta, no de captura, y abiertos
           de fijo empujarían las categorías fuera de la primera pantalla. En un
           evento ya en venta —donde el croquis está bloqueado— es lo único que
           realmente se viene a ver aquí. -->
      @if (plans().length) {
        <section class="rounded-3xl bg-gradient-to-br from-primary/[0.05] via-surface-container-high/90 to-surface-container-high/90 border border-primary/25 border-l-4 border-l-primary/70 shadow-2xl backdrop-blur-2xl overflow-hidden">
          <button
            type="button"
            (click)="numbersOpen.set(!numbersOpen())"
            class="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left transition-colors hover:bg-surface-container/30"
          >
            <h5 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2.5 min-w-0">
              <span class="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center material-symbols-outlined text-lg shrink-0">query_stats</span>
              <span class="min-w-0">
                <span class="block truncate">Todos los números del evento</span>
                <span class="block text-[10px] font-bold normal-case tracking-normal text-outline truncate">
                  Aforo, venta y taquilla por categoría y por croquis
                </span>
              </span>
            </h5>
            <span class="material-symbols-outlined text-xl text-outline shrink-0 transition-transform"
              [class.rotate-180]="numbersOpen()">expand_more</span>
          </button>

          @if (numbersOpen()) {
            <div class="px-5 sm:px-6 pb-5 sm:pb-6">
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
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-cyan-500/25 border-l-4 border-l-cyan-500/70 shadow-2xl shadow-cyan-500/5 space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-2 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">confirmation_number</span>
            <span>Categorías de boleto ({{ tiers().length }})</span>
          </h5>
          @if (canEdit()) {
            <button type="button" (click)="addTier()"
              class="px-2.5 py-1.5 min-h-9 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[10px] font-bold flex items-center gap-1 transition-all">
              <span class="material-symbols-outlined text-[13px]">add</span> Nueva categoría
            </button>
          }
        </div>

        <p class="text-[11px] text-outline leading-relaxed flex items-start gap-2">
          <span class="material-symbols-outlined text-sm shrink-0 mt-0.5 text-cyan-300">sync</span>
          <span>
            Los lugares de cada categoría <strong class="text-on-surface">se cuentan del croquis</strong> y no se
            capturan aquí. Para cambiarlos, mueve o pinta áreas en el editor.
          </span>
        </p>

        @for (tier of tiers(); track tier.id || tier.name) {
          @let croquis = summaryOf(tier);
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <div class="flex items-center gap-2 flex-wrap min-w-0">
              <span class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border" [style.background-color]="tier.color + '33'" [style.border-color]="tier.color + '66'">
                <span class="material-symbols-outlined text-base" [style.color]="tier.color">{{ tier.icon || 'confirmation_number' }}</span>
              </span>
              <div class="flex-1 min-w-[8rem]">
                <app-editable-field
                  [value]="tier.name"
                  valueClass="text-xs font-black text-on-surface break-words"
                  [readonly]="!canEdit()"
                  (save)="patchTier(tier, { name: $event })"
                />
              </div>

              <span class="px-2 py-1 rounded-lg text-[9px] font-black border shrink-0"
                [class]="croquis.capacity > 0
                  ? 'bg-surface-container text-on-surface border-outline-variant/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'">
                {{ croquis.capacity.toLocaleString('es-MX') }} en el croquis
              </span>

              @if (tier.soldSeats > 0) {
                <span class="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black shrink-0">
                  {{ tier.soldSeats }} vendidos
                </span>
              }
              @if (canEdit()) {
                <button type="button" (click)="tierUnderEdit.set(tier); tierDialogOpen.set(true)"
                  class="w-7 h-7 rounded-lg bg-surface-container text-outline border border-outline-variant/30 hover:text-primary hover:border-primary/40 flex items-center justify-center shrink-0 transition-all"
                  title="Editar color, ícono y descripción">
                  <span class="material-symbols-outlined text-[13px]">edit</span>
                </button>
              }
              @if (canEdit() && tier.soldSeats === 0) {
                <button type="button" (click)="removeTier(tier)"
                  class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                  title="Quitar categoría">
                  <span class="material-symbols-outlined text-[13px]">delete</span>
                </button>
              }
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <app-editable-field
                label="Precio"
                type="number"
                prefix="$"
                [value]="tier.price"
                [readonly]="!canEdit()"
                (save)="patchTier(tier, { price: toNumber($event) })"
              />
              <div class="min-w-0 p-3.5 rounded-2xl bg-surface-container/70 border border-outline-variant/20">
                <span class="block text-[10px] font-black uppercase tracking-wider text-outline mb-1.5">Lugares a la venta</span>
                <span class="text-xs font-bold text-on-surface font-mono">
                  {{ croquis.capacity.toLocaleString('es-MX') }}
                </span>
                <span class="block text-[9px] text-outline mt-0.5">
                  {{ croquis.areaCount }} área(s) del croquis
                </span>
              </div>
              <div class="min-w-0 p-3.5 rounded-2xl bg-surface-container/70 border border-outline-variant/20">
                <span class="block text-[10px] font-black uppercase tracking-wider text-outline mb-1.5">Dónde se vende</span>
                <span class="text-[11px] font-bold text-on-surface break-words">
                  {{ croquis.planNames.length ? croquis.planNames.join(', ') : 'En ningún croquis' }}
                </span>
              </div>
              <app-editable-field
                label="Ícono en la ficha"
                type="select"
                [options]="iconOptions"
                [value]="tier.icon || 'confirmation_number'"
                [readonly]="!canEdit()"
                (save)="patchTier(tier, { icon: $event })"
              />
            </div>

            <app-editable-field
              label="Qué incluye esta categoría"
              hint="el cliente decide su compra con este texto"
              type="textarea"
              [rows]="2"
              placeholder="Ej. Primeras filas, acceso prioritario y bebida de cortesía."
              valueClass="text-[11px] font-medium text-on-surface-variant break-words"
              [value]="tier.description || ''"
              [readonly]="!canEdit()"
              (save)="patchTier(tier, { description: $event })"
            />

            @if (canViewFinances() && croquis.capacity > 0) {
              <p class="text-[10px] text-outline flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[12px] text-cyan-300">point_of_sale</span>
                Taquilla potencial de esta categoría:
                <strong class="text-on-surface font-mono">{{ money(croquis.capacity * (tier.price || 0)) }}</strong>
              </p>
            }
          </div>
        } @empty {
          <p class="p-6 text-center text-[11px] text-outline italic bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/30">
            Sin categorías de boleto. Sin esto las áreas del croquis no tienen precio ni color.
          </p>
        }
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
   *
   * Es explícito y no automático a propósito: la migración acomoda las zonas en
   * bandas frente al escenario y eso es una suposición, no un dato. Conviene que
   * alguien lo pida, lo vea y lo corrija, en vez de encontrarse un plano que
   * nadie dibujó.
   */
  migrateLegacy(): void {
    const plans = planFromLegacyZones(this.event());
    this.patch.emit({ croquisPlans: plans });
    this.openEditor.emit(plans[0]?.id ?? null);
  }

  /**
   * Una categoría nueva se captura completa en un diálogo, no en blanco.
   *
   * Sin precio no puede vender y sin un color distinguible el croquis se vuelve
   * una sola mancha; pedirlo todo junto evita que nazca a medias y haya que
   * perseguirla después desde el checklist.
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
   * Quita la categoría y desliga del croquis todo lo que la usaba, en un solo
   * parche: un área apuntando a una categoría borrada se seguiría viendo
   * pintada y con precio hasta que alguien abriera el editor.
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
}
