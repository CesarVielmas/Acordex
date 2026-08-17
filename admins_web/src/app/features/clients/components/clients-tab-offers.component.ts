import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientItem } from '../../../core/models/admin.models';

interface FlatOffer {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  date: string;
  discountPercent: number;
  details: string;
  suggestedGroupName?: string;
  status: 'Enviada' | 'Aceptada' | 'Expirada';
}

/**
 * Pestaña 4: Centro de Ofertas Especiales & Campañas CRM.
 */
@Component({
  selector: 'app-clients-tab-offers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              local_offer
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">Propuestas Comerciales Preferenciales & Fidelización</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Campañas de venta cruzada, paquetes para festivales/palenques y condiciones preferenciales para promotores recurrentes</p>
        </div>
      </div>

      <!-- ─── 1. SUGERENCIAS INTELIGENTES DE RE-CONTACTO CRM ─── -->
      <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-4">
        <h3 class="text-sm font-black text-on-surface flex items-center gap-2 font-['Epilogue']">
          <span class="material-symbols-outlined text-primary">auto_awesome</span>
          Oportunidades de Re-Contacto para Promotores & Patronatos
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-2 shadow-sm">
            <div class="flex justify-between items-center">
              <span class="font-bold text-on-surface font-['Epilogue']">Patronato Feria San Marcos</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">Temporada 2027</span>
            </div>
            <p class="text-outline leading-relaxed font-['Epilogue']">
              El patronato suele apartar fechas para el Palenque con 6 meses de anticipación. Es momento de formalizar la disponibilidad de Los Elegantes del Norte y Grupo Fuego Norteño.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-2 shadow-sm">
            <div class="flex justify-between items-center">
              <span class="font-bold text-on-surface font-['Epilogue']">Promociones del Norte (Roberto Gómez)</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-purple-950/40 text-purple-300 border border-purple-500/30">Gira Fiestas Patrias</span>
            </div>
            <p class="text-outline leading-relaxed font-['Epilogue']">
              Cliente Diamante con alta probabilidad de formalizar paquete doble (Monterrey + Saltillo). Otorgar bonificación del 10% en costos de producción técnica de la segunda fecha.
            </p>
          </div>
        </div>
      </div>

      <!-- ─── 2. HISTORIAL DE OFERTAS DESPACHADAS ─── -->
      <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-4">
        <h3 class="text-sm font-black text-on-surface flex items-center gap-2 border-b border-white/10 pb-3 font-['Epilogue']">
          <span class="material-symbols-outlined text-emerald-400 text-base">outgoing_mail</span>
          Historial de Propuestas Preferenciales Despachadas
        </h3>

        <div class="space-y-3">
          @for (off of allOffers(); track off.id) {
            <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                    {{ off.discountPercent }}% Bonificación
                  </span>
                  <h4 class="text-xs font-black text-on-surface font-['Epilogue']">{{ off.clientName }} ({{ off.clientCompany }})</h4>
                </div>
                <p class="text-xs text-outline font-['Epilogue']">{{ off.details }}</p>
              </div>

              <div class="flex items-center gap-3 font-mono text-xs shrink-0 self-end sm:self-auto">
                <span class="text-outline text-[11px]">{{ off.date }}</span>
                <span class="px-2.5 py-1 rounded-xl text-xs font-bold font-sans font-['Epilogue']"
                  [class]="off.status === 'Aceptada' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-primary/15 text-primary border border-primary/30'">
                  {{ off.status }}
                </span>
              </div>
            </div>
          } @empty {
            <div class="text-center py-8 text-outline text-xs italic font-['Epilogue']">
              No se han enviado ofertas especiales recientemente.
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class ClientsTabOffersComponent {
  clients = input<ClientItem[]>([]);
  sendOffer = output<ClientItem>();

  allOffers(): FlatOffer[] {
    const list: FlatOffer[] = [];
    for (const c of this.clients()) {
      for (const off of c.offersSent || []) {
        list.push({
          id: off.id,
          clientId: c.id,
          clientName: c.name,
          clientCompany: c.company,
          date: off.date,
          discountPercent: off.discountPercent,
          details: off.details,
          suggestedGroupName: off.suggestedGroupName,
          status: off.status
        });
      }
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }
}
