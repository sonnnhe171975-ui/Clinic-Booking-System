import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap'
import { ClientTablePaginationFooter } from '../components/ClientTableControls'
import { CLIENT_TABLE_PAGE_SIZE } from '../hooks/useClientTableView'
import { api } from '../api/client'
import { endpoints } from '../api/config'

function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function AdminMonitoringPage() {
  const [notifications, setNotifications] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)
  const [notiRoleFilter, setNotiRoleFilter] = useState('')
  const [notiTypeFilter, setNotiTypeFilter] = useState('')
  const [notiDateFrom, setNotiDateFrom] = useState('')
  const [notiDateTo, setNotiDateTo] = useState('')
  const [notiSearch, setNotiSearch] = useState('')
  const [auditRoleFilter, setAuditRoleFilter] = useState('')
  const [auditDateFrom, setAuditDateFrom] = useState('')
  const [auditDateTo, setAuditDateTo] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [notificationPage, setNotificationPage] = useState(1)
  const [auditPage, setAuditPage] = useState(1)

  const loadData = useCallback(async () => {
    const [notificationData, auditData] = await Promise.all([
      api.get(endpoints.notifications),
      api.get(`${endpoints.auditLogs}?_sort=createdAt&_order=desc&_limit=120`),
    ])
    setNotifications(notificationData)
    setAuditLogs(auditData)
  }, [])

  useEffect(() => {
    async function run() {
      try {
        await loadData()
      } catch {
        setError('Không tải được dữ liệu theo dõi hệ thống')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [loadData])

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  }, [notifications])

  const filteredNotifications = useMemo(() => {
    const q = notiSearch.trim().toLowerCase()
    return sortedNotifications.filter((item) => {
      if (notiRoleFilter && String(item.role) !== notiRoleFilter) return false
      if (notiTypeFilter && String(item.type) !== notiTypeFilter) return false
      const createdKey = toDateInput(item.createdAt)
      if (notiDateFrom && createdKey < notiDateFrom) return false
      if (notiDateTo && createdKey > notiDateTo) return false
      if (q) {
        const blob = [
          item.id,
          item.userId,
          item.role,
          item.type,
          item.title,
          item.body,
          item.subtitle,
          item.relatedId,
          item.to,
          item.createdAt,
          item.isRead,
        ]
          .map((x) => (x == null ? '' : String(x)))
          .join(' ')
          .toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [
    sortedNotifications,
    notiRoleFilter,
    notiTypeFilter,
    notiDateFrom,
    notiDateTo,
    notiSearch,
  ])

  const filteredAuditLogs = useMemo(() => {
    const keyword = auditSearch.trim().toLowerCase()
    return auditLogs.filter((item) => {
      if (auditRoleFilter && String(item.actorRole) !== auditRoleFilter) return false
      const createdKey = toDateInput(item.createdAt)
      if (auditDateFrom && createdKey < auditDateFrom) return false
      if (auditDateTo && createdKey > auditDateTo) return false
      if (!keyword) return true
      const blob = [
        item.id,
        item.actorId,
        item.actorRole,
        item.action,
        item.resourceType,
        item.resourceId,
        JSON.stringify(item.metadata || {}),
        item.createdAt,
      ]
        .map((x) => (x == null ? '' : String(x)))
        .join(' ')
        .toLowerCase()
      return blob.includes(keyword)
    })
  }, [auditLogs, auditRoleFilter, auditDateFrom, auditDateTo, auditSearch])

  const notificationPageCount = Math.max(1, Math.ceil(filteredNotifications.length / CLIENT_TABLE_PAGE_SIZE))
  const auditPageCount = Math.max(1, Math.ceil(filteredAuditLogs.length / CLIENT_TABLE_PAGE_SIZE))
  const notificationPageSafe = Math.max(1, Math.min(notificationPage, notificationPageCount))
  const auditPageSafe = Math.max(1, Math.min(auditPage, auditPageCount))

  const notificationRows = useMemo(() => {
    const start = (notificationPageSafe - 1) * CLIENT_TABLE_PAGE_SIZE
    return filteredNotifications.slice(start, start + CLIENT_TABLE_PAGE_SIZE)
  }, [filteredNotifications, notificationPageSafe])

  const auditRows = useMemo(() => {
    const start = (auditPageSafe - 1) * CLIENT_TABLE_PAGE_SIZE
    return filteredAuditLogs.slice(start, start + CLIENT_TABLE_PAGE_SIZE)
  }, [filteredAuditLogs, auditPageSafe])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  )

  async function markAllAsRead() {
    const unread = notifications.filter((item) => !item.isRead)
    if (!unread.length) return
    setMarkingAll(true)
    setError('')
    try {
      await Promise.all(
        unread.map((item) =>
          api.put(`${endpoints.notifications}/${item.id}`, {
            ...item,
            isRead: true,
          })
        )
      )
      await loadData()
    } catch {
      setError('Không thể đánh dấu đã đọc toàn bộ thông báo')
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <Container className="py-2 medilab-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Giám sát nghiệp vụ</h3>
        <Button size="sm" variant="outline-primary" onClick={loadData}>
          Làm mới
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Tổng thông báo</Card.Title>
              <h4 className="mb-0">{notifications.length}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Chưa đọc</Card.Title>
              <h4 className="mb-0">{unreadCount}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="med-card">
            <Card.Body>
              <Card.Title className="small text-uppercase text-muted">Audit log</Card.Title>
              <h4 className="mb-0">{auditLogs.length}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <Card className="med-card mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Card.Title className="mb-0">Thông báo hệ thống</Card.Title>
                <Button size="sm" variant="outline-secondary" disabled={markingAll} onClick={markAllAsRead}>
                  {markingAll ? 'Đang xử lý…' : 'Đánh dấu tất cả đã đọc'}
                </Button>
              </div>
              <Row className="g-2 mb-3">
                <Col md={12} lg={4}>
                  <Form.Control
                    type="search"
                    placeholder="Tìm trong mọi cột thông báo…"
                    value={notiSearch}
                    onChange={(e) => {
                      setNotiSearch(e.target.value)
                      setNotificationPage(1)
                    }}
                  />
                </Col>
                <Col md={4} lg={2}>
                  <Form.Select
                    value={notiRoleFilter}
                    onChange={(e) => {
                      setNotiRoleFilter(e.target.value)
                      setNotificationPage(1)
                    }}
                  >
                    <option value="">Tất cả role</option>
                    <option value="admin">admin</option>
                    <option value="doctor">doctor</option>
                    <option value="patient">patient</option>
                  </Form.Select>
                </Col>
                <Col md={4} lg={2}>
                  <Form.Select
                    value={notiTypeFilter}
                    onChange={(e) => {
                      setNotiTypeFilter(e.target.value)
                      setNotificationPage(1)
                    }}
                  >
                    <option value="">Tất cả type</option>
                    <option value="pending_appointment">pending_appointment</option>
                    <option value="appointment_status">appointment_status</option>
                    <option value="admin_pending">admin_pending</option>
                  </Form.Select>
                </Col>
                <Col md={6} lg={2}>
                  <Form.Control
                    type="date"
                    value={notiDateFrom}
                    onChange={(e) => {
                      setNotiDateFrom(e.target.value)
                      setNotificationPage(1)
                    }}
                  />
                </Col>
                <Col md={6} lg={2}>
                  <Form.Control
                    type="date"
                    value={notiDateTo}
                    onChange={(e) => {
                      setNotiDateTo(e.target.value)
                      setNotificationPage(1)
                    }}
                  />
                </Col>
                <Col md={12} lg={12} className="d-flex justify-content-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setNotiRoleFilter('')
                      setNotiTypeFilter('')
                      setNotiDateFrom('')
                      setNotiDateTo('')
                      setNotiSearch('')
                      setNotificationPage(1)
                    }}
                  >
                    Reset bộ lọc thông báo
                  </Button>
                </Col>
              </Row>
              <Table striped bordered hover responsive className="mb-0 small">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã</th>
                    <th>User</th>
                    <th>Vai trò</th>
                    <th>Loại</th>
                    <th>Tiêu đề</th>
                    <th>Nội dung</th>
                    <th>Đọc</th>
                    <th>Tạo lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationRows.map((item, rowIdx) => (
                    <tr key={item.id}>
                      <td>{(notificationPageSafe - 1) * CLIENT_TABLE_PAGE_SIZE + rowIdx + 1}</td>
                      <td>{item.id}</td>
                      <td>{item.userId}</td>
                      <td>{item.role || '-'}</td>
                      <td>{item.type || '-'}</td>
                      <td>{item.title || '-'}</td>
                      <td>{item.body || item.subtitle || '-'}</td>
                      <td>
                        <Badge bg={item.isRead ? 'success' : 'warning'} text={item.isRead ? 'light' : 'dark'}>
                          {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                        </Badge>
                      </td>
                      <td>{item.createdAt || '-'}</td>
                    </tr>
                  ))}
                  {filteredNotifications.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted">
                        Chưa có thông báo
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <ClientTablePaginationFooter
                page={notificationPageSafe}
                totalPages={notificationPageCount}
                onPageChange={setNotificationPage}
                totalFiltered={filteredNotifications.length}
                pageSize={CLIENT_TABLE_PAGE_SIZE}
              />
            </Card.Body>
          </Card>

          <Card className="med-card">
            <Card.Body>
              <Card.Title>Audit log nghiệp vụ</Card.Title>
              <Row className="g-2 mb-3">
                <Col md={12} lg={4}>
                  <Form.Control
                    type="search"
                    placeholder="Tìm trong mọi cột audit (actor, action, resource, metadata…)"
                    value={auditSearch}
                    onChange={(e) => {
                      setAuditSearch(e.target.value)
                      setAuditPage(1)
                    }}
                  />
                </Col>
                <Col md={4} lg={2}>
                  <Form.Select
                    value={auditRoleFilter}
                    onChange={(e) => {
                      setAuditRoleFilter(e.target.value)
                      setAuditPage(1)
                    }}
                  >
                    <option value="">Tất cả role</option>
                    <option value="admin">admin</option>
                    <option value="doctor">doctor</option>
                    <option value="patient">patient</option>
                    <option value="system">system</option>
                  </Form.Select>
                </Col>
                <Col md={4} lg={3}>
                  <Form.Control
                    type="date"
                    value={auditDateFrom}
                    onChange={(e) => {
                      setAuditDateFrom(e.target.value)
                      setAuditPage(1)
                    }}
                  />
                </Col>
                <Col md={4} lg={3}>
                  <Form.Control
                    type="date"
                    value={auditDateTo}
                    onChange={(e) => {
                      setAuditDateTo(e.target.value)
                      setAuditPage(1)
                    }}
                  />
                </Col>
                <Col md={12} className="d-flex justify-content-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setAuditRoleFilter('')
                      setAuditDateFrom('')
                      setAuditDateTo('')
                      setAuditSearch('')
                      setAuditPage(1)
                    }}
                  >
                    Reset bộ lọc audit
                  </Button>
                </Col>
              </Row>
              <Table striped bordered hover responsive className="mb-0 small">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Metadata</th>
                    <th>Tạo lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((item, rowIdx) => (
                    <tr key={item.id}>
                      <td>{(auditPageSafe - 1) * CLIENT_TABLE_PAGE_SIZE + rowIdx + 1}</td>
                      <td>{item.id}</td>
                      <td>{item.actorId || '-'}</td>
                      <td>{item.actorRole || '-'}</td>
                      <td>{item.action || '-'}</td>
                      <td>
                        {item.resourceType || '-'} #{item.resourceId || '-'}
                      </td>
                      <td>
                        <code>{JSON.stringify(item.metadata || {})}</code>
                      </td>
                      <td>{item.createdAt || '-'}</td>
                    </tr>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-muted">
                        Chưa có audit log
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <ClientTablePaginationFooter
                page={auditPageSafe}
                totalPages={auditPageCount}
                onPageChange={setAuditPage}
                totalFiltered={filteredAuditLogs.length}
                pageSize={CLIENT_TABLE_PAGE_SIZE}
              />
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  )
}

export default AdminMonitoringPage
