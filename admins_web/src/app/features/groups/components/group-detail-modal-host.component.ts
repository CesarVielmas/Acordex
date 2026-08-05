import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutStateService } from '../../../core/services/layout_state.service';
import { GroupDetailModalComponent } from './group-detail-modal.component';

/**
 * Punto de montaje del expediente de grupo, a la altura del layout raíz.
 *
 * Existe por una razón concreta de apilamiento: renderizado desde la pantalla
 * de Grupos, el modal vive dentro de `<main>` y queda por debajo del sidebar
 * por más z-index que se le ponga, porque compite dentro del contexto de esa
 * columna. Montado aquí —igual que el modal de cotizaciones— cubre la pantalla
 * completa de verdad.
 */
@Component({
  selector: 'app-group-detail-modal-host',
  standalone: true,
  imports: [CommonModule, GroupDetailModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (layoutState.activeGroup(); as group) {
      <app-group-detail-modal [group]="group" (closed)="layoutState.closeGroupModal()" />
    }
  `
})
export class GroupDetailModalHostComponent {
  layoutState = inject(LayoutStateService);
}
