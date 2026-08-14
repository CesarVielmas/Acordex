import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventFieldProposal } from '../../../core/models/event.models';

/**
 * Los cambios que otros managers proponen sobre un dato, para que su encargado
 * elija.
 *
 * Se pintan siempre en lista aunque haya uno solo. Cuando hay dos o tres —que es
 * lo que pasa cuando varias disqueras se impacientan con el mismo dato— lo único
 * que sirve es verlas juntas, con lo que decía antes al lado, porque la decisión
 * no es "¿acepto este?" sino "¿cuál de estos?". Aceptar uno descarta a los
 * demás, y por eso no pueden llegar de uno en uno.
 */
@Component({
  selector: 'app-field-proposals',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (proposals().length) {
      <div class="mt-2.5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/30 overflow-hidden">
        <div class="px-3 py-2 flex items-center justify-between gap-2 border-b border-amber-500/20 bg-amber-500/[0.06]">
          <span class="text-[9px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">rate_review</span>
            {{ proposals().length === 1 ? 'Un cambio propuesto' : proposals().length + ' cambios propuestos' }}
          </span>
          @if (canDecide()) {
            <span class="text-[9px] text-amber-200/70 font-bold">
              {{ proposals().length > 1 ? 'Solo puede quedar uno' : 'Tú decides' }}
            </span>
          } @else {
            <span class="text-[9px] text-outline font-bold">Decide {{ owner() }}</span>
          }
        </div>

        <div class="divide-y divide-amber-500/10">
          @for (p of proposals(); track p.id) {
            <div class="px-3 py-2.5 flex items-center justify-between gap-3">
              <div class="min-w-0 space-y-0.5">
                <div class="flex items-center gap-1.5 text-[11px] min-w-0">
                  @if (p.previousLabel) {
                    <span class="text-outline line-through truncate max-w-[9rem]">{{ p.previousLabel }}</span>
                    <span class="material-symbols-outlined text-[12px] text-amber-400 shrink-0">arrow_forward</span>
                  }
                  <span class="font-bold text-amber-100 truncate">{{ p.proposedLabel }}</span>
                </div>
                <span class="block text-[9px] text-amber-200/60">
                  {{ p.fieldLabel }} · {{ p.proposedBy.name }} ({{ p.proposedBy.managerName }}) · {{ p.proposedAt }}
                </span>
              </div>

              @if (canDecide()) {
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button" (click)="accept.emit(p.id)"
                    title="Aplicar esta versión al expediente"
                    class="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500 hover:text-black flex items-center justify-center transition-all active:scale-95"
                  ><span class="material-symbols-outlined text-[15px]">check</span></button>
                  <button
                    type="button" (click)="reject.emit(p.id)"
                    title="Descartar esta propuesta"
                    class="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all active:scale-95"
                  ><span class="material-symbols-outlined text-[15px]">close</span></button>
                </div>
              } @else {
                <span class="px-2 py-0.5 rounded-md bg-white/5 text-outline text-[9px] font-black uppercase tracking-wider shrink-0 border border-white/10">
                  En revisión
                </span>
              }
            </div>
          }
        </div>
      </div>
    }
  `
})
export class FieldProposalsComponent {
  readonly proposals = input<EventFieldProposal[]>([]);
  /** Si quien mira es el encargado del dato y por tanto quien decide. */
  readonly canDecide = input<boolean>(false);
  readonly owner = input<string>('su encargado');

  readonly accept = output<string>();
  readonly reject = output<string>();
}
