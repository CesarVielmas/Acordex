import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomSelectComponent, SelectOption } from '../../../shared/ui/custom-select/custom-select.component';

export interface GroupFiltersState {
  searchTerm: string;
  disqueraType: string;
  agendaStatus: string;
  platformStatus: string;
  genre: string;
}

@Component({
  selector: 'app-group-filters-toolbar',
  standalone: true,
  imports: [CommonModule, CustomSelectComponent],
  template: `
    <div class="p-4 sm:p-5 rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 backdrop-blur-xl shadow-xl space-y-4">
      
      <!-- Top Row: Search Input & Reset Button -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[240px]">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-base pointer-events-none">search</span>
          <input
            type="text"
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
            placeholder="Buscar por nombre de grupo, género o líder/encargado..."
            class="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-surface-container-highest/90 border border-outline-variant/40 text-xs font-bold text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-inner transition-all"
          />
          @if (searchTerm()) {
            <button (click)="clearSearch()" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-xl">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          }
        </div>

        <!-- Quick Reset Button -->
        @if (hasActiveFilters()) {
          <button
            (click)="resetFilters()"
            class="self-end sm:self-auto px-4 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-extrabold border border-rose-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span class="material-symbols-outlined text-sm">filter_alt_off</span> Limpiar Filtros
          </button>
        }
      </div>

      <!-- SEGMENTED DISPLAY BAR 1: Contrato / Exclusividad -->
      <div class="space-y-1.5">
        <label class="block text-[10px] font-black uppercase tracking-wider text-outline">Filtrar por Contrato / Exclusividad:</label>
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar p-1 rounded-2xl bg-surface-container-highest/70 border border-outline-variant/30 shadow-inner">
          
          <button
            (click)="selectDisqueraType('ALL')"
            class="px-3.5 py-2 rounded-xl font-black text-[11px] transition-all shrink-0"
            [ngClass]="disqueraType() === 'ALL' ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-on-surface'"
          >
            Todos los Contratos
          </button>

          <button
            (click)="selectDisqueraType('Firmado Exclusivo')"
            class="px-3.5 py-2 rounded-xl font-black text-[11px] transition-all shrink-0 flex items-center gap-1.5"
            [ngClass]="disqueraType() === 'Firmado Exclusivo' ? 'bg-emerald-500 text-on-primary shadow-md' : 'text-outline hover:text-emerald-300'"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Firmados Exclusivos
          </button>

          <button
            (click)="selectDisqueraType('Co-gestionado')"
            class="px-3.5 py-2 rounded-xl font-black text-[11px] transition-all shrink-0 flex items-center gap-1.5"
            [ngClass]="disqueraType() === 'Co-gestionado' ? 'bg-purple-500 text-on-primary shadow-md' : 'text-outline hover:text-purple-300'"
          >
            <span class="w-2 h-2 rounded-full bg-purple-400"></span> Co-gestionados
          </button>

          <button
            (click)="selectDisqueraType('Independiente / Por Evento')"
            class="px-3.5 py-2 rounded-xl font-black text-[11px] transition-all shrink-0 flex items-center gap-1.5"
            [ngClass]="disqueraType() === 'Independiente / Por Evento' ? 'bg-amber-500 text-on-primary shadow-md' : 'text-outline hover:text-amber-300'"
          >
            <span class="w-2 h-2 rounded-full bg-amber-400"></span> Independientes
          </button>

          <button
            (click)="selectDisqueraType('Pendiente de Firma')"
            class="px-3.5 py-2 rounded-xl font-black text-[11px] transition-all shrink-0 flex items-center gap-1.5"
            [ngClass]="disqueraType() === 'Pendiente de Firma' ? 'bg-rose-500 text-on-primary shadow-md' : 'text-outline hover:text-rose-300'"
          >
            <span class="w-2 h-2 rounded-full bg-rose-400"></span> Pendientes Firma
          </button>

        </div>
      </div>

      <!-- SEGMENTED DISPLAY BAR 2: Agenda & Custom App Select Dropdowns -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
        
        <!-- Segmented Agenda Display Bar (7 cols) -->
        <div class="sm:col-span-7 space-y-1.5">
          <label class="block text-[10px] font-black uppercase tracking-wider text-outline">Estado de Agenda / Disponibilidad:</label>
          <div class="flex items-center gap-1 p-1 rounded-2xl bg-surface-container-highest/70 border border-outline-variant/30 shadow-inner">
            <button
              (click)="selectAgendaStatus('ALL')"
              class="flex-1 py-2 rounded-xl font-black text-[11px] transition-all text-center"
              [ngClass]="agendaStatus() === 'ALL' ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-on-surface'"
            >
              Todas
            </button>
            <button
              (click)="selectAgendaStatus('Totalmente Libre')"
              class="flex-1 py-2 rounded-xl font-black text-[11px] transition-all text-center"
              [ngClass]="agendaStatus() === 'Totalmente Libre' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-outline hover:text-emerald-400'"
            >
              Libre Total
            </button>
            <button
              (click)="selectAgendaStatus('Parcialmente Ocupado')"
              class="flex-1 py-2 rounded-xl font-black text-[11px] transition-all text-center"
              [ngClass]="agendaStatus() === 'Parcialmente Ocupado' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm' : 'text-outline hover:text-amber-300'"
            >
              Parcial
            </button>
            <button
              (click)="selectAgendaStatus('Agenda Llena')"
              class="flex-1 py-2 rounded-xl font-black text-[11px] transition-all text-center"
              [ngClass]="agendaStatus() === 'Agenda Llena' ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm' : 'text-outline hover:text-rose-300'"
            >
              Llena
            </button>
          </div>
        </div>

        <!-- Custom App Select Dropdown 1: Origen Plataforma (5 cols) -->
        <div class="sm:col-span-5">
          <app-custom-select
            label="Origen Plataforma:"
            placeholder="Seleccionar origen..."
            [options]="platformOptions"
            [value]="platformStatus()"
            (valueChange)="selectPlatformStatus($event)"
          />
        </div>

      </div>

    </div>
  `
})
export class GroupFiltersToolbarComponent {
  filtersChanged = output<GroupFiltersState>();

  searchTerm = signal<string>('');
  disqueraType = signal<string>('ALL');
  agendaStatus = signal<string>('ALL');
  platformStatus = signal<string>('ALL');
  genre = signal<string>('ALL');

  platformOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todos los Orígenes', icon: 'language' },
    { value: 'REGISTERED', label: 'Alta en Plataforma Acordex', icon: 'verified', badge: 'En plataforma' },
    { value: 'EXTERNAL', label: 'Viene de Fuera / Gestor Externo', icon: 'location_on', badge: 'Externa' }
  ];

  hasActiveFilters(): boolean {
    return (
      this.searchTerm().trim() !== '' ||
      this.disqueraType() !== 'ALL' ||
      this.agendaStatus() !== 'ALL' ||
      this.platformStatus() !== 'ALL' ||
      this.genre() !== 'ALL'
    );
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    this.emitFilters();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.emitFilters();
  }

  selectDisqueraType(type: string): void {
    this.disqueraType.set(type);
    this.emitFilters();
  }

  selectAgendaStatus(status: string): void {
    this.agendaStatus.set(status);
    this.emitFilters();
  }

  selectPlatformStatus(val: string): void {
    this.platformStatus.set(val);
    this.emitFilters();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.disqueraType.set('ALL');
    this.agendaStatus.set('ALL');
    this.platformStatus.set('ALL');
    this.genre.set('ALL');
    this.emitFilters();
  }

  private emitFilters(): void {
    this.filtersChanged.emit({
      searchTerm: this.searchTerm(),
      disqueraType: this.disqueraType(),
      agendaStatus: this.agendaStatus(),
      platformStatus: this.platformStatus(),
      genre: this.genre()
    });
  }
}
