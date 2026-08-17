import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsEngineService } from '../../core/services/metrics-engine.service';

@Component({
  selector: 'app-proyecciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proyecciones.component.html'
})
export class ProyeccionesComponent {
  readonly metrics = inject(MetricsEngineService);

  readonly monthlyForecast = [
    { month: 'Ene 2027', projectedGmv: 4200000, projectedCommission: 420000, growthRate: 14 },
    { month: 'Feb 2027', projectedGmv: 4600000, projectedCommission: 460000, growthRate: 16 },
    { month: 'Mar 2027', projectedGmv: 5100000, projectedCommission: 510000, growthRate: 18 },
    { month: 'Abr 2027', projectedGmv: 5800000, projectedCommission: 580000, growthRate: 22 },
    { month: 'May 2027', projectedGmv: 7400000, projectedCommission: 740000, growthRate: 35 }, // Día de las Madres
    { month: 'Jun 2027', projectedGmv: 6200000, projectedCommission: 620000, growthRate: 20 },
    { month: 'Jul 2027', projectedGmv: 6900000, projectedCommission: 690000, growthRate: 24 },
    { month: 'Ago 2027', projectedGmv: 7800000, projectedCommission: 780000, growthRate: 26 },
    { month: 'Sep 2027', projectedGmv: 9200000, projectedCommission: 920000, growthRate: 40 }, // Fiestas Patrias
    { month: 'Oct 2027', projectedGmv: 8100000, projectedCommission: 810000, growthRate: 25 },
    { month: 'Nov 2027', projectedGmv: 9800000, projectedCommission: 980000, growthRate: 38 }, // Palenques & Ferias
    { month: 'Dic 2027', projectedGmv: 14500000, projectedCommission: 1450000, growthRate: 65 } // Temporada Alta Fin de Año
  ];

  readonly seasonalSpikes = [
    { season: 'Temporada Alta Fin de Año (Diciembre)', multiplier: '2.8x', volumeExpected: '$14.5M GMV', reason: 'Posadas corporativas, bodas de invierno y conciertos de Año Nuevo.' },
    { season: 'Fiestas Patrias (Septiembre)', multiplier: '2.2x', volumeExpected: '$9.2M GMV', reason: 'Festejos cívicos, palenques masivos y contrataciones de mariachi y banda.' },
    { season: 'Temporada de Graduaciones & Mayo', multiplier: '1.8x', volumeExpected: '$7.4M GMV', reason: 'Eventos de gala, festivales universitarios y serenatas.' }
  ];
}
