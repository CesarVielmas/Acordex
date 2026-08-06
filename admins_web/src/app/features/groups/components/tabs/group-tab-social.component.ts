import { Component, input, output, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GroupPost, GroupReview, PostVisibility, approvalPercent, averageAttendance, averageRating, defaultSectionVisibility } from '../../group-profile.model';
import { GroupProfileStore } from '../../group-profile.store';
import { SparkChartComponent, SparkSeries } from '../../../../shared/ui/charts/spark-chart.component';

@Component({
  selector: 'app-group-tab-social',
  standalone: true,
  imports: [CommonModule, SparkChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 text-xs select-none">

      <!-- MÉTRICAS DE ALCANCE E IMPACTO (MÉTRICAS INTERNAS DE LA DISQUERA) -->
      <section class="p-5 sm:p-6 rounded-3xl bg-[#18152a] border border-outline-variant/30 space-y-4 shadow-xl">
        <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
          <span class="material-symbols-outlined text-base">insights</span> Alcance & Métricas de Comunidad (Interno Disquera)
        </h3>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div class="p-4 rounded-2xl bg-surface-container border border-purple-500/30 shadow-md">
            <span class="text-[10px] font-black uppercase tracking-wider text-purple-300 block">Seguidores</span>
            <span class="block text-2xl font-black text-on-surface font-mono tracking-tight">{{ profile().social.followers | number:'1.0-0' }}</span>
            <span class="text-[10px] text-emerald-400 font-black flex items-center gap-0.5 mt-1">
              <span class="material-symbols-outlined text-xs">trending_up</span>
              +{{ profile().social.followersGrowthPercent }}% este mes
            </span>
          </div>

          <div class="p-4 rounded-2xl bg-surface-container border border-rose-500/30 shadow-md">
            <span class="text-[10px] font-black uppercase tracking-wider text-rose-300 block">Likes Totales</span>
            <span class="block text-2xl font-black text-on-surface font-mono tracking-tight">{{ profile().social.totalLikes | number:'1.0-0' }}</span>
            <span class="block text-[10px] text-outline font-bold mt-1">Histórico acumulado</span>
          </div>

          <div class="p-4 rounded-2xl bg-surface-container border border-amber-500/30 shadow-md">
            <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Engagement</span>
            <span class="block text-2xl font-black text-on-surface font-mono tracking-tight">{{ profile().social.engagementPercent }}%</span>
            <span class="block text-[10px] text-outline font-bold mt-1">Seguidores interactuando</span>
          </div>

          <div class="p-4 rounded-2xl bg-surface-container border border-emerald-500/30 shadow-md">
            <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Likes Prom. por Post</span>
            <span class="block text-2xl font-black text-on-surface font-mono tracking-tight">{{ avgLikesPerPost() | number:'1.0-0' }}</span>
            <span class="block text-[10px] text-outline font-bold mt-1">{{ profile().posts.length }} publicaciones</span>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/25 space-y-2.5">
          <div class="flex items-center justify-between text-[10px] font-black">
            <span class="text-outline uppercase tracking-wider">Evolución Mensual de Alcance</span>
            <div class="flex items-center gap-4">
              <span class="text-purple-300 flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Seguidores</span>
              <span class="text-rose-300 flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Likes</span>
            </div>
          </div>
          <app-spark-chart
            [series]="socialSeries()"
            [labels]="months"
            [height]="80"
            [idPrefix]="'social-' + profile().id"
            ariaLabel="Evolución mensual de seguidores y likes"
          />
        </div>
      </section>

      <!-- PUBLICACIONES DEL GRUPO (EXPUESTAS EN VISTA PREVIA) -->
      <section
        class="p-5 sm:p-6 rounded-3xl bg-[#18152a] border transition-all duration-300 space-y-4 shadow-xl"
        [class]="vis().showPosts ? 'border-outline-variant/30' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <header class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-3">
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base">dynamic_feed</span> Publicaciones & Novedades del Grupo
            </h3>
            <p class="text-[10px] text-outline">Sección "Publicaciones & Novedades" expuesta en la Vista Previa del Cliente</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
              <button
                type="button"
                (click)="!vis().showPosts && store.toggleSectionVisibility('showPosts')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="vis().showPosts ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
              >
                VISIBLE
              </button>
              <button
                type="button"
                (click)="vis().showPosts && store.toggleSectionVisibility('showPosts')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="!vis().showPosts ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
              >
                OCULTAR
              </button>
            </div>

          </div>
        </header>

        <div class="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            (click)="createNewPost()"
            class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-amber-400 text-on-primary font-black text-xs hover:scale-105 transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
          >
            <span class="material-symbols-outlined text-sm font-bold">add_comment</span> Nueva Publicación
          </button>

            <div class="flex items-center gap-1 flex-wrap">
              @for (f of sentimentFilters; track f.id) {
                <button
                  type="button"
                  (click)="sentimentFilter.set(f.id)"
                  class="px-3 py-1 rounded-xl text-[10px] font-black border transition-all"
                  [class]="sentimentFilter() === f.id ? f.activeClass : 'bg-[#18152a] text-outline border-outline-variant/25 hover:text-on-surface'"
                >
                  {{ f.label }} ({{ countBySentiment(f.id) }})
                </button>
              }
            </div>
          </div>

        @if (visiblePosts().length) {
          <div class="space-y-4">
            @for (post of visiblePosts(); track post.id) {
              <article class="rounded-3xl bg-[#18152a] border border-outline-variant/30 overflow-hidden shadow-lg hover:border-primary/40 transition-all">
                <div class="p-4 sm:p-5 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <img [src]="profile().avatarUrl" [alt]="profile().name" class="w-10 h-10 rounded-2xl object-cover ring-2 ring-primary/40 shrink-0" />
                      <div class="min-w-0">
                        <p class="text-xs font-black text-on-surface truncate font-display-md">{{ profile().name }}</p>
                        <p class="text-[10px] text-outline font-mono">{{ post.publishedAt }}</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black border shadow-sm" [class]="sentimentClass(post.sentiment)">
                        {{ post.sentiment }}
                      </span>
                      <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black border shadow-sm" [class]="visibilityClass(post.visibility)">
                        {{ post.visibility }}
                      </span>
                    </div>
                  </div>

                  <p class="text-xs text-on-surface/90 leading-relaxed font-medium">{{ post.content }}</p>

                  @if (post.imageUrl) {
                    <img [src]="post.imageUrl" alt="" class="w-full h-48 sm:h-56 object-cover rounded-2xl border border-outline-variant/25 shadow-md" />
                  }

                  <div class="flex items-center gap-5 text-xs font-black text-outline pt-1">
                    <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-rose-400">favorite</span> {{ post.likes | number:'1.0-0' }}</span>
                    <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-cyan-400">chat_bubble</span> {{ post.comments.length }} comentarios</span>
                    <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-emerald-400">share</span> {{ post.shares }} compartidos</span>
                  </div>
                </div>

                <!-- Moderación -->
                <div class="px-5 py-3 bg-[#151224] border-t border-outline-variant/20 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    (click)="openPost.emit(post)"
                    class="text-xs font-black text-primary hover:underline flex items-center gap-1"
                  >
                    Ver Comentarios <span class="material-symbols-outlined text-sm">chevron_right</span>
                  </button>

                  <div class="flex items-center gap-2">
                    <button type="button" (click)="editPost.emit(post)" class="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary/20 hover:text-primary text-outline text-[10px] font-black border border-outline-variant/25 transition-all flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">edit</span> Editar
                    </button>
                    <button type="button" (click)="toggleVisibility.emit(post)" class="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-amber-500/20 hover:text-amber-300 text-outline text-[10px] font-black border border-outline-variant/25 transition-all flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">{{ post.visibility === 'Publicada' ? 'visibility_off' : 'visibility' }}</span>
                      {{ post.visibility === 'Publicada' ? 'Ocultar' : 'Publicar' }}
                    </button>
                    <button type="button" (click)="deletePost.emit(post)" class="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-rose-500/20 hover:text-rose-300 text-outline text-[10px] font-black border border-outline-variant/25 transition-all flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">delete</span> Eliminar
                    </button>
                  </div>
                </div>
              </article>
            }
          </div>
        } @else {
          <p class="p-6 text-center text-xs text-outline italic bg-[#18152a] rounded-3xl border border-dashed border-outline-variant/30">
            No hay publicaciones registradas con este filtro.
          </p>
        }
      </section>

      <!-- RESEÑAS DEL PÚBLICO -->
      <section
        class="p-5 sm:p-6 rounded-3xl bg-[#18152a] border transition-all duration-300 space-y-4 shadow-xl"
        [class]="vis().showReviews ? 'border-outline-variant/30' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <header class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-3">
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span class="material-symbols-outlined text-base">reviews</span> Reseñas & Evaluaciones del Público
            </h3>
            <p class="text-[10px] text-outline">Sección "Reseñas & Testimonios" expuesta en la Vista Previa del Cliente</p>
          </div>

          <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
            <button
              type="button"
              (click)="!vis().showReviews && store.toggleSectionVisibility('showReviews')"
              class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              [class]="vis().showReviews ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
            >
              VISIBLE
            </button>
            <button
              type="button"
              (click)="vis().showReviews && store.toggleSectionVisibility('showReviews')"
              class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              [class]="!vis().showReviews ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
            >
              OCULTAR
            </button>
          </div>
        </header>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div class="p-4 rounded-2xl bg-[#18152a] border border-amber-500/30 text-center shadow-md">
            <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Aprobación</span>
            <span class="text-2xl font-black text-amber-400 font-mono">{{ approval() }}%</span>
          </div>
          <div class="p-4 rounded-2xl bg-[#18152a] border border-outline-variant/30 text-center shadow-md">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Calificación</span>
            <span class="text-2xl font-black text-on-surface">★ {{ rating() }}</span>
          </div>
          <div class="p-4 rounded-2xl bg-[#18152a] border border-outline-variant/30 text-center shadow-md">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Reseñas Totales</span>
            <span class="text-2xl font-black text-on-surface font-mono">{{ profile().reviews.length }}</span>
          </div>
          <div class="p-4 rounded-2xl bg-[#18152a] border border-emerald-500/30 text-center shadow-md">
            <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Asistencia Prom.</span>
            <span class="text-2xl font-black text-emerald-400 font-mono">{{ avgAttendance() | number:'1.0-0' }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          @for (r of profile().reviews; track r.id) {
            <button
              type="button"
              (click)="openReview.emit(r)"
              class="w-full text-left p-4 rounded-3xl bg-[#18152a] border border-outline-variant/30 hover:border-amber-400/60 transition-all shadow-md group transform hover:-translate-y-0.5"
            >
              <div class="flex items-start gap-3.5">
                <img [src]="r.avatarUrl" [alt]="r.clientName" class="w-10 h-10 rounded-2xl object-cover shrink-0 ring-2 ring-amber-500/30" />
                <div class="min-w-0 flex-1 space-y-1">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="text-xs font-black text-on-surface truncate group-hover:text-amber-300 transition-colors">{{ r.clientName }}</span>
                    <span class="text-xs font-black text-amber-300 shrink-0">
                      @for (s of [1,2,3,4,5]; track s) {<span [class]="s <= r.rating ? '' : 'opacity-25'">★</span>}
                    </span>
                  </div>
                  <p class="text-[10px] text-outline font-extrabold">
                    {{ r.eventName }} · {{ r.venue }} · {{ r.eventDate }}
                  </p>
                  <p class="text-xs text-on-surface/90 italic leading-relaxed font-medium">"{{ r.comment }}"</p>
                  <p class="text-[10px] text-outline flex items-center gap-1 font-bold pt-1">
                    <span class="material-symbols-outlined text-xs">groups</span>
                    {{ r.attendees | number:'1.0-0' }} asistentes al evento
                  </p>
                </div>
              </div>
            </button>
          }
        </div>
      </section>

    </div>
  `
})
export class GroupTabSocialComponent {
  profile = input.required<GroupProfile>();

  store = inject(GroupProfileStore);
  vis = computed(() => this.profile().sectionVisibility ?? defaultSectionVisibility());

  openPost = output<GroupPost>();
  addPost = output<GroupPost>();
  editPost = output<GroupPost>();
  deletePost = output<GroupPost>();
  toggleVisibility = output<GroupPost>();
  openReview = output<GroupReview>();

  protected readonly months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  sentimentFilter = signal<'todas' | 'Positivo' | 'Neutro' | 'Negativo'>('todas');

  // Modal signals for creating posts
  showPostModal = signal<boolean>(false);
  newPostContent = signal<string>('');
  newPostImageUrl = signal<string>('');
  newPostVisibility = signal<string>('Publicada');
  newPostSentiment = signal<string>('Positivo');

  protected readonly sentimentFilters = [
    { id: 'todas' as const, label: 'Todas', activeClass: 'bg-primary text-on-primary border-primary shadow-sm' },
    { id: 'Positivo' as const, label: 'Positivas', activeClass: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 shadow-sm' },
    { id: 'Neutro' as const, label: 'Neutras', activeClass: 'bg-slate-500/30 text-slate-200 border-slate-400/60 shadow-sm' },
    { id: 'Negativo' as const, label: 'Negativas', activeClass: 'bg-rose-500/25 text-rose-300 border-rose-400/60 shadow-sm' }
  ];

  visiblePosts = computed(() => {
    const f = this.sentimentFilter();
    const posts = this.profile().posts;
    return f === 'todas' ? posts : posts.filter(p => p.sentiment === f);
  });

  socialSeries = computed<SparkSeries[]>(() => [
    { key: 'followers', label: 'Seguidores', values: this.profile().social.monthlyFollowers, color: '#c084fc', unit: 'k' },
    { key: 'likes', label: 'Likes', values: this.profile().social.monthlyLikes, color: '#fb7185', unit: 'k' }
  ]);

  avgLikesPerPost = computed(() => {
    const posts = this.profile().posts;
    if (!posts.length) return 0;
    return posts.reduce((s, p) => s + p.likes, 0) / posts.length;
  });

  approval = computed(() => approvalPercent(this.profile()));
  rating = computed(() => averageRating(this.profile()));
  avgAttendance = computed(() => averageAttendance(this.profile()));

  createNewPost(): void {
    this.store.openAddPostModal();
  }

  handlePostFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this.newPostImageUrl.set(URL.createObjectURL(file));
    }
  }

  submitNewPost(): void {
    const content = this.newPostContent().trim();
    if (!content) return;

    const newPost: GroupPost = {
      id: 'post-' + Date.now(),
      content,
      imageUrl: this.newPostImageUrl().trim() || undefined,
      publishedAt: 'Hace un momento',
      likes: 0,
      shares: 0,
      visibility: (this.newPostVisibility() as PostVisibility) || 'Publicada',
      sentiment: (this.newPostSentiment() as 'Positivo' | 'Neutro' | 'Negativo') || 'Positivo',
      comments: []
    };

    this.addPost.emit(newPost);
    this.showPostModal.set(false);
  }

  countBySentiment(id: 'todas' | 'Positivo' | 'Neutro' | 'Negativo'): number {
    const posts = this.profile().posts;
    return id === 'todas' ? posts.length : posts.filter(p => p.sentiment === id).length;
  }

  sentimentClass(s: string): string {
    switch (s) {
      case 'Positivo': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Negativo': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default: return 'bg-slate-500/25 text-slate-200 border-slate-400/40';
    }
  }

  visibilityClass(v: PostVisibility): string {
    switch (v) {
      case 'Publicada': return 'bg-primary/20 text-primary border-primary/40';
      case 'Privada': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-surface-bright text-outline border-outline-variant/40';
    }
  }
}
