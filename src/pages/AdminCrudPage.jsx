import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap'
import { api } from '../api/client'
import { endpoints } from '../api/config'
import {
  ClientTablePaginationFooter,
  ClientTableToolbar,
} from '../components/ClientTableControls'
import { CLIENT_TABLE_PAGE_SIZE } from '../hooks/useClientTableView'
import { dateFromIso, scheduleDateFromString } from '../utils/tableMeta'

const RESOURCE_CONFIG = {
  specialties: {
    title: 'Quản lý chuyên khoa',
    path: endpoints.specialties,
    fields: ['name', 'description'],
    sortFields: ['name', 'description'],
  },
  doctors: {
    title: 'Quản lý bác sĩ',
    path: endpoints.doctors,
    fields: ['name', 'specialtyId', 'experience', 'bio'],
    sortFields: ['name', 'specialtyId', 'experience'],
  },
  schedules: {
    title: 'Quản lý lịch khám',
    path: endpoints.schedules,
    fields: ['doctorId', 'date', 'time', 'maxSlot', 'currentSlot', 'status'],
    sortFields: ['date', 'time', 'doctorId', 'currentSlot'],
  },
  users: {
    title: 'Quản lý người dùng',
    path: endpoints.users,
    fields: ['fullName', 'username', 'email', 'phone', 'address', 'role', 'password'],
    sortFields: ['fullName', 'username', 'email', 'role', 'phone'],
    searchField: 'fullName',
    roleFilter: true,
  },
  notifications: {
    title: 'Quản lý thông báo',
    path: endpoints.notifications,
    fields: ['userId', 'role', 'type', 'title', 'body', 'relatedId', 'to', 'isRead'],
    sortFields: ['createdAt', 'type', 'role', 'userId'],
    searchField: 'title',
  },
  auditLogs: {
    title: 'Quản lý audit logs',
    path: endpoints.auditLogs,
    fields: ['actorId', 'actorRole', 'action', 'resourceType', 'resourceId', 'metadata', 'createdAt'],
    sortFields: ['createdAt', 'action', 'actorRole'],
    searchField: 'action',
    jsonFields: ['metadata'],
    readonly: true,
  },
  medicalRecords: {
    title: 'Quản lý hồ sơ khám',
    path: endpoints.medicalRecords,
    fields: ['appointmentId', 'userId', 'doctorId', 'diagnosis', 'conclusion', 'vitalSigns', 'createdAt'],
    sortFields: ['createdAt', 'doctorId', 'userId'],
    searchField: 'diagnosis',
    jsonFields: ['vitalSigns'],
  },
  prescriptions: {
    title: 'Quản lý đơn thuốc',
    path: endpoints.prescriptions,
    fields: ['medicalRecordId', 'doctorId', 'items', 'advice', 'createdAt'],
    sortFields: ['createdAt', 'doctorId', 'medicalRecordId'],
    searchField: 'advice',
    jsonFields: ['items'],
  },
  payments: {
    title: 'Quản lý thanh toán',
    path: endpoints.payments,
    fields: ['appointmentId', 'userId', 'amount', 'currency', 'method', 'status', 'paidAt', 'createdAt'],
    sortFields: ['createdAt', 'paidAt', 'status', 'method', 'amount'],
    searchField: 'status',
  },
}

/** Resource có ít nhất một trường ngày / thời gian — hiện bộ lọc Từ/Đến ngày */
const RESOURCES_WITH_DATE_FILTER = new Set([
  'schedules',
  'users',
  'notifications',
  'auditLogs',
  'medicalRecords',
  'prescriptions',
  'payments',
])

const ALLOWED_SHIFT_TIMES = ['07:00-10:00', '10:00-12:20', '12:50-15:00', '15:30-17:40']

const CREATE_BUTTON_LABELS = {
  specialties: 'Thêm chuyên khoa',
  doctors: 'Thêm bác sĩ',
  schedules: 'Thêm lịch khám',
  users: 'Thêm người dùng',
  notifications: 'Thêm thông báo',
  medicalRecords: 'Thêm hồ sơ khám',
  prescriptions: 'Thêm đơn thuốc',
  payments: 'Thêm thanh toán',
}

function collectParseableDates(item) {
  const times = []
  if (!item || typeof item !== 'object') return times
  for (const v of Object.values(item)) {
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    const s = String(v).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const d = scheduleDateFromString(s)
      if (d && !Number.isNaN(d.getTime())) times.push(d.getTime())
      continue
    }
    const d2 = dateFromIso(v)
    if (d2 && !Number.isNaN(d2.getTime())) times.push(d2.getTime())
  }
  return times
}

function rowMatchesDateRange(item, dateFrom, dateTo) {
  const fromT = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
  const toT = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null
  const times = collectParseableDates(item)
  if (!times.length) return false
  return times.some((t) => {
    if (fromT != null && t < fromT) return false
    if (toT != null && t > toT) return false
    return true
  })
}

function itemMatchesFullSearch(item, keyword) {
  if (!keyword) return true
  const q = keyword.toLowerCase()
  if (String(item.id ?? '').toLowerCase().includes(q)) return true
  for (const v of Object.values(item)) {
    if (v == null) continue
    const chunk = typeof v === 'object' ? JSON.stringify(v) : String(v)
    if (chunk.toLowerCase().includes(q)) return true
  }
  return false
}

function compareSortRows(a, b, field, dir) {
  const av = a[field]
  const bv = b[field]
  const tryDate = (x) => {
    if (x == null || x === '') return null
    const d = dateFromIso(x)
    if (d && !Number.isNaN(d.getTime())) return d
    const s = String(x).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return scheduleDateFromString(s)
    return null
  }
  const da = tryDate(av)
  const db = tryDate(bv)
  if (da && db && !Number.isNaN(da.getTime()) && !Number.isNaN(db.getTime())) {
    const c = da.getTime() - db.getTime()
    return dir === 'asc' ? c : -c
  }
  const na = Number(av)
  const nb = Number(bv)
  if (
    typeof av !== 'boolean' &&
    typeof bv !== 'boolean' &&
    av !== '' &&
    bv !== '' &&
    !Number.isNaN(na) &&
    !Number.isNaN(nb)
  ) {
    const c = na - nb
    return dir === 'asc' ? c : -c
  }
  const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true })
  return dir === 'asc' ? cmp : -cmp
}

function parseTimeRangeToMinutes(range) {
  const match = String(range || '').trim().match(
    /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/
  )
  if (!match) return null
  const start = Number(match[1]) * 60 + Number(match[2])
  const end = Number(match[3]) * 60 + Number(match[4])
  if (start >= end) return null
  return { start, end }
}

function AdminCrudPage({ resource }) {
  const config = useMemo(() => RESOURCE_CONFIG[resource], [resource])
  const sortFieldOptions = useMemo(() => {
    const raw = [...(config.sortFields || []), ...config.fields].filter((f) => f !== 'password')
    if (!raw.includes('id')) raw.push('id')
    return [...new Set(raw)]
  }, [config])
  const [items, setItems] = useState([])
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState(
    () => RESOURCE_CONFIG[resource].sortFields?.[0] || RESOURCE_CONFIG[resource].fields[0] || 'id'
  )
  const [sortDir, setSortDir] = useState('asc')
  const [roleFilter, setRoleFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [formModalOpen, setFormModalOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get(config.path)
        setItems(data)
      } catch {
        setError('Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [config.path])

  useEffect(() => {
    const next = config.sortFields?.[0] || config.fields[0] || 'id'
    setSortField(next)
  }, [resource, config])

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function normalizeJsonFieldInput(field, value) {
    if (!config.jsonFields?.includes(field)) return value
    if (value == null || value === '') return value
    if (typeof value !== 'string') return JSON.stringify(value)
    return value
  }

  const displayedItems = useMemo(() => {
    let result = [...items]
    const keyword = searchText.trim().toLowerCase()

    if (keyword) {
      result = result.filter((item) => itemMatchesFullSearch(item, keyword))
    }

    if (config.roleFilter && roleFilter) {
      result = result.filter((item) => String(item.role) === roleFilter)
    }

    if (RESOURCES_WITH_DATE_FILTER.has(resource) && (dateFromFilter || dateToFilter)) {
      result = result.filter((item) => rowMatchesDateRange(item, dateFromFilter, dateToFilter))
    }

    if (sortField) {
      result.sort((a, b) => compareSortRows(a, b, sortField, sortDir))
    }

    return result
  }, [
    items,
    searchText,
    config,
    resource,
    roleFilter,
    sortField,
    sortDir,
    dateFromFilter,
    dateToFilter,
  ])

  const tablePageCount = Math.max(1, Math.ceil(displayedItems.length / CLIENT_TABLE_PAGE_SIZE))
  const tablePageSafe = Math.max(1, Math.min(tablePage, tablePageCount))

  const pagedTableItems = useMemo(() => {
    const start = (tablePageSafe - 1) * CLIENT_TABLE_PAGE_SIZE
    return displayedItems.slice(start, start + CLIENT_TABLE_PAGE_SIZE)
  }, [displayedItems, tablePageSafe])

  useEffect(() => {
    setTablePage(1)
  }, [
    searchText,
    roleFilter,
    sortField,
    sortDir,
    dateFromFilter,
    dateToFilter,
    items.length,
    resource,
  ])

  function openCreateModal() {
    setEditingId(null)
    setForm({})
    setError('')
    setFormModalOpen(true)
  }

  function closeFormModal() {
    setFormModalOpen(false)
    setEditingId(null)
    setForm({})
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      let payload = { ...form }
      if (config.jsonFields?.length) {
        for (const field of config.jsonFields) {
          const raw = payload[field]
          if (raw == null || raw === '') continue
          if (typeof raw === 'string') {
            try {
              payload[field] = JSON.parse(raw)
            } catch {
              setError(`${field} phải là JSON hợp lệ`)
              return
            }
          }
        }
      }

      if (resource === 'schedules') {
        const doctorId = Number(payload.doctorId)
        const maxSlot = Number(payload.maxSlot)
        const currentSlot = Number(payload.currentSlot || 0)
        const date = String(payload.date || '').trim()
        const time = String(payload.time || '').trim()

        if (!doctorId || !date || !time) {
          setError('Bác sĩ, ngày và khung giờ là bắt buộc')
          return
        }

        if (!ALLOWED_SHIFT_TIMES.includes(time)) {
          setError(
            'Khung giờ chỉ được chọn một trong 4 ca: 07:00-10:00, 10:00-12:20, 12:50-15:00, 15:30-17:40'
          )
          return
        }

        const newRange = parseTimeRangeToMinutes(time)
        if (!newRange) {
          setError('Khung giờ phải đúng định dạng HH:MM-HH:MM và giờ kết thúc lớn hơn giờ bắt đầu')
          return
        }

        if (!maxSlot || maxSlot <= 0) {
          setError('maxSlot phải là số dương')
          return
        }
        if (currentSlot < 0 || currentSlot > maxSlot) {
          setError('currentSlot phải nằm trong khoảng 0 … maxSlot')
          return
        }

        const isOverlap = items.some((item) => {
          if (editingId && String(item.id) === String(editingId)) return false
          if (Number(item.doctorId) !== doctorId) return false
          if (String(item.date) !== date) return false
          const existingRange = parseTimeRangeToMinutes(item.time)
          if (!existingRange) return false
          return (
            Math.max(newRange.start, existingRange.start) <
            Math.min(newRange.end, existingRange.end)
          )
        })

        if (isOverlap) {
          setError('Bác sĩ đã có lịch trong khung giờ này')
          return
        }

        payload = {
          ...payload,
          doctorId,
          maxSlot,
          currentSlot,
          status: currentSlot >= maxSlot ? 'full' : 'available',
          date,
          time,
        }
      }

      if (editingId) {
        await api.put(`${config.path}/${editingId}`, { id: editingId, ...payload })
      } else {
        await api.post(config.path, payload)
      }
      closeFormModal()
      const data = await api.get(config.path)
      setItems(data)
    } catch {
      setError('Không thể lưu dữ liệu')
    }
  }

  function onEdit(item) {
    setEditingId(item.id)
    const normalized = { ...item }
    if (config.jsonFields?.length) {
      config.jsonFields.forEach((field) => {
        if (normalized[field] != null && typeof normalized[field] !== 'string') {
          normalized[field] = JSON.stringify(normalized[field], null, 2)
        }
      })
    }
    setForm(normalized)
    setError('')
    setFormModalOpen(true)
  }

  async function onDelete(id) {
    try {
      await api.del(`${config.path}/${id}`)
      if (editingId === id) {
        closeFormModal()
      }
      const data = await api.get(config.path)
      setItems(data)
    } catch {
      setError('Không thể xóa dữ liệu')
    }
  }

  return (
    <Container className="py-2 medilab-page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h3 className="mb-0">{config.title}</h3>
        <div className="d-flex flex-wrap align-items-center gap-2">
          {!config.readonly && (
            <Button variant="primary" type="button" onClick={openCreateModal}>
              {CREATE_BUTTON_LABELS[resource] || 'Thêm mới'}
            </Button>
          )}
          <Badge bg="secondary" className="fs-6 fw-normal">
            {items.length} bản ghi · {displayedItems.length} sau lọc
          </Badge>
        </div>
      </div>
      {error && !formModalOpen && <Alert variant="danger">{error}</Alert>}
      <ClientTableToolbar
        search={searchText}
        onSearchChange={setSearchText}
        dateFrom={dateFromFilter}
        onDateFromChange={setDateFromFilter}
        dateTo={dateToFilter}
        onDateToChange={setDateToFilter}
        dateSortDir="desc"
        onToggleDateSort={() => {}}
        showDateSort={false}
        showDateFilters={RESOURCES_WITH_DATE_FILTER.has(resource)}
        searchPlaceholder="Tìm trong mọi trường (kể cả id, ngày tạo, JSON…)"
      />
      <Row className="mb-3 g-2 align-items-end">
        <Col md={4} lg={3}>
          <Form.Label className="small text-muted mb-1">Sắp xếp theo cột</Form.Label>
          <Form.Select value={sortField} onChange={(e) => setSortField(e.target.value)}>
            {sortFieldOptions.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3} lg={2}>
          <Form.Label className="small text-muted mb-1">Thứ tự</Form.Label>
          <Form.Select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="asc">Tăng dần (A→Z, cũ→mới)</option>
            <option value="desc">Giảm dần (Z→A, mới→cũ)</option>
          </Form.Select>
        </Col>
        {config.roleFilter && (
          <Col md={5} lg={4}>
            <Form.Label className="small text-muted mb-1">Vai trò</Form.Label>
            <Form.Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Tất cả vai trò</option>
              <option value="admin">admin</option>
              <option value="doctor">doctor</option>
              <option value="patient">patient</option>
            </Form.Select>
          </Col>
        )}
        <Col md="auto" className="ms-lg-auto">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setSearchText('')
              setDateFromFilter('')
              setDateToFilter('')
              setRoleFilter('')
            }}
          >
            Xóa bộ lọc
          </Button>
        </Col>
      </Row>
      {RESOURCES_WITH_DATE_FILTER.has(resource) && (
        <Alert variant="light" className="small py-2 border mb-3 text-muted">
          Lọc ngày áp dụng cho mọi trường thời gian trên dòng (vd. <strong>date</strong>,{' '}
          <strong>createdAt</strong>, <strong>paidAt</strong>): giữ dòng nếu <em>bất kỳ</em> mốc
          nào nằm trong khoảng đã chọn.
        </Alert>
      )}
      {!config.readonly && (
        <Modal
          show={formModalOpen}
          onHide={closeFormModal}
          size="lg"
          centered
          scrollable
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingId ? `Chỉnh sửa · ID ${editingId}` : CREATE_BUTTON_LABELS[resource] || 'Thêm mới'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="py-2 small" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Form id="admin-crud-form" onSubmit={onSubmit}>
              <Row>
                {config.fields.map((field) => (
                  <Col md={6} key={field} className="mb-3">
                    <Form.Label>{field}</Form.Label>
                    <Form.Control
                      as={config.jsonFields?.includes(field) ? 'textarea' : 'input'}
                      rows={config.jsonFields?.includes(field) ? 4 : undefined}
                      value={normalizeJsonFieldInput(field, form[field]) || ''}
                      onChange={(e) => onChange(field, e.target.value)}
                    />
                  </Col>
                ))}
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer className="gap-2">
            <Button type="button" variant="outline-secondary" onClick={closeFormModal}>
              Đóng
            </Button>
            <Button type="submit" form="admin-crud-form" variant="primary">
              {editingId ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>STT</th>
                <th>ID</th>
                {config.fields.map((field) => (
                  <th key={field}>{field}</th>
                ))}
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedTableItems.map((item, rowIdx) => (
                <tr key={item.id}>
                  <td>{(tablePageSafe - 1) * CLIENT_TABLE_PAGE_SIZE + rowIdx + 1}</td>
                  <td>{item.id}</td>
                  {config.fields.map((field) => (
                    <td key={field}>
                      {typeof item[field] === 'object'
                        ? JSON.stringify(item[field])
                        : String(item[field])}
                    </td>
                  ))}
                  <td>
                    <div className="d-flex align-items-center gap-2 flex-nowrap">
                      {!config.readonly ? (
                        <>
                          <Button size="sm" onClick={() => onEdit(item)}>
                            Sửa
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => onDelete(item.id)}>
                            Xóa
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted small">Chỉ xem</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={config.fields.length + 3} className="text-center text-muted">
                    Chưa có dữ liệu
                  </td>
                </tr>
              )}
              {items.length > 0 && displayedItems.length === 0 && (
                <tr>
                  <td colSpan={config.fields.length + 3} className="text-center text-muted">
                    Không có dòng nào khớp bộ lọc
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          <ClientTablePaginationFooter
            page={tablePageSafe}
            totalPages={tablePageCount}
            onPageChange={setTablePage}
            totalFiltered={displayedItems.length}
            pageSize={CLIENT_TABLE_PAGE_SIZE}
          />
        </>
      )}
    </Container>
  )
}

export default AdminCrudPage
