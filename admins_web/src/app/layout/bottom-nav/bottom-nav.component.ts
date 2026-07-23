import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../core/services/role.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Bottom Navigation Bar (md:hidden) -->
    <div class="fixed bottom-0 left-0 right-0 w-full z-50 md:hidden pointer-events-none">
      
      <!-- Bottom Nav Bar -->
      <nav class="w-full bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-primary/30 shadow-[0_-4px_25px_rgba(0,0,0,0.8)] flex justify-around items-center pt-2.5 pb-4 px-2 pointer-events-auto">
        
        <!-- Dashboard -->
        <a 
          routerLink="/dashboard" 
          routerLinkActive="text-primary font-bold scale-105"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center justify-center text-outline hover:text-on-surface transition-all p-1.5 rounded-xl w-full"
        >
          <span class="material-symbols-outlined text-2xl">grid_view</span>
          <span class="font-['Epilogue'] text-[9px] font-bold uppercase tracking-wider mt-0.5">Inicio</span>
        </a>

        <!-- Cotizaciones (If permitted) -->
        @if (roleService.canViewQuotes()) {
          <a 
            routerLink="/quotes" 
            routerLinkActive="text-primary font-bold scale-105"
            class="flex flex-col items-center justify-center text-outline hover:text-on-surface transition-all p-1.5 rounded-xl w-full"
          >
            <span class="material-symbols-outlined text-2xl">request_quote</span>
            <span class="font-['Epilogue'] text-[9px] font-bold uppercase tracking-wider mt-0.5">Booking</span>
          </a>
        }

        <!-- Eventos -->
        <a 
          routerLink="/events" 
          routerLinkActive="text-primary font-bold scale-105"
          class="flex flex-col items-center justify-center text-outline hover:text-on-surface transition-all p-1.5 rounded-xl w-full"
        >
          <span class="material-symbols-outlined text-2xl">event</span>
          <span class="font-['Epilogue'] text-[9px] font-bold uppercase tracking-wider mt-0.5">Eventos</span>
        </a>

        <!-- Tareas -->
        <a 
          routerLink="/tasks" 
          routerLinkActive="text-primary font-bold scale-105"
          class="flex flex-col items-center justify-center text-outline hover:text-on-surface transition-all p-1.5 rounded-xl w-full"
        >
          <span class="material-symbols-outlined text-2xl">task_alt</span>
          <span class="font-['Epilogue'] text-[9px] font-bold uppercase tracking-wider mt-0.5">Tareas</span>
        </a>

        <!-- Menu / Más (Opens Full Mobile Drawer) -->
        <button 
          (click)="toggleMenu.emit()"
          class="flex flex-col items-center justify-center text-outline hover:text-primary transition-all p-1.5 rounded-xl w-full"
        >
          <span class="material-symbols-outlined text-2xl">widgets</span>
          <span class="font-['Epilogue'] text-[9px] font-bold uppercase tracking-wider mt-0.5">Más</span>
        </button>

      </nav>
    </div>
  `
})
export class BottomNavComponent {
  roleService = inject(RoleService);
  @Output() toggleMenu = new EventEmitter<void>();
}
