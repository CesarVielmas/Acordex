import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutStateService {
  readonly isSidebarCollapsed = signal<boolean>(false);
  readonly isMobileMenuOpen = signal<boolean>(false);

  constructor() {
    try {
      const saved = localStorage.getItem('acordex_group_sidebar_collapsed');
      if (saved !== null) {
        this.isSidebarCollapsed.set(saved === 'true');
      }
    } catch (e) {
      console.warn('Storage read error', e);
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => {
      const next = !v;
      try {
        localStorage.setItem('acordex_group_sidebar_collapsed', String(next));
      } catch (e) {
        console.warn('Storage write error', e);
      }
      return next;
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
