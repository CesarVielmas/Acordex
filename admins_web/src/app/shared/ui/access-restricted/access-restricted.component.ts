import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-access-restricted',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4 space-y-4">
      <div class="w-16 h-16 rounded-3xl bg-surface-container-high border border-outline-variant/30 text-outline flex items-center justify-center">
        <span class="material-symbols-outlined text-3xl">{{ icon }}</span>
      </div>
      <div class="space-y-1.5 max-w-sm">
        <h2 class="text-lg font-bold text-on-surface">{{ title }}</h2>
        @if (message) {
          <p class="text-xs text-outline leading-relaxed">{{ message }}</p>
        }
      </div>
      @if (showBackLink) {
        <a routerLink="/dashboard" class="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 pt-2">
          <span class="material-symbols-outlined text-base">arrow_back</span> Volver al inicio
        </a>
      }
    </div>
  `
})
export class AccessRestrictedComponent {
  @Input() icon: string = 'lock';
  @Input() title: string = 'Acceso Restringido';
  @Input() message: string = '';
  @Input() showBackLink: boolean = true;
}
