/** Поддерживаемые ключи стилей карты (синхрон с фронтом `MAP_STYLES`). */
export const ALLOWED_MAP_STYLE_KEYS = [
  'openstreet',
  'openstreet3d',
  'satellite',
  'carto',
  'terrain',
  'osmHumanitarian',
  'streets',
  'natGeo',
] as const;

export type AllowedMapStyleKey = (typeof ALLOWED_MAP_STYLE_KEYS)[number];

const ALLOWED_SET = new Set<string>(ALLOWED_MAP_STYLE_KEYS);

export const DEFAULT_AVAILABLE_MAP_STYLES: AllowedMapStyleKey[] = [
  'carto',
  'openstreet3d',
];

export const DEFAULT_MAP_STYLE_KEY: AllowedMapStyleKey = 'carto';

/** Фильтрует неизвестные/удалённые стили, сохраняет порядок, убирает дубликаты. */
export function filterAllowedMapStyles(
  input: string[] | null | undefined,
): AllowedMapStyleKey[] {
  if (!input?.length) {
    return [...DEFAULT_AVAILABLE_MAP_STYLES];
  }
  const seen = new Set<string>();
  const out: AllowedMapStyleKey[] = [];
  for (const k of input) {
    if (ALLOWED_SET.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(k as AllowedMapStyleKey);
    }
  }
  return out.length > 0 ? out : [...DEFAULT_AVAILABLE_MAP_STYLES];
}

export function ensureDefaultInAvailable(
  defaultStyle: string | null | undefined,
  available: AllowedMapStyleKey[],
): AllowedMapStyleKey {
  const candidate =
    defaultStyle && ALLOWED_SET.has(defaultStyle)
      ? (defaultStyle as AllowedMapStyleKey)
      : DEFAULT_MAP_STYLE_KEY;
  if (available.includes(candidate)) {
    return candidate;
  }
  if (available.includes(DEFAULT_MAP_STYLE_KEY)) {
    return DEFAULT_MAP_STYLE_KEY;
  }
  return available[0];
}

export function normalizeStoredMapSettings(
  rawAvailable: string[] | null | undefined,
  rawDefault: string | null | undefined,
): { availableMapStyles: AllowedMapStyleKey[]; defaultMapStyle: AllowedMapStyleKey } {
  const availableMapStyles = filterAllowedMapStyles(rawAvailable);
  const defaultMapStyle = ensureDefaultInAvailable(rawDefault, availableMapStyles);
  return { availableMapStyles, defaultMapStyle };
}
