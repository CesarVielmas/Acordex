import {
  Component, input, output, signal, effect, OnDestroy, ChangeDetectionStrategy, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-preview-player',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#1c1834] via-[#151226] to-[#0f0c1b] border border-primary/50 shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden select-none">
      
      <!-- BACKGROUND AMBIENT GLOW -->
      <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <!-- TRACK INFO & EQUALIZER -->
        <div class="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            (click)="togglePlay()"
            [disabled]="!audioUrl()"
            class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-amber-400 to-amber-500 text-on-primary font-black flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(242,202,80,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            [title]="isPlaying() ? 'Pausar vista previa' : 'Reproducir vista previa'"
          >
            <span class="material-symbols-outlined text-2xl font-bold">
              {{ isPlaying() ? 'pause' : 'play_arrow' }}
            </span>
          </button>

          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2">
              <h4 class="text-xs sm:text-sm font-black text-on-surface truncate font-display-md">{{ title() || 'Selecciona una canción' }}</h4>
              
              @if (isPlaying()) {
                <!-- ANIMATED EQUALIZER BARS -->
                <div class="flex items-end gap-0.5 h-3.5 px-1.5 py-0.5 rounded-md bg-primary/20 border border-primary/40 shrink-0">
                  <span class="w-0.5 bg-primary animate-bounce rounded-full h-3"></span>
                  <span class="w-0.5 bg-amber-300 animate-bounce delay-100 rounded-full h-2"></span>
                  <span class="w-0.5 bg-primary animate-bounce delay-200 rounded-full h-3.5"></span>
                  <span class="w-0.5 bg-amber-300 animate-bounce delay-300 rounded-full h-2.5"></span>
                </div>
              }
            </div>

            <p class="text-[10px] text-outline font-bold truncate flex items-center gap-2">
              <span>{{ artistName() }}</span>
              <span>·</span>
              <span class="font-mono text-primary font-black">{{ genre() }}</span>
            </p>
          </div>
        </div>

        <!-- PROGRESS BAR & CONTROLS -->
        <div class="flex-1 max-w-md space-y-1.5">
          <div class="flex items-center justify-between text-[10px] font-mono font-black text-outline">
            <span class="text-primary">{{ formatTime(currentTime()) }}</span>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-sans font-black border" [class]="audioUrl() ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'">
              {{ audioUrl() ? 'MP3 Verificado ✓' : 'Sin Audio Subido' }}
            </span>
            <span>{{ formatTime(duration()) }}</span>
          </div>

          <div class="relative flex items-center group">
            <input
              type="range"
              min="0"
              [max]="duration() || 100"
              [value]="currentTime()"
              (input)="seek($event)"
              [disabled]="!audioUrl()"
              class="w-full h-2 rounded-full appearance-none bg-[#120f20] border border-outline-variant/30 cursor-pointer accent-primary focus:outline-none"
            />
          </div>
        </div>

        <!-- AUDIO URL EDIT / VERIFICATION BUTTON -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            (click)="promptChangeAudioUrl()"
            class="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary/20 hover:text-primary text-outline text-[10px] font-black border border-outline-variant/30 transition-all flex items-center gap-1.5 shadow-sm"
            title="Verificar o cambiar enlace del archivo de audio"
          >
            <span class="material-symbols-outlined text-xs">graphic_eq</span>
            {{ audioUrl() ? 'Reemplazar Audio' : 'Subir Audio (.mp3)' }}
          </button>

          <button
            type="button"
            (click)="toggleMute()"
            [disabled]="!audioUrl()"
            class="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/30 transition-all flex items-center justify-center"
            [title]="isMuted() ? 'Activar sonido' : 'Silenciar'"
          >
            <span class="material-symbols-outlined text-sm">
              {{ isMuted() ? 'volume_off' : 'volume_up' }}
            </span>
          </button>
        </div>

      </div>

      <!-- Hidden HTML5 audio element -->
      <audio
        #audioRef
        [src]="audioUrl()"
        (timeupdate)="onTimeUpdate()"
        (loadedmetadata)="onLoadedMetadata()"
        (ended)="onEnded()"
        (error)="onAudioError()"
      ></audio>

    </div>
  `
})
export class AudioPreviewPlayerComponent implements OnDestroy {
  audioUrl = input<string | undefined>('');
  title = input<string>('Reproductor de Audio');
  artistName = input<string>('Vista Previa');
  genre = input<string>('Audio HD');

  audioUrlChange = output<string>();

  isPlaying = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  isMuted = signal<boolean>(false);

  @ViewChild('audioRef') private audioRef?: ElementRef<HTMLAudioElement>;

  constructor() {
    effect(() => {
      // Auto-play when a new track/url is selected
      const url = this.audioUrl();
      const songTitle = this.title();
      if (url && songTitle && songTitle !== 'Selecciona una canción para escuchar el audio') {
        setTimeout(() => {
          this.play();
        }, 50);
      } else if (!url && this.isPlaying()) {
        this.pause();
      }
    });
  }

  ngOnDestroy(): void {
    this.pause();
  }

  togglePlay(): void {
    if (!this.audioUrl()) return;
    this.isPlaying() ? this.pause() : this.play();
  }

  play(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    audio.play().then(() => {
      this.isPlaying.set(true);
    }).catch(err => {
      console.warn('Audio play prevented:', err);
      this.isPlaying.set(false);
    });
  }

  pause(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      audio.pause();
    }
    this.isPlaying.set(false);
  }

  seek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = Number(input.value);
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      audio.currentTime = val;
      this.currentTime.set(val);
    }
  }

  toggleMute(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      audio.muted = !audio.muted;
      this.isMuted.set(audio.muted);
    }
  }

  onTimeUpdate(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      this.currentTime.set(audio.currentTime);
    }
  }

  onLoadedMetadata(): void {
    const audio = this.audioRef?.nativeElement;
    if (audio) {
      this.duration.set(audio.duration || 0);
    }
  }

  onEnded(): void {
    this.isPlaying.set(false);
    this.currentTime.set(0);
  }

  onAudioError(): void {
    this.isPlaying.set(false);
  }

  promptChangeAudioUrl(): void {
    const current = this.audioUrl() || '';
    const newUrl = prompt('Ingresa la URL del archivo de audio MP3 para probar la vista previa:', current);
    if (newUrl !== null) {
      this.audioUrlChange.emit(newUrl.trim());
    }
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
