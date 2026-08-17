import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-[#080b11] text-on-surface">
      <!-- Desktop Sticky Sidebar (stays fixed in viewport during scroll) -->
      <div class="sticky top-0 h-screen z-30 flex-shrink-0">
        <app-sidebar></app-sidebar>
      </div>

      <!-- Main Developer Canvas Area -->
      <div class="flex flex-1 flex-col min-w-0">
        <app-header></app-header>
        
        <main class="flex-1 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 max-w-[1520px] w-full mx-auto animate-fade-in">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {}
