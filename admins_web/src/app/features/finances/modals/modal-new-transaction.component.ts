import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceAccount, FinanceCategory, FinanceTransactionType } from '../../../core/models/finance.models';

/**
 * Modal para registrar un nuevo movimiento de tesorería (Ingreso o Egreso extraordinario).
 */
@Component({
  selector: 'app-modal-new-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-lg rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-2xl bg-primary/20 text-primary flex items-center justify-center material-symbols-outlined text-xl">
              add_card
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface">Registrar Movimiento de Tesorería</h3>
              <p class="text-[11px] text-outline">Captura de ingresos y egresos para el libro diario</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Formulario -->
        <div class="space-y-4 text-xs">

          <!-- Tipo (Ingreso / Egreso) -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1">Tipo de Movimiento</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="type.set('ingreso')"
                class="py-2.5 rounded-xl font-bold border transition-all text-center"
                [class]="type() === 'ingreso'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md'
                  : 'bg-surface-container-high border-outline-variant/30 text-outline hover:text-on-surface'"
              >
                + Ingreso a Caja / Banco
              </button>
              <button
                type="button"
                (click)="type.set('egreso')"
                class="py-2.5 rounded-xl font-bold border transition-all text-center"
                [class]="type() === 'egreso'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md'
                  : 'bg-surface-container-high border-outline-variant/30 text-outline hover:text-on-surface'"
              >
                - Egreso / Gasto
              </button>
            </div>
          </div>

          <!-- Monto y Fecha -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-outline uppercase text-[10px] block mb-1">Monto (MXN)</label>
              <input
                type="number"
                [ngModel]="amount()"
                (ngModelChange)="amount.set($event)"
                placeholder="0.00"
                class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-on-surface font-mono font-bold focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label class="font-bold text-outline uppercase text-[10px] block mb-1">Fecha</label>
              <input
                type="date"
                [ngModel]="date()"
                (ngModelChange)="date.set($event)"
                class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-on-surface font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <!-- Categoría -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1">Categoría Contable</label>
            <select
              [ngModel]="category()"
              (ngModelChange)="category.set($event)"
              class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            >
              @if (type() === 'ingreso') {
                <option value="taquilla_evento">Taquilla de Evento Masivo</option>
                <option value="anticipo_cotizacion">Anticipo de Cotización / Show</option>
                <option value="contrato_privado">Liquidación Contrato Privado</option>
                <option value="patrocinio">Patrocinio Comercial</option>
                <option value="concesion_barra">Concesión de Barra / Alimentos</option>
                <option value="otro_ingreso">Otro Ingreso Extraordinario</option>
              } @else {
                <option value="honorarios_artistas">Honorarios / Caché de Artista</option>
                <option value="produccion_audio">Producción, Audio & Escenario</option>
                <option value="renta_recinto">Renta de Recinto / Palenque</option>
                <option value="viaticos_logistica">Viáticos, Vuelos & Hospedaje</option>
                <option value="seguridad_vallas">Seguridad Privada & Vallas</option>
                <option value="marketing_prensa">Marketing, Medios & Prensa</option>
                <option value="permisos_impuestos">Permisos Municipales & Protección Civil</option>
                <option value="finiquito_manager">Finiquito a Manager Co-organizador</option>
                <option value="otro_egreso">Otro Egreso Operativo</option>
              }
            </select>
          </div>

          <!-- Cuenta Bancaria Receptora -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1">Cuenta Bancaria Receptora / Origen</label>
            <select
              [ngModel]="accountId()"
              (ngModelChange)="accountId.set($event)"
              class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            >
              @for (acc of accounts(); track acc.id) {
                <option [value]="acc.id">{{ acc.name }} ({{ acc.bankName }})</option>
              }
            </select>
          </div>

          <!-- Concepto -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1">Concepto Detallado</label>
            <input
              type="text"
              [ngModel]="concept()"
              (ngModelChange)="concept.set($event)"
              placeholder="Ej. Anticipo por renta de generador diésel para Lienzo Charro..."
              class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <!-- Referencia SPEI / Factura -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1">Referencia SPEI / Factura / Folio</label>
            <input
              type="text"
              [ngModel]="reference()"
              (ngModelChange)="reference.set($event)"
              placeholder="Ej. SPEI-992182 o FAC-A409"
              class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-on-surface font-mono focus:outline-none focus:border-primary"
            />
          </div>

        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-surface-container-high text-outline text-xs font-bold hover:text-on-surface"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="save()"
            [disabled]="!isValid()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary text-xs font-black shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            Guardar Movimiento
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalNewTransactionComponent {
  accounts = input.required<FinanceAccount[]>();

  closed = output<void>();
  saved = output<{
    type: FinanceTransactionType;
    category: FinanceCategory;
    concept: string;
    amount: number;
    date: string;
    accountId: string;
    accountName: string;
    status: 'conciliado' | 'pendiente';
    receiptReference?: string;
  }>();

  type = signal<FinanceTransactionType>('ingreso');
  amount = signal<number | null>(null);
  date = signal<string>(new Date().toISOString().slice(0, 10));
  category = signal<FinanceCategory>('taquilla_evento');
  accountId = signal<string>('card-bbva-01');
  concept = signal<string>('');
  reference = signal<string>('');

  isValid(): boolean {
    return !!(this.amount() && this.amount()! > 0 && this.concept().trim().length > 3);
  }

  save(): void {
    if (!this.isValid()) return;
    const acc = this.accounts().find(a => a.id === this.accountId()) || this.accounts()[0];

    this.saved.emit({
      type: this.type(),
      category: this.category(),
      concept: this.concept().trim(),
      amount: this.amount()!,
      date: this.date(),
      accountId: acc.id,
      accountName: acc.name,
      status: 'conciliado',
      receiptReference: this.reference().trim() || undefined
    });
  }
}
