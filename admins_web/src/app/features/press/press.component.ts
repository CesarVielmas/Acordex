import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-press',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Firmas & Ruedas de Prensa</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
              Cobertura de Medios
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Trazabilidad de conferencias, gastos operativos e impacto mediático</p>
        </div>
      </div>

      <!-- PRESS EVENTS CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (prs of mockData.pressEvents(); track prs.id) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 shadow-xl space-y-4">
            
            <div class="flex items-center justify-between">
              <span [class]="prs.type === 'Firma de Autógrafos' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'" class="px-3 py-1 rounded-full text-xs font-bold border">
                {{ prs.type }}
              </span>
              <span class="text-xs font-bold text-primary">{{ prs.status }}</span>
            </div>

            <div>
              <h3 class="text-lg font-black text-on-surface">{{ prs.title }}</h3>
              <p class="text-xs text-outline mt-0.5">Grupo: <strong class="text-primary">{{ prs.groupName }}</strong></p>
              <p class="text-xs text-outline">{{ prs.location }} ({{ prs.date }})</p>
            </div>

            <p class="text-xs text-on-surface-variant leading-relaxed">
              {{ prs.summary }}
            </p>

            <!-- Expenses & Media stats -->
            <div class="grid grid-cols-2 gap-3 bg-surface-container-high p-3 rounded-2xl text-xs">
              <div>
                <span class="text-[10px] text-outline uppercase font-bold block">Gastos Operativos (Mock)</span>
                @if (roleService.canViewFinances()) {
                  <span class="font-black text-on-surface text-sm">&#36;{{ prs.operatingExpenses | number:'1.0-0' }} MXN</span>
                } @else {
                  <span class="font-bold text-outline">Reservado</span>
                }
              </div>

              <div>
                <span class="text-[10px] text-outline uppercase font-bold block">Medios Acreditados</span>
                <span class="font-black text-emerald-400 text-sm">{{ prs.mediaCount }} Medios</span>
              </div>
            </div>

            <!-- Accredited Outlets List -->
            <div>
              <span class="text-[10px] font-bold text-outline uppercase block mb-1.5">Medios Destacados:</span>
              <div class="flex flex-wrap gap-1.5">
                @for (m of prs.accreditedJournalists; track m) {
                  <span class="px-2 py-0.5 rounded-md bg-surface-bright text-on-surface text-[11px] font-medium border border-outline-variant/30">
                    {{ m }}
                  </span>
                }
              </div>
            </div>

            <div class="pt-2 border-t border-outline-variant/20 flex justify-end">
              <button 
                (click)="downloadPressKit(prs.pressKitUrl)"
                class="px-3.5 py-2 rounded-xl bg-surface-container-highest hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-sm">download</span> Descargar Press Kit
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class PressComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  downloadPressKit(filename: string): void {
    alert(`Descargando ${filename} simulado...`);
  }
}
