import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EventItem,
  EventClosureReport,
  EventExpense,
  EventPayout
} from '../../../../core/models/event.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { ProgressBarComponent } from '../../../../shared/ui/progress-bar/progress-bar.component';
import {
  grossTicketRevenue,
  isClosureComplete,
  lineup,
  money,
  netResult,
  paidPayouts,
  pendingPayoutsCount,
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

      <!-- Estado del cierre -->
      <div class="p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap"
           [class]="complete() ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="material-symbols-outlined text-lg shrink-0" [class]="complete() ? 'text-emerald-400' : 'text-amber-400'">
            {{ complete() ? 'fact_check' : 'pending_actions' }}
          </span>
          <div class="min-w-0">
            <p class="text-xs font-black text-on-surface">
              {{ complete() ? 'Cierre completo, listo para sellar' : 'Cierre incompleto' }}
            </p>
            <p class="text-[11px] text-outline">
              {{ complete()
                ? 'Aforo, taquilla y pagos capturados. Sellar deja el expediente en solo lectura para siempre.'
                : 'Faltan aforo real, taquilla final o liquidar a algún grupo.' }}
            </p>
          </div>
        </div>

        @if (canEdit() && !sealed()) {
          <button
            type="button"
            (click)="seal.emit()"
            [disabled]="!complete()"
            class="px-4 py-2.5 min-h-11 rounded-xl bg-zinc-500/20 text-zinc-200 border border-zinc-400/40 hover:bg-zinc-400 hover:text-black text-[11px] font-black flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
          >
            <span class="material-symbols-outlined text-sm">lock</span> Cerrar y sellar expediente
          </button>
        }
      </div>

      <!-- Cifras finales -->
      <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
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
        <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
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
        <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
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
