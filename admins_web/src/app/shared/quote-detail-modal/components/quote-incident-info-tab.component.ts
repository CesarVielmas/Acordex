import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Quote, QuoteIncident } from '../../../core/models/admin.models';
import { QuoteIncidentSummaryCardComponent } from './quote-incident-summary-card.component';
import { QuoteClientInfoTabComponent } from './quote-client-info-tab.component';

@Component({
  selector: 'app-quote-incident-info-tab',
  standalone: true,
  imports: [CommonModule, QuoteIncidentSummaryCardComponent, QuoteClientInfoTabComponent],
  template: `
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 font-sans">
      <app-quote-incident-summary-card [incident]="incident" />

      <div class="space-y-2">
        <span class="text-[10px] font-black text-outline uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <span class="material-symbols-outlined text-sm">history_edu</span>
          INFORMACIÓN DEL EVENTO ORIGINALMENTE ACORDADO
        </span>
        <app-quote-client-info-tab [quote]="quote" />
      </div>
    </div>
  `
})
export class QuoteIncidentInfoTabComponent {
  @Input() quote: Quote | null = null;
  @Input() incident: QuoteIncident | null = null;
}
