import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { QuoteDetailModalComponent } from '../../shared/quote-detail-modal/quote-detail-modal.component';
import { LayoutStateService } from '../../core/services/layout_state.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, BottomNavComponent, QuoteDetailModalComponent],
  template: `
    <!-- Root Container: Fixed full viewport height, no global body scroll -->
    <div class="h-screen w-screen bg-[#131313] text-on-surface flex flex-col font-body-md relative">
      
      <!-- Top Header -->
      <app-header class="shrink-0" />

      <!-- Inner Layout Container -->
      <div class="flex-1 flex overflow-hidden min-h-0">
        
        <!-- Desktop Sidebar (Hidden on mobile) -->
        <app-sidebar class="hidden md:block shrink-0 h-full" />

        <!-- Main Scrollable Content Area -->
        <main class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto custom-scrollbar pb-24 md:pb-8">
          <router-outlet />
        </main>

      </div>

      <!-- Mobile Bottom Navigation (md:hidden) -->
      @if (!layoutState.fullScreenModalActive()) {
        <app-bottom-nav class="md:hidden" (toggleMenu)="layoutState.toggleMobileMenu()" />
      }

      <!-- Mobile Drawer for all 12 Panels (md:hidden) -->
      @if (layoutState.mobileMenuOpen()) {
        <div class="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-md flex justify-start animate-fade-in">
          <div class="w-72 bg-[#1A1A1A] h-full shadow-2xl flex flex-col border-r border-white/10 animate-slide-up">
            
            <div class="p-4 border-b border-white/10 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <img src="acordex_without_bg.png" alt="Acordex Logo" class="w-8 h-8 object-contain" />
                <span class="font-['Epilogue'] font-black text-lg text-primary tracking-tighter">MENÚ ADMINISTRADOR</span>
              </div>
              <button (click)="layoutState.closeMobileMenu()" class="text-outline hover:text-on-surface p-1">
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto">
              <app-sidebar (onItemClick)="layoutState.closeMobileMenu()" />
            </div>

          </div>
        </div>
      }

      <!-- Global Quote Detail Modal (Rendered at Root Level, overlays Header & Sidebar 100%) -->
      <app-quote-detail-modal />

    </div>
  `
})
export class MainLayoutComponent {
  layoutState = inject(LayoutStateService);
}
