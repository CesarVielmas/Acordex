import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Zona de arrastrar y soltar con vista previa y alternativa de liga.
 *
 * El patrón ya estaba resuelto en el diálogo de posponer de Eventos, y en Prensa
 * hace falta tres veces —la fotografía oficial, la galería y el kit de prensa—.
 * Copiarlo tres veces era garantizar que una de las tres se quedara sin el botón
 * de quitar o sin el peso del archivo, que es exactamente lo que hace que una
 * pantalla se sienta a medias.
 *
 * `URL.createObjectURL` es lo que ya usa el resto del panel: sin backend, la liga
 * temporal del navegador es todo lo que hay, y sirve perfectamente para ver que
 * lo que se subió es lo que se quería subir.
 */
@Component({
  selector: 'app-press-file-drop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5">
      @if (label()) {
        <label class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center justify-between gap-2">
          <span>{{ label() }}</span>
          @if (hint()) { <span class="normal-case font-bold text-outline/70">{{ hint() }}</span> }
        </label>
      }

      @if (value()) {
        <div class="relative rounded-2xl overflow-hidden border border-blue-500/35 bg-black/60">
          @if (kind() === 'image') {
            <img [src]="value()" [alt]="label()" class="w-full h-44 object-contain bg-black/60" />
          } @else if (kind() === 'video') {
            <video [src]="value()" controls class="w-full h-44 bg-black object-contain"></video>
          } @else {
            <div class="h-24 flex items-center gap-3 px-4">
              <span class="material-symbols-outlined text-3xl text-blue-300">description</span>
              <span class="text-xs font-bold text-on-surface truncate">{{ fileName() || value() }}</span>
            </div>
          }
          <div class="p-2.5 flex items-center justify-between gap-2 border-t border-white/10 bg-black/50">
            <span class="text-[10px] text-on-surface-variant truncate">{{ fileName() || 'Archivo cargado' }}</span>
            @if (!readonly()) {
              <button
                type="button"
                (click)="clear()"
                class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[10px] font-bold transition-all shrink-0"
              >Quitar</button>
            }
          </div>
        </div>
      } @else if (readonly()) {
        <div class="h-24 rounded-2xl border border-dashed border-white/10 bg-black/20 flex items-center justify-center">
          <span class="text-[11px] text-outline italic">Sin archivo</span>
        </div>
      } @else {
        <label
          class="flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
          [class]="dragOver()
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-white/15 bg-black/30 hover:border-blue-400/50 hover:bg-blue-500/5'"
          (dragover)="onDragOver($event)"
          (dragleave)="dragOver.set(false)"
          (drop)="onDrop($event)"
        >
          <span class="material-symbols-outlined text-2xl text-blue-400/70">{{ icon() }}</span>
          <span class="text-[11px] font-bold text-on-surface-variant">Arrastra el archivo o haz clic</span>
          <span class="text-[10px] text-outline">{{ formats() }}</span>
          <input type="file" [accept]="accept()" class="hidden" (change)="onPick($event)" />
        </label>
        @if (allowUrl()) {
          <input
            type="url"
            [ngModel]="value()"
            (ngModelChange)="save.emit($event)"
            placeholder="…o pega la liga aquí"
            class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3.5 py-2 text-[11px] text-on-surface focus:outline-none font-mono transition-colors"
          />
        }
      }
    </div>
  `
})
export class PressFileDropComponent {
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly value = input<string>('');
  readonly kind = input<'image' | 'video' | 'file'>('image');
  readonly readonly = input<boolean>(false);
  /** Deja pegar una liga externa además de subir el archivo. */
  readonly allowUrl = input<boolean>(true);

  readonly save = output<string>();
  /** Nombre y peso del archivo, para que el sitio que lo use lo pueda guardar. */
  readonly named = output<string>();

  readonly dragOver = signal(false);
  readonly fileName = signal('');

  icon(): string {
    switch (this.kind()) {
      case 'video': return 'videocam';
      case 'file': return 'upload_file';
      default: return 'add_photo_alternate';
    }
  }

  accept(): string {
    switch (this.kind()) {
      case 'video': return 'video/*';
      case 'file': return '.pdf,.zip,.doc,.docx';
      default: return 'image/*';
    }
  }

  formats(): string {
    switch (this.kind()) {
      case 'video': return 'MP4 o MOV · también sirve una liga de YouTube';
      case 'file': return 'PDF o ZIP · máx. 20 MB';
      default: return 'JPG o PNG';
    }
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOver.set(false);
    this.take(ev.dataTransfer?.files?.[0]);
  }

  onPick(ev: Event): void {
    this.take((ev.target as HTMLInputElement).files?.[0]);
  }

  clear(): void {
    this.fileName.set('');
    this.save.emit('');
    this.named.emit('');
  }

  private take(file?: File | null): void {
    if (!file) return;
    const nombre = `${file.name} · ${this.fileSize(file.size)}`;
    this.fileName.set(nombre);
    this.save.emit(URL.createObjectURL(file));
    this.named.emit(nombre);
  }

  private fileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
