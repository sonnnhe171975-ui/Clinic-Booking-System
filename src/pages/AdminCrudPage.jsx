import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap'
import { api } from '../api/client'
import { endpoints } from '../api/config'

const RESOURCE_CONFIG = {
  specialties: {
    title: 'Quản lý chuyên khoa',
    path: endpoints.specialties,
    fields: ['name', 'description'],
  },
  doctors: {
    title: 'Quản lý bác sĩ',
    path: endpoints.doctors,
    fields: ['name', 'specialtyId', 'experience', 'bio'],
  },
  schedules: {
    title: 'Quản lý lịch khám',
    path: endpoints.schedules,
    fields: ['doctorId', 'date', 'time', 'maxSlot', 'currentSlot', 'status'],
  },
  users: {
    title: 'Quản lý người dùng',
    path: endpoints.users,
    fields: ['fullName', 'username', 'email', 'phone', 'address', 'role', 'password'],
    sortFields: ['fullName', 'username', 'email', 'role'],
    searchField: 'fullName',
    roleFilter: true,
  },
}

const ALLOWED_SHIFT_TIMES = ['07:00-10:00', '10:00-12:20', '12:50-15:00', '15:30-17:40']

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
  const [items, setItems] = useState([])
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState(config.sortFields?.[0] || config.fields[0])
  const [sortDir, setSortDir] = useState('asc')
  const [roleFilter, setRoleFilter] = useState('')

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

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const displayedItems = useMemo(() => {
    let result = [...items]
    const keyword = searchText.trim().toLowerCase()

    if (keyword) {
      const field = config.searchField || config.fields[0]
      result = result.filter((item) =>
        String(item[field] ?? '')
          .toLowerCase()
          .includes(keyword)
      )
    }

    if (config.roleFilter && roleFilter) {
      result = result.filter((item) => String(item.role) === roleFilter)
    }

    if (sortField) {
      result.sort((a, b) => {
        const av = String(a[sortField] ?? '').toLowerCase()
        const bv = String(b[sortField] ?? '').toLowerCase()
        const compare = av.localeCompare(bv, undefined, { numeric: true })
        return sortDir === 'asc' ? compare : -compare
      })
    }

    return result
  }, [items, searchText, config, roleFilter, sortField, sortDir])

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      let payload = { ...form }

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
      setForm({})
      setEditingId(null)
      const data = await api.get(config.path)
      setItems(data)
    } catch {
      setError('Không thể lưu dữ liệu')
    }
  }

  function onEdit(item) {
    setEditingId(item.id)
    setForm(item)
  }

  async function onDelete(id) {
    try {
      await api.del(`${config.path}/${id}`)
      if (editingId === id) {
        setEditingId(null)
        setForm({})
      }
      const data = await api.get(config.path)
      setItems(data)
    } catch {
      setError('Không thể xóa dữ liệu')
    }
  }

  return (
    <Container className="py-2 medilab-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">{config.title}</h3>
        <Badge bg="secondary">{displayedItems.length} bản ghi</Badge>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="mb-3 g-2">
        <Col md={4}>
          <Form.Control
            placeholder={`Tìm theo ${config.searchField || config.fields[0]}`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select value={sortField} onChange={(e) => setSortField(e.target.value)}>
            {(config.sortFields || config.fields).map((field) => (
              <option key={field} value={field}>
                Sắp xếp: {field}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="asc">Tăng dần</option>
            <option value="desc">Giảm dần</option>
          </Form.Select>
        </Col>
        {config.roleFilter && (
          <Col md={3}>
            <Form.Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Tất cả vai trò</option>
              <option value="admin">admin</option>
              <option value="patient">patient</option>
            </Form.Select>
          </Col>
        )}
      </Row>
      <Row className="mb-4">
        <Col lg={9}>
          <Card className="med-card">
            <Card.Body>
              <Form onSubmit={onSubmit}>
                <Row>
                  {config.fields.map((field) => (
                    <Col md={6} key={field} className="mb-2">
                      <Form.Label>{field}</Form.Label>
                      <Form.Control
                        value={form[field] || ''}
                        onChange={(e) => onChange(field, e.target.value)}
                      />
                    </Col>
                  ))}
                </Row>
                <div className="d-flex gap-2">
                  <Button type="submit">{editingId ? 'Cập nhật' : 'Tạo mới'}</Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => {
                        setEditingId(null)
                        setForm({})
                      }}
                    >
                      Hủy chỉnh sửa
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              {config.fields.map((field) => (
                <th key={field}>{field}</th>
              ))}
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                {config.fields.map((field) => (
                  <td key={field}>{String(item[field])}</td>
                ))}
                <td>
                  <div className="d-flex align-items-center gap-2 flex-nowrap">
                    <Button size="sm" onClick={() => onEdit(item)}>
                      Sửa
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(item.id)}>
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={config.fields.length + 2} className="text-center text-muted">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </Container>
  )
}

export default AdminCrudPage
