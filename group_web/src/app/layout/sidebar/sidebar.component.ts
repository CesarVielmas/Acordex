import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GroupDataService } from '../../core/services/group-data.service';
import { LayoutStateService } from '../../core/services/layout-state.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: () => number | string | null;
  badgeColor?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly groupData = inject(GroupDataService);
  readonly layout = inject(LayoutStateService);

  readonly mainNavItems: NavItem[] = [
    { label: 'Panel de Control', route: '/dashboard', icon: 'space_dashboard' },
    { label: 'Evidencias de Eventos', route: '/eventos-evidencias', icon: 'photo_camera' },
    { label: 'Muro & Publicaciones', route: '/publicaciones', icon: 'dynamic_feed' },
    { label: 'Historias 24h', route: '/historias', icon: 'history_toggle_off' },
    { label: 'Calendario & Agenda', route: '/calendario', icon: 'calendar_month' },
    { 
      label: 'Chat Directo', 
      route: '/chat', 
      icon: 'forum', 
      badge: () => this.groupData.pendingQuotesCount() > 0 ? `${this.groupData.pendingQuotesCount()} cot.` : null,
      badgeColor: 'bg-primary/20 text-primary border border-primary/30'
    },
    { 
      label: 'Notificaciones', 
      route: '/notificaciones', 
      icon: 'notifications',
      badge: () => this.groupData.unreadNotificationsCount() > 0 ? this.groupData.unreadNotificationsCount() : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    { label: 'Editor Página Acordex', route: '/editor-pagina', icon: 'web' }
  ];
}
