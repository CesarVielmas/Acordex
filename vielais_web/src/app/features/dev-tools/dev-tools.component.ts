import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetricsEngineService } from '../../core/services/metrics-engine.service';

@Component({
  selector: 'app-dev-tools',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dev-tools.component.html'
})
export class DevToolsComponent {
  readonly metrics = inject(MetricsEngineService);

  takeRateInput = signal<number>(this.metrics.globalTakeRatePercent());
  simGroup = signal<string>('Banda Los Reyes');
  simAmount = signal<number>(250000);
  simFeedback = signal<string | null>(null);

  updateTakeRate(): void {
    this.metrics.setGlobalTakeRate(this.takeRateInput());
  }

  toggleFlag(id: string): void {
    this.metrics.toggleFeatureFlag(id);
  }

  runSimulation(): void {
    this.metrics.simulateLiveBooking(this.simGroup(), this.simAmount());
    const comm = (this.simAmount() * this.metrics.globalTakeRatePercent()) / 100;
    this.simFeedback.set(`¡Simulación exitosa! Se acreditó comisión de $${comm.toLocaleString()} MXN para ${this.simGroup()}.`);
    setTimeout(() => this.simFeedback.set(null), 5000);
  }

  resetAllCaches(): void {
    localStorage.removeItem('acordex_vielais_feature_flags_v1');
    localStorage.removeItem('acordex_vielais_global_commission_rate');
    this.simFeedback.set('Cachés locales del portal de desarrollo purgados con éxito.');
    setTimeout(() => this.simFeedback.set(null), 4000);
  }
}
