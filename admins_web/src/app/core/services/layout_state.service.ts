import { Injectable, signal } from '@angular/core';
import { Quote } from '../models/admin.models';

@Injectable({
  providedIn: 'root'
})
export class LayoutStateService {
  isSidebarCollapsed = signal<boolean>(false);
  mobileMenuOpen = signal<boolean>(false);
  fullScreenModalActive = signal<boolean>(false);

  // Global quote modal state — rendered at root layout level so it overlays everything
  activeQuote = signal<Quote | null>(null);

  openQuoteModal(quote: Quote): void {
    this.activeQuote.set(quote);
    this.fullScreenModalActive.set(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closeQuoteModal(): void {
    this.activeQuote.set(null);
    this.fullScreenModalActive.set(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(val => !val);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(val => !val);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
