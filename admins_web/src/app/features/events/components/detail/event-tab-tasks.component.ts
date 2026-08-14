import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EventFieldProposal, EventItem, EventTask, EventProductionItem, EventTaskTransfer,
  ProductionCategory, ProductionItemStatus
} from '../../../../core/models/event.models';
import { SessionService } from '../../../../core/services/session.service';
import { RoleService } from '../../../../core/services/role.service';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { eventCompleteness } from '../../event-completeness';
import { eventTaskPolicy } from '../../../../core/models/event-state.meta';
import {
  acceptProposal, activeIntervention, approversOf, canDecideProposals,
  getTabForChecklistItem, isSystemActor, pendingProposals, rejectProposal,
  resolveTasks, ResolvedTask
} from '../../event-tasks';
import { FieldProposalsComponent } from '../../../../shared/ui/field-proposals/field-proposals.component';
import { PRODUCTION_CATEGORIES, productionCategoryMeta } from '../../production-catalog';
import { EventDetailTab } from '../event-detail-modal.component';
import { money } from '../../event-metrics';

/**
 * Tareas del evento: quién responde por cada cosa y cómo se demuestra que se hizo.
 *
 * Hay dos naturalezas distintas y la pestaña no las trata igual porque no lo son:
 *
 *   **Los puntos del expediente** son los datos que la ficha pública necesita
 *   —el título, el cartel, los precios, el croquis—. El sistema sabe solo si
 *   están o no, así que aquí no hay ningún botón de "ya lo hice": se marcan al
 *   capturar el dato y no hay forma de mentirle. Lo único que se decide en esta
 *   pestaña es *a quién se le encarga*.
 *
 *   **Los encargos operativos** son lo que pasa fuera del sistema: contratar el
 *   audio, conseguir las mesas, pagar la ambulancia. Nada de eso se puede
 *   detectar —tendría que existir un módulo por cada cosa que se contrata en un
 *   evento—, así que la única prueba posible es que el responsable lo confirme.
 *   Puede confirmarlo a secas o desglosar en qué se le fue el dinero, y ese
 *   desglose *es* el bloque que aparece en Producción: no son dos capturas, es
 *   la misma vista desde los dos lados.
 *
 * Y sobre las dos, el reparto: un manager delega a su gente dentro de casa —eso
 * no se le pregunta a nadie, es su equipo— o se la pasa a otro manager, y eso sí
 * se pregunta, porque nadie carga con una responsabilidad que no aceptó.
 */
@Component({
  selector: 'app-event-tab-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, FieldProposalsComponent],
  host: { class: 'block pt-4' },
  template: `
    <div class="space-y-6">

      <!-- ═══ ENCABEZADO ═══ -->
      <section class="relative overflow-hidden p-6 sm:p-7 rounded-[2rem] bg-gradient-to-br from-amber-500/[0.10] via-surface-container-high/90 to-surface-container-high/90 border border-amber-500/25 border-l-4 border-l-amber-500/70 shadow-2xl backdrop-blur-2xl space-y-6">
        <div class="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex items-start justify-between gap-5 flex-wrap">
          <div class="flex items-start gap-4 min-w-0 flex-1">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <span class="material-symbols-outlined text-2xl">assignment_ind</span>
            </div>
            <div class="space-y-1.5 min-w-0 flex-1">
              <h4 class="font-['Epilogue'] font-black text-xl sm:text-2xl text-on-surface tracking-tight leading-tight">
                Quién responde por qué
              </h4>
              <p class="text-[11px] text-outline leading-relaxed max-w-2xl">
                Los <strong class="text-sky-300">puntos del expediente</strong> los cierra el sistema al capturar el dato; aquí solo se decide de quién son.
                Los <strong class="text-amber-300">encargos operativos</strong> los confirma su responsable, y su desglose de gastos es el mismo que ves en Producción.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap shrink-0">
            @if (canAssign()) {
            <button
              type="button"
              (click)="assignPanelOpen.set(!assignPanelOpen()); createPanelOpen.set(false)"
              class="px-4 py-2.5 rounded-2xl border font-bold text-[11px] transition-all flex items-center gap-2 active:scale-95"
              [class]="assignPanelOpen()
                ? 'bg-sky-400 text-black border-sky-300 shadow-lg shadow-sky-500/25'
                : 'bg-sky-500/12 hover:bg-sky-500/20 border-sky-400/35 text-sky-300'"
            >
              <span class="material-symbols-outlined text-base">how_to_reg</span>
              Encargar punto del expediente
            </button>
            }

            @if (canCreate()) {
            <button
              type="button"
              (click)="createPanelOpen.set(!createPanelOpen()); assignPanelOpen.set(false)"
              class="px-4 py-2.5 rounded-2xl font-black text-[11px] transition-all flex items-center gap-2 active:scale-95 border"
              [class]="createPanelOpen()
                ? 'bg-amber-300 text-black border-amber-200 shadow-lg shadow-amber-500/30'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black border-amber-300/40 shadow-[0_0_22px_rgba(242,202,80,0.28)]'"
            >
              <span class="material-symbols-outlined text-base">add_task</span>
              Nuevo encargo operativo
            </button>
            }
          </div>
        </div>

        @if (policy().notice) {
          <div class="relative z-10 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-2.5">
            <span class="material-symbols-outlined text-base text-outline shrink-0">lock</span>
            <p class="text-[11px] text-on-surface-variant leading-relaxed">{{ policy().notice }}</p>
          </div>
        }

        <!-- ─── Cifras ─── -->
        <div class="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5">

          <!-- Expediente: nunca es una alarma en Borrador. Un borrador
               incompleto es un borrador, no un problema; lo que dice esta cifra
               es cuánto falta para poder publicar, que es otra cosa. -->
          <div class="p-4 rounded-2xl border bg-white/[0.03] backdrop-blur-xl space-y-2.5"
            [class]="requiredPending() === 0
              ? 'border-emerald-500/30'
              : (isDraft() ? 'border-white/10' : 'border-rose-500/30')">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-black uppercase tracking-widest"
                [class]="requiredPending() === 0 ? 'text-emerald-300' : (isDraft() ? 'text-outline' : 'text-rose-300')">
                Expediente
              </span>
              <span class="material-symbols-outlined text-base"
                [class]="requiredPending() === 0 ? 'text-emerald-400' : (isDraft() ? 'text-outline' : 'text-rose-400')">
                {{ requiredPending() === 0 ? 'verified' : 'checklist' }}
              </span>
            </div>
            <div class="text-3xl font-black font-mono leading-none"
              [class]="requiredPending() === 0 ? 'text-emerald-400' : (isDraft() ? 'text-on-surface' : 'text-rose-400')">
              {{ requiredDone() }}<span class="text-lg text-outline">/{{ requiredTotal() }}</span>
            </div>
            <span class="text-[10px] text-outline block leading-snug">
              @if (requiredPending() === 0) {
                Puntos obligatorios listos
              } @else {
                Faltan {{ requiredPending() }} para poder publicar
              }
            </span>
          </div>

          <!-- Encargos operativos -->
          <div class="p-4 rounded-2xl border border-amber-500/25 bg-white/[0.03] backdrop-blur-xl space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-black uppercase tracking-widest text-amber-300">Encargos</span>
              <span class="material-symbols-outlined text-base text-amber-400">handyman</span>
            </div>
            <div class="text-3xl font-black font-mono text-amber-300 leading-none">
              {{ optionalDone() }}<span class="text-lg text-outline">/{{ optionalTotal() }}</span>
            </div>
            <span class="text-[10px] text-outline block leading-snug">Operativos confirmados</span>
          </div>

          <!-- Esperan tu respuesta: solo cuenta lo que te toca contestar a ti. -->
          <div class="p-4 rounded-2xl border bg-white/[0.03] backdrop-blur-xl space-y-2.5"
            [class]="awaitingMe() > 0 ? 'border-amber-400/50 shadow-lg shadow-amber-500/10' : 'border-white/10'">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-black uppercase tracking-widest"
                [class]="awaitingMe() > 0 ? 'text-amber-300' : 'text-outline'">Te toca contestar</span>
              <span class="material-symbols-outlined text-base"
                [class]="awaitingMe() > 0 ? 'text-amber-400' : 'text-outline'">swap_horiz</span>
            </div>
            <div class="text-3xl font-black font-mono leading-none"
              [class]="awaitingMe() > 0 ? 'text-amber-300' : 'text-on-surface-variant'">
              {{ awaitingMe() }}
            </div>
            <span class="text-[10px] text-outline block leading-snug">
              {{ awaitingMe() > 0 ? 'Transferencias dirigidas a ti' : 'Sin transferencias por responder' }}
            </span>
          </div>

          <!-- Desglosado -->
          @if (canViewFinances()) {
            <div class="p-4 rounded-2xl border border-violet-500/25 bg-white/[0.03] backdrop-blur-xl space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-violet-300">Desglosado</span>
                <span class="material-symbols-outlined text-base text-violet-400">receipt_long</span>
              </div>
              <div class="text-2xl font-black font-mono text-violet-200 leading-none">{{ money(linkedSpend()) }}</div>
              <span class="text-[10px] text-outline block leading-snug">
                {{ linkedItemCount() }} partida(s) desde encargos
              </span>
            </div>
          } @else {
            <div class="p-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-outline">Delegadas</span>
                <span class="material-symbols-outlined text-base text-outline">groups</span>
              </div>
              <div class="text-3xl font-black font-mono text-on-surface-variant leading-none">{{ delegatedCount() }}</div>
              <span class="text-[10px] text-outline block leading-snug">En manos de tu staff</span>
            </div>
          }
        </div>

        <!-- ─── Panel: encargar un punto del expediente ─── -->
        @if (assignPanelOpen()) {
          <div class="relative z-10 p-5 rounded-2xl bg-sky-950/25 border border-sky-500/30 space-y-4 animate-fade-in">
            <div class="flex items-start gap-2.5">
              <span class="material-symbols-outlined text-lg text-sky-400 shrink-0">how_to_reg</span>
              <div class="space-y-0.5 min-w-0">
                <h6 class="text-xs font-black text-sky-300">Encargar un punto del expediente</h6>
                <p class="text-[11px] text-outline leading-relaxed">
                  Esto no completa el punto: le pone nombre y apellido. El punto se cierra solo cuando el dato aparece capturado.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Punto del expediente</label>
                <select
                  [(ngModel)]="assignItemId"
                  (ngModelChange)="onAssignItemChange($event)"
                  class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-sky-400"
                >
                  <option value="">— Elige el punto —</option>
                  @for (g of checklistByGroup(); track g.group) {
                    <optgroup [label]="g.group">
                      @for (i of g.items; track i.id) {
                        <option [value]="i.id">{{ i.done ? '✓ ' : '' }}{{ i.label }}{{ i.required ? ' · obligatorio' : '' }}</option>
                      }
                    </optgroup>
                  }
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Disquera responsable</label>
                <select
                  [(ngModel)]="assignManager"
                  class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-sky-400"
                >
                  <option value="">— Elige la disquera —</option>
                  @for (m of managerList(); track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="assignPanelOpen.set(false)" class="px-4 py-2 rounded-xl text-outline hover:text-on-surface text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitAssign()"
                [disabled]="!assignItemId || !assignManager"
                class="px-5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-black text-xs disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                Encargar punto
              </button>
            </div>
          </div>
        }

        <!-- ─── Panel: nuevo encargo operativo ─── -->
        @if (createPanelOpen()) {
          <div class="relative z-10 p-5 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-4 animate-fade-in">
            <div class="flex items-start gap-2.5">
              <span class="material-symbols-outlined text-lg text-amber-400 shrink-0">add_task</span>
              <div class="space-y-0.5 min-w-0">
                <h6 class="text-xs font-black text-amber-300">Nuevo encargo operativo</h6>
                <p class="text-[11px] text-outline leading-relaxed">
                  Algo que pasa fuera del sistema y que alguien tiene que confirmar. El desglose de gastos se puede capturar después, al confirmarlo.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="space-y-1 md:col-span-2">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Qué hay que hacer *</label>
                <input
                  type="text"
                  [(ngModel)]="newTitle"
                  placeholder="Ej: Contratar el equipo de audio del escenario principal"
                  class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-amber-400"
                />
              </div>

              <div class="space-y-1 md:col-span-2">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Detalle o especificación</label>
                <textarea
                  [(ngModel)]="newDetail"
                  rows="2"
                  placeholder="Line array, dos consolas digitales, operador para prueba de sonido y show…"
                  class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-amber-400"
                ></textarea>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Disquera responsable</label>
                <select
                  [(ngModel)]="newManager"
                  class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-amber-400"
                >
                  @for (m of managerList(); track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Prioridad</label>
                <select
                  [(ngModel)]="newPriority"
                  class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-amber-400"
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              @if (canViewFinances()) {
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase tracking-wider text-outline">Presupuesto estimado (opcional)</label>
                  <input
                    type="number"
                    [(ngModel)]="newEstimate"
                    placeholder="92000"
                    class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-on-surface focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase tracking-wider text-outline">Rubro previsto (opcional)</label>
                  <select
                    [(ngModel)]="newCategory"
                    class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-amber-400"
                  >
                    @for (c of categories; track c.key) {
                      <option [value]="c.key">{{ c.key }}</option>
                    }
                  </select>
                </div>
              }
            </div>

            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="createPanelOpen.set(false)" class="px-4 py-2 rounded-xl text-outline hover:text-on-surface text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitCreate()"
                [disabled]="!newTitle.trim()"
                class="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                Crear encargo
              </button>
            </div>
          </div>
        }
      </section>

      <!-- ═══ FILTROS ═══ -->
      <section class="flex items-center gap-2.5 flex-wrap">
        <div class="relative flex-1 min-w-[200px]">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-outline pointer-events-none">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar por tarea, detalle o responsable…"
            class="w-full bg-surface-container/70 border border-outline-variant/25 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-amber-400/60"
          />
        </div>

        @for (f of filters(); track f.value) {
          <button
            type="button"
            (click)="activeFilter.set(f.value)"
            class="px-3.5 py-2.5 rounded-2xl border text-[11px] font-bold transition-all flex items-center gap-2 shrink-0"
            [class]="activeFilter() === f.value
              ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-500/20'
              : 'bg-surface-container/70 text-on-surface-variant border-outline-variant/25 hover:border-amber-400/40'"
          >
            <span class="material-symbols-outlined text-sm">{{ f.icon }}</span>
            {{ f.label }}
            <span class="px-1.5 rounded-md font-mono font-black"
              [class]="activeFilter() === f.value ? 'bg-black/20' : 'bg-white/5 text-outline'">{{ f.count }}</span>
          </button>
        }
      </section>

      <!-- ═══ LISTA ═══ -->
      <div class="space-y-3">
        @for (t of filteredTasks(); track t.id) {
          @let expanded = isExpanded(t.id);
          @let optional = t.kind === 'externa';
          @let mine = canManageTask(t);
          @let incoming = incomingTransfer(t);
          @let outgoing = outgoingTransfer(t);

          <div
            class="rounded-3xl border transition-all duration-300 overflow-hidden backdrop-blur-xl"
            [class]="incoming
              ? 'bg-amber-500/[0.07] border-amber-400/50 shadow-lg shadow-amber-500/10'
              : (t.done
                ? 'bg-surface-container/40 border-emerald-500/20'
                : 'bg-surface-container-high/60 border-outline-variant/25 hover:border-amber-400/30')"
          >
            <!-- ─── Cabecera ─── -->
            <div
              (click)="toggleExpand(t.id)"
              class="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer group"
            >
              <div class="flex items-start gap-3.5 min-w-0 flex-1">
                <!-- Marca de estado -->
                <div
                  class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5"
                  [class]="t.done
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : (optional
                      ? 'bg-amber-500/12 border-amber-500/35 text-amber-400'
                      : 'bg-sky-500/12 border-sky-500/35 text-sky-400')"
                >
                  <span class="material-symbols-outlined text-lg">
                    {{ t.done ? 'check_circle' : (optional ? 'handyman' : 'fact_check') }}
                  </span>
                </div>

                <div class="min-w-0 flex-1 space-y-2">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <!-- Naturaleza -->
                    <span class="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1"
                      [class]="optional
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/35'">
                      {{ optional ? 'Encargo operativo' : 'Punto del expediente' }}
                    </span>

                    @if (t.group) {
                      <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold border border-white/10 bg-white/5 text-outline">{{ t.group }}</span>
                    }

                    <!-- Obligatorio: el tono depende de si ya pesa o todavía no.
                         En Borrador es información; a partir de revisión es un
                         candado real sobre la publicación. -->
                    @if (t.blocking && !t.done) {
                      <span class="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1"
                        [class]="isDraft()
                          ? 'bg-white/5 text-outline border-white/10'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'">
                        <span class="material-symbols-outlined text-[11px]">{{ isDraft() ? 'flag' : 'lock' }}</span>
                        {{ isDraft() ? 'Obligatorio para publicar' : 'Falta para publicar' }}
                      </span>
                    }

                    @if (incoming) {
                      <span class="px-2.5 py-0.5 rounded-lg bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <span class="material-symbols-outlined text-[11px]">how_to_vote</span> Te toca contestar
                      </span>
                    } @else if (outgoing) {
                      <span class="px-2.5 py-0.5 rounded-lg bg-white/5 text-amber-300/80 border border-amber-500/25 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span class="material-symbols-outlined text-[11px]">hourglass_top</span> Esperando a {{ outgoing.toManager }}
                      </span>
                    } @else {
                      <span [class]="statusClass(t)" class="px-2.5 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider">
                        {{ statusLabel(t) }}
                      </span>
                    }

                    @if (t.productionItems.length && canViewFinances()) {
                      <span class="px-2.5 py-0.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/35 text-[9px] font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-[11px]">receipt_long</span>
                        {{ t.productionItems.length }} partida(s) · {{ money(t.productionTotal) }}
                      </span>
                    }
                  </div>

                  <h5 class="text-sm sm:text-base font-bold leading-snug transition-colors"
                    [class]="t.done ? 'text-on-surface-variant' : 'text-on-surface group-hover:text-amber-300'">
                    {{ t.title }}
                  </h5>
                </div>
              </div>

              <div class="flex items-center gap-3.5 shrink-0">
                <div class="hidden md:flex flex-col items-end text-right">
                  <span class="text-[9px] font-black uppercase tracking-widest text-outline">Responsable</span>
                  <span class="text-[11px] font-bold flex items-center gap-1"
                    [class]="mine ? 'text-amber-300' : 'text-on-surface-variant'">
                    <span class="material-symbols-outlined text-xs">business</span>
                    {{ t.assignedManager || 'Sin encargar' }}
                  </span>
                  @if (t.delegate) {
                    <span class="text-[9px] text-violet-300 flex items-center gap-1">
                      <span class="material-symbols-outlined text-[11px]">badge</span>
                      {{ t.delegate.name }}
                    </span>
                  }
                </div>

                <div class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-outline group-hover:text-on-surface transition-all"
                  [class.rotate-180]="expanded">
                  <span class="material-symbols-outlined text-lg">expand_more</span>
                </div>
              </div>
            </div>

            <!-- ─── Cuerpo ─── -->
            @if (expanded) {
              <div class="px-4 sm:px-5 pb-5 space-y-4 border-t border-white/10 pt-4 animate-fade-in">

                @if (t.detail) {
                  <p class="text-[11px] text-on-surface-variant leading-relaxed p-3.5 rounded-2xl bg-black/30 border border-white/5">
                    {{ t.detail }}
                  </p>
                }

                <!-- ── Transferencia dirigida a mí: yo decido ── -->
                @if (incoming) {
                  <div class="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-black/40 border border-amber-400/40 space-y-4">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-xl">swap_horiz</span>
                      </div>
                      <div class="min-w-0 space-y-0.5">
                        <h6 class="font-black text-xs text-amber-300">{{ incoming.fromManager }} quiere pasarte esta tarea</h6>
                        <p class="text-[11px] text-outline">Solicitado el {{ incoming.requestedAt }}. Si aceptas, la responsabilidad pasa a ser tuya.</p>
                      </div>
                    </div>

                    <div class="p-3.5 rounded-xl bg-black/50 border border-amber-500/20">
                      <span class="text-[9px] font-black uppercase tracking-wider text-amber-300/90 block mb-1">Motivo</span>
                      <p class="text-[11px] text-on-surface leading-relaxed italic">"{{ incoming.reason }}"</p>
                    </div>

                    <div class="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        (click)="acceptTransfer(t)"
                        class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black font-black text-[11px] shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
                      >
                        <span class="material-symbols-outlined text-base">check_circle</span> Aceptar y hacerme cargo
                      </button>
                      @if (!rejectOpen()[t.id]) {
                        <button
                          type="button"
                          (click)="toggleReject(t.id)"
                          class="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[11px] transition-all flex items-center gap-2"
                        >
                          <span class="material-symbols-outlined text-base">cancel</span> Rechazar
                        </button>
                      }
                    </div>

                    @if (rejectOpen()[t.id]) {
                      <div class="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2.5 animate-fade-in">
                        <label class="block text-[11px] font-bold text-rose-300">Por qué no puedes asumirla *</label>
                        <textarea
                          [ngModel]="rejectReason[t.id] || ''"
                          (ngModelChange)="rejectReason[t.id] = $event"
                          rows="2"
                          placeholder="Explica el motivo; le llegará a quien te la envió."
                          class="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-[11px] text-on-surface focus:outline-none focus:border-rose-400"
                        ></textarea>
                        <div class="flex items-center justify-end gap-2">
                          <button type="button" (click)="toggleReject(t.id)" class="px-3 py-1.5 rounded-lg text-outline hover:text-on-surface text-[11px]">Cancelar</button>
                          <button
                            type="button"
                            (click)="rejectTransfer(t)"
                            [disabled]="!rejectReason[t.id]?.trim()"
                            class="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-[11px] disabled:opacity-40"
                          >
                            Confirmar rechazo
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- ── Transferencia que yo pedí: solo esperar o retirarla ── -->
                @if (outgoing) {
                  <div class="p-4 rounded-2xl bg-black/30 border border-amber-500/25 flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-start gap-3 min-w-0">
                      <span class="material-symbols-outlined text-lg text-amber-400 shrink-0">hourglass_top</span>
                      <div class="min-w-0 space-y-0.5">
                        <p class="text-[11px] font-bold text-on-surface">
                          Esperando a que <strong class="text-amber-300">{{ outgoing.toManager }}</strong> acepte o rechace
                        </p>
                        <p class="text-[10px] text-outline italic">"{{ outgoing.reason }}"</p>
                        <p class="text-[10px] text-outline">
                          Hasta que conteste, la tarea sigue siendo responsabilidad de {{ outgoing.fromManager }}.
                        </p>
                      </div>
                    </div>
                    @if (mine) {
                      <button
                        type="button"
                        (click)="cancelTransfer(t)"
                        class="text-[11px] text-rose-400 hover:text-rose-300 underline font-bold shrink-0"
                      >
                        Retirar solicitud
                      </button>
                    }
                  </div>
                }

                <!-- ── Punto del expediente ── -->
                @if (!optional) {
                  <div class="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/25 space-y-3">
                    <div class="flex items-start justify-between gap-3 flex-wrap">
                      <div class="flex items-start gap-2.5 min-w-0">
                        <span class="material-symbols-outlined text-lg text-sky-400 shrink-0">fact_check</span>
                        <div class="space-y-1 min-w-0">
                          <h6 class="text-[11px] font-black text-sky-300">Lo verifica el sistema, no un botón</h6>
                          <p class="text-[11px] text-outline leading-relaxed">
                            Este punto se cierra solo en cuanto el dato aparece capturado en el expediente. Por eso aquí no hay nada que confirmar a mano:
                            no habría manera de distinguir un dato capturado de alguien diciendo que lo capturó.
                          </p>
                        </div>
                      </div>
                      <span class="px-3 py-1 rounded-xl text-[10px] font-bold border shrink-0 flex items-center gap-1.5"
                        [class]="t.done
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                          : 'bg-white/5 text-outline border-white/10'">
                        <span class="material-symbols-outlined text-sm">{{ t.done ? 'check_circle' : 'radio_button_unchecked' }}</span>
                        {{ t.done ? 'Capturado' : 'Sin capturar' }}
                      </span>
                    </div>

                    @if (t.done) {
                      <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                        <div class="flex items-center gap-1.5 font-bold text-emerald-300">
                          <span class="material-symbols-outlined text-sm">verified</span>
                          <span>Completado y Verificado</span>
                          @if (intervenerOf(t)) {
                            <span class="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-wider">
                              Intervenida
                            </span>
                          }
                        </div>
                        <p class="text-[11px] text-emerald-200/90">
                          Resuelto por <strong class="text-on-surface">{{ resolvedByOf(t) }}</strong>
                          @if (resolvedAtOf(t)) {
                            <span class="text-emerald-300/80 font-mono"> · {{ resolvedAtOf(t) }}</span>
                          }
                        </p>
                        @if (intervenerOf(t) && t.assignedManager) {
                          <p class="text-[10px] text-amber-200/90 leading-snug">
                            Lo capturó {{ intervenerOf(t) }} interviniendo en un punto de {{ t.assignedManager }}.
                            Mientras siga así, los dos pueden corregirlo y los dos deciden lo que otros propongan.
                          </p>
                        }
                      </div>
                    }

                    <!-- ── Los cambios que otros managers proponen sobre este dato ──
                         Van aquí y no solo junto al campo porque esta es la pantalla
                         donde el encargado revisa lo suyo: si únicamente vivieran en el
                         formulario, tendría que recorrer las cinco pestañas del
                         expediente para enterarse de que alguien le propuso algo. -->
                    @if (proposalsOf(t).length) {
                      <div class="rounded-2xl bg-amber-500/[0.07] border border-amber-400/40 overflow-hidden">
                        <div class="px-4 py-3 flex items-start justify-between gap-3 flex-wrap border-b border-amber-500/20 bg-amber-500/[0.06]">
                          <div class="flex items-start gap-2.5 min-w-0">
                            <span class="material-symbols-outlined text-lg text-amber-400 shrink-0">rate_review</span>
                            <div class="min-w-0 space-y-0.5">
                              <h6 class="text-[11px] font-black text-amber-300">
                                {{ proposalsOf(t).length }} cambio(s) esperando decisión
                              </h6>
                              <p class="text-[10px] text-outline leading-relaxed">
                                @if (canDecideOn(t)) {
                                  Otros managers proponen cambiar este dato. Cuando varios proponen sobre el mismo campo
                                  solo puede quedar uno: al aceptar una, las demás de ese campo se descartan solas.
                                } @else {
                                  Lo decide {{ approversLabel(t) }}. Tu propuesta se aplica solo si la acepta{{ intervenerOf(t) ? 'n' : '' }}.
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Se desplaza en su sitio en vez de estirar la tarjeta:
                             con cuatro propuestas encima, el encargado perdía de
                             vista las demás tareas y tenía que buscar el final
                             de la lista para volver. -->
                        <div class="p-3 space-y-3 scroll-oculto max-h-[19rem]">
                          @for (group of proposalGroupsOf(t); track group.fieldKey) {
                            <div class="space-y-1.5">
                              <div class="flex items-center gap-2">
                                <span class="text-[9px] font-black uppercase tracking-widest text-outline">{{ group.fieldLabel }}</span>
                                @if (group.items.length > 1) {
                                  <span class="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[8px] font-black uppercase tracking-wider">
                                    {{ group.items.length }} en disputa
                                  </span>
                                }
                              </div>
                              <app-field-proposals
                                [proposals]="group.items"
                                [canDecide]="canDecideOn(t)"
                                [owner]="approversLabel(t)"
                                (accept)="acceptChange(t, $event)"
                                (reject)="rejectChange(t, $event)"
                              />
                            </div>
                          }
                        </div>
                      </div>
                    }

                    @if (t.checklistItemId) {
                      <button
                        type="button"
                        (click)="goToData(t.checklistItemId)"
                        class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 text-black font-black text-[11px] transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 active:scale-95"
                      >
                        <span class="material-symbols-outlined text-base">open_in_new</span>
                        {{ t.done ? 'Ver el dato en el expediente' : 'Ir a capturarlo' }}
                      </button>
                    }
                  </div>
                }

                <!-- ── Encargo operativo: confirmar ── -->
                @if (optional && !t.done) {
                  <div class="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                    <div class="flex items-start gap-2.5">
                      <span class="material-symbols-outlined text-lg text-emerald-400 shrink-0">task_alt</span>
                      <div class="space-y-0.5 min-w-0">
                        <h6 class="text-[11px] font-black text-on-surface">Confirmar que ya se hizo</h6>
                        <p class="text-[10px] text-outline leading-relaxed">
                          El sistema no puede verlo: la confirmación de {{ t.assignedManager || 'quien responde' }} es la única prueba.
                          Desglosar el gasto es opcional, pero es lo que deja rastro de en qué se fue el dinero.
                        </p>
                      </div>
                    </div>

                    @if (mine) {
                      <div class="flex items-center gap-2.5 flex-wrap">
                        <input
                          type="text"
                          [ngModel]="completionNote[t.id] || ''"
                          (ngModelChange)="completionNote[t.id] = $event"
                          placeholder="Nota de cierre (opcional): con quién se cerró, número de contrato…"
                          class="flex-1 min-w-[200px] bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-[11px] text-on-surface focus:outline-none focus:border-emerald-400"
                        />
                        <button
                          type="button"
                          (click)="completeTask(t)"
                          class="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-black text-[11px] border border-emerald-500/40 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                        >
                          <span class="material-symbols-outlined text-base">check</span> Marcar como hecha
                        </button>
                      </div>
                    } @else {
                      <p class="text-[10px] text-outline italic">
                        Solo {{ t.assignedManager }} puede confirmarla.
                      </p>
                    }
                  </div>
                }

                @if (optional && t.done) {
                  <div class="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 space-y-1.5">
                    <div class="flex items-center gap-2 text-emerald-300 font-black text-[11px]">
                      <span class="material-symbols-outlined text-base">verified</span>
                      Confirmada por {{ t.completedBy?.name || t.assignedManager }}
                      @if (t.completedAt) { <span class="font-mono text-outline font-normal">· {{ t.completedAt }}</span> }
                    </div>
                    @if (t.completionNote) {
                      <p class="text-[11px] text-on-surface-variant italic pl-6">"{{ t.completionNote }}"</p>
                    }
                    @if (mine) {
                      <button type="button" (click)="reopenTask(t)" class="text-[10px] text-outline hover:text-rose-300 underline pl-6">
                        Reabrir la tarea
                      </button>
                    }
                  </div>
                }

                <!-- ── Desglose de producción (solo encargos operativos) ── -->
                @if (optional && canViewFinances()) {
                  <div class="rounded-2xl bg-violet-950/15 border border-violet-500/30 overflow-hidden">
                    <div class="px-4 py-3 flex items-center justify-between gap-3 flex-wrap border-b border-violet-500/20 bg-violet-500/[0.06]">
                      <h6 class="font-black text-[11px] uppercase tracking-wider text-violet-300 flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">receipt_long</span>
                        Desglose de producción
                      </h6>
                      <div class="flex items-center gap-2 flex-wrap">
                        @if (t.estimatedCost) {
                          <span class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-outline">
                            Estimado {{ money(t.estimatedCost) }}
                          </span>
                        }
                        <span class="px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/40 font-mono font-black text-[11px] text-violet-200">
                          {{ t.productionItems.length }} partida(s) · {{ money(t.productionTotal) }}
                        </span>
                      </div>
                    </div>

                    <div class="p-4 space-y-3">
                      <p class="text-[10px] text-outline leading-relaxed">
                        Estas partidas son las mismas que se ven en <strong class="text-violet-300">Producción</strong>, agrupadas ahí bajo este encargo.
                        Un encargo puede llevar varias: la consola, las bocinas y el operador son tres gastos de una sola contratación.
                      </p>

                      @for (p of t.productionItems; track p.id) {
                        @let meta = categoryMeta(p.category);
                        <div class="rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
                          <div class="px-3.5 py-2.5 flex items-center justify-between gap-3 flex-wrap border-b border-white/5"
                            [class]="'bg-white/[0.02]'">
                            <div class="flex items-center gap-2 min-w-0">
                              <span class="material-symbols-outlined text-base shrink-0" [class]="meta.textColor">{{ meta.icon }}</span>
                              <span class="text-[11px] font-black text-on-surface truncate">{{ p.concept || 'Partida sin concepto' }}</span>
                              <span class="px-2 py-0.5 rounded-md text-[9px] font-bold border shrink-0" [class]="meta.badgeClass">{{ p.category }}</span>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                              <span class="px-2 py-0.5 rounded-md text-[9px] font-black border" [class]="itemStatusClass(p.status)">{{ p.status }}</span>
                              <span class="font-mono font-black text-[11px] text-violet-200">{{ money(p.amount) }}</span>
                              @if (mine) {
                                <button
                                  type="button"
                                  (click)="unlinkItem(p)"
                                  title="Quitarla de este encargo; la partida sigue en Producción"
                                  class="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-outline hover:text-amber-300 hover:border-amber-400/40 flex items-center justify-center transition-all"
                                >
                                  <span class="material-symbols-outlined text-[13px]">link_off</span>
                                </button>
                                <button
                                  type="button"
                                  (click)="deleteItem(p)"
                                  title="Borrar la partida del desglose"
                                  class="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                                >
                                  <span class="material-symbols-outlined text-[13px]">delete</span>
                                </button>
                              }
                            </div>
                          </div>

                          <!-- Ficha completa: los mismos campos que en Producción.
                               Media ficha aquí obligaba a saltar de pestaña para
                               corregir un importe que se está mirando. -->
                          <div class="p-3.5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <app-editable-field
                              label="Rubro" type="select" [options]="categoryOptions"
                              [value]="p.category" [readonly]="!mine"
                              (save)="patchItem(p, { category: $any($event) })"
                            />
                            <app-editable-field
                              label="Concepto" [value]="p.concept" [readonly]="!mine"
                              placeholder="Qué se contrató"
                              (save)="patchItem(p, { concept: $event })"
                            />
                            <app-editable-field
                              label="Proveedor" [value]="p.supplier || ''" [readonly]="!mine"
                              placeholder="A quién se le paga"
                              (save)="patchItem(p, { supplier: $event })"
                            />
                            <app-editable-field
                              label="Estado" type="select" [options]="statusOptions"
                              [value]="p.status" [readonly]="!mine"
                              (save)="patchItem(p, { status: $any($event) })"
                            />
                            <app-editable-field
                              label="Cantidad" type="number" [value]="p.quantity ?? 1" [readonly]="!mine"
                              (save)="patchQuantity(p, $event)"
                            />
                            <app-editable-field
                              label="Unidad" [value]="p.unit || meta.defaultUnit" [readonly]="!mine"
                              (save)="patchItem(p, { unit: $event })"
                            />
                            <app-editable-field
                              label="Costo unitario" type="number" prefix="$" [value]="p.unitCost ?? 0" [readonly]="!mine"
                              (save)="patchUnitCost(p, $event)"
                            />
                            <app-editable-field
                              label="Importe total" type="number" prefix="$"
                              valueClass="text-xs font-black font-mono text-violet-200"
                              [value]="p.amount" [readonly]="!mine"
                              (save)="patchItem(p, { amount: +$event || 0 })"
                            />
                            <div class="col-span-2">
                              <app-editable-field
                                label="Detalle" [value]="p.detail || ''" [readonly]="!mine"
                                placeholder="Modelo, alcance, condiciones…"
                                valueClass="text-[10px] font-medium text-outline break-words"
                                (save)="patchItem(p, { detail: $event })"
                              />
                            </div>
                            <div class="col-span-2">
                              <app-editable-field
                                label="Notas" [value]="p.notes || ''" [readonly]="!mine"
                                placeholder="Lo que haya que recordar de este gasto"
                                valueClass="text-[10px] font-medium text-outline break-words"
                                (save)="patchItem(p, { notes: $event })"
                              />
                            </div>
                          </div>
                        </div>
                      } @empty {
                        <p class="text-[11px] text-outline italic px-1">
                          Este encargo todavía no tiene gastos desglosados.
                        </p>
                      }

                      @if (mine) {
                        <div class="pt-2 border-t border-violet-500/20 space-y-3">
                          <div class="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              (click)="toggleNewItem(t.id)"
                              class="px-3.5 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500 text-violet-200 hover:text-black border border-violet-500/35 font-bold text-[11px] transition-all flex items-center gap-1.5"
                            >
                              <span class="material-symbols-outlined text-sm">add</span> Añadir partida nueva
                            </button>

                            <!-- Vincular una partida que ya existe: el desglose
                                 pudo capturarse antes en Producción, y obligar a
                                 rehacerlo aquí duplicaría el gasto. -->
                            @if (linkableItems(t).length) {
                              <select
                                [ngModel]="''"
                                (ngModelChange)="linkExisting(t, $event)"
                                class="bg-black/50 border border-amber-500/30 text-on-surface rounded-xl px-3 py-2 text-[11px] font-bold focus:outline-none focus:border-amber-400 min-w-[240px]"
                              >
                                <option value="">＋ Vincular una partida ya capturada…</option>
                                @for (p of linkableItems(t); track p.id) {
                                  <option [value]="p.id">{{ p.category }} · {{ p.concept }} — {{ money(p.amount) }}</option>
                                }
                              </select>
                            } @else {
                              <span class="text-[10px] text-outline italic">
                                No hay partidas sueltas de {{ t.assignedManager || organizer() }} para vincular.
                              </span>
                            }
                          </div>

                          @if (newItemOpen()[t.id]) {
                            <div class="p-3.5 rounded-xl bg-black/50 border border-violet-500/30 space-y-3 animate-fade-in">
                              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                  <label class="text-[10px] font-black uppercase tracking-wider text-violet-300">Rubro *</label>
                                  <select
                                    [ngModel]="newItemCategory[t.id] || defaultCategory(t)"
                                    (ngModelChange)="newItemCategory[t.id] = $event"
                                    class="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-[11px] text-on-surface focus:outline-none focus:border-violet-400"
                                  >
                                    @for (c of categories; track c.key) {
                                      <option [value]="c.key">{{ c.key }}</option>
                                    }
                                  </select>
                                </div>
                                <div class="space-y-1">
                                  <label class="text-[10px] font-black uppercase tracking-wider text-violet-300">Importe *</label>
                                  <input
                                    type="number"
                                    [ngModel]="newItemAmount[t.id]"
                                    (ngModelChange)="newItemAmount[t.id] = $event"
                                    placeholder="18000"
                                    class="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-[11px] font-mono text-on-surface focus:outline-none focus:border-violet-400"
                                  />
                                </div>
                                <div class="space-y-1">
                                  <label class="text-[10px] font-black uppercase tracking-wider text-outline">Concepto</label>
                                  <input
                                    type="text"
                                    [ngModel]="newItemConcept[t.id] || ''"
                                    (ngModelChange)="newItemConcept[t.id] = $event"
                                    [placeholder]="t.title"
                                    class="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-[11px] text-on-surface focus:outline-none focus:border-violet-400"
                                  />
                                </div>
                                <div class="space-y-1">
                                  <label class="text-[10px] font-black uppercase tracking-wider text-outline">Proveedor</label>
                                  <input
                                    type="text"
                                    [ngModel]="newItemSupplier[t.id] || ''"
                                    (ngModelChange)="newItemSupplier[t.id] = $event"
                                    placeholder="Ej: Audio Norte Producciones"
                                    class="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-[11px] text-on-surface focus:outline-none focus:border-violet-400"
                                  />
                                </div>
                              </div>
                              <div class="flex items-center justify-end gap-2">
                                <button type="button" (click)="toggleNewItem(t.id)" class="px-3 py-1.5 rounded-lg text-outline hover:text-on-surface text-[11px]">Cancelar</button>
                                <button
                                  type="button"
                                  (click)="addItem(t)"
                                  [disabled]="!newItemAmount[t.id]"
                                  class="px-4 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-black font-black text-[11px] disabled:opacity-40"
                                >
                                  Añadir al desglose
                                </button>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- ── Reparto de la responsabilidad ── -->
                @if (!t.done && !incoming && !outgoing) {
                  @if (mine) {
                    <div class="p-4 rounded-2xl bg-black/30 border border-amber-500/25 space-y-3">
                      <h6 class="font-black text-[11px] uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">engineering</span>
                        Repartir esta responsabilidad
                      </h6>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                          <div>
                            <span class="font-bold text-[11px] text-violet-300 block">Delegar dentro de tu equipo</span>
                            <p class="text-[10px] text-outline leading-snug">
                              No se le pregunta a nadie: tu gente responde ante ti y la responsabilidad sigue siendo de tu disquera.
                            </p>
                          </div>
                          <select
                            [ngModel]="delegateId[t.id] || t.delegate?.name || ''"
                            (ngModelChange)="delegateId[t.id] = $event"
                            class="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-[11px] text-on-surface"
                          >
                            <option value="">— Sin delegar —</option>
                            @for (m of teamOf(t); track m.id) {
                              <option [value]="m.id">{{ m.name }} · {{ m.rank }}</option>
                            }
                          </select>
                          <button
                            type="button"
                            (click)="delegate(t)"
                            class="w-full py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500 text-violet-300 hover:text-black font-bold text-[11px] border border-violet-500/40 transition-all"
                          >
                            {{ delegateId[t.id] ? 'Confirmar delegación' : 'Quitar delegación' }}
                          </button>
                        </div>

                        <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
                          <div>
                            <span class="font-bold text-[11px] text-amber-300 block">Pasarla a otro manager</span>
                            <p class="text-[10px] text-outline leading-snug">
                              Esta sí se pregunta: la otra disquera puede aceptarla o rechazarla con motivo. Hasta que conteste, sigue siendo tuya.
                            </p>
                          </div>
                          <select
                            [ngModel]="transferTo[t.id] || ''"
                            (ngModelChange)="transferTo[t.id] = $event"
                            class="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-[11px] text-on-surface"
                          >
                            <option value="">— Elige la disquera destino —</option>
                            @for (m of transferTargets(t); track m) {
                              <option [value]="m">{{ m }}</option>
                            }
                          </select>
                          <input
                            type="text"
                            [ngModel]="transferReason[t.id] || ''"
                            (ngModelChange)="transferReason[t.id] = $event"
                            placeholder="Motivo (obligatorio)"
                            class="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-[11px] text-on-surface"
                          />
                          <button
                            type="button"
                            (click)="requestTransfer(t)"
                            [disabled]="!transferTo[t.id] || !transferReason[t.id]?.trim()"
                            class="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] transition-all disabled:opacity-40 disabled:pointer-events-none"
                          >
                            Enviar solicitud
                          </button>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-2.5">
                      <span class="material-symbols-outlined text-base text-outline shrink-0">lock</span>
                      <p class="text-[10px] text-outline leading-relaxed">
                        La lleva <strong class="text-on-surface">{{ t.assignedManager || 'el organizador' }}</strong>.
                        Delegarla o pasarla a otra disquera le corresponde solo a ellos.
                      </p>
                    </div>
                  }
                }

                <!-- ── Historial ── -->
                @if (t.transferHistory?.length || t.rejectedReason) {
                  <div class="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                    <span class="text-[9px] font-black uppercase tracking-widest text-outline block">Historial de la responsabilidad</span>
                    @for (tr of t.transferHistory || []; track tr.id) {
                      <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <span class="text-[10px] font-bold text-on-surface">{{ tr.fromManager }} → {{ tr.toManager }}</span>
                          <p class="text-[10px] text-outline italic">"{{ tr.reason }}"</p>
                          @if (tr.rejectionReason) {
                            <p class="text-[10px] text-rose-300 italic">Rechazo: "{{ tr.rejectionReason }}"</p>
                          }
                        </div>
                        <span class="text-[10px] font-black shrink-0"
                          [class]="tr.status === 'aceptada' ? 'text-emerald-400' : 'text-rose-400'">
                          {{ tr.status === 'aceptada' ? 'Aceptada' : 'Rechazada' }}
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="p-12 text-center rounded-3xl bg-surface-container-high/40 border border-white/5 space-y-2">
            <span class="material-symbols-outlined text-4xl text-outline">filter_alt_off</span>
            <p class="text-sm font-bold text-on-surface">Nada con estos filtros.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class EventTabTasksComponent {
  event = input.required<EventItem>();
  canViewFinances = input<boolean>(true);
  /** Si el rol de plataforma permite tocar el evento siquiera. */
  canEdit = input<boolean>(true);
  patch = output<Partial<EventItem>>();
  navigateTab = output<EventDetailTab>();

  private readonly session = inject(SessionService);
  readonly roleService = inject(RoleService);
  readonly money = money;
  readonly categories = PRODUCTION_CATEGORIES;
  readonly categoryMeta = productionCategoryMeta;

  readonly categoryOptions: EditableOption[] =
    PRODUCTION_CATEGORIES.map(c => ({ value: c.key, label: c.key }));
  readonly statusOptions: EditableOption[] =
    (['Estimado', 'Cotizado', 'Contratado', 'Pagado'] as ProductionItemStatus[])
      .map(s => ({ value: s, label: s }));

  // ─── Estado de pantalla ────────────────────────────────────────────────────
  activeFilter = signal<string>('todas');
  searchQuery = '';
  private expanded = signal<Set<string>>(new Set());

  assignPanelOpen = signal(false);
  createPanelOpen = signal(false);

  assignItemId = '';
  assignManager = '';

  newTitle = '';
  newDetail = '';
  newManager = '';
  newPriority: 'Alta' | 'Media' | 'Baja' = 'Media';
  newEstimate?: number;
  newCategory: ProductionCategory = 'Audio';

  rejectOpen = signal<Record<string, boolean>>({});
  rejectReason: Record<string, string> = {};
  completionNote: Record<string, string> = {};
  delegateId: Record<string, string> = {};
  transferTo: Record<string, string> = {};
  transferReason: Record<string, string> = {};

  newItemOpen = signal<Record<string, boolean>>({});
  newItemCategory: Record<string, ProductionCategory> = {};
  newItemAmount: Record<string, number | undefined> = {};
  newItemConcept: Record<string, string> = {};
  newItemSupplier: Record<string, string> = {};

  // ─── Derivados ─────────────────────────────────────────────────────────────
  tasks = computed(() => resolveTasks(this.event()));
  isDraft = computed(() => this.event().state === 'Borrador');

  /**
   * Qué se puede hacer con las tareas en la fase en la que está el evento.
   *
   * Faltaba por completo: la pestaña no sabía en qué estado estaba, así que en
   * un evento cerrado o con boletos vendidos se seguían pudiendo reasignar
   * puntos obligatorios y decidir propuestas sobre datos que ya vio el público.
   */
  policy = computed(() => eventTaskPolicy(this.event().state));
  canAssign = computed(() => this.canEdit() && this.policy().assignMandatory);
  canCreate = computed(() => this.canEdit() && this.policy().createOptional);
  canWork = computed(() => this.canEdit() && this.policy().workOptional);
  canDecide = computed(() => this.canEdit() && this.policy().decideProposals);
  organizer = computed(() => this.event().ownerManagerName || this.event().createdBy || '');

  private requiredTasks = computed(() => this.tasks().filter(t => t.blocking));
  requiredTotal = computed(() => this.requiredTasks().length);
  requiredDone = computed(() => this.requiredTasks().filter(t => t.done).length);
  requiredPending = computed(() => this.requiredTotal() - this.requiredDone());

  private optionalTasks = computed(() => this.tasks().filter(t => t.kind === 'externa'));
  optionalTotal = computed(() => this.optionalTasks().length);
  optionalDone = computed(() => this.optionalTasks().filter(t => t.done).length);

  delegatedCount = computed(() => this.tasks().filter(t => !!t.delegate && !t.done).length);

  /**
   * Solo lo que espera *mi* respuesta.
   *
   * Antes se contaban todas las transferencias vivas del evento, así que quien
   * pedía una veía un "1 pendiente" que no le pedía nada a él: la estaba
   * esperando el otro. La cifra que sirve es la que se puede accionar.
   */
  awaitingMe = computed(() => this.tasks().filter(t => !!this.incomingTransfer(t)).length);

  linkedSpend = computed(() => this.optionalTasks().reduce((s, t) => s + t.productionTotal, 0));
  linkedItemCount = computed(() => this.optionalTasks().reduce((s, t) => s + t.productionItems.length, 0));

  /** Los puntos del expediente agrupados, para que el selector se pueda leer. */
  checklistByGroup = computed(() => {
    const items = eventCompleteness(this.event()).items;
    const groups: { group: string; items: typeof items }[] = [];
    for (const item of items) {
      let g = groups.find(x => x.group === item.group);
      if (!g) { g = { group: item.group, items: [] }; groups.push(g); }
      g.items.push(item);
    }
    return groups;
  });

  /**
   * Las disqueras a las que se le puede encargar algo de este evento.
   *
   * La propia siempre entra aunque no co-organice: quedarse uno con una tarea no
   * necesita permiso de nadie, y sin esto quien mira el evento desde fuera no
   * podía ni tomar el encargo que le acaban de pasar.
   */
  managerList = computed(() => {
    const e = this.event();
    const set = new Set<string>();
    if (this.organizer()) set.add(this.organizer());
    for (const a of e.managerAgreements || []) if (a.managerName) set.add(a.managerName);
    for (const s of e.lineup || []) if (s.managerName) set.add(s.managerName);
    set.add(this.session.actor().managerName);
    return Array.from(set).filter(Boolean);
  });

  filters = computed(() => {
    const list = this.tasks();
    return [
      { value: 'todas', label: 'Todas', icon: 'apps', count: list.length },
      { value: 'contestar', label: 'Te toca contestar', icon: 'how_to_vote', count: this.awaitingMe() },
      { value: 'expediente', label: 'Expediente', icon: 'fact_check', count: list.filter(t => t.kind === 'sistema' && !t.done).length },
      { value: 'operativas', label: 'Encargos', icon: 'handyman', count: list.filter(t => t.kind === 'externa' && !t.done).length },
      { value: 'mias', label: 'De mi disquera', icon: 'business', count: list.filter(t => this.canManageTask(t) && !t.done).length },
      { value: 'hechas', label: 'Hechas', icon: 'task_alt', count: list.filter(t => t.done).length }
    ];
  });

  filteredTasks = computed(() => {
    const query = (this.searchQuery || '').toLowerCase().trim();
    let list = this.tasks();

    if (query) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(query)
        || (t.detail || '').toLowerCase().includes(query)
        || (t.assignedManager || '').toLowerCase().includes(query)
        || (t.delegate?.name || '').toLowerCase().includes(query));
    }

    switch (this.activeFilter()) {
      case 'contestar': return list.filter(t => !!this.incomingTransfer(t));
      case 'expediente': return list.filter(t => t.kind === 'sistema' && !t.done);
      case 'operativas': return list.filter(t => t.kind === 'externa' && !t.done);
      case 'mias': return list.filter(t => this.canManageTask(t) && !t.done);
      case 'hechas': return list.filter(t => t.done);
      default: return list;
    }
  });

  // ─── Permisos ──────────────────────────────────────────────────────────────

  /**
   * Quién puede mover esta tarea.
   *
   * La lleva mi disquera, o la lleva el organizador —que responde por todo lo
   * que no repartió— y ese soy yo. Encargarle algo a otra disquera y seguir
   * pudiendo cerrárselo uno mismo haría del encargo un adorno: el sentido de
   * pasarle una tarea a alguien es que la respuesta sea suya.
   */
  canManageTask(t: ResolvedTask): boolean {
    // La fase manda por encima de la disquera: en un evento sellado no hay nada
    // que gestionar aunque la tarea sea tuya.
    if (t.kind === 'sistema' ? !this.canAssign() : !this.canWork()) return false;
    const me = this.session.actor().managerName;
    if (t.assignedManager) return t.assignedManager === me;
    return this.organizer() === me;
  }

  /**
   * La transferencia que me toca contestar a mí.
   *
   * Este es el arreglo de fondo del reparto: antes cualquiera que abriera la
   * tarea veía los botones de aceptar y rechazar, así que quien pedía la
   * transferencia podía aceptársela solo y pasarle el muerto a otra disquera sin
   * que esta dijera nada. Solo contesta el destino.
   */
  incomingTransfer(t: ResolvedTask): EventTaskTransfer | null {
    const tr = t.pendingTransfer;
    if (!tr || tr.status !== 'pendiente') return null;
    return tr.toManager === this.session.actor().managerName ? tr : null;
  }

  /** La que pedí yo y sigue esperando respuesta. */
  outgoingTransfer(t: ResolvedTask): EventTaskTransfer | null {
    const tr = t.pendingTransfer;
    if (!tr || tr.status !== 'pendiente') return null;
    return tr.toManager === this.session.actor().managerName ? null : tr;
  }

  teamOf(t: ResolvedTask) {
    return this.session.membersOf(t.assignedManager || this.session.actor().managerName);
  }

  transferTargets(t: ResolvedTask): string[] {
    const holder = t.assignedManager || this.organizer();
    return this.managerList().filter(m => m !== holder);
  }

  // ─── Pantalla ──────────────────────────────────────────────────────────────
  isExpanded(id: string): boolean { return this.expanded().has(id); }

  toggleExpand(id: string): void {
    this.expanded.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggleReject(id: string): void {
    this.rejectOpen.update(m => ({ ...m, [id]: !m[id] }));
  }

  toggleNewItem(id: string): void {
    this.newItemOpen.update(m => ({ ...m, [id]: !m[id] }));
  }

  goToData(checklistItemId?: string): void {
    if (!checklistItemId) return;
    this.navigateTab.emit(getTabForChecklistItem(checklistItemId));
  }

  statusClass(t: ResolvedTask): string {
    if (t.done) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
    switch (t.status) {
      case 'sin-enviar': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'asignada': return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'aceptada': return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'rechazada': return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      default: return 'bg-white/5 text-outline border-white/10';
    }
  }

  statusLabel(t: ResolvedTask): string {
    if (t.done) return 'Hecha';
    switch (t.status) {
      case 'abierta': return t.assignedManager ? 'Asignada' : 'Sin encargar';
      case 'sin-enviar': return 'Se avisa al enviar a revisión';
      case 'asignada': return 'Asignada';
      case 'aceptada': return 'Aceptada';
      case 'rechazada': return 'Rechazada';
      default: return t.status;
    }
  }

  itemStatusClass(status: ProductionItemStatus): string {
    switch (status) {
      case 'Pagado': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
      case 'Contratado': return 'bg-sky-500/15 text-sky-300 border-sky-500/35';
      case 'Cotizado': return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
      default: return 'bg-white/5 text-outline border-white/10';
    }
  }

  defaultCategory(t: ResolvedTask): ProductionCategory {
    return (t.productionCategory as ProductionCategory) || 'Mobiliario';
  }

  /**
   * Partidas ya capturadas que se pueden colgar de este encargo.
   *
   * Solo las que no son de nadie más: una partida que ya cuelga de otra tarea
   * pertenece a ese encargo, y moverla desde aquí sería quitársela por la
   * espalda. Se limitan además a la disquera que responde por la tarea, que es
   * la que puede haberlas capturado.
   */
  linkableItems(t: ResolvedTask): EventProductionItem[] {
    const holder = t.assignedManager || this.organizer();
    return (this.event().productionItems || []).filter(p =>
      !p.taskId && (!p.assignedTo || p.assignedTo === holder || holder === this.organizer()));
  }

  // ─── Mutaciones ────────────────────────────────────────────────────────────
  private now(): string { return new Date().toISOString().slice(0, 16); }

  private writeTasks(tasks: EventTask[], productionItems?: EventProductionItem[]): void {
    this.patch.emit(productionItems ? { tasks, productionItems } : { tasks });
  }

  private mapTask(id: string, change: (t: EventTask) => EventTask): EventTask[] {
    return (this.event().tasks || []).map(t => (t.id === id ? change(t) : t));
  }

  onAssignItemChange(itemId: string): void {
    const existing = (this.event().tasks || []).find(t => t.checklistItemId === itemId);
    this.assignManager = existing?.assignedManager || this.assignManager;
  }

  submitAssign(): void {
    const itemId = this.assignItemId;
    const manager = this.assignManager;
    if (!itemId || !manager) return;

    const item = eventCompleteness(this.event()).items.find(i => i.id === itemId);
    if (!item) return;

    const draft = this.isDraft();
    const now = this.now();
    const stored = this.event().tasks || [];
    const exists = stored.some(t => t.checklistItemId === itemId);

    const tasks: EventTask[] = exists
      ? stored.map(t => (t.checklistItemId === itemId
        ? { ...t, assignedManager: manager, status: draft ? 'sin-enviar' as const : 'asignada' as const, assignedAt: draft ? undefined : now }
        : t))
      : [...stored, {
        id: `task-${itemId}-${Date.now()}`,
        kind: 'sistema' as const,
        title: item.label,
        detail: item.hint,
        group: item.group,
        checklistItemId: itemId,
        assignedManager: manager,
        status: draft ? 'sin-enviar' as const : 'asignada' as const,
        priority: item.required ? 'Alta' as const : 'Media' as const,
        createdBy: this.session.actor(),
        createdAt: now,
        assignedAt: draft ? undefined : now
      }];

    this.writeTasks(tasks);
    this.assignPanelOpen.set(false);
    this.assignItemId = '';
    this.assignManager = '';
  }

  submitCreate(): void {
    const title = this.newTitle.trim();
    if (!title) return;

    const actor = this.session.actor();
    const draft = this.isDraft();
    const now = this.now();

    const task: EventTask = {
      id: `task-ext-${Date.now()}`,
      kind: 'externa',
      title,
      detail: this.newDetail.trim() || undefined,
      assignedManager: this.newManager || actor.managerName,
      status: draft ? 'sin-enviar' : 'asignada',
      priority: this.newPriority,
      productionCategory: this.newEstimate ? this.newCategory : undefined,
      estimatedCost: this.newEstimate || undefined,
      createdBy: actor,
      createdAt: now,
      assignedAt: draft ? undefined : now
    };

    this.writeTasks([...(this.event().tasks || []), task]);
    this.createPanelOpen.set(false);
    this.newTitle = '';
    this.newDetail = '';
    this.newEstimate = undefined;
  }

  completeTask(t: ResolvedTask): void {
    const actor = this.session.actor();
    const note = (this.completionNote[t.id] || '').trim();
    this.writeTasks(this.mapTask(t.id, task => ({
      ...task,
      status: 'completada',
      completedAt: this.now(),
      completedBy: actor,
      completionNote: note || undefined
    })));
  }

  reopenTask(t: ResolvedTask): void {
    this.writeTasks(this.mapTask(t.id, task => ({
      ...task,
      status: task.assignedManager ? 'asignada' : 'abierta',
      completedAt: undefined,
      completedBy: undefined,
      completionNote: undefined
    })));
  }

  // ─── Desglose ──────────────────────────────────────────────────────────────
  private writeItems(items: EventProductionItem[]): void {
    this.patch.emit({ productionItems: items });
  }

  patchItem(item: EventProductionItem, changes: Partial<EventProductionItem>): void {
    this.writeItems((this.event().productionItems || [])
      .map(p => (p.id === item.id ? { ...p, ...changes } : p)));
  }

  /** Cantidad y unitario recalculan el importe: es lo que uno espera al teclearlos. */
  patchQuantity(item: EventProductionItem, value: string): void {
    const quantity = +value || 0;
    const unitCost = item.unitCost || 0;
    this.patchItem(item, { quantity, amount: unitCost ? quantity * unitCost : item.amount });
  }

  patchUnitCost(item: EventProductionItem, value: string): void {
    const unitCost = +value || 0;
    const quantity = item.quantity || 1;
    this.patchItem(item, { unitCost, amount: quantity * unitCost });
  }

  addItem(t: ResolvedTask): void {
    const amount = this.newItemAmount[t.id];
    if (!amount) return;

    const category = this.newItemCategory[t.id] || this.defaultCategory(t);
    const item: EventProductionItem = {
      id: `pi-task-${Date.now()}`,
      category,
      concept: (this.newItemConcept[t.id] || '').trim() || t.title,
      supplier: (this.newItemSupplier[t.id] || '').trim() || undefined,
      quantity: 1,
      unit: productionCategoryMeta(category).defaultUnit,
      unitCost: amount,
      amount,
      status: 'Contratado',
      assignedTo: t.assignedManager || this.session.actor().managerName,
      taskId: t.id,
      createdBy: this.session.actor().name
    };

    this.writeItems([...(this.event().productionItems || []), item]);
    this.toggleNewItem(t.id);
    this.newItemAmount[t.id] = undefined;
    this.newItemConcept[t.id] = '';
    this.newItemSupplier[t.id] = '';
  }

  linkExisting(t: ResolvedTask, itemId: string): void {
    if (!itemId) return;
    this.writeItems((this.event().productionItems || [])
      .map(p => (p.id === itemId ? { ...p, taskId: t.id } : p)));
  }

  /** La partida se queda en Producción; solo deja de colgar de este encargo. */
  unlinkItem(item: EventProductionItem): void {
    const tasks = (this.event().tasks || []).map(t =>
      (t.productionItemId === item.id ? { ...t, productionItemId: undefined } : t));
    this.patch.emit({
      tasks,
      productionItems: (this.event().productionItems || [])
        .map(p => (p.id === item.id ? { ...p, taskId: undefined } : p))
    });
  }

  deleteItem(item: EventProductionItem): void {
    const tasks = (this.event().tasks || []).map(t =>
      (t.productionItemId === item.id ? { ...t, productionItemId: undefined } : t));
    this.patch.emit({
      tasks,
      productionItems: (this.event().productionItems || []).filter(p => p.id !== item.id)
    });
  }

  // ─── Reparto ───────────────────────────────────────────────────────────────
  delegate(t: ResolvedTask): void {
    const id = this.delegateId[t.id];
    const member = this.teamOf(t).find(m => m.id === id);
    this.writeTasks(this.mapTask(t.id, task => ({
      ...task,
      delegate: member ? { name: member.name, rank: member.rank } : undefined
    })));
  }

  requestTransfer(t: ResolvedTask): void {
    const to = this.transferTo[t.id];
    const reason = (this.transferReason[t.id] || '').trim();
    if (!to || !reason) return;

    const transfer: EventTaskTransfer = {
      id: `tr-${Date.now()}`,
      fromManager: t.assignedManager || this.session.actor().managerName,
      toManager: to,
      reason,
      requestedAt: this.now(),
      status: 'pendiente'
    };

    this.writeTasks(this.mapTask(t.id, task => ({
      ...task,
      status: 'pendiente-aprobacion',
      pendingTransfer: transfer
    })));
    this.transferReason[t.id] = '';
    this.transferTo[t.id] = '';
  }

  acceptTransfer(t: ResolvedTask): void {
    const tr = this.incomingTransfer(t);
    if (!tr) return;
    const done: EventTaskTransfer = { ...tr, status: 'aceptada', respondedAt: this.now() };

    this.writeTasks(this.mapTask(t.id, task => ({
      ...task,
      assignedManager: tr.toManager,
      // Cambia de dueño: la delegación en el equipo del anterior deja de valer.
      delegate: undefined,
      status: 'aceptada',
      acceptedAt: this.now(),
      pendingTransfer: undefined,
      rejectedReason: undefined,
      transferHistory: [...(task.transferHistory || []), done]
    })));
  }

  rejectTransfer(t: ResolvedTask): void {
    const tr = this.incomingTransfer(t);
    const reason = (this.rejectReason[t.id] || '').trim();
    if (!tr || !reason) return;

    const done: EventTaskTransfer = {
      ...tr, status: 'rechazada', respondedAt: this.now(), rejectionReason: reason
    };

    this.writeTasks(this.mapTask(t.id, task => ({
      ...task,
      // Rebota a quien la tenía: rechazarla no la deja sin dueño.
      assignedManager: tr.fromManager,
      status: 'asignada',
      rejectedReason: reason,
      pendingTransfer: undefined,
      transferHistory: [...(task.transferHistory || []), done]
    })));
    this.toggleReject(t.id);
    this.rejectReason[t.id] = '';
  }

  /** Quien la pidió puede retirarla mientras nadie haya contestado. */
  cancelTransfer(t: ResolvedTask): void {
    this.writeTasks(this.mapTask(t.id, task => ({
      ...task,
      status: task.assignedManager ? 'asignada' : 'abierta',
      pendingTransfer: undefined
    })));
  }

  acceptChangeProposal(task: ResolvedTask): void {
    const prop = task.pendingChangeProposal;
    if (!prop) return;

    const patchData = prop.proposedChanges || {};
    const updatedTasks = (this.event().tasks || []).map(t => {
      if (t.id === task.id || t.checklistItemId === task.checklistItemId) {
        return {
          ...t,
          pendingChangeProposal: {
            ...prop,
            status: 'aceptada' as const,
            respondedAt: new Date().toISOString()
          }
        };
      }
      return t;
    });

    this.patch.emit({ ...patchData, tasks: updatedTasks });
  }

  rejectChangeProposal(task: ResolvedTask): void {
    const prop = task.pendingChangeProposal;
    if (!prop) return;

    const updatedTasks = (this.event().tasks || []).map(t => {
      if (t.id === task.id || t.checklistItemId === task.checklistItemId) {
        return {
          ...t,
          pendingChangeProposal: {
            ...prop,
            status: 'rechazada' as const,
            respondedAt: new Date().toISOString()
          }
        };
      }
      return t;
    });

    this.patch.emit({ tasks: updatedTasks });
  }

  // ─── Cambios propuestos sobre un dato obligatorio ──────────────────────────

  proposalsOf(t: ResolvedTask): EventFieldProposal[] {
    return pendingProposals(t);
  }

  /**
   * Las propuestas agrupadas por el campo que tocan.
   *
   * Agrupar es lo que hace visible la decisión real: dos propuestas sobre el
   * recinto son excluyentes y hay que elegir, una sobre el recinto y otra sobre
   * la fecha no compiten y se aceptan por separado. En una lista plana las
   * cuatro se ven iguales.
   */
  proposalGroupsOf(t: ResolvedTask): { fieldKey: string; fieldLabel: string; items: EventFieldProposal[] }[] {
    const groups: { fieldKey: string; fieldLabel: string; items: EventFieldProposal[] }[] = [];
    for (const p of this.proposalsOf(t)) {
      let g = groups.find(x => x.fieldKey === p.fieldKey);
      if (!g) { g = { fieldKey: p.fieldKey, fieldLabel: p.fieldLabel, items: [] }; groups.push(g); }
      g.items.push(p);
    }
    return groups;
  }

  /**
   * Quién decide sobre lo que le proponen a este punto.
   *
   * Su encargado siempre, y además quien haya intervenido mientras la
   * intervención siga viva: el dato lleva la firma de los dos y un tercero les
   * debe explicación a ambos.
   */
  canDecideOn(t: ResolvedTask): boolean {
    if (!this.canDecide()) return false;
    return canDecideProposals(this.event(), t, this.session.actor());
  }

  /** Los nombres de quienes tienen que aceptar, para poder decirlo. */
  approversLabel(t: ResolvedTask): string {
    return approversOf(this.event(), t).join(' y ') || this.organizer();
  }

  /** El manager que intervino y sigue firmando el dato con su encargado. */
  intervenerOf(t: ResolvedTask): string {
    return activeIntervention(t)?.name || '';
  }

  /**
   * Quién resolvió el punto, nunca "el sistema".
   *
   * El sistema detecta que el dato está, no lo escribe. Dejarlo como autor de un
   * punto obligatorio deja al expediente sin nadie a quien preguntarle cuando el
   * dato resulta estar mal.
   */
  resolvedByOf(t: ResolvedTask): string {
    const who = t.completedBy || t.intervenedBy;
    if (who && !isSystemActor(who)) return who.name;
    return !isSystemActor(t.assignedManager) && t.assignedManager
      ? t.assignedManager : this.organizer();
  }

  /** Fecha y hora en que quedó resuelto, ya legible. */
  resolvedAtOf(t: ResolvedTask): string {
    const iso = t.completedAt || t.intervenedAt;
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' h';
  }

  acceptChange(t: ResolvedTask, proposalId: string): void {
    this.patch.emit(acceptProposal(this.event(), t.id, proposalId, this.session.actor()));
  }

  rejectChange(t: ResolvedTask, proposalId: string): void {
    this.patch.emit(rejectProposal(this.event(), t.id, proposalId, this.session.actor()));
  }

}
