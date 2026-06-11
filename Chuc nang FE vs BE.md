# Vai Trò của Bảng Điều Khiển Tương Tranh (FE) và Sự Kết Hợp Với Backend (BE)

Tài liệu này tổng hợp phân tích về vai trò của **Bảng điều khiển tương tranh (Concurrency Control Center)** ở Frontend (React) và cách nó giao tiếp, truyền dữ liệu xuống phân hệ **Backend (Node.js)** và **Database (SQL Server)** trong mô hình thực tế.

---

## 1. Ý Nghĩa Của Bảng Điều Khiển Tương Tranh Khi Có BE và DB Thật

Khi hệ thống đã hoàn thiện đầy đủ cả 3 lớp (React Frontend $\rightarrow$ Node.js Backend $\rightarrow$ SQL Server Database), bảng điều khiển tương tranh không còn là công cụ "giả lập" (mock) nữa. Thay vào đó, nó chuyển đổi thành một **Bảng điều khiển cấu hình hệ thống thực tế**, giúp điều phối trực tiếp hành vi giao dịch và khóa của SQL Server ngay trên giao diện web.

### 1.1. Truyền Động Mức Cô Lập (Isolation Level) Xuống Database
* **Frontend:** Khi người dùng thay đổi mức cô lập (ví dụ: chuyển từ `READ COMMITTED` sang `SERIALIZABLE`), thông tin này sẽ được đính kèm vào Header của mọi API request gửi từ Client lên.
* **Backend:** Một middleware trung gian (như `concurrency.ts`) sẽ đọc tham số này và thực thi câu lệnh cấu hình động trên kết nối SQL hiện hành:
  ```sql
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  ```
* **Ý nghĩa:** Demo trực quan sự khác biệt giữa các mức cô lập (ví dụ: làm thế nào `SERIALIZABLE` ngăn chặn lỗi Phantom Read trên database thật).

### 1.2. Bật/Tắt Chế Độ Sửa Lỗi (`useLockFix`) Để Gọi Stored Procedure Khác Nhau
* **Frontend:** Người dùng gạt công tắc "Sửa lỗi" (ON/OFF) trên giao diện. Trạng thái này được gửi dưới dạng tham số URL (Query Parameter) lên BE.
* **Backend & DB:** BE dựa vào tham số này để quyết định chạy thủ tục (Stored Procedure) nào trong database:
  * **Tắt sửa lỗi (`fixed = false`):** Gọi `usp_BookTicket_Conflict` (thiếu khóa `UPDLOCK` hoặc không sắp xếp thứ tự ghế), tạo ra lỗi Deadlock 1205 hoặc Lost Update thực tế trong SQL Server.
  * **Bật sửa lỗi (`fixed = true`):** Gọi `usp_BookTicket_Fixed` (sử dụng khóa `UPDLOCK, HOLDLOCK` và sắp xếp thứ tự khóa) để SQL Server xử lý đồng bộ an toàn.
* **Ý nghĩa:** Trình diễn trực tiếp hai kịch bản **Lỗi** và **Đã sửa lỗi** ngay trên giao diện mà không cần phải can thiệp trực tiếp vào mã nguồn hay cơ sở dữ liệu trong lúc demo.

### 1.3. Cấu Hình Độ Trễ Giao Dịch (`latencyMs`) Để Tạo Điểm Nghẽn
* **Frontend:** Thanh trượt độ trễ cho phép đặt khoảng thời gian (ví dụ: 3 giây). Tham số này được truyền xuống BE.
* **Backend & DB:** Database sẽ thực hiện lệnh trì hoãn giao dịch để giữ khóa lâu hơn:
  ```sql
  WAITFOR DELAY '00:00:03';
  ```
* **Ý nghĩa:** Giúp giao dịch của người thứ nhất bị giữ lại đủ lâu, tạo điều kiện dễ dàng cho người thứ hai (ở máy khác hoặc tab khác) bấm thao tác nhằm tạo ra xung đột tương tranh thật sự trên Database mà không cần phải thao tác thủ công cực nhanh.

---

## 2. Các Thành Phần Tiếp Nhận Tham Số Từ FE Xuống Ở Backend

Theo kiến trúc phân hệ Backend, có **hai nơi chính** thực hiện nhiệm vụ tiếp nhận cấu hình tương tranh từ Frontend:

### 2.1. Lớp Middleware: [concurrency.ts](file:///d:/He+Quan+Tri+CSDL/FE_RDBMS/backend/src/middlewares/concurrency.ts)
Đây là bộ lọc trung gian đón nhận các thiết lập hệ thống trước khi API xử lý các logic nghiệp vụ.

* **Cách nhận:** Đọc qua HTTP Header (ví dụ: `x-isolation-level`).
* **Mã ví dụ xử lý:**
  ```typescript
  // backend/src/middlewares/concurrency.ts
  import { Request, Response, NextFunction } from 'express';
  
  export async function concurrencyMiddleware(req: Request, res: Response, next: NextFunction) {
    const isolationLevel = req.headers['x-isolation-level'] as string;
    
    if (isolationLevel) {
      try {
        // Lấy kết nối SQL từ Pool và thiết lập mức cô lập động
        const pool = req.app.locals.dbPool;
        const transaction = pool.transaction();
        await transaction.begin();
        
        await transaction.request().query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel};`);
        req.app.locals.currentTransaction = transaction; // Lưu lại để controller sử dụng
      } catch (err) {
        return res.status(500).json({ error: "Không thể thiết lập mức cô lập giao dịch." });
      }
    }
    next();
  }
  ```

### 2.2. Lớp Điều Phối (Controllers): [ticket.controller.ts](file:///d:/He+Quan+Tri+CSDL/FE_RDBMS/backend/src/controllers/ticket.controller.ts) và [report.controller.ts](file:///d:/He+Quan+Tri+CSDL/FE_RDBMS/backend/src/controllers/report.controller.ts)
Đây là nơi tiếp nhận các tham số nghiệp vụ đi kèm trực tiếp với hành động cụ thể từ người dùng.

* **Cách nhận:** Đọc qua Query Parameters (trên URL) hoặc Body Payload (định dạng JSON).
* **Mã ví dụ xử lý trong `ticket.controller.ts` (Đặt vé):**
  ```typescript
  // backend/src/controllers/ticket.controller.ts
  import { Request, Response } from 'express';
  import { ticketService } from '../services/ticket.service';
  
  export async function bookTicketController(req: Request, res: Response) {
    try {
      const { seats, showtimeId } = req.body;
      
      // Nhận tham số 'fixed' (chế độ sửa lỗi) từ query string
      const useLockFix = req.query.fixed === 'true';
      
      // Nhận tham số 'latency' (độ trễ khóa) từ query string
      const latencyMs = Number(req.query.latency) || 0;
      
      // Gọi service xử lý thao tác với Database thực tế
      const result = await ticketService.bookTicket({
        seats,
        showtimeId,
        useLockFix,
        latencyMs
      });
      
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      // Middleware errorHandler sẽ bắt mã lỗi SQL (VD: 1205 - Deadlock) và trả về thông báo lỗi tương ứng
      return res.status(400).json({ success: false, errorCode: error.number, message: error.message });
    }
  }
  ```
