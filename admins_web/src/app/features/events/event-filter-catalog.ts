import { EventItem, EventState } from '../../core/models/event.models';
import { canSubmitForReview } from './event-completeness';
import {
  daysSince,
  daysUntilEvent,
  externalSlots,
  hasRejection,
  hoursUntilPublish,
  isClosureComplete,
  isSoldOut,
  occupancyPercent,
  pendingApprovals,
  pendingPayoutsCount,
  isSealed
} from './event-metrics';

/**
 * Catálogo de filtros del módulo de eventos.
 *
 * Igual que en cotizaciones, hay dos familias:
 *
 * - **Contextuales por estado**: dependen de la fase ("¿ya está listo para
 *   revisión?", "¿quién falta de aprobar?", "¿cómo va la venta?"). Los usa cada
 *   columna del tablero.
 * - **Transversales**: cruzan todas las fases ("¿qué está por ocurrir?", "¿qué
 *   está atorado?"). Los usa la cartelera plana, donde filtrar por fase no
 *   tendría sentido.
 */
export interface EventFilterOption {
  value: string;
  label: string;
  icon: string;
  /** Clases Tailwind aplicadas cuando el chip está activo. */
  activeClass: string;
  match: (e: EventItem) => boolean;
}

const TODOS: EventFilterOption = {
  value: 'todas',
  label: 'Todos',
  icon: 'apps',
  activeClass: 'bg-primary text-on-primary border-primary shadow-sm',
  match: () => true
};

const EMERALD = 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 shadow-sm';
const AMBER = 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-sm';
const ROSE = 'bg-rose-500/25 text-rose-300 border-rose-400/60 shadow-sm';
const CYAN = 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 shadow-sm';
const PURPLE = 'bg-purple-500/25 text-purple-300 border-purple-400/60 shadow-sm';
const BLUE = 'bg-blue-500/25 text-blue-300 border-blue-400/60 shadow-sm';
const SLATE = 'bg-slate-500/30 text-slate-200 border-slate-400/60 shadow-sm';

/** Título de la barra de filtros, nombrando la dimensión que se filtra en esa fase. */
export function stateFilterLabel(state: EventState): string {
  switch (state) {
    case 'Borrador': return 'Filtrar por Avance:';
    case 'En Revisión': return 'Filtrar por Aprobación:';
    case 'Próximo a Publicar': return 'Filtrar por Programación:';
    case 'Publicado': return 'Filtrar por Cartelera:';
    case 'En Venta': return 'Filtrar por Ocupación:';
    case 'Finalizada': return 'Filtrar por Cierre:';
    case 'Cerrado': return 'Filtrar por Resultado:';
    case 'Cancelado': return 'Filtrar por Reembolso:';
    default: return 'Filtrar por:';
  }
}

/** Filtros que de verdad importan en cada fase. La primera opción siempre es "Todos". */
export function stateFilterOptions(state: EventState): EventFilterOption[] {
  switch (state) {
    case 'Borrador':
      return [TODOS,
        { value: 'listo', label: 'Listo para Revisión', icon: 'task_alt', activeClass: EMERALD, match: e => canSubmitForReview(e) },
        { value: 'incompleto', label: 'Información Incompleta', icon: 'checklist', activeClass: AMBER, match: e => !canSubmitForReview(e) },
        { value: 'con_externos', label: 'Con Grupos Externos', icon: 'diversity_3', activeClass: PURPLE, match: e => externalSlots(e).length > 0 },
        { value: 'urgente', label: 'Fecha Cercana (≤30 días)', icon: 'bolt', activeClass: ROSE, match: e => daysUntilEvent(e) >= 0 && daysUntilEvent(e) <= 30 }
      ];

    case 'En Revisión':
      return [TODOS,
        { value: 'pendientes', label: 'Con Aprobaciones Pendientes', icon: 'hourglass_top', activeClass: AMBER, match: e => pendingApprovals(e).length > 0 },
        { value: 'rechazado', label: 'Con Rechazo', icon: 'thumb_down', activeClass: ROSE, match: e => hasRejection(e) },
        { value: 'aprobado', label: 'Aprobado por Todos', icon: 'verified', activeClass: EMERALD, match: e => pendingApprovals(e).length === 0 && !hasRejection(e) },
        { value: 'reenviado', label: 'En Segunda Ronda o Más', icon: 'restart_alt', activeClass: PURPLE, match: e => (e.reviewRounds?.length ?? 0) > 1 }
      ];

    case 'Próximo a Publicar':
      return [TODOS,
        { value: 'inminente', label: 'Publica en ≤24 h', icon: 'schedule_send', activeClass: CYAN, match: e => (hoursUntilPublish(e) ?? 9999) <= 24 },
        { value: 'programado', label: 'Programado a Futuro', icon: 'event_upcoming', activeClass: BLUE, match: e => (hoursUntilPublish(e) ?? -1) > 24 },
        { value: 'sin_fecha', label: 'Sin Fecha de Publicación', icon: 'event_busy', activeClass: AMBER, match: e => !e.publication?.scheduledAt }
      ];

    case 'Publicado':
      return [TODOS,
        { value: 'urgente', label: 'Evento Cercano (≤30 días)', icon: 'bolt', activeClass: ROSE, match: e => daysUntilEvent(e) >= 0 && daysUntilEvent(e) <= 30 },
        { value: 'sin_traccion', label: 'Más de 7 días en Cartelera sin Venta', icon: 'trending_down', activeClass: AMBER, match: e => (daysSince(e.publication?.publishedAt?.slice(0, 10)) ?? 0) >= 7 },
        { value: 'coproduccion', label: 'Co-producción', icon: 'handshake', activeClass: PURPLE, match: e => e.isCoProduction }
      ];

    case 'En Venta':
      return [TODOS,
        { value: 'agotado', label: 'Agotado', icon: 'local_fire_department', activeClass: EMERALD, match: e => isSoldOut(e) },
        { value: 'buena_venta', label: 'Buena Venta (≥70%)', icon: 'trending_up', activeClass: EMERALD, match: e => occupancyPercent(e) >= 70 && !isSoldOut(e) },
        { value: 'venta_media', label: 'Venta Media (35-70%)', icon: 'insights', activeClass: BLUE, match: e => occupancyPercent(e) >= 35 && occupancyPercent(e) < 70 },
        { value: 'venta_lenta', label: 'Venta Lenta (<35%)', icon: 'trending_down', activeClass: ROSE, match: e => occupancyPercent(e) < 35 }
      ];

    case 'Finalizada':
      return [TODOS,
        { value: 'cierre_completo', label: 'Cierre Completo', icon: 'fact_check', activeClass: EMERALD, match: e => isClosureComplete(e) },
        { value: 'cierre_incompleto', label: 'Faltan Datos de Cierre', icon: 'pending_actions', activeClass: AMBER, match: e => !isClosureComplete(e) },
        { value: 'pagos_pendientes', label: 'Con Pagos a Grupos Pendientes', icon: 'payments', activeClass: ROSE, match: e => pendingPayoutsCount(e) > 0 }
      ];

    case 'Cerrado':
      return [TODOS,
        { value: 'sellado', label: 'Sellado', icon: 'lock', activeClass: SLATE, match: e => isSealed(e) },
        { value: 'coproduccion', label: 'Co-producción', icon: 'handshake', activeClass: PURPLE, match: e => e.isCoProduction }
      ];

    case 'Cancelado':
      return [TODOS,
        { value: 'con_reembolso', label: 'Con Reembolsos', icon: 'currency_exchange', activeClass: ROSE, match: e => (e.cancellation?.refundsIssued ?? 0) > 0 },
        { value: 'sin_venta', label: 'Cancelado Antes de la Venta', icon: 'money_off', activeClass: SLATE, match: e => (e.cancellation?.refundsIssued ?? 0) === 0 }
      ];

    default:
      return [TODOS];
  }
}

/**
 * Filtros que aplican sin importar la fase. En la cartelera, donde los eventos
 * se ven todos juntos, lo que interesa es detectar de un golpe qué necesita
 * atención hoy.
 */
export function transversalFilterOptions(): EventFilterOption[] {
  return [TODOS,
    { value: 'proximos', label: 'Ocurre en ≤15 días', icon: 'bolt', activeClass: ROSE, match: e => daysUntilEvent(e) >= 0 && daysUntilEvent(e) <= 15 },
    { value: 'requiere_accion', label: 'Requiere Mi Acción', icon: 'priority_high', activeClass: AMBER, match: e => requiresAction(e) },
    { value: 'con_externos', label: 'Con Grupos de Otros Encargados', icon: 'diversity_3', activeClass: PURPLE, match: e => externalSlots(e).length > 0 },
    { value: 'coproduccion', label: 'Co-producción', icon: 'handshake', activeClass: BLUE, match: e => e.isCoProduction },
    { value: 'con_venta', label: 'Con Boletos Vendidos', icon: 'confirmation_number', activeClass: EMERALD, match: e => occupancyPercent(e) > 0 },
    { value: 'historico', label: 'Histórico (Cerrado o Cancelado)', icon: 'history', activeClass: SLATE, match: e => e.state === 'Cerrado' || e.state === 'Cancelado' }
  ];
}

export const TRANSVERSAL_FILTER_LABEL = 'Filtrar por Atención Requerida:';

/**
 * True cuando el evento está esperando que alguien de la disquera haga algo.
 * Es el filtro que responde "¿qué tengo yo que mover hoy?".
 */
export function requiresAction(e: EventItem): boolean {
  switch (e.state) {
    case 'Borrador': return !canSubmitForReview(e);
    case 'En Revisión': return hasRejection(e) || pendingApprovals(e).length === 0;
    case 'Próximo a Publicar': return !e.publication?.scheduledAt;
    case 'Publicado': return daysUntilEvent(e) <= 30 && occupancyPercent(e) === 0;
    case 'En Venta': return occupancyPercent(e) < 35 && daysUntilEvent(e) <= 30;
    case 'Finalizada': return !isClosureComplete(e) || pendingPayoutsCount(e) > 0;
    default: return false;
  }
}
