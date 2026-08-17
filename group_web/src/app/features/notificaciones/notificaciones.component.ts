import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { GroupDataService } from '../../core/services/group-data.service';
import { GroupNotification, NotificationCategory } from '../../core/models/notification.models';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})
export class NotificacionesComponent {
  readonly groupData = inject(GroupDataService);
  private readonly router = inject(Router);

  selectedCategory = signal<string>('todos');
  activeCategory = this.selectedCategory;

  readonly categories = [
    { id: 'todos', label: 'Todas' },
    { id: 'cotizacion', label: 'Cotizaciones' },
    { id: 'evento', label: 'Eventos' },
    { id: 'mensaje', label: 'Mensajes & Chat' },
    { id: 'pago', label: 'Pagos & Tesorería' },
    { id: 'fans', label: 'Fans & Reseñas' }
  ];

  get filteredNotifications(): GroupNotification[] {
    const list = this.groupData.notifications();
    const cat = this.selectedCategory();
    if (cat === 'todos') return list;
    return list.filter(n => n.category === cat || (n as any).type === cat);
  }

  handleNotificationClick(notif: GroupNotification): void {
    this.handleNotifClick(notif);
  }

  handleNotifClick(notif: GroupNotification): void {
    this.groupData.markNotificationAsRead(notif.id);
    if (notif.actionRoute) {
      this.router.navigate([notif.actionRoute]);
    }
  }

  markAllAsRead(): void {
    this.groupData.markAllNotificationsAsRead();
  }
}
