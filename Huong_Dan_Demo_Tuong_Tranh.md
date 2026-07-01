# Hướng dẫn Demo chi tiết các Tình huống Tương tranh (Mô phỏng Thao tác Thủ công)

Tài liệu này hướng dẫn chi tiết cách tự thao tác trực tiếp trên giao diện (giữa 2 trình duyệt song song đóng vai trò 2 khách hàng thực tế) để **tự gây ra lỗi tương tranh** và **kiểm chứng sửa lỗi** bằng SQL Server. 

> [!IMPORTANT]
> **Quy tắc Demo**:
> * **Để tạo ra lỗi**: Trong mục cài đặt tương tranh (Dev Panel), luôn giữ mục **"Tình huống tương tranh"** ở trạng thái **"Không giả lập (Mặc định)"** (Scenario: `none`). 
> * **Vai trò của Dev Panel**: Chỉ dùng để cấu hình các thông số kỹ thuật (độ trễ `Latency`, mức cô lập `Isolation Level`, nút bật/tắt `Sửa lỗi/Lock Fix`) để hỗ trợ kiểm chứng hành vi CSDL.

---

## 🛠️ Chuẩn bị chung trước khi Demo

1. **Khởi động hệ thống**:
   * Nhấp đúp chuột vào file [run.bat](file:///d:/He%20Quan%20Tri%20CSDL/RDBMS/run.bat) ở thư mục gốc của dự án.
   * Đảm bảo cả máy chủ Backend (port 5000) và Frontend (port 5173/5174) đều hoạt động.

2. **Mở song song 2 trình duyệt để thao tác**:
   * **Màn hình A (Trái)**: Mở trình duyệt bình thường (đại diện Khách A).
   * **Màn hình B (Phải)**: Mở một tab **Ẩn danh (Incognito)** (đại diện Khách B).
   * Cả hai bên cùng truy cập vào địa chỉ website: `http://localhost:5173`.

3. **Bật Developer Panel (Góc dưới cùng bên phải)**:
   * Click vào biểu tượng **CPU** màu đỏ ở cả hai màn hình.
   * Chuyển sang Tab **"Nhật ký SQL"** ở cả hai bên để quan sát các câu lệnh chạy thực tế dưới database dưới dạng console log thời gian thực.

---

## 1. Mất cập nhật (Lost Update)

### 📌 Nguyên lý tương tranh
Khách A và Khách B cùng đọc sơ đồ ghế và thấy ghế `A5` đang trống. Giao dịch A thực hiện đặt trước, nhưng do không khóa giữ dòng, Giao dịch B tiếp tục ghi đè lệnh đặt ghế `A5` lên trên. Dẫn đến giao dịch đặt vé của Khách A bị biến mất trên CSDL.

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Thiết lập tham số (Dev Panel)
* Trên **cả hai màn hình A & B**:
  * Bật **"Kích hoạt chế độ giả lập tương tranh"** (Dev Mode: ON).
  * **Tình huống tương tranh**: Chọn **"Không giả lập (Mặc định)"** (Scenario: `none`).
  * **Độ trễ lock/query**: Kéo lên **5.0s** (độ trễ này giúp ta có thời gian click tương tranh).
  * **Tắt (OFF)** nút: *Sử dụng sửa lỗi (Lock Fix: OFF)*.
  * **Isolation Level**: **READ COMMITTED** (mức mặc định của SQL Server).

#### Bước 2: Thao tác gây lỗi trực tiếp trên UI
1. Trên cả hai màn hình, cùng chọn phim **Dune: Part Two** -> chọn suất chiếu **09:30 (Hall 1)** ngày hôm nay.
2. Cả hai cùng click chọn ghế **A5** (ghế chuyển sang màu cam).
3. Nhấp nút **"Tiếp theo"** ở cả hai màn hình. Vì ở chế độ Không giả lập, nút này sẽ kích hoạt giao dịch đặt vé thực tế và giữ kết nối mở trong vòng 5 giây trước khi Commit.
4. **Hành động click trùng nhau**:
   * Click **"Xác nhận đặt vé"** ở **Màn hình A (Trái)** trước.
   * *Ngay lập tức* (trong vòng 5 giây đó), click **"Xác nhận đặt vé"** ở **Màn hình B (Phải)**.

#### Bước 3: Hiện tượng xảy ra
* Cả hai màn hình đều chạy hết vòng quay tải và báo **Thành công**!
* Nhìn vào **Nhật ký SQL**: Cả hai luồng A và B đều ghi nhận INSERT hóa đơn vé thành công cho ghế `A5`.
* Tuy nhiên, nếu bạn tải lại sơ đồ ghế hoặc kiểm tra database, ghế `A5` đã bị chiếm hữu hoàn toàn bởi Khách B (vé của A bị ghi đè/mất dấu cập nhật).

---

### 🛡️ Cách kiểm chứng Sửa lỗi
1. Mở **Dev Panel** trên cả hai màn hình -> Bật **"Đã áp dụng cách khắc phục"** (Sử dụng SP mới có cơ chế `UPDLOCK, HOLDLOCK`).
2. Tiến hành đặt trùng ghế **A6** trên cả hai màn hình:
   * Nhấp **"Xác nhận đặt vé"** bên màn hình A.
   * Ngay sau đó, nhấp **"Xác nhận đặt vé"** bên màn hình B.
3. **Hiện tượng xảy ra**:
   * Màn hình B sẽ bị **Block (xoay vòng chờ)** chứ không thành công ngay.
   * Trên Tab **Nhật ký SQL** của màn hình B, bạn sẽ thấy câu lệnh SQL bị treo để đợi Khách A kết thúc giao dịch.
   * Sau khi màn hình A hết 5 giây và báo thành công (Commit), màn hình B mới được tiếp tục xử lý.
   * Do A đã đặt ghế, CSDL kiểm tra và từ chối giao dịch B -> màn hình B lập tức hiển thị thông báo: `"Ghế A6 đã bị bán trước đó. Giao dịch thất bại!"` và rollback an toàn!

---

## 2. Đọc dữ liệu rác (Dirty Read)

### 📌 Nguyên lý tương tranh
Giao dịch A đang thực hiện đặt ghế thanh toán (chưa Commit). Ghế tạm thời được lưu trong CSDL. Giao dịch B vào đọc sơ đồ ghế và thấy ghế đã bị khóa (Đọc dữ liệu chưa commit). Sau đó Giao dịch A gặp lỗi thanh toán hoặc hủy vé (Rollback). Ghế trở lại trạng thái trống. Giao dịch B đã đọc phải thông tin rác.

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Thiết lập tham số (Dev Panel)
* **Màn hình A (Trái - Khách đặt vé)**:
  * Tình huống: **"Không giả lập (Mặc định)"**.
  * Độ trễ lock/query: Kéo lên **5.0s**.
  * Isolation Level: **READ COMMITTED**.
* **Màn hình B (Phải - Khách xem sơ đồ)**:
  * Tình huống: **"Không giả lập (Mặc định)"**.
  * Isolation Level: Đổi thủ công sang **READ UNCOMMITTED** (mức cô lập cho phép đọc dữ liệu chưa commit).

#### Bước 2: Thao tác gây lỗi trực tiếp trên UI
1. Trên cả hai màn hình, cùng vào sơ đồ ghế phim **Dune**, suất chiếu **09:30**.
2. **Màn hình A**: Chọn ghế **A2** -> bấm **"Tiếp theo"** để chạy giao dịch giữ ghế trong 5 giây (chưa Commit).
3. **Màn hình B**: *Ngay lập tức* (trong vòng 5 giây đó), nhấn **F5** để tải lại sơ đồ ghế.
4. **Hiện tượng xảy ra**:
   * Màn hình B sẽ thấy ghế **A2** hiển thị màu đỏ (Đã bán) dù giao dịch A chưa kết thúc.
   * Sau 5 giây, giao dịch A gặp lỗi hoặc người dùng click tắt/hủy -> CSDL thực hiện **Rollback**. Ghế `A2` thực chất vẫn trống, nhưng Khách B đã đọc sai thông tin.

---

### 🛡️ Cách kiểm chứng Sửa lỗi
1. Trên **Dev Panel của màn hình B**, đổi mức cô lập về **READ COMMITTED** (chỉ đọc dữ liệu đã commit).
2. Thực hiện lại quy trình đặt ghế `A2` bên màn hình A.
3. Khi màn hình A đang trong 5 giây chờ, màn hình B nhấn F5 tải lại trang.
4. **Hiện tượng xảy ra**:
   * Màn hình B sẽ bị treo tải sơ đồ ghế (do bị Block bởi khóa độc quyền của A đang giữ trên dữ liệu A2) hoặc sơ đồ ghế sẽ chỉ hiển thị `A2` ở trạng thái **Trống** cho đến khi giao dịch của A kết thúc (Commit hoặc Rollback hoàn toàn).

---

## 3. Đọc không lặp lại (Non-repeatable Read)

### 📌 Nguyên lý tương tranh
Thủ quỹ A thực hiện truy vấn tổng doanh thu lần 1 (Transaction A đang mở). Trong lúc đó, một khách hàng B thực hiện hủy vé thành công (Commit). Thủ quỹ A đọc lại doanh thu lần 2 trong cùng giao dịch và thu được con số khác so với lần 1.

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Thiết lập tham số (Dev Panel)
* Trên **Dev Panel**:
  * Tình huống: **"Không giả lập (Mặc định)"** (Scenario: `none`).
  * Isolation Level: **READ COMMITTED**.
  * Độ trễ lock/query: Kéo lên **5.0s**.

#### Bước 2: Thao tác gây lỗi trực tiếp trên UI
1. Vào **Admin Portal** -> Chọn mục **Báo cáo Doanh thu**.
2. Chọn ngày hôm nay và click vào nút **"Xem báo cáo (Tương tranh)"**.
3. **Hành động tương tranh**:
   * Giao dịch A sẽ bắt đầu, đọc doanh thu lần 1 (Ví dụ hiển thị: 10,000,000đ) và treo chờ 5 giây.
   * Hệ thống tự động kích hoạt một tiến trình hủy vé mẫu `CNS_REVENUE_DEL` trị giá `1,200,000đ` chạy ngầm song song (đóng vai trò Khách B hủy vé thành công).
   * Hết 5 giây, Giao dịch A đọc lại lần 2.
4. **Hiện tượng xảy ra**:
   * Số tiền doanh thu lần 2 hiển thị trên console log bị **giảm đi 1,200,000đ** so với lần 1 (Chỉ còn 8,800,000đ). Hệ thống báo lỗi tương tranh dữ liệu không nhất quán.

---

### 🛡️ Cách kiểm chứng Sửa lỗi
1. Mở **Dev Panel** -> Chuyển Isolation Level sang **REPEATABLE READ**.
2. Bấm lại nút **"Xem báo cáo (Tương tranh)"**.
3. **Hiện tượng xảy ra**:
   * Lần đọc 1 hiển thị tổng tiền doanh thu.
   * Khóa đọc Shared Lock (S) giữ chặt dòng dữ liệu vé mẫu. Tiến trình hủy vé ngầm của B cố gắng chạy nhưng bị **Block hoàn toàn** (SQL Server treo hàng chờ).
   * Lần đọc 2 đếm lại -> kết quả **trùng khớp hoàn toàn** với lần 1.
   * Giao dịch A kết thúc và Commit -> Tiến trình hủy vé B mới được phép hoàn tất.

---

## 4. Lỗi bóng ma (Phantom Read)

### 📌 Nguyên lý tương tranh
Giao dịch A đang thực hiện tra cứu số lượng suất chiếu (Transaction A đang mở). Trong lúc đó, Admin B chèn thêm một suất chiếu mới (Commit). Giao dịch A đọc lại lần 2 và phát hiện số lượng suất chiếu bị tăng lên (dòng dữ liệu bóng ma xuất hiện).

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Thiết lập tham số (Dev Panel)
* Trên **Dev Panel**:
  * Tình huống: **"Không giả lập (Mặc định)"** (Scenario: `none`).
  * Isolation Level: **REPEATABLE READ** (Lưu ý: REPEATABLE READ chỉ khóa các dòng hiện có, không ngăn được chèn dòng mới).
  * Độ trễ lock/query: Kéo lên **5.0s**.

#### Bước 2: Thao tác gây lỗi trực tiếp trên UI
1. Vào **Admin Portal** -> Chọn tab **Quầy bán vé (Sales)**.
2. Chọn một Phim, Rạp và Ngày chiếu.
3. Click vào nút **"Tra cứu suất chiếu (Tương tranh Phantom)"** (nút màu đỏ đặc biệt kế bên tiêu đề Suất chiếu).
4. **Hành động tương tranh**:
   * Giao dịch A bắt đầu quét số suất chiếu lần 1 và treo chờ 5 giây.
   * Trong 5 giây đó, hệ thống chạy ngầm chèn thêm 1 suất chiếu "Bóng ma" lúc 20:30 (đại diện Admin B chèn thành công).
   * Hết 5 giây, giao dịch A quét lại lần 2.
5. **Hiện tượng xảy ra**:
   * Suất chiếu mới ID 999 (phòng PHANTOM) xuất hiện trên sơ đồ của A.
   * Nhật ký SQL báo lỗi Phantom Read xảy ra do số lượng bản ghi thay đổi giữa 2 lần đọc trong cùng một giao dịch.

---

### 🛡️ Cách kiểm chứng Sửa lỗi
1. Mở **Dev Panel** -> Chuyển Isolation Level sang **SERIALIZABLE**.
2. Click lại nút **"Tra cứu suất chiếu (Tương tranh Phantom)"**.
3. **Hiện tượng xảy ra**:
   * Giao dịch A quét lần 1 và áp đặt khóa phạm vi (Range Lock).
   * Tiến trình chèn suất chiếu ngầm bị **Block hoàn toàn** (không thể ghi dữ liệu).
   * Lần đọc 2 cho kết quả suất chiếu hoàn toàn nhất quán với lần 1. 

---

## 5. Khóa chết (Deadlock)

### 📌 Nguyên lý tương tranh
Khách A đặt combo 2 ghế `A1` và `A2` (khóa `A1` thành công, chờ khóa `A2`). Khách B đặt combo 2 ghế ngược lại `A2` và `A1` (khóa `A2` thành công, chờ khóa `A1`). Cả hai giữ khóa của nhau và chờ nhau vô hạn. SQL Server sẽ tự động phát hiện khóa chéo này sau 1-2 giây và chủ động hủy (Kill) một giao dịch làm nạn nhân (Deadlock Victim - Mã lỗi 1205).

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Thiết lập tham số (Dev Panel)
* Trên **cả hai màn hình A & B**:
  * Tình huống: **"Không giả lập (Mặc định)"** (Scenario: `none`).
  * Isolation Level: **READ COMMITTED**.
  * Độ trễ lock/query: Kéo lên **5.0s**.
  * **Tắt (OFF)** nút: *Sử dụng sửa lỗi (Lock Fix: OFF)*.

#### Bước 2: Thao tác gây lỗi trực tiếp trên UI
1. Trên cả 2 màn hình, cùng chọn suất chiếu **09:30 (Hall 1)** phim **Dune**.
2. **Màn hình A (Trái)**: Lần lượt click chọn ghế **A1** trước, sau đó click chọn ghế **A2** (thứ tự chọn: A1 -> A2).
3. **Màn hình B (Phải)**: Lần lượt click chọn ghế **A2** trước, sau đó click chọn ghế **A1** (thứ tự chọn: A2 -> A1).
4. Nhấn nút **"Tiếp theo"** ở cả hai màn hình. Lúc này luồng A chuẩn bị khóa A1 rồi tới A2; luồng B chuẩn bị khóa A2 rồi tới A1.
5. **Hành động tương tranh**:
   * Nhấp nút **"Xác nhận đặt vé"** ở **Màn hình A (Trái)**.
   * *Ngay lập tức* (trong vòng 1 giây), nhấp nút **"Xác nhận đặt vé"** ở **Màn hình B (Phải)**.

#### Bước 3: Hiện tượng xảy ra
* Sau khoảng 3-5 giây chờ đợi:
  * Một bên (ví dụ màn hình B) sẽ đặt vé thành công.
  * Màn hình còn lại (màn hình A) sẽ bị crash và hiển thị thông báo lỗi nổi bật màu đỏ:
    > ❌ **LỖI KHÓA CHẾT (Deadlock 1205)**: *"Giao dịch của bạn đã bị SQL Server chọn làm nạn nhân (Deadlock Victim) để giải phóng tài nguyên hệ thống do bị khóa chéo."*
  * Kiểm tra Tab **Nhật ký SQL** để thấy lỗi 1205 trực tiếp từ CSDL.

---

### 🛡️ Cách kiểm chứng Sửa lỗi
1. Mở **Dev Panel** ở cả hai bên -> Bật **"Đã áp dụng cách khắc phục"** (Hệ thống kích hoạt thuật toán sắp xếp lại danh sách ghế tăng dần theo bảng chữ cái trước khi thực hiện câu lệnh SELECT khóa).
2. Lặp lại thao tác chọn ghế: màn A chọn A1 -> A2, màn B chọn A2 -> A1. Click Xác nhận cùng lúc.
3. **Hiện tượng xảy ra**:
   * Nhờ thuật toán sắp xếp tự động, cả hai luồng A và B dưới CSDL đều thống nhất khóa `A1` trước rồi mới khóa `A2`.
   * Luồng của B sẽ bị block chờ một cách có trật tự ở bước khóa ghế `A1` thay vì khóa chéo.
   * Giao dịch A hoàn tất thành công -> Giao dịch B tiếp tục chạy và báo lỗi ghế đã bán (thay vì bị crash do khóa chết Deadlock). Hệ thống hoàn toàn an toàn và nhất quán!
