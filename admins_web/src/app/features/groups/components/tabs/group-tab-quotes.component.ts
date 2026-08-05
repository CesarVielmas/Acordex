import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote } from '../../../../core/models/admin.models';
import { quoteStateMeta } from '../../../../core/models/quote-state.meta';

@Component({
  selector: 'app-group-tab-quotes',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 text-xs select-none">

      <!-- RESUMEN DE NEGOCIO Y COTIZACIONES -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="p-4 rounded-2xl bg-[#18152a] border border-outline-variant/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Cotizaciones Totales</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ quotes().length }}</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-emerald-500/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Valor Acumulado</span>
          <span class="text-xl font-black text-emerald-400 font-mono">&#36;{{ totalValue() | number:'1.0-0' }} MXN</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-primary/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-primary block">Ticket Promedio</span>
          <span class="text-xl font-black text-on-surface font-mono">&#36;{{ avgTicket() | number:'1.0-0' }} MXN</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-amber-500/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Cotizaciones Cerradas</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ closedCount() }}</span>
        </div>
      </section>

      <!-- EXPEDIENTES Y LISTADO -->
      <section class="space-y-3.5">
        <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
          <span class="material-symbols-outlined text-base">request_quote</span> Expedientes de Cotizaciones del Grupo
        </h3>

        @if (quotes().length) {
          <div class="space-y-3">
            @for (q of quotes(); track q.id) {
              <button
                type="button"
                (click)="openQuote.emit(q)"
                class="w-full text-left p-4 rounded-3xl bg-[#18152a] border border-outline-variant/30 hover:border-primary/60 transition-all space-y-3 shadow-lg group transform hover:-translate-y-0.5"
              >
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <span class="font-black text-primary text-xs font-mono tracking-wider">{{ q.id }}</span>
                  <span class="px-3 py-1 rounded-xl text-[10px] font-black border shadow-sm" [class]="stateBadge(q)">
                    {{ q.state }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div class="min-w-0">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Cliente & Empresa</span>
                    <span class="font-black text-on-surface truncate block font-display-md group-hover:text-primary transition-colors">{{ q.clientName }}</span>
                    <span class="text-outline truncate block font-medium text-[11px]">{{ q.clientCompany }}</span>
                  </div>
                  <div class="min-w-0">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Fecha & Sede</span>
                    <span class="font-black text-on-surface font-mono text-xs">{{ q.proposedDate }}</span>
                    <span class="text-outline truncate block font-medium text-[11px]">{{ q.venue }}</span>
                  </div>
                  <div class="min-w-0">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Monto Cotizado</span>
                    <span class="font-black text-emerald-400 text-base font-mono">&#36;{{ q.totalAmount | number:'1.0-0' }} MXN</span>
                    <span class="text-outline block font-medium text-[11px]">{{ q.paymentStatus }}</span>
                  </div>
                </div>

                <div class="pt-2 border-t border-outline-variant/20 flex items-center justify-end">
                  <span class="text-xs font-black text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Abrir Expediente Completo <span class="material-symbols-outlined text-sm">open_in_new</span>
                  </span>
                </div>
              </button>
            }
          </div>
        } @else {
          <p class="p-6 text-center text-xs text-outline italic bg-[#18152a] rounded-3xl border border-dashed border-outline-variant/30">
            Este grupo todavía no tiene cotizaciones registradas en el sistema.
          </p>
        }
      </section>

    </div>
  `
})
export class GroupTabQuotesComponent {
  quotes = input.required<Quote[]>();
  openQuote = output<Quote>();

  totalValue = computed(() => this.quotes().reduce((s, q) => s + q.totalAmount, 0));

  avgTicket = computed(() => {
    const list = this.quotes();
    return list.length ? this.totalValue() / list.length : 0;
  });

  closedCount = computed(() =>
    this.quotes().filter(q => q.state === 'Finalizada' || q.state === 'Contrato firmado').length
  );

  stateBadge(q: Quote): string {
    return quoteStateMeta(q.state).badgeClass;
  }
}
