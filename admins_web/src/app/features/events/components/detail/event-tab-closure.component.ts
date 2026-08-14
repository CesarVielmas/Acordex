import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EventItem,
  EventClosureReport,
  EventExpense,
  EventPayout,
  EventManagerAgreement,
  EventManagerClosureConfirmation
} from '../../../../core/models/event.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { ProgressBarComponent } from '../../../../shared/ui/progress-bar/progress-bar.component';
import {
  allManagersConfirmedClosure,
  grossTicketRevenue,
  isClosureComplete,
  lineup,
  money,
  netResult,
  paidPayouts,
  participatingManagers,
  pendingPayoutsCount,
  potentialTicketRevenue,
  productionCost,
  slotCost,
  soldSeats,
  totalExpenses,
  totalPayouts
} from '../../event-metrics';

/**
 * Cierre del evento: los números finales y lo que se le termina pagando a cada
 * grupo.
 *
 * Los pagos a los grupos se generan desde el cartel, no se capturan a mano:
 * lo pactado ya está en el desglose de costos de cada slot, y volver a
 * teclearlo es la forma más fácil de que el expediente termine diciendo una
 * cosa y el cartel otra.
 */
@Component({
  selector: 'app-event-tab-closure',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent, ProgressBarComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">

      <!-- Estado del cierre & Sello -->
      <div class="p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap"
           [class]="complete() && allManagersConfirmed() ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="material-symbols-outlined text-lg shrink-0" [class]="complete() && allManagersConfirmed() ? 'text-emerald-400' : 'text-amber-400'">
            {{ complete() && allManagersConfirmed() ? 'fact_check' : 'pending_actions' }}
          </span>
          <div class="min-w-0">
            <p class="text-xs font-black text-on-surface">
              {{ complete() && allManagersConfirmed() ? 'Cierre completo y finiquitos confirmados por todos los managers' : 'Cierre o confirmaciones pendientes' }}
            </p>
            <p class="text-[11px] text-outline">
              @if (!complete()) {
                Falta capturar aforo real, taquilla final o liquidar pagos a los grupos.
              } @else if (!allManagersConfirmed()) {
                Se requiere la confirmación y firma de conformidad de TODOS los managers participantes antes de sellar.
              } @else {
                Todo verificado y firmado. Sellar congelará el expediente en solo lectura inmutable.
              }
            </p>
          </div>
        </div>

        @if (canEdit() && !sealed()) {
          <button
            type="button"
            (click)="seal.emit()"
            [disabled]="!complete() || !allManagersConfirmed()"
            [title]="!complete() ? 'Faltan datos del cierre' : (!allManagersConfirmed() ? 'Faltan confirmaciones de managers' : 'Cerrar y sellar expediente')"
            class="px-4 py-2.5 min-h-11 rounded-xl bg-zinc-500/20 text-zinc-200 border border-zinc-400/40 hover:bg-zinc-400 hover:text-black text-[11px] font-black flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 shadow-lg"
          >
            <span class="material-symbols-outlined text-sm">lock</span> Cerrar y sellar expediente
          </button>
        }
      </div>

      <!-- ─── REPARTO DE UTILIDADES & FIRMA DE MANAGERS ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-2xl space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h5 class="text-[10px] font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">handshake</span> Reparto de ganancias y finiquito de managers
            </h5>
            <p class="text-[11px] text-outline mt-0.5">
              {{ managers().length > 1 ? 'Co-organización: cada manager debe dar el visto bueno a su liquidación para poder cerrar.' : 'Organizador único: liquidación directa.' }}
            </p>
          </div>

          <span class="px-3 py-1 rounded-xl text-[10px] font-black border"
            [class]="allManagersConfirmed() ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'">
            {{ confirmationsCount() }} de {{ managers().length }} confirmación(es)
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          @for (m of managers(); track m) {
            @let conf = confirmationOf(m);
            @let agr = agreementOf(m);
            <div class="p-4 rounded-2xl bg-surface-container border space-y-3 shadow-md"
              [class]="conf ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-outline-variant/25'">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="w-8 h-8 rounded-xl border flex items-center justify-center material-symbols-outlined text-base shrink-0"
                    [class]="conf ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-teal-500/15 border-teal-500/30 text-teal-300'">
                    {{ conf ? 'verified' : 'account_circle' }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-xs font-black text-on-surface truncate">{{ m }}</p>
                    <p class="text-[10px] text-outline">
                      {{ agr?.role === 'organizador' ? 'Organizador principal' : 'Co-organizador' }} ·
                      {{ agr?.settlementKind === 'fijo' ? ('Monto fijo: ' + money(agr?.fixedAmount || 0)) : (agr?.percent ? (agr?.percent + '% utilidad') : '100% utilidad') }}
                    </p>
                  </div>
                </div>

                <span class="px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border shrink-0"
                  [class]="conf ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'">
                  {{ conf ? 'Confirmado' : 'Pendiente' }}
                </span>
              </div>

              <!-- Estimación de ganancia según acuerdo -->
              @if (canViewFinances()) {
                <div class="p-2.5 rounded-xl bg-surface-container-highest/60 border border-outline-variant/15 flex items-center justify-between text-xs">
                  <span class="text-outline text-[11px] font-medium">Liquidación estimada:</span>
                  <strong class="text-emerald-400 font-bold font-mono">{{ estimatedShare(agr) }}</strong>
                </div>
              }

              <!-- Estado de la firma / Botón de confirmación -->
              @if (conf) {
                <p class="text-[10px] text-emerald-300 flex items-center gap-1.5 pt-1 border-t border-outline-variant/15">
                  <span class="material-symbols-outlined text-[12px]">check_circle</span>
                  <span>Firmado el {{ conf.confirmedAt }} por {{ conf.confirmedBy || m }}</span>
                </p>
              } @else if (canEdit() && !sealed()) {
                <div class="pt-1 border-t border-outline-variant/15 flex items-center justify-end">
                  <button
                    type="button"
                    (click)="confirmManager(m)"
                    class="px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-200 border border-teal-500/40 hover:bg-teal-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1.5"
                  >
                    <span class="material-symbols-outlined text-[12px]">draw</span> Firmar y Confirmar Finiquito
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Cifras finales -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-purple-500/25 border-l-4 border-l-purple-500/70 shadow-2xl shadow-purple-500/5 space-y-4 backdrop-blur-2xl">
        <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[13px]">analytics</span> Resultados finales
        </h5>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <app-editable-field
            label="Asistencia real"
            hint="personas que entraron"
            type="number"
            [value]="closure().attendance ?? ''"
            [readonly]="!canEdit()"
            (save)="patchClosure({ attendance: toNumber($event) })"
          />
          <app-editable-field
            label="Boletos vendidos"
            type="number"
            [value]="closure().ticketsSold ?? sold()"
            [readonly]="!canEdit()"
            (save)="patchClosure({ ticketsSold: toNumber($event) })"
          />
          @if (canViewFinances()) {
            <app-editable-field
              label="Taquilla final"
              type="number"
              prefix="$"
              [value]="closure().grossRevenue ?? ticketRevenue()"
              [readonly]="!canEdit()"
              (save)="patchClosure({ grossRevenue: toNumber($event) })"
            />
          }
        </div>

        @if (canViewFinances()) {
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-outline-variant/20">
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Taquilla</span>
              <span class="text-xs font-black text-on-surface">{{ revenueLabel() }}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Gastos</span>
              <span class="text-xs font-black text-rose-300">{{ expensesLabel() }}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Pagos a grupos</span>
              <span class="text-xs font-black text-amber-300">{{ payoutsLabel() }}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Resultado</span>
              <span class="text-xs font-black" [class]="net() >= 0 ? 'text-emerald-400' : 'text-rose-400'">{{ netLabel() }}</span>
            </div>
          </div>
        }

        <app-editable-field
          label="Resumen del cierre"
          type="textarea"
          [rows]="3"
          placeholder="Cómo salió el evento, incidencias, aprendizajes…"
          valueClass="text-[11px] font-medium text-on-surface-variant break-words"
          [value]="closure().summary || ''"
          [readonly]="!canEdit()"
          (save)="patchClosure({ summary: $event })"
        />
      </section>

      <!-- Gastos de producción -->
      @if (canViewFinances()) {
        <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-purple-500/25 border-l-4 border-l-purple-500/70 shadow-2xl shadow-purple-500/5 space-y-4 backdrop-blur-2xl">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h5 class="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">receipt_long</span> Gastos de producción
            </h5>
            <span class="text-[11px] font-black text-on-surface">{{ expensesLabel() }}</span>
          </div>

          @for (expense of expenses(); track expense.id) {
            <div class="flex items-center gap-2 p-2 rounded-lg bg-surface-container border border-outline-variant/20">
              <div class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <app-editable-field
                  [value]="expense.concept"
                  valueClass="text-[11px] font-bold text-on-surface break-words"
                  [readonly]="!canEdit()"
                  (save)="patchExpense(expense, { concept: $event })"
                />
                <app-editable-field
                  type="select"
                  [options]="expenseCategories"
                  [value]="expense.category"
                  valueClass="text-[11px] font-semibold text-outline"
                  [readonly]="!canEdit()"
                  (save)="patchExpense(expense, { category: $any($event) })"
                />
                <app-editable-field
                  type="number"
                  prefix="$"
                  [value]="expense.amount"
                  valueClass="text-[11px] font-black text-rose-300 text-right block"
                  [readonly]="!canEdit()"
                  (save)="patchExpense(expense, { amount: toNumber($event) })"
                />
              </div>
              @if (canEdit()) {
                <button
                  type="button"
                  (click)="removeExpense(expense)"
                  class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                >
                  <span class="material-symbols-outlined text-[13px]">delete</span>
                </button>
              }
            </div>
          } @empty {
            <p class="text-[10px] text-outline italic">Sin gastos capturados.</p>
          }

          @if (canEdit()) {
            <button
              type="button"
              (click)="addExpense()"
              class="px-2.5 py-1.5 min-h-9 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <span class="material-symbols-outlined text-[13px]">add</span> Agregar gasto
            </button>
          }
        </section>

        <!-- Pagos a los grupos -->
        <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-purple-500/25 border-l-4 border-l-purple-500/70 shadow-2xl shadow-purple-500/5 space-y-4 backdrop-blur-2xl">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h5 class="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">payments</span> Pagos a los grupos
            </h5>
            <span class="text-[11px] text-outline">
              Pagado <strong class="text-on-surface">{{ paidLabel() }}</strong> de {{ payoutsLabel() }}
            </span>
          </div>

          <app-progress-bar
            [percent]="paidPercent()"
            [valueLabel]="pendingCount() === 0 ? 'Todos liquidados' : pendingCount() + ' pendiente(s)'"
            [colorVariant]="pendingCount() === 0 ? 'success' : 'warning'"
          />

          @for (payout of payouts(); track payout.groupId) {
            <div class="p-2.5 rounded-lg bg-surface-container border border-outline-variant/20 space-y-2">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-[11px] font-bold text-on-surface truncate min-w-0">{{ payout.groupName }}</span>
                <span [class]="payoutClass(payout.status)" class="px-2 py-0.5 rounded-lg text-[9px] font-black border shrink-0">
                  {{ payout.status }}
                </span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <app-editable-field
                  label="Pactado"
                  type="number"
                  prefix="$"
                  [value]="payout.agreedTotal"
                  [readonly]="true"
                />
                <app-editable-field
                  label="Pagado"
                  type="number"
                  prefix="$"
                  [value]="payout.paidAmount"
                  [readonly]="!canEdit()"
                  (save)="patchPayout(payout, { paidAmount: toNumber($event) })"
                />
                <app-editable-field
                  label="Fecha de pago"
                  type="date"
                  [value]="payout.paidAt || ''"
                  [readonly]="!canEdit()"
                  (save)="patchPayout(payout, { paidAt: $event })"
                />
                <app-editable-field
                  label="Referencia"
                  placeholder="TRF-00000"
                  [value]="payout.receiptReference || ''"
                  [readonly]="!canEdit()"
                  (save)="patchPayout(payout, { receiptReference: $event })"
                />
              </div>
            </div>
          } @empty {
            <p class="text-[10px] text-outline italic">
              Sin pagos generados. Se toman del desglose de costos de cada grupo del cartel.
            </p>
          }

          @if (canEdit() && missingPayouts().length > 0) {
            <button
              type="button"
              (click)="generatePayouts()"
              class="px-2.5 py-1.5 min-h-9 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-black text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <span class="material-symbols-outlined text-[13px]">auto_fix_high</span>
              Generar pagos desde el cartel ({{ missingPayouts().length }} grupo(s))
            </button>
          }
        </section>
      }
    </div>
  `
})
export class EventTabClosureComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(false);
  canViewFinances = input<boolean>(false);

  patch = output<Partial<EventItem>>();
  seal = output<void>();

  money = money;

  readonly expenseCategories: EditableOption[] = [
    { value: 'Sonido', label: 'Sonido' },
    { value: 'Recinto', label: 'Recinto' },
    { value: 'Staff', label: 'Staff' },
    { value: 'Publicidad', label: 'Publicidad' },
    { value: 'Logística', label: 'Logística' },
    { value: 'Seguridad', label: 'Seguridad' },
    { value: 'Otro', label: 'Otro' }
  ];

  closure = computed<EventClosureReport>(() => this.event().closure || { expenses: [], payouts: [] });
  expenses = computed(() => this.closure().expenses || []);
  payouts = computed(() => this.closure().payouts || []);

  sealed = computed(() => !!this.closure().isSealed);
  complete = computed(() => isClosureComplete(this.event()));

  sold = computed(() => soldSeats(this.event()));
  ticketRevenue = computed(() => grossTicketRevenue(this.event()));
  revenueLabel = computed(() => money(this.closure().grossRevenue ?? this.ticketRevenue()));
  expensesLabel = computed(() => money(totalExpenses(this.event())));
  payoutsLabel = computed(() => money(totalPayouts(this.event())));
  paidLabel = computed(() => money(paidPayouts(this.event())));
  pendingCount = computed(() => pendingPayoutsCount(this.event()));
  net = computed(() => netResult(this.event()));
  netLabel = computed(() => money(this.net()));

  paidPercent = computed(() => {
    const total = totalPayouts(this.event());
    return total > 0 ? (paidPayouts(this.event()) / total) * 100 : 0;
  });

  /** Grupos del cartel que todavía no tienen su renglón de pago. */
  missingPayouts = computed(() => {
    const already = new Set(this.payouts().map(p => p.groupId));
    return lineup(this.event()).filter(s => !already.has(s.groupId));
  });

  toNumber(value: string): number {
    return Math.max(0, Number(String(value).replace(/[^0-9.-]/g, '')) || 0);
  }

  payoutClass(status: string): string {
    switch (status) {
      case 'Pagado': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Parcial': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  }

  patchClosure(changes: Partial<EventClosureReport>): void {
    this.patch.emit({ closure: { ...this.closure(), ...changes } });
  }

  addExpense(): void {
    const expense: EventExpense = {
      id: 'ex-' + this.event().id + '-' + Date.now(),
      concept: 'Nuevo gasto',
      category: 'Otro',
      amount: 0
    };
    this.patchClosure({ expenses: [...this.expenses(), expense] });
  }

  patchExpense(expense: EventExpense, changes: Partial<EventExpense>): void {
    this.patchClosure({ expenses: this.expenses().map(x => (x.id === expense.id ? { ...x, ...changes } : x)) });
  }

  removeExpense(expense: EventExpense): void {
    this.patchClosure({ expenses: this.expenses().filter(x => x.id !== expense.id) });
  }

  /** El estatus se deduce del monto pagado: capturarlo aparte solo invita a que se contradigan. */
  patchPayout(payout: EventPayout, changes: Partial<EventPayout>): void {
    this.patchClosure({
      payouts: this.payouts().map(p => {
        if (p.groupId !== payout.groupId) return p;
        const next = { ...p, ...changes };
        const paid = next.paidAmount || 0;
        next.status = paid <= 0 ? 'Pendiente' : (paid >= next.agreedTotal ? 'Pagado' : 'Parcial');
        return next;
      })
    });
  }

  confirmManagerClosure = output<{ managerName: string }>();

  managers = computed(() => participatingManagers(this.event()));
  allManagersConfirmed = computed(() => allManagersConfirmedClosure(this.event()));
  confirmations = computed(() => this.closure().managerConfirmations || []);
  confirmationsCount = computed(() => this.confirmations().length);

  confirmationOf(managerName: string): EventManagerClosureConfirmation | undefined {
    return this.confirmations().find(c => c.managerName === managerName);
  }

  agreementOf(managerName: string): EventManagerAgreement | undefined {
    const e = this.event();
    const agrs = e.managerAgreements || [];
    return agrs.find(a => a.managerName === managerName) || (
      (e.ownerManagerName === managerName || e.createdBy === managerName)
        ? { id: 'owner', managerName, role: 'organizador', settlementKind: 'porcentaje', percent: 100, status: 'Aceptado' }
        : undefined
    );
  }

  estimatedShare(a?: EventManagerAgreement): string {
    if (!a) return '$0 MXN';
    const net = Math.max(0, this.net());
    if (a.settlementKind === 'porcentaje') {
      const share = net * ((a.percent || 0) / 100);
      return money(share);
    } else {
      return money(a.fixedAmount || 0);
    }
  }

  confirmManager(managerName: string): void {
    const existing = this.confirmations();
    if (existing.some(c => c.managerName === managerName)) return;

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newConf: EventManagerClosureConfirmation = {
      managerName,
      confirmedAt: now,
      confirmedBy: managerName
    };

    this.patchClosure({
      managerConfirmations: [...existing, newConf]
    });
  }

  generatePayouts(): void {
    const generated: EventPayout[] = this.missingPayouts().map(slot => ({
      groupId: slot.groupId,
      groupName: slot.groupName,
      agreedTotal: slotCost(slot),
      paidAmount: 0,
      status: 'Pendiente' as const
    }));
    this.patchClosure({ payouts: [...this.payouts(), ...generated] });
  }
}
