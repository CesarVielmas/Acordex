import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetricsEngineService } from '../../core/services/metrics-engine.service';
import { GroupCommissionItem } from '../../core/models/vielais.models';

@Component({
  selector: 'app-comisiones-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comisiones-grupos.component.html'
})
export class ComisionesGruposComponent {
  readonly metrics = inject(MetricsEngineService);

  searchQuery = signal<string>('');
  selectedGenre = signal<string>('Todos');
  selectedGroupDetail = signal<GroupCommissionItem | null>(null);

  readonly genres = ['Todos', 'Banda Sinaloense', 'Mariachi Tradicional', 'Norteño-Banda / Corridos', 'Cumbia & Tropical', 'Norteño Clásico'];

  get filteredGroups(): GroupCommissionItem[] {
    const list = this.metrics.groupCommissions();
    const q = this.searchQuery().toLowerCase().trim();
    const g = this.selectedGenre();

    return list.filter(item => {
      const matchSearch = !q || item.groupName.toLowerCase().includes(q) || item.managerName.toLowerCase().includes(q);
      const matchGenre = g === 'Todos' || item.genre === g;
      return matchSearch && matchGenre;
    });
  }

  openDetail(group: GroupCommissionItem): void {
    this.selectedGroupDetail.set(group);
  }

  closeDetail(): void {
    this.selectedGroupDetail.set(null);
  }
}
