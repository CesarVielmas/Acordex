import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem, EventSoundSetup, EventSchedule, RiderCheckItem } from '../../../../core/models/event.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { lineup, money } from '../../event-metrics';

/**
 * Producción: qué equipo de audio lleva el evento y a qué hora pasa cada cosa
 * el día del show.
 *
 * La corrida del día se muestra junto al orden de entradas de los grupos a
 * propósito: son el mismo calendario visto desde dos lados, y los descuadres
 * —un grupo que llega después de su prueba de sonido, un show que empieza antes
 * de abrir puertas— solo se ven cuando ambos están a la vista.
 */
@Component({
  selector: 'app-event-tab-production',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent],
  host: { class: 'block' },
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

      <!-- ─── EQUIPO DE SONIDO ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-violet-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-violet-500/25 border-l-4 border-l-violet-500/70 shadow-2xl shadow-violet-500/5 space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-2">
          <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">speaker</span> Equipo de sonido
          </h5>
          @if (canViewFinances()) {
            <span class="text-[11px] font-black text-on-surface">{{ soundCost() }}</span>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <app-editable-field
            label="Quién lleva el audio"
            type="select"
            [options]="providerTypes"
            [value]="sound().providerType"
            [readonly]="!canEdit()"
            (save)="patchSound({ providerType: $any($event) })"
          />
          <app-editable-field
            label="Proveedor"
            placeholder="Nombre de la empresa o del grupo"
            [value]="sound().providerName || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ providerName: $event })"
          />
          <app-editable-field
            label="Ingeniero responsable"
            [value]="sound().engineerName || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ engineerName: $event })"
          />
          <app-editable-field
            label="Teléfono del ingeniero"
            type="tel"
            [value]="sound().engineerPhone || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ engineerPhone: $event })"
          />
          <app-editable-field
            label="Consola"
            placeholder="Ej. DiGiCo SD10"
            [value]="sound().consoleModel || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ consoleModel: $event })"
          />
          <app-editable-field
            label="Sistema de bocinas"
            placeholder="Ej. Line array L-Acoustics K2 · 24 cajas"
            [value]="sound().speakersSetup || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ speakersSetup: $event })"
          />
          <app-editable-field
            label="Monitores"
            placeholder="Ej. 12 de piso + 6 IEM"
            [value]="sound().monitorsSetup || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ monitorsSetup: $event })"
          />
          @if (canViewFinances()) {
            <app-editable-field
              label="Costo del equipo"
              type="number"
              prefix="$"
              [value]="sound().cost ?? 0"
              [readonly]="!canEdit()"
              (save)="patchSound({ cost: toNumber($event) })"
            />
          }
        </div>

        <div class="grid grid-cols-3 gap-3 pt-2 border-t border-outline-variant/20">
          <app-editable-field
            label="Montaje"
            placeholder="12:00"
            [value]="sound().loadInTime || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ loadInTime: $event })"
          />
          <app-editable-field
            label="Sound check inicia"
            placeholder="17:30"
            [value]="sound().soundCheckStart || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ soundCheckStart: $event })"
          />
          <app-editable-field
            label="Sound check termina"
            placeholder="19:00"
            [value]="sound().soundCheckEnd || ''"
            [readonly]="!canEdit()"
            (save)="patchSound({ soundCheckEnd: $event })"
          />
        </div>

        <!-- Rider -->
        <div class="pt-2 border-t border-outline-variant/20 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">checklist_rtl</span> Rider técnico
            </span>
            <span class="text-[9px] text-outline">{{ riderDone() }} de {{ rider().length }} cubiertos</span>
          </div>

          @for (item of rider(); track item.id) {
            <div class="flex items-center gap-2 p-2 rounded-lg bg-surface-container border border-outline-variant/20">
              <button
                type="button"
                (click)="toggleRider(item)"
                [disabled]="!canEdit()"
                class="shrink-0 disabled:pointer-events-none"
              >
                <span class="material-symbols-outlined text-base" [class]="item.done ? 'text-emerald-400' : 'text-outline'">
                  {{ item.done ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
              </button>
              <div class="flex-1 min-w-0">
                <app-editable-field
                  [value]="item.label"
                  valueClass="text-[11px] font-semibold text-on-surface break-words"
                  [readonly]="!canEdit()"
                  (save)="patchRider(item, { label: $event })"
                />
              </div>
              <div class="w-28 shrink-0">
                <app-editable-field
                  [value]="item.responsible || ''"
                  placeholder="Responsable"
                  valueClass="text-[10px] font-bold text-outline break-words"
                  [readonly]="!canEdit()"
                  (save)="patchRider(item, { responsible: $event })"
                />
              </div>
              @if (canEdit()) {
                <button
                  type="button"
                  (click)="removeRider(item)"
                  class="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                >
                  <span class="material-symbols-outlined text-[12px]">delete</span>
                </button>
              }
            </div>
          } @empty {
            <p class="text-[10px] text-outline italic">Sin requerimientos capturados.</p>
          }

          @if (canEdit()) {
            <button
              type="button"
              (click)="addRider()"
              class="px-2.5 py-1.5 min-h-9 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <span class="material-symbols-outlined text-[13px]">add</span> Agregar requerimiento
            </button>
          }
        </div>
      </section>

      <!-- ─── CORRIDA DEL DÍA ─── -->
      <section class="space-y-4">
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-violet-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-violet-500/25 border-l-4 border-l-violet-500/70 shadow-2xl shadow-violet-500/5 space-y-4 backdrop-blur-2xl">
          <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">schedule</span> Corrida del día
          </h5>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <app-editable-field
              label="Llamado de staff"
              type="datetime-local"
              [value]="schedule().crewCallAt || ''"
              [readonly]="!canEdit()"
              (save)="patchSchedule({ crewCallAt: $event })"
            />
            <app-editable-field
              label="Montaje / descarga"
              type="datetime-local"
              [value]="schedule().loadInAt || ''"
              [readonly]="!canEdit()"
              (save)="patchSchedule({ loadInAt: $event })"
            />
            <app-editable-field
              label="Prueba de sonido"
              type="datetime-local"
              [value]="schedule().soundCheckAt || ''"
              [readonly]="!canEdit()"
              (save)="patchSchedule({ soundCheckAt: $event })"
            />
            <app-editable-field
              label="Apertura de puertas"
              type="datetime-local"
              [value]="schedule().doorsOpenAt || ''"
              [readonly]="!canEdit()"
              (save)="patchSchedule({ doorsOpenAt: $event })"
            />
            <app-editable-field
              label="Inicio del show"
              type="datetime-local"
              [value]="schedule().showStartAt || ''"
              [readonly]="!canEdit()"
              (save)="patchSchedule({ showStartAt: $event })"
            />
            <app-editable-field
              label="Hora límite (curfew)"
              type="datetime-local"
              [value]="schedule().curfewAt || ''"
              [readonly]="!canEdit()"
              (save)="patchSchedule({ curfewAt: $event })"
            />
          </div>

          <app-editable-field
            label="Notas de producción"
            type="textarea"
            [rows]="2"
            valueClass="text-[11px] font-medium text-on-surface-variant break-words"
            [value]="schedule().notes || ''"
            [readonly]="!canEdit()"
            (save)="patchSchedule({ notes: $event })"
          />
        </div>

        <!-- Orden de entradas, para cotejar contra la corrida -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
          <h5 class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">queue_music</span> Orden de entradas (referencia)
          </h5>
          @for (slot of slots(); track slot.id) {
            <div class="flex items-center gap-2 p-2 rounded-lg bg-surface-container border border-outline-variant/20 text-[11px]">
              <span class="w-5 h-5 rounded-md bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center shrink-0">
                {{ slot.order }}
              </span>
              <span class="font-bold text-on-surface truncate flex-1 min-w-0">{{ slot.groupName }}</span>
              <span class="font-mono text-outline shrink-0">
                llega {{ slot.arrivalTime || '--:--' }} · toca {{ slot.setStartTime || '--:--' }}
              </span>
            </div>
          } @empty {
            <p class="text-[10px] text-outline italic">Sin grupos en el cartel.</p>
          }
        </div>
      </section>
    </div>
  `
})
export class EventTabProductionComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(false);
  canViewFinances = input<boolean>(false);

  patch = output<Partial<EventItem>>();

  readonly providerTypes: EditableOption[] = [
    { value: 'Por Definir', label: 'Por definir' },
    { value: 'Equipo Propio de un Grupo', label: 'Equipo propio de un grupo' },
    { value: 'Proveedor Externo', label: 'Proveedor externo' },
    { value: 'Equipo del Recinto', label: 'Equipo del recinto' }
  ];

  sound = computed<EventSoundSetup>(() => this.event().sound || { providerType: 'Por Definir' });
  schedule = computed<EventSchedule>(() => this.event().schedule || {});
  rider = computed<RiderCheckItem[]>(() => this.sound().riderChecklist || []);
  riderDone = computed(() => this.rider().filter(r => r.done).length);
  slots = computed(() => lineup(this.event()));
  soundCost = computed(() => money(this.sound().cost || 0));

  toNumber(value: string): number {
    return Math.max(0, Number(String(value).replace(/[^0-9.-]/g, '')) || 0);
  }

  patchSound(changes: Partial<EventSoundSetup>): void {
    this.patch.emit({ sound: { ...this.sound(), ...changes } });
  }

  patchSchedule(changes: Partial<EventSchedule>): void {
    this.patch.emit({ schedule: { ...this.schedule(), ...changes } });
  }

  addRider(): void {
    const item: RiderCheckItem = {
      id: 'r-' + this.event().id + '-' + Date.now(),
      label: 'Nuevo requerimiento',
      done: false
    };
    this.patchSound({ riderChecklist: [...this.rider(), item] });
  }

  patchRider(item: RiderCheckItem, changes: Partial<RiderCheckItem>): void {
    this.patchSound({ riderChecklist: this.rider().map(r => (r.id === item.id ? { ...r, ...changes } : r)) });
  }

  toggleRider(item: RiderCheckItem): void {
    this.patchRider(item, { done: !item.done });
  }

  removeRider(item: RiderCheckItem): void {
    this.patchSound({ riderChecklist: this.rider().filter(r => r.id !== item.id) });
  }
}
