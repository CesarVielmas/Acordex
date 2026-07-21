import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly _isSidebarCollapsed = signal(false);
  private readonly _pageTitle = signal('BIENVENIDO');

  readonly isSidebarCollapsed = computed(() => this._isSidebarCollapsed());
  readonly pageTitle = computed(() => this._pageTitle());

  readonly isBottomNavCollapsed = signal(false);

  toggleSidebar() {
    this._isSidebarCollapsed.update(val => !val);
  }

  setPageTitle(title: string) {
    this._pageTitle.set(title);
  }
}
