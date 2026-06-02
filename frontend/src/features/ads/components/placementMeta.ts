import type { AdPlacement } from '../types'

/** Human-readable Spanish labels for each placement. */
export const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  header: 'Encabezado',
  sidebar: 'Barra lateral',
  between_matches: 'Entre partidos',
  footer: 'Pie de página',
  match_live: 'Partido en vivo',
}
