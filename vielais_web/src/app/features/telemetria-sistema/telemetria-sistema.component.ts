import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsEngineService } from '../../core/services/metrics-engine.service';
import { AuditLogItem } from '../../core/models/vielais.models';

@Component({
  selector: 'app-telemetria-sistema',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './telemetria-sistema.component.html'
})
export class TelemetriaSistemaComponent {
  readonly metrics = inject(MetricsEngineService);

  activeLogLevel = signal<string>('ALL');

  get filteredLogs(): AuditLogItem[] {
    const list = this.metrics.auditLogs();
    const lvl = this.activeLogLevel();
    if (lvl === 'ALL') return list;
    return list.filter(l => l.level === lvl);
  }
}
