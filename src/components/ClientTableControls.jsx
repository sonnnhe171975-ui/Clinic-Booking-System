import { Button, Col, Form, Row } from 'react-bootstrap'
import { buildPaginationItems } from '../utils/paginationRange'

/** Ô tìm kiếm, lọc ngày, sort — đặt phía trên bảng (số dòng/trang cố định 30 ở logic phân trang) */
export function ClientTableToolbar({
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  dateSortDir,
  onToggleDateSort,
  showDateFilters = true,
  showDateSort = true,
  searchPlaceholder = 'Tìm trong tất cả cột…',
}) {
  return (
    <Row className="g-2 mb-2 align-items-end">
      <Col xs={12} md={showDateFilters ? (showDateSort ? 4 : 5) : 12}>
        <Form.Label className="small text-muted mb-1">Tìm kiếm</Form.Label>
        <Form.Control
          type="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Col>
      {showDateFilters && (
        <>
          <Col xs={6} md={2}>
            <Form.Label className="small text-muted mb-1">Từ ngày</Form.Label>
            <Form.Control
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </Col>
          <Col xs={6} md={2}>
            <Form.Label className="small text-muted mb-1">Đến ngày</Form.Label>
            <Form.Control
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </Col>
          {showDateSort && (
            <Col xs={12} md="auto">
              <Form.Label className="small text-muted mb-1 d-block">Sắp xếp ngày</Form.Label>
              <Button size="sm" variant="outline-secondary" type="button" onClick={onToggleDateSort}>
                {dateSortDir === 'asc' ? '↑ Cũ → mới' : '↓ Mới → cũ'}
              </Button>
            </Col>
          )}
        </>
      )}
    </Row>
  )
}

/** Phân trang dạng số trang (1, 2, 3…) — đặt dưới bảng */
export function ClientTablePaginationFooter({
  page,
  totalPages,
  onPageChange,
  totalFiltered,
  pageSize,
  className = 'mt-3',
}) {
  const items = buildPaginationItems(page, totalPages)
  const summaryParts = [
    `${totalFiltered} kết quả`,
    pageSize != null ? `${pageSize} dòng/trang` : null,
    `Trang ${page}/${totalPages}`,
  ].filter(Boolean)

  return (
    <div className={className}>
      <div className="med-numbered-pagination d-flex flex-wrap justify-content-center align-items-center gap-1 py-2 px-3">
        {items.map((item, idx) =>
          item.type === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="med-page-ellipsis">
              …
            </span>
          ) : item.value === page ? (
            <span key={item.value} className="med-page-active px-2 py-1" aria-current="page">
              {item.value}
            </span>
          ) : (
            <button
              key={item.value}
              type="button"
              className="med-page-link btn p-1 border-0 bg-transparent shadow-none"
              onClick={() => onPageChange(item.value)}
            >
              {item.value}
            </button>
          )
        )}
      </div>
      <div className="text-center small text-muted mt-2">{summaryParts.join(' · ')}</div>
    </div>
  )
}
