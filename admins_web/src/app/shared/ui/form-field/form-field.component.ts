import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent, SelectOption } from '../custom-select/custom-select.component';

export interface FormFieldOption {
  label: string;
  value: string;
}

export type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'select';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  template: `
    <div>
      @if (type !== 'select' && label) {
        <label class="block text-outline font-medium mb-1 text-xs">{{ label }}</label>
      }

      @switch (type) {
        @case ('select') {
          <app-custom-select
            [label]="label"
            [placeholder]="placeholder || 'Seleccionar...'"
            [options]="customSelectOptions"
            [value]="value + ''"
            (valueChange)="valueChange.emit($event)"
          />
        }
        @case ('textarea') {
          <textarea
            [ngModel]="value"
            (ngModelChange)="valueChange.emit($event)"
            [placeholder]="placeholder"
            rows="3"
            class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-on-surface text-xs font-medium resize-none"
          ></textarea>
        }
        @default {
          <input
            [ngModel]="value"
            (ngModelChange)="valueChange.emit($event)"
            [type]="type"
            [placeholder]="placeholder"
            class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-on-surface text-xs font-medium min-h-11"
          />
        }
      }
    </div>
  `
})
export class FormFieldComponent {
  @Input() label: string = '';
  @Input() type: FormFieldType = 'text';
  @Input() value: string | number = '';
  @Input() placeholder: string = '';
  @Input() options: FormFieldOption[] = [];
  @Output() valueChange = new EventEmitter<string | number>();

  get customSelectOptions(): SelectOption[] {
    return this.options.map(o => ({
      value: o.value,
      label: o.label
    }));
  }
}
