import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutStateService } from '../../core/services/layout-state.service';
import { MetricsEngineService } from '../../core/services/metrics-engine.service';

interface DevNavItem {
  label: string;
  route: string;
  icon: string;
  badge?: () => string | number | null;
  badgeColor?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  readonly layout = inject(LayoutStateService);
  readonly metrics = inject(MetricsEngineService);

  readonly navItems: DevNavItem[] = [
    { label: 'Centro de Comando', route: '/dashboard', icon: 'dashboard' },
    { 
      label: 'Comisiones por Grupo', 
      route: '/comisiones', 
      icon: 'monetization_on',
      badge: () => `${this.metrics.globalTakeRatePercent()}%`,
      badgeColor: 'bg-primary/20 text-primary border border-primary/30'
    },
    { 
      label: 'Managers & Tickets', 
      route: '/managers-tickets', 
      icon: 'support_agent',
      badge: () => this.metrics.openTicketsCount() > 0 ? `${this.metrics.openTicketsCount()} open` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    },
    { 
      label: 'Tráfico & Embudo', 
      route: '/trafico', 
      icon: 'analytics',
      badge: () => `${this.metrics.activeLiveUsers()} live`,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
    },
    { 
      label: 'Telemetría & Servidores', 
      route: '/telemetria', 
      icon: 'dns',
      badge: () => `${this.metrics.systemTelemetry().uptimePercent}%`,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    },
    { label: 'Modelos Predictivos', route: '/proyecciones', icon: 'trending_up' },
    { 
      label: 'Dev Tools & Master Flags', 
      route: '/dev-tools', 
      icon: 'terminal',
      badge: () => 'ROOT',
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono'
    }
  ];
}
