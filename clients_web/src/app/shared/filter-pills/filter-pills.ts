import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-pills',
  imports: [CommonModule],
  templateUrl: './filter-pills.html',
  styleUrl: './filter-pills.scss'
})
export class FilterPills {
  @Input() filters: string[] = [];
  @Input() activeFilter: string = '';
  @Output() filterSelected = new EventEmitter<string>();

  selectFilter(filter: string) {
    this.filterSelected.emit(filter);
  }
}
