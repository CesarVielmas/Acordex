export type NotificationCategory = 'cotizacion' | 'evento' | 'mensaje' | 'fans' | 'pago';

export interface GroupNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  type?: string;
  timestamp: string;
  read: boolean;
  actionRoute?: string;
  actionLabel?: string;
  targetId?: string;
  priority: 'Urgente' | 'Alta' | 'Normal';
}
