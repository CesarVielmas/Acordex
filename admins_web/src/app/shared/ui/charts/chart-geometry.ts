/**
 * Geometría compartida de los gráficos de línea.
 *
 * Vive aparte de los componentes a propósito: son funciones puras, sin Angular
 * ni DOM, así que se pueden razonar y probar solas. Antes esta misma matemática
 * estaba duplicada en el panel de métricas y en la tarjeta de grupo, con dos
 * implementaciones que ya habían empezado a divergir.
 */

/** Un punto ya proyectado al sistema de coordenadas del SVG. */
export interface ChartPoint {
  x: number;
  y: number;
  /** Valor original de la serie, sin escalar. */
  value: number;
  index: number;
}

/** Una serie lista para pintar: los puntos y sus dos trazos. */
export interface ChartSeries {
  points: ChartPoint[];
  /** Trazo de la curva. */
  linePath: string;
  /** Trazo cerrado contra la base, para el relleno degradado. */
  areaPath: string;
}

export interface ChartGeometryOptions {
  width: number;
  height: number;
  /** Margen interior para que la curva no se pegue a los bordes. */
  padding: number;
  /** Máximo de la escala vertical. Si se omite, se toma el máximo de la serie. */
  max?: number;
  /** Y donde cierra el área. Por defecto, la base del gráfico. */
  baseline?: number;
}

/**
 * Curva suave que pasa por todos los puntos, con dos puntos de control por
 * tramo alineados horizontalmente. Mantiene la curva monótona en x, así que
 * nunca se dobla sobre sí misma.
 */
export function buildSmoothPath(points: ChartPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const midX = from.x + (to.x - from.x) / 2;
    path += ` C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  }
  return path;
}

/**
 * Proyecta una serie de valores al espacio del SVG y devuelve sus trazos.
 * Una escala compartida entre series (`options.max`) es lo que permite
 * compararlas visualmente en el mismo gráfico.
 */
export function buildSeries(values: number[], options: ChartGeometryOptions): ChartSeries {
  const { width, height, padding } = options;

  if (!values.length) {
    return { points: [], linePath: '', areaPath: '' };
  }

  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  // Una escala de 0 dejaría todo aplastado en la base y además dividiría por
  // cero, así que siempre se usa un mínimo positivo.
  const scaleMax = Math.max(options.max ?? Math.max(...values), 1);
  const lastIndex = Math.max(1, values.length - 1);

  const points: ChartPoint[] = values.map((value, index) => {
    const x = padding + (index / lastIndex) * usableWidth;
    const clamped = Math.min(Math.max(value, 0), scaleMax);
    const y = height - padding - (clamped / scaleMax) * usableHeight;
    return { x, y, value, index };
  });

  const linePath = buildSmoothPath(points);
  const baseline = options.baseline ?? height;
  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;

  return { points, linePath, areaPath };
}

/**
 * Ancho de cada franja invisible de hover. Se usan franjas contiguas en vez de
 * exigir apuntar al punto exacto: así el gráfico responde en cualquier x.
 */
export function hoverBandWidth(count: number, width: number, padding: number): number {
  if (count <= 1) return width;
  return (width - padding * 2) / (count - 1);
}

/**
 * Coordenada x donde empieza la franja de hover de un índice. La primera y la
 * última son medias franjas, centradas en su punto.
 */
export function hoverBandStart(index: number, count: number, width: number, padding: number): number {
  const band = hoverBandWidth(count, width, padding);
  return padding + index * band - band / 2;
}
