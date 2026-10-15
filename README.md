# 🎬 CINESTAR - HỆ THỐNG ĐẶT VÉ XEM PHIM & MÔ PHỎNG TƯƠNG TRANH CSDL

Dự án xây dựng ứng dụng đặt vé xem phim trực tuyến kết hợp bảng điều khiển mô phỏng và xử lý 5 hiện tượng tranh chấp đồng thời (Concurrency Conflicts) trong Hệ quản trị Cơ sở dữ liệu SQL Server: **Lost Update**, **Dirty Read**, **Non-repeatable Read**, **Phantom Read** và **Deadlock**.

---

## 👨‍💻 Đóng góp cá nhân (Personal Contributions)

Trong dự án CineStar, tôi tập trung vào **Phân tích hệ thống, Thiết kế cơ sở dữ liệu và Phát triển giao diện người dùng**, đồng thời tham gia tích hợp Frontend với Backend để hoàn thiện luồng đặt vé.

| Hạng mục | Công việc thực hiện | Công nghệ / Công cụ |
|---|---|---|
| **Phân tích hệ thống** | Phân tích yêu cầu, xác định chức năng chính và mô hình hóa các luồng nghiệp vụ đặt vé xem phim. | System Analysis, Use Case, User Flow |
| **Thiết kế cơ sở dữ liệu** | Phân tích dữ liệu nghiệp vụ, xây dựng cấu trúc bảng và xác định mối quan hệ giữa các thực thể. | SQL Server, ERD, T-SQL |
| **Phát triển Frontend** | Xây dựng và hoàn thiện giao diện các trang phim, chi tiết phim, chọn ghế, xác nhận đặt vé và giao diện quản trị. | React, TypeScript, Tailwind CSS |
| **Tích hợp Frontend – Backend** | Phối hợp kết nối giao diện với API, xử lý dữ liệu trả về và hoàn thiện luồng tương tác giữa người dùng với hệ thống. | REST API, Node.js, Express.js |
| **Xử lý nghiệp vụ đặt vé** | Tham gia hoàn thiện luồng chọn ghế và đặt vé, chú trọng việc kiểm tra trạng thái ghế và hạn chế xung đột khi nhiều giao dịch diễn ra đồng thời. | SQL Server, Transaction, Concurrency Control |
| **Kiểm thử và kiểm tra lỗi** | Kiểm tra luồng chức năng, đối chiếu dữ liệu giữa giao diện và Backend, phối hợp sửa lỗi trong quá trình tích hợp. | Manual Testing, API Testing |

> *Lưu ý: Chỉ giữ lại những công việc mà bạn thực sự trực tiếp thực hiện hoặc có tham gia. Có thể điều chỉnh nội dung từng dòng để phản ánh chính xác phạm vi đóng góp cá nhân.*

---

## 🧰 Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS | Xây dựng giao diện người dùng |
| Backend | Node.js, Express.js | Xây dựng API và xử lý nghiệp vụ |
| Database | Microsoft SQL Server, T-SQL | Lưu trữ và xử lý dữ liệu |
| API | REST API | Trao đổi dữ liệu giữa Frontend và Backend |
| Kiểm thử | Manual Testing | Kiểm tra luồng chức năng và phản hồi từ hệ thống |
| Quản lý mã nguồn | Git, GitHub | Quản lý phiên bản và phối hợp phát triển |

---

## 🎯 Mục tiêu và phạm vi chức năng

| Nhóm chức năng | Nội dung |
|---|---|
| **Người dùng** | Đăng nhập, đăng ký và quản lý thông tin tài khoản theo phạm vi triển khai |
| **Tra cứu phim** | Xem danh sách phim, thông tin chi tiết và lịch chiếu |
| **Đặt vé** | Chọn suất chiếu, chọn ghế và thực hiện quy trình đặt vé |
| **Quản lý** | Quản lý dữ liệu và theo dõi thông tin theo quyền được cấp |
| **Báo cáo** | Truy vấn dữ liệu phục vụ thống kê và báo cáo doanh thu |
| **Mô phỏng tương tranh** | Quan sát các tình huống giao dịch đồng thời, mức cô lập và phương án hạn chế xung đột |

---

## 🗄️ Thiết kế cơ sở dữ liệu

| Bảng dữ liệu | Vai trò |
|---|---|
| `Category` | Lưu thông tin thể loại phim |
| `Movie` | Lưu thông tin phim |
| `Showtime` | Quản lý lịch chiếu |
| `Seat` | Lưu thông tin ghế |
| `Customer` | Lưu thông tin khách hàng |
| `Ticket` | Lưu thông tin vé |
| `TicketDetail` | Lưu thông tin chi tiết vé |

### Các đối tượng SQL tiêu biểu

| Đối tượng | Tên | Mục đích |
|---|---|---|
| View | `v_ShowtimeSeats` | Truy vấn thông tin suất chiếu và ghế |
| View | `v_RevenueByMovie` | Tổng hợp dữ liệu doanh thu theo phim |
| Function | `fn_CountEmptySeats` | Hỗ trợ đếm số ghế còn trống |
| Function | `fn_CalculateInvoice` | Hỗ trợ tính toán hóa đơn |
| Stored Procedure | `usp_GetRevenueReport` | Truy vấn dữ liệu báo cáo doanh thu |
| Stored Procedure | `usp_BookTicket_Conflict` | Phục vụ kịch bản đặt vé có nguy cơ xung đột |
| Stored Procedure | `usp_BookTicket_Fixed` | Phục vụ kịch bản đặt vé đã áp dụng phương án xử lý xung đột |
| Trigger | `trg_PreventDoubleBooking` | Hỗ trợ kiểm soát việc đặt trùng ghế |
| Trigger | `trg_ShowtimeOverlapCheck` | Kiểm tra điều kiện liên quan đến lịch chiếu |

---

## ⚙️ Các vấn đề tương tranh cơ sở dữ liệu

| Vấn đề | Mô tả | Hướng xử lý / nghiên cứu |
|---|---|---|
| Lost Update | Các giao dịch cập nhật dữ liệu có thể ghi đè kết quả của nhau. | Kiểm soát giao dịch và khóa dữ liệu phù hợp |
| Dirty Read | Một giao dịch đọc dữ liệu chưa được giao dịch khác xác nhận. | Sử dụng mức cô lập phù hợp |
| Non-repeatable Read | Cùng một truy vấn có thể đọc được giá trị khác nhau trong một giao dịch. | Điều chỉnh mức cô lập giao dịch |
| Phantom Read | Truy vấn lặp lại có thể xuất hiện thêm hoặc mất các dòng dữ liệu phù hợp điều kiện lọc. | Lựa chọn mức cô lập và cơ chế khóa phù hợp |
| Deadlock | Các giao dịch chờ tài nguyên của nhau tạo thành vòng chờ. | Chuẩn hóa thứ tự khóa và điều chỉnh cách thực hiện giao dịch |

---

## 📁 Cấu trúc thư mục dự án

```text
RDBMS/
├── frontend/                     # Mã nguồn ứng dụng Client (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/           # Navbar, Footer, DevPanel (Bảng điều khiển tương tranh)
│   │   ├── pages/                # HomePage, SeatsPage, BookingConfirmPage, AdminPortalPage...
│   │   ├── lib/                  # db.ts (Lớp truy cập dữ liệu giả lập/đồng bộ khóa)
│   │   ├── App.tsx               # Quản lý State toàn cục & định tuyến
│   │   └── main.tsx              # Điểm khởi chạy ứng dụng
│   └── package.json
├── backend/                      # Mã nguồn máy chủ trung gian (Node.js + Express)
│   ├── src/
│   │   ├── config/database.ts    # Cấu hình Pool Connection kết nối SQL Server
│   │   ├── controllers/          # Điều phối luồng nghiệp vụ & tương tranh
│   │   ├── middlewares/          # Bắt lỗi & thiết lập Isolation Level
│   │   ├── routes/               # Định nghĩa các cổng API
│   │   └── services/             # Tầng truy xuất dữ liệu (Data Access Layer - DAL)
│   └── package.json
└── database/                     # Kịch bản T-SQL khởi tạo Database, Table, SP, Trigger
    └── CineStar_Database_Setup.sql
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Cơ sở dữ liệu (SQL Server)
- Mở **SQL Server Management Studio (SSMS)**.
- Mở và thực thi script `database/CineStar_Database_Setup.sql` để khởi tạo database, bảng, dữ liệu mẫu, trigger và các stored procedure.

### 2. Backend (Node.js API)
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Truy cập ứng dụng tại `http://localhost:5173`.
