import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientItem } from '../../../core/models/admin.models';
import { money } from '../../finances/finance-metrics';
import { getTierBadgeClass, getSegmentBadgeClass, getClientStatusBadgeClass } from '../client-metrics';

/**
 * Pestaña 1: Directorio & CRM de Clientes.
 */
@Component({
  selector: 'app-clients-tab-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ─── BARRA DE BÚSQUEDA & FILTROS ─── -->
      <div class="p-4 sm:p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">

        <!-- Buscador -->
        <div class="relative flex-1 max-w-md">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por titular, razón social, RFC, plaza o teléfono..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all font-['Epilogue'] shadow-inner"
          />
        </div>

        <!-- Filtros Rápidos -->
        <div class="flex items-center gap-2 flex-wrap text-xs">

          <!-- Segmento -->
          <select
            [ngModel]="selectedSegment()"
            (ngModelChange)="selectedSegment.set($event)"
            class="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
          >
            <option value="ALL">Todos los Segmentos</option>
            <option value="Empresario de Palenque / Feria">Empresarios de Palenques & Ferias</option>
            <option value="Promotor de Bailes">Promotores de Espectáculos Masivos</option>
            <option value="Particular (Boda/XV)">Eventos Sociales Particulares</option>
            <option value="Corporativo / Empresa">Eventos Corporativos & Marcas</option>
            <option value="Gobierno / Municipio">Patronatos & Gobiernos Municipales</option>
          </select>

          <!-- Nivel / Tier -->
          <select
            [ngModel]="selectedTier()"
            (ngModelChange)="selectedTier.set($event)"
            class="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
          >
            <option value="ALL">Todos los Tiers</option>
            <option value="Diamante">💎 Tier Diamante</option>
            <option value="Oro">🥇 Tier Oro</option>
            <option value="Plata">🥈 Tier Plata</option>
            <option value="Prospecto">🎯 Prospecto Comercial</option>
          </select>

          @if (searchQuery() || selectedSegment() !== 'ALL' || selectedTier() !== 'ALL') {
            <button
              type="button"
              (click)="clearFilters()"
              class="px-3 py-2 rounded-xl bg-[#222222] text-outline hover:text-on-surface font-bold text-xs transition-all cursor-pointer font-['Epilogue']"
            >
              Limpiar
            </button>
          }
        </div>

      </div>

      <!-- ─── CARDS DE CLIENTES ─── -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        @for (cli of filteredClients(); track cli.id) {
          <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-5 relative overflow-hidden transition-all hover:border-primary/50 group">

            <!-- Encabezado con Avatar y Badges -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-13 h-13 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary font-black font-mono text-base shrink-0 shadow-inner">
                  {{ cli.name.charAt(0) }}
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#141414] text-outline border border-white/10">
                      {{ cli.id }}
                    </span>
                    @if (cli.tier) {
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-black border font-mono" [class]="getTierBadgeClass(cli.tier)">
                        {{ cli.tier }}
                      </span>
                    }
                  </div>
                  <h3 class="text-sm font-black text-on-surface truncate mt-0.5 group-hover:text-primary transition-colors font-['Epilogue']">
                    {{ cli.name }}
                  </h3>
                  <p class="text-xs text-outline truncate font-['Epilogue']">{{ cli.company }}</p>
                </div>
              </div>

              <!-- Rating Estrellas -->
              <div class="text-right shrink-0">
                <div class="flex items-center gap-0.5 text-amber-400 text-xs font-mono">
                  <span class="material-symbols-outlined text-sm">star</span>
                  <span class="font-bold text-on-surface">{{ cli.rating || 5 }}.0</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold border uppercase mt-1 inline-block font-mono" [class]="getClientStatusBadgeClass(cli.status)">
                  {{ cli.status }}
                </span>
              </div>
            </div>

            <!-- Segmento & Ubicación -->
            <div class="flex items-center justify-between text-xs pt-1">
              <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold border font-['Epilogue']" [class]="getSegmentBadgeClass(cli.segment)">
                {{ cli.segment || 'Cliente General' }}
              </span>
              <span class="text-outline text-[11px] font-medium flex items-center gap-1 font-['Epilogue']">
                <span class="material-symbols-outlined text-xs text-primary">location_on</span>
                {{ cli.city || 'México' }}, {{ cli.state || 'MX' }}
              </span>
            </div>

            <!-- Datos de Contacto Directo -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 space-y-2 text-xs shadow-inner">
              <div class="flex items-center justify-between gap-2">
                <span class="text-outline flex items-center gap-1 truncate text-[11px] font-['Epilogue']">
                  <span class="material-symbols-outlined text-xs text-primary">mail</span> {{ cli.email }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-outline flex items-center gap-1 font-mono text-[11px]">
                  <span class="material-symbols-outlined text-xs text-primary">call</span> {{ cli.phone }}
                </span>
                @if (cli.whatsapp) {
                  <a
                    [href]="'https://wa.me/' + cli.whatsapp.replace('+', '').replace(' ', '')"
                    target="_blank"
                    (click)="$event.stopPropagation()"
                    class="px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500 hover:text-black transition-all cursor-pointer font-['Epilogue'] shadow-sm"
                  >
                    <span class="material-symbols-outlined text-xs">chat</span> WhatsApp
                  </a>
                }
              </div>
            </div>

            <!-- Resumen Financiero & Eventos -->
            <div class="grid grid-cols-2 gap-2 font-mono text-center text-xs">
              <div class="p-2.5 rounded-2xl bg-[#141414] border border-white/5 shadow-inner">
                <span class="text-[9px] font-['Epilogue'] font-bold text-outline uppercase block">Contrataciones</span>
                <span class="font-black text-on-surface">{{ cli.totalEvents }} Fechas</span>
              </div>
              <div class="p-2.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 shadow-inner">
                <span class="text-[9px] font-['Epilogue'] font-bold text-emerald-400 uppercase block">Facturación</span>
                <span class="font-black text-emerald-300">{{ money(cli.totalSpent) }}</span>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                (click)="openDetail.emit(cli)"
                class="flex-1 py-2.5 rounded-xl bg-[#202020] hover:bg-[#282828] text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer font-['Epilogue']"
              >
                <span class="material-symbols-outlined text-sm">history_edu</span>
                Expediente 360°
              </button>

              <button
                type="button"
                (click)="sendOffer.emit(cli)"
                class="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-primary/20 font-['Epilogue']"
              >
                <span class="material-symbols-outlined text-sm">local_offer</span>
                Oferta
              </button>

              <button
                type="button"
                (click)="editClient.emit(cli)"
                title="Editar Cliente"
                class="p-2.5 rounded-xl bg-[#202020] hover:bg-[#282828] text-outline hover:text-on-surface transition-all cursor-pointer"
              >
                <span class="material-symbols-outlined text-base">edit</span>
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class ClientsTabDirectoryComponent {
  clients = input<ClientItem[]>([]);
  openDetail = output<ClientItem>();
  sendOffer = output<ClientItem>();
  editClient = output<ClientItem>();

  searchQuery = signal('');
  selectedSegment = signal('ALL');
  selectedTier = signal('ALL');

  filteredClients(): ClientItem[] {
    return this.clients().filter(c => {
      // Filtro de Búsqueda
      if (this.searchQuery()) {
        const q = this.searchQuery().toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchComp = c.company?.toLowerCase().includes(q);
        const matchRfc = c.taxInfo?.rfc?.toLowerCase().includes(q);
        const matchCity = c.city?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        if (!matchName && !matchComp && !matchRfc && !matchCity && !matchPhone) return false;
      }

      // Filtro de Segmento
      if (this.selectedSegment() !== 'ALL' && c.segment !== this.selectedSegment()) {
        return false;
      }

      // Filtro de Tier
      if (this.selectedTier() !== 'ALL' && c.tier !== this.selectedTier()) {
        return false;
      }

      return true;
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedSegment.set('ALL');
    this.selectedTier.set('ALL');
  }

  money = money;
  getTierBadgeClass = getTierBadgeClass;
  getSegmentBadgeClass = getSegmentBadgeClass;
  getClientStatusBadgeClass = getClientStatusBadgeClass;
}
