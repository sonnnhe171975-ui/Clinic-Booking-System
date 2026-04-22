# Mô tả nghiệp vụ và chức năng — Hệ thống đặt lịch phòng khám (Clinic Booking)

Tài liệu này mô tả **chức năng nghiệp vụ** và **luồng xử lý** theo từng vai trò, bám sát triển khai trong mã nguồn (React + JSON Server / `db.json`). Dùng cho đồ án, bàn giao hoặc mở rộng hệ thống.

---

## 1. Tổng quan hệ thống

### 1.1. Mục tiêu

- Cho phép **bệnh nhân** xem thông tin phòng khám, chuyên khoa, bác sĩ, **đặt / đổi / hủy lịch khám** theo ca (schedule) có giới hạn số suất (`maxSlot` / `currentSlot`).
- Cho phép **bác sĩ** xem lịch theo tuần, **xác nhận / từ chối** lịch mới, cập nhật **tiến trình khám** (đến, hoàn tất, không đến, hủy…).
- Cho phép **quản trị viên** quản lý **danh mục** (chuyên khoa, bác sĩ, ca khám, người dùng), **toàn bộ lịch hẹn**, và các thực thể nghiệp vụ mở rộng (hồ sơ khám, đơn thuốc, thanh toán, thông báo, audit).

### 1.2. Công nghệ & giả định vận hành

- **Frontend**: React, định tuyến theo vai trò (`ProtectedRoute`), giao diện dashboard riêng từng role.
- **Backend (demo)**: REST kiểu JSON Server; dữ liệu trong `db.json`. Một số thao tác **nguyên tử hóa tối đa** ở tầng ứng dụng (đặt lịch: tạo appointment rồi tăng slot; nếu tràn slot thì rollback xóa appointment).
- **Bảo mật**: Ở phạm vi đồ án, xác thực dựa trên phiên đăng nhập lưu ở client; quyền truy cập route theo `role` (`patient` | `doctor` | `admin`).

---

## 2. Vai trò (role) và phân quyền truy cập

| Vai trò   | Đường dẫn chính | Ghi chú |
|-----------|-----------------|--------|
| **patient** | `/patient`, `/patient/appointments`, `/patient/doctors`, … | Chỉ truy cập khu vực bệnh nhân sau đăng nhập. |
| **doctor**  | `/doctor` | Một màn hình lịch/tuần + modal chi tiết ca; không dùng footer trang công khai giống bệnh nhân. |
| **admin**   | `/admin`, `/admin/*` | Toàn bộ module quản trị. |

**Khách (chưa đăng nhập)** truy cập: trang chủ, giới thiệu, danh sách chuyên khoa, danh sách bác sĩ, chi tiết bác sĩ (xem lịch trống). **Đặt lịch** trên trang chi tiết bác sĩ yêu cầu đăng nhập tài khoản **patient**.

---

## 3. Thực thể nghiệp vụ cốt lõi

### 3.1. Chuyên khoa (specialties)

- Danh mục chuyên khoa phòng khám; bác sĩ gắn với `specialtyId`.

### 3.2. Bác sĩ (doctors)

- Thông tin hiển thị công khai: tên, chuyên khoa, kinh nghiệm, giới thiệu.
- Tài khoản user loại `doctor` có thể có `doctorId` khớp với bản ghi bác sĩ để nhận thông báo và vào đúng dashboard.

### 3.3. Lịch khám / ca (schedules)

- Gắn `doctorId`, **ngày** (`date`), **khung giờ** (`time` — một trong các ca cố định trong hệ thống), `maxSlot`, `currentSlot`, trạng thái ca (`available` / `full`).
- **Ràng buộc**: không trùng lịch chồng khung giờ cho cùng bác sĩ cùng ngày (kiểm tra khi admin tạo/sửa ca).

### 3.4. Lịch hẹn (appointments)

- Liên kết `userId` (bệnh nhân), `doctorId`, `scheduleId`, thông tin liên hệ (`patientName`, `phone`, email, địa chỉ, ghi chú).
- **Trạng thái** (`status`) — đồng bộ toàn hệ thống:

| Giá trị      | Nhãn UI (VI)     | Ý nghĩa nghiệp vụ |
|-------------|------------------|-------------------|
| `pending`   | Chờ xác nhận     | Bệnh nhân vừa đặt; bác sĩ cần xác nhận hoặc từ chối. |
| `confirmed` | Đã xác nhận      | Lịch được chấp nhận; bệnh nhân có thể đến theo ca. |
| `checked_in`| Đã đến           | Bệnh nhân đã check-in tại ca. |
| `completed` | Đã khám xong     | Kết thúc khám; **giải phóng slot** (không còn chiếm suất “đang giữ”). |
| `cancelled` | Đã hủy           | Hủy lịch; **trả slot**. |
| `no_show`   | Không đến        | Bệnh nhân không đến; **vẫn giữ slot** (không trả như hủy). |

Quy ước **slot** (tóm tắt từ logic hệ thống):

- Trạng thái **chiếm chỗ** (đếm vào `currentSlot`): mọi trạng thái **trừ** `cancelled` và `completed`.
- Đổi trạng thái có thể **+1 / -1** `currentSlot` tùy chuyển từ trạng thái cũ sang mới; nếu cần **tăng** slot mà ca đã đầy → từ chối cập nhật.

### 3.5. Người dùng (users)

- Tài khoản: `admin`, `doctor`, `patient`; có thể có thêm trường hồ sơ (SĐT, địa chỉ, ngày sinh…) tùy dữ liệu.

### 3.6. Hồ sơ khám, đơn thuốc, thanh toán

- **Hồ sơ khám**: gắn `appointmentId`, bệnh nhân, bác sĩ, chẩn đoán, kết luận, sinh hiệu (JSON), thời điểm tạo.
- **Đơn thuốc**: gắn `medicalRecordId`, bác sĩ, danh sách thuốc (JSON), lời dặn.
- **Thanh toán**: gắn lịch hẹn / user, số tiền, phương thức, trạng thái, thời điểm thanh toán nếu có.

*(Luồng tạo tự động từ màn bác sĩ có thể mở rộng sau; hiện admin quản lý CRUD trên các bảng này.)*

### 3.7. Thông báo (notifications) & nhật ký audit (auditLogs)

- **Thông báo**: gửi tới `userId` + `role`, có `type`, tiêu đề, nội dung, `relatedId`, đường dẫn `to`, `isRead`, `createdAt`.
- **Audit log**: ghi `actorId`, `actorRole`, `action`, loại tài nguyên, `resourceId`, `metadata`, `createdAt` — ví dụ sau khi đặt lịch hoặc đổi trạng thái.

---

## 4. Luồng nghiệp vụ: đặt lịch và vòng đời trạng thái

### 4.1. Đặt lịch (bệnh nhân)

1. Bệnh nhân chọn bác sĩ và **ca còn chỗ** (`currentSlot < maxSlot`).
2. Gửi yêu cầu đặt lịch: tạo appointment với `status = pending`, tăng `currentSlot` của ca.
3. Kiểm tra **trùng**: cùng `userId` + `scheduleId` không được có hai lịch **đang hoạt động** (không hủy / chưa hoàn tất) trùng ca.
4. Nếu sau khi tạo phát hiện **race condition** (ca đầy) → xóa appointment vừa tạo và báo lỗi.
5. Sau khi đặt thành công: tạo **thông báo** cho tài khoản bác sĩ (nếu map được `doctorId`) và cho **mọi admin**; ghi **audit** `appointment_created`.

### 4.2. Hủy lịch

- Bệnh nhân: được phép ở trạng thái **pending** hoặc **confirmed** (theo quyền UI).
- Chuyển sang `cancelled` và **giảm** `currentSlot` tương ứng.

### 4.3. Đổi lịch (đổi ca)

- **Đặt ca mới trước** (tạo appointment mới + slot mới), **sau đó hủy ca cũ**. Nếu hủy ca cũ thất bại → rollback (hủy appointment mới) để tránh lịch trùng / slot sai.

### 4.4. Bác sĩ xử lý lịch

Theo `permissions` / `getDoctorAllowedActions`:

| Trạng thái hiện tại | Hành động được phép |
|---------------------|----------------------|
| `pending`           | Xác nhận → `confirmed`; Từ chối → có luồng từ chối (tùy triển khai UI). |
| `confirmed`         | Đã đến → `checked_in`; Không đến → `no_show`; Hủy → `cancelled`. |
| `checked_in`        | Hoàn tất khám → `completed`. |
| Trạng thái kết thúc / hủy | Không còn thao tác tiến trình. |

### 4.5. Quản trị viên cập nhật trạng thái

- Admin có thể đổi trạng thái lịch từ màn **Quản lý lịch hẹn**; cùng quy tắc **slot** như trên (đã hủy / đã khám xong → trả slot; không đến → giữ slot; v.v.).

---

## 5. Chi tiết chức năng theo vai trò

### 5.1. Bệnh nhân (patient)

**Khu vực công khai (có thể trước đăng nhập)**

- Xem trang chủ, giới thiệu, **danh sách chuyên khoa**, **danh sách bác sĩ**, **chi tiết bác sĩ** và bảng các ca khám (ngày, ca, slot, đầy/còn chỗ).

**Sau đăng nhập — Dashboard bệnh nhân**

- **Trang chủ dashboard** (`/patient`): thống kê nhanh (vai trò, số lịch đang hoạt động), liên kết đặt lịch; **bảng lịch hẹn** có tìm kiếm, lọc theo ngày, sắp xếp theo ngày khám, phân trang cố định 30 dòng/trang, cột STT.
- **Lịch hẹn của tôi** (`/patient/appointments`): danh sách đầy đủ với bác sĩ, ngày/ca, trạng thái; **Hủy lịch**, **Đổi lịch** (chọn ca trống cùng bác sĩ) khi trạng thái cho phép; cùng bộ lọc/tìm kiếm/phân trang như trên.
- **Đặt lịch khám** (`/patient/doctors`): danh sách bác sĩ; vào chi tiết để điền form đặt lịch (tên, SĐT, email, địa chỉ, ghi chú, chọn ca).

**Ràng buộc**

- Chỉ role `patient` được đặt lịch qua luồng đã kiểm tra quyền.

---

### 5.2. Bác sĩ (doctor)

**Dashboard** (`/doctor`)

- Xem **lịch theo tuần** (lưới ca × ngày): ô có ca hiển thị phòng, slot, đầy/còn chỗ; bấm vào ô mở **modal chi tiết ca**.
- **Danh sách bệnh nhân trong ca** (trong modal): thông tin liên hệ, ghi chú đặt hẹn, nút hành động theo trạng thái (xác nhận, từ chối, check-in, không đến, hủy, hoàn tất…).
- Có thể có **danh sách lịch pending** cần xác nhận và toast nhắc khi có lịch mới (polling định kỳ).
- Tìm kiếm / phân trang trong modal danh sách bệnh nhân theo ca.

**Điều hướng**

- Bác sĩ đăng nhập có thể được chuyển hướng khỏi trang công khai một số route (component `DoctorPublicRedirect`).

---

### 5.3. Quản trị viên (admin)

**Tổng quan** (`/admin`)

- Các thẻ dẫn tới từng module quản lý.

**Danh mục & người dùng (CRUD trong modal)**

- **Chuyên khoa**, **Bác sĩ**, **Lịch khám**, **Người dùng**: thêm/sửa/xóa qua popup; bảng có tìm kiếm đa trường, lọc ngày (nếu resource có dữ liệu thời gian), sắp xếp, lọc vai trò (users), phân trang 30/trang.
- **Lịch khám**: validate ca thuộc tập khung giờ cho phép; kiểm tra trùng giờ theo bác sĩ/ngày.

**Lịch hẹn** (`/admin/appointments`)

- Xem toàn bộ appointment; đổi trạng thái qua dropdown + nút cập nhật; hiển thị ngày/ca từ schedule; tìm kiếm, lọc ngày, phân trang.

**Hồ sơ khám, Đơn thuốc, Thanh toán, Thông báo**

- CRUD tương tự (thông báo có cấu trúc theo API); tìm kiếm/lọc/sắp xếp/phân trang.

**Audit logs**

- **Chỉ xem** (không sửa/xóa trên UI CRUD); tra cứu toàn bộ nhật ký.

**Giám sát hệ thống** (`/admin/monitoring`)

- Bảng **thông báo** và **audit** với bộ lọc (role, type, khoảng ngày, tìm kiếm toàn trường), phân trang; có thể đánh dấu đọc hàng loạt thông báo.

---

## 6. Thông báo và audit (hành vi hệ thống)

### 6.1. Khi có lịch mới (`pending`)

- Thông báo tới **bác sĩ** (user map `doctorId`) — type kiểu `pending_appointment`.
- Thông báo tới **mọi admin** — type kiểu `admin_pending`.

### 6.2. Khi đổi trạng thái lịch

- Thông báo tới **bệnh nhân** (`userId`) — type `appointment_status`, nội dung gợi mở trang lịch của tôi.

### 6.3. Audit

- Ví dụ: `appointment_created`, `appointment_status_changed` với `metadata` chứa `from` / `to` trạng thái.

---

## 7. Giao diện & trải nghiệm dùng chung

- **Navbar**: theo ngữ cảnh đăng nhập; **Trung tâm thông báo** (nếu có component) liên kết tới các route liên quan.
- **Dashboard**: sidebar menu khác nhau theo `admin` / `doctor` / `patient`.
- **Phân trang**: số trang dạng 1, 2, 3…; **30 bản ghi/trang** cố định; dòng tóm tắt “kết quả · 30 dòng/trang · trang x/y”.
- **Bảng lớn**: tìm kiếm chuỗi, lọc khoảng ngày (khi có ngày khám), đảo chiều sắp xếp ngày nơi áp dụng.

---

## 8. Rủi ro & hạn chế (phiên bản hiện tại)

- Backend kiểu **JSON Server** không có transaction thật; xử lý race condition đặt lịch là **best-effort** (đã có bước rollback khi phát hiện ca đầy sau POST).
- Mật khẩu và quyền: phù hợp môi trường demo; triển khai thực tế cần API bảo mật, JWT/session server-side, RBAC đầy đủ.
- Các module **hồ sơ / đơn / thanh toán** chủ yếu do admin quản lý dữ liệu; luồng khám từ A–Z có thể bổ sung (bác sĩ kê đơn trực tiếp trên UI, v.v.).

---

## 9. Bản đồ route nhanh

| Route | Mô tả ngắn |
|-------|------------|
| `/` | Trang chủ |
| `/login`, `/register` | Đăng nhập / đăng ký |
| `/patient`, `/patient/appointments`, `/patient/doctors` | Dashboard bệnh nhân |
| `/doctor` | Dashboard bác sĩ |
| `/admin` | Tổng quan admin |
| `/admin/specialties` … `/admin/audit-logs` | Các module CRUD / lịch / giám sát |

---

*Tài liệu phản ánh trạng thái mã nguồn tại thời điểm tạo file; khi refactor, nên cập nhật lại mục luồng trạng thái và route cho khớp.*
