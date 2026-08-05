import { Injectable, signal } from '@angular/core';
import { Quote, GroupItem } from '../models/admin.models';

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

  /**
   * Expediente de grupo. Igual que el de cotización, se renderiza desde
   * `main-layout` y no desde la pantalla que lo abre: dentro de `<main>` el
   * modal queda por debajo del sidebar aunque lleve un z-index altísimo, porque
   * compite dentro del contexto de apilamiento de esa columna.
   */
  activeGroup = signal<GroupItem | null>(null);

  openGroupModal(group: GroupItem): void {
    this.activeGroup.set(group);
    this.fullScreenModalActive.set(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closeGroupModal(): void {
    this.activeGroup.set(null);
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
