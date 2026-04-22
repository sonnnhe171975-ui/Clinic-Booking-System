import { useCallback, useMemo, useState } from 'react'

export const CLIENT_TABLE_PAGE_SIZE = 30

/**
 * Client-side search, optional date filter/sort, and pagination.
 * @param {unknown[]} rows Original row data (stable order when date sort off).
 * @param {{ search: string, date: Date | null }[]} metaList Parallel to rows[i].
 * @param {{ pageSize?: number, defaultDateSort?: 'asc'|'desc', enableDate?: boolean }} options
 */
export function useClientTableView(rows, metaList, options = {}) {
  const pageSize = options.pageSize ?? CLIENT_TABLE_PAGE_SIZE
  const enableDate = options.enableDate !== false

  const [search, setSearchState] = useState('')
  const [dateFrom, setDateFromState] = useState('')
  const [dateTo, setDateToState] = useState('')
  const [dateSortDir, setDateSortDirState] = useState(options.defaultDateSort ?? 'desc')
  const [page, setPageState] = useState(1)

  const setSearch = useCallback((v) => {
    setSearchState(v)
    setPageState(1)
  }, [])

  const setDateFrom = useCallback((v) => {
    setDateFromState(v)
    setPageState(1)
  }, [])

  const setDateTo = useCallback((v) => {
    setDateToState(v)
    setPageState(1)
  }, [])

  const setDateSortDir = useCallback((v) => {
    setDateSortDirState(v)
    setPageState(1)
  }, [])

  const indices = useMemo(() => {
    const n = rows.length
    let idxs = Array.from({ length: n }, (_, i) => i)
    const q = search.trim().toLowerCase()
    if (q) {
      idxs = idxs.filter((i) => {
        const hay = (metaList[i]?.search || '').toLowerCase()
        return hay.includes(q)
      })
    }
    if (enableDate && (dateFrom || dateTo)) {
      const fromT = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
      const toT = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null
      idxs = idxs.filter((i) => {
        const d = metaList[i]?.date
        if (!d || Number.isNaN(d.getTime())) return false
        const t = d.getTime()
        if (fromT != null && t < fromT) return false
        if (toT != null && t > toT) return false
        return true
      })
    }
    if (enableDate) {
      idxs.sort((ia, ib) => {
        const da = metaList[ia]?.date
        const db = metaList[ib]?.date
        const na = da && !Number.isNaN(da.getTime()) ? da.getTime() : 0
        const nb = db && !Number.isNaN(db.getTime()) ? db.getTime() : 0
        return dateSortDir === 'asc' ? na - nb : nb - na
      })
    }
    return idxs
  }, [rows, metaList, search, dateFrom, dateTo, dateSortDir, enableDate])

  const totalFiltered = indices.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const effectivePage = Math.max(1, Math.min(page, totalPages))

  const pageRows = useMemo(() => {
    const start = (effectivePage - 1) * pageSize
    return indices.slice(start, start + pageSize).map((i) => rows[i])
  }, [indices, effectivePage, pageSize, rows])

  const setPage = useCallback((p) => {
    setPageState(p)
  }, [])

  function toggleDateSort() {
    setDateSortDirState((d) => (d === 'asc' ? 'desc' : 'asc'))
    setPageState(1)
  }

  /** STT trong toàn bộ kết quả đã lọc (1 … totalFiltered), theo trang hiện tại */
  const rowStt = useCallback(
    (rowIndexInPage) => (effectivePage - 1) * pageSize + rowIndexInPage + 1,
    [effectivePage, pageSize]
  )

  return {
    pageRows,
    totalFiltered,
    page: effectivePage,
    setPage,
    totalPages,
    pageSize,
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    dateSortDir,
    setDateSortDir,
    toggleDateSort,
    rowStt,
  }
}
