/** @param {string|undefined|null} dateStr YYYY-MM-DD from API */
export function scheduleDateFromString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const d = new Date(`${dateStr.trim()}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** @param {string|undefined|null} iso */
export function dateFromIso(iso) {
  if (iso == null || iso === '') return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Join values for case-insensitive substring search in useClientTableView.
 * @param {unknown[]} parts
 */
export function joinSearchParts(...parts) {
  return parts
    .filter((x) => x != null && x !== '')
    .map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x)))
    .join(' ')
}
