/** @returns {{ type: 'page', value: number } | { type: 'ellipsis' }}[] */
export function buildPaginationItems(page, totalPages, siblingCount = 2) {
  if (totalPages < 1) return []
  const MAX_SHOW_ALL = 12
  if (totalPages <= MAX_SHOW_ALL) {
    return Array.from({ length: totalPages }, (_, i) => ({ type: 'page', value: i + 1 }))
  }
  const set = new Set([1, totalPages, page])
  for (let i = page - siblingCount; i <= page + siblingCount; i += 1) {
    if (i >= 1 && i <= totalPages) set.add(i)
  }
  const sorted = [...set].sort((a, b) => a - b)
  /** @type {{ type: 'page', value: number } | { type: 'ellipsis' }}[] */
  const out = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push({ type: 'ellipsis' })
    out.push({ type: 'page', value: p })
    prev = p
  }
  return out
}
