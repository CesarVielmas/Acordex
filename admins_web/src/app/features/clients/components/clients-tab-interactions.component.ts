import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientItem } from '../../../core/models/admin.models';

interface FlatInteraction {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  date: string;
  type: 'llamada' | 'whatsapp' | 'reunion' | 'cotizacion' | 'oferta' | 'nota';
  summary: string;
  authorName: string;
}

/**
 * Pestaña 3: Bitácora de Seguimiento & Interacciones CRM.
 */
@Component({
  selector: 'app-clients-tab-interactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              chat
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">Bitácora de Interacciones & Seguimiento Comercial</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Registro cronológico de llamadas de prospección, negociaciones vía WhatsApp, reuniones ejecutivas y acuerdos de contratación</p>
        </div>

        <button
          type="button"
          (click)="showNewInteractionForm.set(!showNewInteractionForm())"
          class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-lg shadow-primary/20 font-['Epilogue']"
        >
          <span class="material-symbols-outlined text-base">add_comment</span>
          Registrar Interacción
        </button>
      </div>

      <!-- FORMULARIO RÁPIDO DE NUEVA INTERACCIÓN -->
      @if (showNewInteractionForm()) {
        <div class="p-6 rounded-3xl bg-[#181818] border border-primary/40 shadow-2xl space-y-4 animate-fade-in">
          <h3 class="text-sm font-black text-on-surface flex items-center gap-2 font-['Epilogue']">
            <span class="material-symbols-outlined text-primary">add_circle</span>
            Nueva Entrada en Bitácora de Atención Comercial
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div class="space-y-1">
              <label class="font-bold text-on-surface font-['Epilogue']">Cliente / Titular</label>
              <select
                [(ngModel)]="newFormClientId"
                class="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue'] shadow-inner"
              >
                <option value="">Selecciona un cliente...</option>
                @for (cli of clients(); track cli.id) {
                  <option [value]="cli.id">{{ cli.name }} ({{ cli.company }})</option>
                }
              </select>
            </div>

            <div class="space-y-1">
              <label class="font-bold text-on-surface font-['Epilogue']">Canal de Contacto</label>
              <select
                [(ngModel)]="newFormType"
                class="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue'] shadow-inner"
              >
                <option value="whatsapp">📱 Mensaje de WhatsApp</option>
                <option value="llamada">📞 Llamada Telefónica</option>
                <option value="reunion">🤝 Reunión Presencial / Virtual</option>
                <option value="cotizacion">📄 Envío de Cotización Formal</option>
                <option value="nota">📝 Nota Interna de Operación</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="font-bold text-on-surface font-['Epilogue']">Atendido por</label>
              <input
                type="text"
                [(ngModel)]="newFormAuthor"
                class="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue'] shadow-inner"
              />
            </div>
          </div>

          <div class="space-y-1 text-xs">
            <label class="font-bold text-on-surface font-['Epilogue']">Resumen Ejecutivo de la Negociación o Acuerdo</label>
            <textarea
              [(ngModel)]="newFormSummary"
              rows="2"
              placeholder="Detalles de la llamada, fecha solicitada, presupuesto estimado o dudas del cliente..."
              class="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue'] shadow-inner"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 text-xs">
            <button
              type="button"
              (click)="showNewInteractionForm.set(false)"
              class="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#282828] text-outline hover:text-on-surface font-bold transition-all cursor-pointer font-['Epilogue']"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="submitInteraction()"
              [disabled]="!newFormClientId || !newFormSummary.trim()"
              class="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-bold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer font-['Epilogue'] shadow-md shadow-primary/20"
            >
              Guardar en Bitácora
            </button>
          </div>
        </div>
      }

      <!-- LISTA CRONOLÓGICA DE INTERACCIONES -->
      <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-4">
        <h3 class="text-sm font-black text-on-surface flex items-center gap-2 border-b border-white/10 pb-3 font-['Epilogue']">
          <span class="material-symbols-outlined text-primary text-base">history</span>
          Historial Cronológico de Interacciones
        </h3>

        <div class="space-y-3">
          @for (item of allInteractions(); track item.id) {
            <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 hover:border-primary/40 transition-all space-y-2 shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="w-8 h-8 rounded-xl flex items-center justify-center material-symbols-outlined text-base shadow-inner"
                    [class]="item.type === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300' : (item.type === 'llamada' ? 'bg-cyan-500/20 text-cyan-300' : (item.type === 'reunion' ? 'bg-purple-500/20 text-purple-300' : 'bg-primary/20 text-primary'))">
                    {{ item.type === 'whatsapp' ? 'chat' : (item.type === 'llamada' ? 'call' : (item.type === 'reunion' ? 'handshake' : 'note')) }}
                  </span>

                  <div>
                    <h4 class="text-xs font-black text-on-surface font-['Epilogue']">
                      {{ item.clientName }} <span class="text-outline font-normal">({{ item.clientCompany }})</span>
                    </h4>
                    <span class="text-[10px] text-outline font-['Epilogue']">Atendió: <b class="text-on-surface font-sans">{{ item.authorName }}</b></span>
                  </div>
                </div>

                <span class="text-[10px] font-mono text-outline self-end sm:self-auto">{{ item.date }}</span>
              </div>

              <p class="text-xs text-on-surface/90 leading-relaxed pl-10 font-['Epilogue']">
                {{ item.summary }}
              </p>
            </div>
          } @empty {
            <div class="text-center py-8 text-outline text-xs italic font-['Epilogue']">
              No hay interacciones registradas aún.
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class ClientsTabInteractionsComponent {
  clients = input<ClientItem[]>([]);
  addInteraction = output<{ clientId: string; type: any; summary: string; authorName: string }>();

  showNewInteractionForm = signal(false);

  newFormClientId = '';
  newFormType: any = 'whatsapp';
  newFormSummary = '';
  newFormAuthor = 'Lic. Claudia Morales';

  allInteractions(): FlatInteraction[] {
    const list: FlatInteraction[] = [];
    for (const c of this.clients()) {
      for (const int of c.interactions || []) {
        list.push({
          id: int.id,
          clientId: c.id,
          clientName: c.name,
          clientCompany: c.company,
          date: int.date,
          type: int.type,
          summary: int.summary,
          authorName: int.authorName
        });
      }
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  submitInteraction(): void {
    if (!this.newFormClientId || !this.newFormSummary.trim()) return;
    this.addInteraction.emit({
      clientId: this.newFormClientId,
      type: this.newFormType,
      summary: this.newFormSummary.trim(),
      authorName: this.newFormAuthor.trim()
    });
    this.newFormSummary = '';
    this.showNewInteractionForm.set(false);
  }
}
