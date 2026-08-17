import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientItem, GroupItem } from '../../../core/models/admin.models';

/**
 * Modal de Despacho de Oferta Especial CRM.
 */
@Component({
  selector: 'app-modal-send-offer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-lg rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              local_offer
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface font-['Epilogue']">Despacho de Propuesta Comercial Preferencial</h3>
              <p class="text-xs text-outline font-['Epilogue']">Generación de propuesta con bonificación y condiciones para promotor</p>
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

        <!-- Banner del Cliente Destinatario -->
        <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 flex items-center gap-3 text-xs shadow-inner">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-black flex items-center justify-center font-mono border border-primary/30 shadow-sm">
            {{ client().name.charAt(0) }}
          </div>
          <div>
            <h4 class="font-bold text-on-surface font-['Epilogue']">{{ client().name }}</h4>
            <p class="text-outline font-['Epilogue']">{{ client().company }} · {{ client().email }}</p>
          </div>
        </div>

        <!-- Formulario de Oferta -->
        <div class="space-y-3.5 text-xs">

          <!-- 1. PORCENTAJE DE DESCUENTO -->
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface font-['Epilogue']">Bonificación Comercial / Descuento</label>
            <select
              [(ngModel)]="formDiscountPercent"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
            >
              <option value="5">5% - Bonificación Cuenta Recurrente</option>
              <option value="10">10% - Promoción Especial de Temporada Alta</option>
              <option value="15">15% - Paquete 2 Fechas Consecutivas Regionales</option>
              <option value="20">20% - Contratación Anticipada Anual</option>
            </select>
          </div>

          <!-- 2. GRUPO SUGERIDO -->
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface font-['Epilogue']">Agrupación Musical Promocionada</label>
            <select
              [(ngModel)]="formSuggestedGroup"
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
            >
              <option value="">Cualquier elenco del catálogo Acordex...</option>
              @for (g of groups(); track g.id) {
                <option [value]="g.name">{{ g.name }} ({{ g.genre }})</option>
              }
            </select>
          </div>

          <!-- 3. MENSAJE Y CONDICIONES -->
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface font-['Epilogue']">Especificaciones de la Propuesta & Condiciones</label>
            <textarea
              [(ngModel)]="formDetails"
              rows="3"
              placeholder="Detalla las condiciones especiales, vigencia de la oferta y beneficios del paquete..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
            ></textarea>
          </div>

        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10 text-xs">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-[#222222] hover:bg-[#282828] text-outline hover:text-on-surface font-bold transition-all cursor-pointer font-['Epilogue']"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="dispatchOffer()"
            [disabled]="!formDetails.trim()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-black shadow-md hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">send</span>
            Enviar Propuesta
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalSendOfferComponent {
  client = input.required<ClientItem>();
  groups = input<GroupItem[]>([]);

  sent = output<{ clientId: string; discountPercent: number; details: string; suggestedGroupName?: string }>();
  closed = output<void>();

  formDiscountPercent = '10';
  formSuggestedGroup = '';
  formDetails = 'Propuesta comercial preferencial con paquete de audio y viáticos incluidos para fecha en fin de semana.';

  ngOnInit(): void {
    if (this.client().preferredArtists && this.client().preferredArtists!.length > 0) {
      this.formSuggestedGroup = this.client().preferredArtists![0];
    }
  }

  dispatchOffer(): void {
    if (!this.formDetails.trim()) return;
    this.sent.emit({
      clientId: this.client().id,
      discountPercent: Number(this.formDiscountPercent),
      details: this.formDetails.trim(),
      suggestedGroupName: this.formSuggestedGroup || undefined
    });
  }
}
