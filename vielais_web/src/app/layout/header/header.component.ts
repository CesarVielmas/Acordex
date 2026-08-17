import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetricsEngineService } from '../../core/services/metrics-engine.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  readonly metrics = inject(MetricsEngineService);

  simulateQuickBooking(): void {
    const list = this.metrics.groupCommissions();
    const randomGroup = list[Math.floor(Math.random() * list.length)];
    const amounts = [120000, 180000, 250000, 320000, 450000];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
    this.metrics.simulateLiveBooking(randomGroup.groupName, randomAmount);
  }
}
