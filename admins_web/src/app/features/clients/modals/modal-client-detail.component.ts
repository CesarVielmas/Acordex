import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientItem, Quote } from '../../../core/models/admin.models';
import { money } from '../../finances/finance-metrics';
import { getTierBadgeClass, getSegmentBadgeClass, getClientStatusBadgeClass } from '../client-metrics';

/**
 * Modal de Expediente 360° del Cliente CRM.
 */
@Component({
  selector: 'app-modal-client-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-3xl rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 sm:p-7 space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">

        <!-- Encabezado con Avatar y Badges -->
        <div class="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary font-black font-mono text-xl shrink-0">
              {{ client().name.charAt(0) }}
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-container-highest text-outline border border-outline-variant/30">
                  {{ client().id }}
                </span>
                @if (client().tier) {
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border" [class]="getTierBadgeClass(client().tier)">
                    {{ client().tier }}
                  </span>
                }
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase" [class]="getClientStatusBadgeClass(client().status)">
                  {{ client().status }}
                </span>
              </div>

              <h3 class="text-base sm:text-lg font-black text-on-surface truncate mt-1">
                {{ client().name }}
              </h3>
              <p class="text-xs text-outline truncate">{{ client().company }} · {{ client().city }}, {{ client().state }}</p>
            </div>
          </div>

          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Métricas Principales Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center text-xs">
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] font-sans text-outline uppercase block">Eventos Hechos</span>
            <span class="text-sm font-black text-on-surface">{{ client().totalEvents }} Fechas</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
            <span class="text-[9px] font-sans text-emerald-400 uppercase block font-bold">Inversión Total</span>
            <span class="text-sm font-black text-emerald-300">{{ money(client().totalSpent) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] font-sans text-outline uppercase block">Ticket Promedio</span>
            <span class="text-sm font-black text-purple-300">{{ money(client().averageTicket || (client().totalEvents > 0 ? client().totalSpent / client().totalEvents : 0)) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] font-sans text-outline uppercase block">Rating</span>
            <span class="text-sm font-black text-amber-400">{{ client().rating || 5 }}.0 ★</span>
          </div>
        </div>

        <!-- Datos de Contacto y Facturación -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

          <!-- Contacto Directo -->
          <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
            <h4 class="font-bold text-on-surface flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-base">contact_mail</span>
              Contacto Directo
            </h4>
            <div class="space-y-1 text-[11px]">
              <p class="text-outline">Email: <b class="text-on-surface">{{ client().email }}</b></p>
              <p class="text-outline">Teléfono: <b class="text-on-surface font-mono">{{ client().phone }}</b></p>
              <p class="text-outline">Segmento: <b class="text-on-surface">{{ client().segment || 'General' }}</b></p>
            </div>
            @if (client().whatsapp) {
              <div class="pt-1">
                <a
                  [href]="'https://wa.me/' + client().whatsapp!.replace('+', '').replace(' ', '')"
                  target="_blank"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all"
                >
                  <span class="material-symbols-outlined text-sm">chat</span> Abrir WhatsApp
                </a>
              </div>
            }
          </div>

          <!-- Datos Fiscales (RFC) -->
          <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
            <h4 class="font-bold text-on-surface flex items-center gap-1.5">
              <span class="material-symbols-outlined text-cyan-400 text-base">receipt_long</span>
              Datos Fiscales de Facturación
            </h4>
            @if (client().taxInfo?.rfc) {
              <div class="space-y-1 text-[11px]">
                <p class="text-outline">RFC: <b class="text-cyan-300 font-mono">{{ client().taxInfo?.rfc }}</b></p>
                <p class="text-outline">Régimen: <b class="text-on-surface">{{ client().taxInfo?.taxRegime }}</b></p>
                <p class="text-outline truncate">Dirección: <b class="text-on-surface">{{ client().taxInfo?.billingAddress }}</b></p>
              </div>
            } @else {
              <p class="text-[11px] text-outline italic">Sin datos fiscales capturados (Particular).</p>
            }
          </div>

        </div>

        <!-- Notas de Servicio -->
        @if (client().notes) {
          <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-1 text-xs">
            <span class="text-[10px] text-outline font-bold uppercase block">Notas y Hábitos de Contratación</span>
            <p class="text-on-surface leading-relaxed">{{ client().notes }}</p>
          </div>
        }

        <!-- Historial de Cotizaciones Cruzadas -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3 text-xs">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-on-surface flex items-center gap-1.5">
              <span class="material-symbols-outlined text-purple-400 text-base">request_quote</span>
              Cotizaciones Registradas en Acordex
            </h4>
            <span class="text-[10px] font-mono text-outline">{{ clientQuotes().length }} expedientes</span>
          </div>

          <div class="space-y-2">
            @for (q of clientQuotes(); track q.id) {
              <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="min-w-0 space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-primary">{{ q.id }}</span>
                    <span class="font-bold text-on-surface">{{ q.eventType }}</span>
                  </div>
                  <p class="text-[11px] text-outline">{{ q.groupName }} · {{ q.proposedDate }}</p>
                </div>

                <div class="flex items-center gap-3 font-mono self-end sm:self-auto">
                  <span class="font-black text-emerald-300">{{ money(q.totalAmount) }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold font-sans bg-surface-container-highest text-on-surface border border-outline-variant/30">
                    {{ q.state }}
                  </span>
                </div>
              </div>
            } @empty {
              <p class="text-[11px] text-outline italic">No hay cotizaciones registradas con el nombre de este cliente.</p>
            }
          </div>
        </div>

        <!-- Bitácora de Interacciones CRM -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3 text-xs">
          <h4 class="font-bold text-on-surface flex items-center gap-1.5">
            <span class="material-symbols-outlined text-cyan-400 text-base">chat</span>
            Bitácora de Seguimiento & Llamadas
          </h4>

          <div class="space-y-2 max-h-44 overflow-y-auto pr-1">
            @for (int of client().interactions || []; track int.id) {
              <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                <div class="flex justify-between items-center text-[10px]">
                  <span class="font-bold text-primary uppercase">{{ int.type }}</span>
                  <span class="text-outline font-mono">{{ int.date }} · Atendió: {{ int.authorName }}</span>
                </div>
                <p class="text-[11px] text-on-surface">{{ int.summary }}</p>
              </div>
            } @empty {
              <p class="text-[11px] text-outline italic">No hay interacciones registradas aún.</p>
            }
          </div>

          <!-- Input para agregar nota rápida -->
          <div class="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
            <input
              type="text"
              [(ngModel)]="newInteractionText"
              (keyup.enter)="submitNote()"
              placeholder="Registrar nota de llamada o mensaje..."
              class="flex-1 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              (click)="submitNote()"
              [disabled]="!newInteractionText.trim()"
              class="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span class="material-symbols-outlined text-sm">send</span> Guardar
            </button>
          </div>
        </div>

        <!-- Footer con Acciones -->
        <div class="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/20 text-xs">
          <button
            type="button"
            (click)="delete.emit(client().id)"
            class="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">delete</span>
            Eliminar Cliente
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="sendOffer.emit(client())"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span class="material-symbols-outlined text-sm">local_offer</span>
              Enviar Oferta
            </button>

            <button
              type="button"
              (click)="edit.emit(client())"
              class="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span class="material-symbols-outlined text-base">edit</span>
              Editar
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ModalClientDetailComponent {
  client = input.required<ClientItem>();
  allQuotes = input<Quote[]>([]);

  closed = output<void>();
  edit = output<ClientItem>();
  delete = output<string>();
  sendOffer = output<ClientItem>();
  addInteraction = output<{ clientId: string; type: any; summary: string; authorName: string }>();

  newInteractionText = '';

  clientQuotes(): Quote[] {
    const cName = this.client().name.toLowerCase();
    const cComp = (this.client().company || '').toLowerCase();
    return this.allQuotes().filter(q => {
      const qCli = (q.clientName || '').toLowerCase();
      const qComp = (q.clientCompany || '').toLowerCase();
      return qCli.includes(cName) || cName.includes(qCli) || (cComp && qComp && (qComp.includes(cComp) || cComp.includes(qComp)));
    });
  }

  submitNote(): void {
    if (!this.newInteractionText.trim()) return;
    this.addInteraction.emit({
      clientId: this.client().id,
      type: 'nota',
      summary: this.newInteractionText.trim(),
      authorName: 'Lic. Claudia Morales'
    });
    this.newInteractionText = '';
  }

  money = money;
  getTierBadgeClass = getTierBadgeClass;
  getSegmentBadgeClass = getSegmentBadgeClass;
  getClientStatusBadgeClass = getClientStatusBadgeClass;
}
