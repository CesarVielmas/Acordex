/**
 * Las pestañas del expediente de prensa y en cuál se captura cada punto.
 *
 * Vive fuera del modal para que la pestaña de Tareas pueda mandar a la gente al
 * sitio correcto sin importar el componente entero —importarse mutuamente es
 * exactamente el ciclo que rompe la compilación—.
 */
export type PressDetailTab =
  | 'resumen' | 'evento' | 'acreditaciones' | 'produccion'
  | 'tareas' | 'cierre' | 'trazabilidad';

/**
 * En qué pestaña se captura este punto del checklist.
 *
 * Las ids son las de `pressCompleteness`, no nombres de campo del modelo. En
 * Eventos este mapa nació escrito contra ids que no existían —`coverUrl`,
 * `lineup`, `ticketTiers`— así que ninguna coincidía, todo caía en el `default` y
 * el botón "Ir a capturarlo" abría siempre la misma pestaña, dejando a quien lo
 * pulsaba buscando un dato que no estaba ahí. Por eso el `default` es lo último
 * que debería usarse y no la regla.
 */
export function getTabForPressChecklistItem(id: string): PressDetailTab {
  switch (id) {
    case 'identidad_prensa':
    case 'tipo_prensa':
    case 'hora_prensa':
    case 'direccion_prensa':
    case 'flyer_prensa':
    case 'grupo_prensa':
    case 'grupos_publico_prensa':
    case 'foto_oficial':
    case 'descripcion_prensa':
    case 'mapa_prensa':
    case 'soporte_prensa':
    case 'reglas_fans':
    case 'galeria_prensa':
    case 'videos_prensa':
      return 'evento';

    case 'ventana_registro':
    case 'cupo':
    case 'zonas':
    case 'kit_prensa':
      return 'acreditaciones';

    case 'sede_montaje':
    case 'sonido_prensa':
    case 'backdrop':
    case 'control_fila':
    case 'seguridad_prensa':
    case 'llegada_grupo':
    case 'vocero':
    case 'duracion_prensa':
    case 'temas_vetados':
      return 'produccion';

    default:
      return 'evento';
  }
}
