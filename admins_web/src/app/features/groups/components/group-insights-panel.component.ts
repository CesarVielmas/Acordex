import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupItem } from '../../../core/models/admin.models';
import { RoleService } from '../../../core/services/role.service';

interface PointCoord {
  x: number;
  y: number;
  val: number;
  label: string;
}

export type ChartMetricMode = 'VOLUME' | 'REVENUE' | 'APPROVAL';

@Component({
  selector: 'app-group-insights-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5 sticky top-6">
      
      <!-- Panel Header & Group Selector Tabs -->
      <div class="p-5 rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 backdrop-blur-xl shadow-xl space-y-4">
        
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-amber-400 text-on-primary flex items-center justify-center font-black shadow-lg">
              <span class="material-symbols-outlined text-xl">analytics</span>
            </div>
            <div>
              <h3 class="font-display-md text-base font-black text-on-surface">Panel de Gráficos & Métricas</h3>
              <p class="text-[11px] text-outline font-semibold">Pasa el cursor sobre la curva para ver el detalle del mes</p>
            </div>
          </div>
        </div>

        <!-- Selector de grupo. Solo los chips: un select encima listaba exactamente
             los mismos grupos, así que duplicaba la información. -->
        <span class="block text-[10px] font-black uppercase tracking-wider text-outline">Seleccionar Grupo para Análisis:</span>
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            (click)="selectGroupById('ALL')"
            class="px-3 py-1.5 rounded-xl font-extrabold transition-all shrink-0 text-[11px]"
            [ngClass]="activeGroupId() === 'ALL' ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-highest text-outline hover:text-on-surface'"
          >
            Todos
          </button>
          @for (grp of groups(); track grp.id) {
            <button
              (click)="selectGroupById(grp.id)"
              class="px-3 py-1.5 rounded-xl font-extrabold transition-all shrink-0 text-[11px] flex items-center gap-1.5 border border-outline-variant/20"
              [ngClass]="activeGroupId() === grp.id ? 'bg-primary text-on-primary shadow-md border-primary' : 'bg-surface-container-highest text-outline hover:text-on-surface'"
            >
              <img [src]="grp.image" [alt]="grp.name" class="w-4 h-4 rounded-full object-cover ring-1 ring-white/30" />
              <span class="truncate max-w-[110px]">{{ grp.name }}</span>
            </button>
          }
        </div>

      </div>

      <!-- ACTIVE GROUP HEADER CARD (If specific group selected) -->
      @if (activeGroup(); as grp) {
        <div class="p-4 rounded-3xl bg-gradient-to-r from-surface-container-high via-surface-bright to-surface-container-high border border-primary/40 backdrop-blur-xl shadow-xl flex items-center gap-4 animate-fade-in">
          <img [src]="grp.image" [alt]="grp.name" class="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary shadow-lg shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <h4 class="font-black text-sm text-on-surface truncate">{{ grp.name }}</h4>
              
              @if (grp.isOnline) {
                <span class="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> En Línea
                </span>
              } @else {
                <span class="text-[10px] font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  ★ {{ grp.rating }}
                </span>
              }
            </div>
            <p class="text-[11px] text-primary font-bold truncate mt-0.5">{{ grp.genre }} • {{ grp.followersCount }} seguidores</p>
            <div class="flex items-center gap-2 text-[10px] text-outline font-semibold mt-1">
              <span>Líder: {{ grp.groupLeaderName }}</span>
              <span>•</span>
              <span class="text-emerald-400 font-extrabold">{{ grp.agendaStatus }}</span>
            </div>
          </div>
        </div>
      }

      <!-- SEGMENTED DISPLAY BAR FOR CHART METRIC SELECTION -->
      <div class="p-5 rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 backdrop-blur-xl shadow-xl space-y-4">
        
        <!-- Display Bar Mode Selector -->
        <div class="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-1 p-1 rounded-2xl bg-surface-container-highest/80 border border-outline-variant/30 w-full shadow-inner">
            <button
              (click)="chartMetricMode.set('VOLUME')"
              class="flex-1 py-2 px-2 rounded-xl font-black text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1"
              [ngClass]="chartMetricMode() === 'VOLUME' ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-on-surface'"
            >
              <span class="material-symbols-outlined text-xs">bar_chart</span> Volumen Booking
            </button>

            <button
              (click)="chartMetricMode.set('REVENUE')"
              class="flex-1 py-2 px-2 rounded-xl font-black text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1"
              [ngClass]="chartMetricMode() === 'REVENUE' ? 'bg-emerald-500 text-on-primary shadow-md' : 'text-outline hover:text-emerald-400'"
            >
              <span class="material-symbols-outlined text-xs">payments</span> Facturación ($)
            </button>

            <button
              (click)="chartMetricMode.set('APPROVAL')"
              class="flex-1 py-2 px-2 rounded-xl font-black text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1"
              [ngClass]="chartMetricMode() === 'APPROVAL' ? 'bg-amber-500 text-on-primary shadow-md' : 'text-outline hover:text-amber-300'"
            >
              <span class="material-symbols-outlined text-xs">thumb_up</span> Aprobación (%)
            </button>
          </div>
        </div>

        <!-- CLEAN VECTORIAL GRAPH CONTAINER (NO PERMANENT DOTS, HOVER LASER + FLOATING GLASS CARD) -->
        <div 
          class="relative h-64 w-full pt-4 pb-2 bg-gradient-to-b from-surface-container-highest/90 to-surface-container-highest/40 rounded-3xl p-4 border border-outline-variant/30 shadow-inner select-none overflow-hidden"
          (mouseleave)="activeHoverIndex.set(null)"
        >
          
          <!-- SVG Vector Graphics -->
          <svg class="w-full h-48 overflow-visible relative z-10" viewBox="0 0 400 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#c084fc" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#c084fc" stop-opacity="0.0" />
              </linearGradient>

              <linearGradient id="secondaryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#34d399" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#34d399" stop-opacity="0.0" />
              </linearGradient>

              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- Mode 1: VOLUME (Cotizaciones vs Eventos) -->
            @if (chartMetricMode() === 'VOLUME') {
              <!-- Areas -->
              <path [attr.d]="quoteSvgData().areaPath" fill="url(#primaryGrad)" />
              <path [attr.d]="eventSvgData().areaPath" fill="url(#secondaryGrad)" />

              <!-- Smooth Vector Lines (Without Permanent Dots) -->
              <path [attr.d]="quoteSvgData().linePath" fill="none" stroke="#c084fc" stroke-width="3.5" stroke-linecap="round" filter="url(#neonGlow)" />
              <path [attr.d]="eventSvgData().linePath" fill="none" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" filter="url(#neonGlow)" />
            }

            <!-- Mode 2: REVENUE ($ Facturación Mensual) -->
            @if (chartMetricMode() === 'REVENUE') {
              <path [attr.d]="revenueSvgData().areaPath" fill="url(#secondaryGrad)" />
              <path [attr.d]="revenueSvgData().linePath" fill="none" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" filter="url(#neonGlow)" />
            }

            <!-- Mode 3: APPROVAL (%) -->
            @if (chartMetricMode() === 'APPROVAL') {
              <path [attr.d]="approvalSvgData().areaPath" fill="url(#primaryGrad)" />
              <path [attr.d]="approvalSvgData().linePath" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" filter="url(#neonGlow)" />
            }

            <!-- DYNAMIC INTERACTIVE LASER CURSOR & SINGLE GLOWING NODE ON HOVER -->
            @if (activeHoverIndex(); as idx) {
              @if (getHoverDetails(idx); as details) {
                <!-- Vertical Laser Guide Line -->
                <line
                  [attr.x1]="details.x"
                  y1="10"
                  [attr.x2]="details.x"
                  y2="165"
                  stroke="#f2ca50"
                  stroke-width="1.5"
                  stroke-dasharray="3,3"
                  class="animate-pulse"
                />

                <!-- Single Active Glow Circle Node on Hover -->
                <circle
                  [attr.cx]="details.x"
                  [attr.cy]="details.yPrimary"
                  r="6.5"
                  fill="#f2ca50"
                  stroke="#ffffff"
                  stroke-width="2.5"
                  class="shadow-2xl"
                />
              }
            }

            <!-- INVISIBLE HOVER COLLISION COLUMNS FOR SMOOTH SCALING ACROSS ANY X-POSITION -->
            @for (m of monthlyMetrics(); track m.monthLabel; let idx = $index) {
              <rect
                [attr.x]="20 + (idx * (360 / 11)) - (180 / 11)"
                y="0"
                [attr.width]="360 / 11"
                height="180"
                fill="transparent"
                class="cursor-pointer"
                (mouseenter)="activeHoverIndex.set(idx)"
              />
            }
          </svg>

          <!-- Monthly Labels Row (Ene - Dic) -->
          <div class="flex items-center justify-between text-[9px] font-black text-outline px-1 pt-1 border-t border-outline-variant/20">
            @for (m of monthlyMetrics(); track m.monthLabel; let idx = $index) {
              <span
                (mouseenter)="activeHoverIndex.set(idx)"
                class="text-center w-6 cursor-pointer transition-colors duration-200"
                [ngClass]="activeHoverIndex() === idx ? 'text-primary font-black scale-125' : 'hover:text-on-surface'"
              >
                {{ m.monthLabel }}
              </span>
            }
          </div>

          <!-- ULTRA-LUXURY FLOATING HOVER CARD AT CURSOR POSITION -->
          @if (activeHoverIndex(); as idx) {
            @if (getHoverDetails(idx); as details) {
              <!-- Ancho al contenido y anclado por porcentaje: con un ancho fijo las
                   cifras largas partían en dos líneas al angostar la ventana. -->
              <div
                class="absolute z-30 p-3.5 rounded-2xl bg-[#161325] border border-primary/50 shadow-[0_20px_50px_rgba(0,0,0,0.95)] pointer-events-none animate-scale-up space-y-1.5 text-xs w-max whitespace-nowrap"
                [style.top.px]="30"
                [style.left.%]="details.cardLeftPercent"
                [style.transform]="details.cardTransform"
              >
                <div class="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                  <span class="font-black text-on-surface text-xs uppercase flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-primary text-sm">calendar_month</span>
                    {{ details.monthLabel }} 2026
                  </span>
                  <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    Métricas
                  </span>
                </div>

                <div class="space-y-1 text-[11px]">
                  @if (chartMetricMode() === 'VOLUME') {
                    <div class="flex items-center justify-between font-extrabold text-purple-300">
                      <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-purple-400 shadow-sm"></span>
                        Cotizaciones:
                      </span>
                      <span class="font-black text-xs text-white">{{ details.quotes }} solicitudes</span>
                    </div>

                    <div class="flex items-center justify-between font-extrabold text-emerald-400">
                      <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm"></span>
                        Eventos Confirmados:
                      </span>
                      <span class="font-black text-xs text-white">{{ details.events }} fechas</span>
                    </div>
                  } @else if (chartMetricMode() === 'REVENUE') {
                    <div class="flex items-center justify-between font-extrabold text-emerald-400">
                      <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm"></span>
                        Facturación Mensual:
                      </span>
                      <span class="font-black text-xs text-white">&#36;{{ details.revenue | number:'1.0-0' }} MXN</span>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between font-extrabold text-amber-300">
                      <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-amber-400 shadow-sm"></span>
                        Aceptación Pública:
                      </span>
                      <span class="font-black text-xs text-white">{{ details.approval }}% Positiva</span>
                    </div>
                  }

                  <div class="pt-1 text-[9px] text-outline font-semibold border-t border-outline-variant/15 flex items-center justify-between">
                    <span>Estimado Proyectado:</span>
                    <span class="text-emerald-400 font-extrabold">&#36;{{ details.revenue | number:'1.0-0' }}</span>
                  </div>
                </div>
              </div>
            }
          }

        </div>

        <!-- Metrics Summary Chips -->
        <div class="grid grid-cols-3 gap-2.5 text-center text-xs">
          <div class="p-3 rounded-2xl bg-surface-container-highest/80 border border-purple-500/20 shadow-sm">
            <span class="text-[9px] font-black uppercase tracking-wider text-purple-300 block">Cotizaciones Mes</span>
            <span class="font-black text-purple-400 text-base mt-0.5 block">{{ currentTotalQuotes() }}</span>
          </div>

          <div class="p-3 rounded-2xl bg-surface-container-highest/80 border border-emerald-500/20 shadow-sm">
            <span class="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">Eventos Mes</span>
            <span class="font-black text-emerald-400 text-base mt-0.5 block">{{ currentTotalEvents() }}</span>
          </div>

          <div class="p-3 rounded-2xl bg-surface-container-highest/80 border border-outline-variant/20 shadow-sm">
            <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Integrantes</span>
            <span class="font-black text-on-surface text-base mt-0.5 block">{{ activeGroup()?.membersCount || 'N/A' }}</span>
          </div>
        </div>

      </div>

      <!-- ROLE-BASED INSIGHTS: Ganancias (Encargado) & Aceptación del Público (Encargado + Admin) -->
      <div class="grid grid-cols-1 gap-4">

        <!-- 1. Aproximado de Ganancias (Rol Encargado) -->
        @if (roleService.activeRole() === 'encargado' || roleService.canViewFinances()) {
          <div class="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-surface-container-high to-surface-container-high border border-emerald-500/40 backdrop-blur-xl shadow-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">payments</span>
                Aproximado de Ganancias (Rol Encargado)
              </span>
              <span class="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {{ activeGroup() ? activeGroup()?.name : 'Catálogo Total' }}
              </span>
            </div>

            <div class="flex items-baseline justify-between pt-1">
              <div>
                <span class="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  &#36;{{ currentEstimatedEarnings() | number:'1.0-0' }}
                </span>
                <span class="text-xs text-outline ml-1 font-bold">MXN</span>
              </div>
              <span class="text-xs font-bold text-emerald-300 flex items-center gap-0.5 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                <span class="material-symbols-outlined text-xs">trending_up</span> +16.8%
              </span>
            </div>
            <p class="text-[10px] text-outline font-semibold leading-relaxed">
              Estimado de facturación proyectado según honorarios vigentes y eventos confirmados del grupo.
            </p>
          </div>
        }

        <!-- 2. Aceptación Promedio de la Gente (Rol Encargado y Administrador) -->
        @if (roleService.activeRole() === 'encargado' || roleService.activeRole() === 'administrador') {
          <div class="p-5 rounded-3xl bg-gradient-to-br from-amber-950/50 via-surface-container-high to-surface-container-high border border-amber-500/40 backdrop-blur-xl shadow-xl space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">sentiment_very_satisfied</span>
                Aceptación Promedio del Público
              </span>
              <span class="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Encargado & Admin
              </span>
            </div>

            <div class="flex items-center gap-4">
              <!-- Radial Meter Gauge Ring -->
              <div class="relative w-16 h-16 rounded-full flex items-center justify-center border-4 border-amber-500/20 bg-amber-500/10 shadow-md shrink-0">
                <span class="text-base font-black text-amber-300">
                  {{ currentPublicApproval() }}%
                </span>
              </div>

              <div class="flex-1 space-y-2">
                <div class="w-full bg-surface-container-highest h-3.5 rounded-full overflow-hidden p-0.5 border border-outline-variant/30 shadow-inner">
                  <div
                    class="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 h-full rounded-full transition-all duration-500 shadow"
                    [style.width.%]="currentPublicApproval()"
                  ></div>
                </div>

                <div class="flex items-center justify-between text-[10px] text-outline font-bold">
                  <span>Auditoría de Experiencia</span>
                  <span class="text-amber-300 font-extrabold">★ {{ activeGroup()?.rating || '4.9' }} / 5.0</span>
                </div>
              </div>
            </div>
          </div>
        }

      </div>

    </div>
  `
})
export class GroupInsightsPanelComponent {
  roleService = inject(RoleService);

  groups = input.required<GroupItem[]>();
  activeGroupId = signal<string>('ALL');
  chartMetricMode = signal<ChartMetricMode>('VOLUME');
  activeHoverIndex = signal<number | null>(null);

  protected Math = Math;

  activeGroup = computed<GroupItem | null>(() => {
    const id = this.activeGroupId();
    if (id === 'ALL') return null;
    return this.groups().find(g => g.id === id) || null;
  });

  selectGroupById(id: string): void {
    this.activeGroupId.set(id);
  }

  // Monthly timeline metrics (Ene - Dic)
  monthlyMetrics = computed(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const active = this.activeGroup();
    
    return months.map((monthLabel, i) => {
      let q = Math.floor(Math.sin((i + 1) * 0.8) * 4 + 8);
      let e = Math.floor(Math.sin((i + 1) * 0.8) * 3 + 5);
      let rev = Math.floor((q * 85000) + (e * 120000));

      if (active) {
        q = Math.floor((active.monthlyQuotesCount / 12) * (1 + Math.sin(i) * 0.4));
        e = Math.floor((active.monthlyEventsCount / 12) * (1 + Math.cos(i) * 0.4));
        rev = Math.floor((active.estimatedMonthlyEarnings / 12) * (1 + Math.sin(i) * 0.3));
      }

      return { monthLabel, quotes: Math.max(1, q), events: Math.max(0, e), revenue: Math.max(10000, rev) };
    });
  });

  maxVal = computed(() => {
    const metrics = this.monthlyMetrics();
    if (!metrics.length) return 10;
    const max = Math.max(...metrics.map(m => Math.max(m.quotes, m.events)));
    return max > 0 ? max : 10;
  });

  quoteSvgData = computed(() => {
    return this.generateSvgPaths(this.monthlyMetrics().map(m => m.quotes), this.maxVal());
  });

  eventSvgData = computed(() => {
    return this.generateSvgPaths(this.monthlyMetrics().map(m => m.events), this.maxVal());
  });

  revenueSvgData = computed(() => {
    const revs = this.monthlyMetrics().map(m => m.revenue);
    const max = Math.max(...revs, 100000);
    return this.generateSvgPaths(revs, max);
  });

  approvalSvgData = computed(() => {
    const active = this.activeGroup();
    const appVal = active ? active.publicApprovalPercent : 95;
    const vals = [appVal - 3, appVal - 1, appVal, appVal + 1, appVal + 2, appVal + 1, appVal, appVal - 1, appVal, appVal + 1, appVal, appVal];
    return this.generateSvgPaths(vals, 100);
  });

  private generateSvgPaths(values: number[], max: number): { linePath: string; areaPath: string; points: PointCoord[] } {
    const width = 400;
    const height = 160;
    const padding = 20;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    if (!values.length) {
      return { linePath: '', areaPath: '', points: [] };
    }

    const maxSafe = max > 0 ? max : 10;

    const points: PointCoord[] = values.map((val, idx) => {
      const x = padding + (idx / Math.max(1, values.length - 1)) * availableWidth;
      const normalizedY = (val / maxSafe) * availableHeight;
      const y = height - padding - normalizedY;
      return { x, y, val, label: `${val}` };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    const areaPath = `${linePath} L ${lastPt.x} ${height - 5} L ${firstPt.x} ${height - 5} Z`;

    return { linePath, areaPath, points };
  }

  getHoverDetails(idx: number): {
    monthLabel: string;
    quotes: number;
    events: number;
    revenue: number;
    approval: number;
    x: number;
    yPrimary: number;
    cardLeftPercent: number;
    cardTransform: string;
  } | null {
    const metrics = this.monthlyMetrics();
    if (idx < 0 || idx >= metrics.length) return null;

    const m = metrics[idx];
    const pts = this.quoteSvgData().points;
    const pt = pts[idx] || { x: 20, y: 80 };

    // Se ancla en % del ancho real del contenedor (no en px del viewBox) y se
    // alinea al borde en los extremos, para que no se salga de la tarjeta.
    const cardLeftPercent = (pt.x / 400) * 100;
    const cardTransform =
      cardLeftPercent < 28 ? 'translateX(0)' :
      cardLeftPercent > 72 ? 'translateX(-100%)' :
      'translateX(-50%)';

    return {
      monthLabel: m.monthLabel,
      quotes: m.quotes,
      events: m.events,
      revenue: m.revenue,
      approval: this.currentPublicApproval(),
      x: pt.x,
      yPrimary: pt.y,
      cardLeftPercent,
      cardTransform
    };
  }

  currentTotalQuotes = computed(() => {
    const active = this.activeGroup();
    if (active) return active.monthlyQuotesCount;
    return this.groups().reduce((sum, g) => sum + (g.monthlyQuotesCount || 0), 0);
  });

  currentTotalEvents = computed(() => {
    const active = this.activeGroup();
    if (active) return active.monthlyEventsCount;
    return this.groups().reduce((sum, g) => sum + (g.monthlyEventsCount || 0), 0);
  });

  currentEstimatedEarnings = computed(() => {
    const active = this.activeGroup();
    if (active) return active.estimatedMonthlyEarnings;
    return this.groups().reduce((sum, g) => sum + (g.estimatedMonthlyEarnings || 0), 0);
  });

  currentPublicApproval = computed(() => {
    const active = this.activeGroup();
    if (active) return active.publicApprovalPercent;

    const list = this.groups();
    if (!list.length) return 0;
    const sum = list.reduce((acc, g) => acc + (g.publicApprovalPercent || 90), 0);
    return Math.round(sum / list.length);
  });
}
