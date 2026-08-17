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
  template: `    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-lg rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-2xl bg-primary/20 text-primary flex items-center justify-center material-symbols-outlined text-xl shadow-inner">
              add_card
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface font-['Epilogue']">Registrar Movimiento Contable</h3>
              <p class="text-[11px] text-outline font-['Epilogue']">Asiento contable de tesorería para el libro diario</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-[#222222] text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Formulario -->
        <div class="space-y-4 text-xs">

          <!-- Tipo (Ingreso / Egreso) -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Naturaleza del Movimiento</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="type.set('ingreso')"
                class="py-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer font-['Epilogue']"
                [class]="type() === 'ingreso'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md'
                  : 'bg-[#141414] border-white/10 text-outline hover:text-on-surface'"
              >
                + Ingreso a Caja / Banco
              </button>
              <button
                type="button"
                (click)="type.set('egreso')"
                class="py-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer font-['Epilogue']"
                [class]="type() === 'egreso'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md'
                  : 'bg-[#141414] border-white/10 text-outline hover:text-on-surface'"
              >
                - Egreso / Liquidación
              </button>
            </div>
          </div>

          <!-- Monto y Fecha -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Monto (MXN)</label>
              <input
                type="number"
                [ngModel]="amount()"
                (ngModelChange)="amount.set($event)"
                placeholder="0.00"
                class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface font-mono font-bold focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Fecha Contable</label>
              <input
                type="date"
                [ngModel]="date()"
                (ngModelChange)="date.set($event)"
                class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <!-- Categoría -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Categoría Contable</label>
            <select
              [ngModel]="category()"
              (ngModelChange)="category.set($event)"
              class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            >
              @if (type() === 'ingreso') {
                <option value="taquilla_evento">Taquilla de Evento Masivo</option>
                <option value="anticipo_cotizacion">Anticipo de Cotización Privada</option>
                <option value="finiquito_cotizacion">Liquidación Final de Contratación</option>
                <option value="patrocinio_marca">Patrocinio / Marca Comercial</option>
                <option value="concesion_barras">Concesión de Barras y Bebidas</option>
                <option value="otro_ingreso">Otros Ingresos Extraordinarios</option>
              } @else {
                <option value="honorarios_artista">Honorarios / Caché de Artista</option>
                <option value="produccion_audio">Producción, Audio & Escenario</option>
                <option value="recinto_venue">Renta de Recinto / Palenque</option>
                <option value="viaticos_hospedaje">Viáticos, Vuelos & Hospedaje</option>
                <option value="marketing_pauta">Publicidad & Campañas de Prensa</option>
                <option value="seguridad_permisos">Permisos Municipales & Protección Civil</option>
                <option value="reparto_manager">Liquidación a Co-productor / Manager</option>
                <option value="otro_egreso">Otros Gastos Operativos</option>
              }
            </select>
          </div>

          <!-- Concepto -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Concepto / Glosa</label>
            <input
              type="text"
              [ngModel]="concept()"
              (ngModelChange)="concept.set($event)"
              placeholder="Ej. Liquidación de rider de sonido para Palenque..."
              class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <!-- Cuenta Bancaria -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Cuenta Bancaria / Caja</label>
            <select
              [ngModel]="accountId()"
              (ngModelChange)="accountId.set($event)"
              class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            >
              @for (acc of accounts(); track acc.id) {
                <option [value]="acc.id">{{ acc.name }} ({{ acc.bankName }})</option>
              }
            </select>
          </div>

          <!-- Referencia SPEI -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Folio / Referencia SPEI (Opcional)</label>
            <input
              type="text"
              [ngModel]="reference()"
              (ngModelChange)="reference.set($event)"
              placeholder="Ej. SPEI-BNTE-881920"
              class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface font-mono focus:outline-none focus:border-primary"
            />
          </div>

        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-[#222222] text-outline text-xs font-bold hover:text-on-surface cursor-pointer font-['Epilogue']"
          >
            Cancelar
          </button>
          <button
            type="button"
            [disabled]="!isValid()"
            (click)="save()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary text-xs font-black shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-sm">save</span>
            Guardar Asiento
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
