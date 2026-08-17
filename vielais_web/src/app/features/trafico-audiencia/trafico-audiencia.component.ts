import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsEngineService } from '../../core/services/metrics-engine.service';

@Component({
  selector: 'app-trafico-audiencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trafico-audiencia.component.html'
})
export class TraficoAudienciaComponent {
  readonly metrics = inject(MetricsEngineService);
}
