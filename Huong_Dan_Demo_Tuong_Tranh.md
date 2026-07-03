# Hướng dẫn Demo chi tiết các Tình huống Tương tranh (Mô phỏng Thao tác Thủ công)

Tài liệu này hướng dẫn chi tiết cách tự thao tác trực tiếp trên giao diện (giữa 2 trình duyệt song song đóng vai trò 2 khách hàng thực tế) để **tự gây ra lỗi tương tranh** và **kiểm chứng sửa lỗi** bằng SQL Server.

> [!IMPORTANT]
> **Quy tắc Demo**:
> * **Để tạo ra lỗi**: Không cần thiết lập tình huống trong Dev Panel (luôn giữ **"Tình huống tương tranh"** ở trạng thái **"Không giả lập (Mặc định)"** / Scenario: `none`). 
> * **Thao tác thủ công**: Chia đôi màn hình thành 2 cửa sổ để mô phỏng 2 người thật đặt vé cùng lúc, click chuột lần lượt trên cả 2 màn hình để tạo tương tranh vật lý dưới SQL Server.
> * **Vai trò của Dev Panel**: Chỉ mở lên khi cần **tiến hành sửa lỗi** (bằng cách chọn Isolation Level cao hơn hoặc bật nút **"Sửa lỗi" / Lock Fix**) hoặc để xem **Nhật ký SQL**.
> * **Cơ chế độ trễ**: Hệ thống đã được cấu hình mặc định độ trễ giao dịch là **5.0 giây** khi chưa được sửa lỗi, cho phép bạn thoải mái chuyển đổi giữa 2 màn hình để click thao tác tạo tương tranh.

---

## 🛠️ Chuẩn bị chung trước khi Demo

1. **Khởi động hệ thống**:
   * Nhấp đúp chuột vào file [run.bat](file:///d:/He%20Quan%20Tri%20CSDL/RDBMS/run.bat) ở thư mục gốc của dự án.
   * Đảm bảo cả máy chủ Backend (port 5000) và Frontend (port 5173/5174) đều hoạt động.

2. **Mở song song 2 trình duyệt**:
   * **Màn hình A (Trái)**: Mở trình duyệt bình thường (đại diện Khách A).
   * **Màn hình B (Phải)**: Mở một tab **Ẩn danh (Incognito)** hoặc trình duyệt khác (đại diện Khách B).
   * Cả hai bên cùng truy cập vào địa chỉ website: `http://localhost:5173`.

3. **Mở Developer Panel (Góc dưới cùng bên phải)**:
   * Click vào biểu tượng **CPU** màu đỏ ở cả hai màn hình.
   * Chuyển sang Tab **"Nhật ký SQL"** ở cả hai bên để quan sát các câu lệnh chạy thực tế dưới database dưới dạng console log thời gian thực.
   * Trong suốt quá trình gây lỗi, giữ mục **"Tình huống tương tranh"** là **"Không giả lập (Mặc định)"**.

---

## 1. Hiện tượng Lost Update (Ghi đè dữ liệu)

### 📌 Mô tả
Hiện tượng Lost Update xảy ra khi hai giao dịch cùng đọc một trạng thái dữ liệu ban đầu và cùng thực hiện cập nhật dựa trên trạng thái đó. Nếu hệ thống không có cơ chế kiểm soát tương tranh phù hợp, kết quả cập nhật của một giao dịch có thể bị giao dịch còn lại ghi đè, làm mất dữ liệu của giao dịch trước.

Trong hệ thống đặt vé xem phim, hiện tượng này có thể xảy ra khi hai khách hàng gần như đồng thời đặt cùng một ghế.

---

### 🖥️ Kịch bản xảy ra lỗi (Khi chưa sửa lỗi)

**Điều kiện**
* Có hai khách hàng: Khách A (Session 1) và Khách B (Session 2).
* Cả hai cùng chọn ghế **G10** của cùng một suất chiếu.
* Hệ thống chưa áp dụng cơ chế kiểm soát tương tranh.

**Các bước thực hiện**
1. **Hai khách cùng đọc dữ liệu**: Khách A và Khách B gần như đồng thời mở sơ đồ ghế. Hệ thống kiểm tra trạng thái ghế G10 và đều trả về: **Ghế G10 đang trống**. Cả hai giao dịch đều lưu trạng thái này vào bộ nhớ cục bộ và tiếp tục thực hiện quá trình đặt vé.
2. **Khách A bắt đầu đặt vé**: Khách A nhấn Đặt vé. Giao dịch A cập nhật thông tin đặt ghế G10 cho Khách A. Để mô phỏng hiện tượng tương tranh, hệ thống tạo một khoảng thời gian chờ 10 giây trước khi hoàn tất giao dịch.
3. **Khách B cũng đặt cùng ghế**: Trong khi giao dịch của Khách A vẫn chưa hoàn tất (đang trong 10 giây chờ), Khách B cũng nhấn Đặt vé. Do Khách B vẫn sử dụng dữ liệu đã đọc ở Bước 1 nên hệ thống tiếp tục cho rằng: **Ghế G10 vẫn còn trống**. Sau đó, giao dịch B cũng thực hiện cập nhật thông tin đặt ghế G10.
4. **Xảy ra Lost Update**: Do hệ thống không kiểm tra lại dữ liệu trước khi ghi và không có cơ chế đồng bộ giữa hai giao dịch, giao dịch của Khách B hoàn tất sau và ghi đè kết quả cập nhật của Khách A.
5. **Hậu quả**:
   * Hệ thống đều thông báo Đặt vé thành công cho cả hai khách:
     * Khách A: Đặt vé thành công.
     * Khách B: Đặt vé thành công.
   * Tuy nhiên, trong cơ sở dữ liệu: Chỉ có một vé ghế G10 được ghi nhận thuộc về khách hàng đặt sau (Khách B). Thông tin đặt vé của Khách A đã bị ghi đè và bị mất khỏi cơ sở dữ liệu.

---

### 🛡️ Giải pháp khắc phục (Dùng Dev Panel)

#### Áp dụng kỹ thuật Validation-Based Concurrency Control (Optimistic Concurrency Control)
Để ngăn chặn hiện tượng Lost Update, hệ thống áp dụng kỹ thuật xác nhận tính hợp lệ (Validation-Based Concurrency Control). Thay vì ghi dữ liệu trực tiếp xuống cơ sở dữ liệu ngay khi người dùng thực hiện thao tác, mỗi giao dịch sẽ làm việc trên một bản sao dữ liệu cục bộ. Trước khi Commit, hệ thống sẽ tiến hành kiểm tra xem dữ liệu đã bị giao dịch khác thay đổi hay chưa. Nếu phát hiện có xung đột, giao dịch sẽ bị hủy và phải thực hiện lại.

**Quy trình hoạt động sau khi sửa**
1. **Giai đoạn 1 – Read Phase**: Khách A và Khách B cùng đọc trạng thái ghế G10. Cả hai đều nhận được kết quả: **Ghế G10 đang trống**. Thông tin này chỉ được lưu trong bộ nhớ cục bộ của từng giao dịch.
2. **Giai đoạn 2 – Validation Phase**: Khi chuẩn bị Commit, hệ thống tiến hành so sánh Read Set (tập dữ liệu đã đọc) và Write Set (tập dữ liệu sẽ ghi) với các giao dịch đã Commit trước đó.
   * Giả sử giao dịch của Khách A hoàn thành trước và được xác nhận hợp lệ.
   * Giao dịch của Khách B được kiểm tra sau: Hệ thống phát hiện ghế G10 đã được Khách A cập nhật, dẫn đến dữ liệu mà Khách B đọc trước đó không còn hợp lệ. Do đó, **Validation của Khách B thất bại**.
3. **Giai đoạn 3 – Write Phase**:
   * Chỉ giao dịch của Khách A được phép ghi dữ liệu xuống cơ sở dữ liệu và Commit.
   * Giao dịch của Khách B bị **Rollback** và hệ thống yêu cầu thực hiện lại thao tác đặt vé. Khi Khách B đọc lại dữ liệu, hệ thống hiển thị: **Ghế G10 đã được đặt**. Do đó, Khách B không thể tiếp tục đặt ghế này.

**Kết quả sau khi áp dụng giải pháp**
* Chỉ một giao dịch được phép cập nhật dữ liệu.
* Không xảy ra hiện tượng ghi đè dữ liệu giữa các giao dịch.
* Dữ liệu trong cơ sở dữ liệu luôn phản ánh đúng trạng thái thực tế, ngăn chặn hiệu quả hiện tượng Lost Update.

---

## 2. Đọc dữ liệu rác (Dirty Read)

### 📌 Kịch bản minh họa Dirty Read trong CSDL

**Mục tiêu**
Minh họa hiện tượng Dirty Read khi một giao tác đọc phải dữ liệu chưa được COMMIT của một giao tác khác.

**Điều kiện**
* Có hai khách hàng: Khách A (Session 1) và Khách B (Session 2).
* Cả hai cùng chọn một ghế.
* Session 2 sử dụng mức cô lập **READ UNCOMMITTED**.

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Khách A chọn ghế
1. Khách A mở trang chọn ghế và chọn ghế **A12**.
2. Sau đó nhấn *Tiếp tục* đến trang thanh toán.
   > [!NOTE]
   > Ở bước này hệ thống chưa ghi dữ liệu xuống SQL Server, chỉ giữ thông tin ghế trên giao diện để mô phỏng quy trình thanh toán thực tế (Pending Lock).

#### Bước 2: Khách A xác nhận thanh toán (Demo Dirty Read)
1. Khách A nhấn nút: **"Tôi đã thanh toán thành công"**
2. Backend gọi Stored Procedure:
   ```sql
   EXEC usp_DirtyRead_Demo
   ```
3. Stored Procedure thực hiện:
   ```sql
   BEGIN TRANSACTION
   INSERT INTO Ticket (...)
   INSERT INTO TicketDetail (...) -- Ghế A12 được ghi vào CSDL
   WAITFOR DELAY '00:00:10' -- Transaction vẫn đang mở (chưa COMMIT)
   ```
   *(Trong khoảng 10 giây này, dữ liệu đã tồn tại trong SQL Server nhưng chưa được COMMIT)*.

#### Bước 3: Khách B đọc dữ liệu
1. Trong lúc Session 1 đang chờ (đang hiện vòng quay xử lý), tại Dev Panel của màn hình B:
   * Thiết lập Isolation Level: **READ UNCOMMITTED**
2. Khách B nhấn **F5** hoặc *Làm mới sơ đồ ghế*.
3. Hệ thống đọc dữ liệu từ SQL Server:
   * Do sử dụng `READ UNCOMMITTED`, Session 2 đọc được bản ghi `TicketDetail` chưa commit.
4. **Kết quả hiển thị**: Ghế **A12 = Đã đặt** (màu xám).

#### Bước 4: Giao dịch bị hủy (Rollback)
1. Sau khi hết thời gian chờ 10 giây, Stored Procedure thực hiện:
   ```sql
   ROLLBACK TRANSACTION;
   ```
2. Toàn bộ dữ liệu vừa `INSERT` bị hủy. Ghế **A12** trở về trạng thái **Trống**.

#### Bước 5: Khách B đọc lại
1. Khách B tiếp tục nhấn **F5**.
2. **Kết quả**: Ghế **A12 = Trống** (màu xanh).

**Kết luận**
* Trong lần đọc đầu tiên, khách B nhìn thấy **Ghế A12 = Đã đặt**.
* Nhưng sau khi giao dịch của khách A `ROLLBACK`, ghế A12 lại trở về **Ghế A12 = Trống**.
* Điều này chứng tỏ khách B đã đọc phải dữ liệu chưa được COMMIT của một giao tác khác. Đây chính là hiện tượng **Dirty Read**.

---

### 🛡️ Phiên bản sửa lỗi (READ COMMITTED)
1. Đổi Isolation Level của Session 2 thành: **READ COMMITTED**
2. Lặp lại kịch bản. Lúc này:
   * Session 2 sẽ không đọc được dữ liệu chưa commit.
   * SQL Server sẽ chờ cho đến khi Session 1 COMMIT hoặc ROLLBACK.
   * Sau khi Session 1 kết thúc:
     * Nếu **COMMIT** → ghế A12 hiển thị **Đã đặt**.
     * Nếu **ROLLBACK** → ghế A12 hiển thị **Trống**.
   * Vì Session 2 không bao giờ đọc được dữ liệu chưa commit nên Dirty Read được loại bỏ hoàn toàn.

---

## 3. Đọc không lặp lại (Non-repeatable Read)

### 📌 Nguyên lý tương tranh
Thủ quỹ A truy vấn tổng doanh thu lần 1. Trong lúc giao dịch A chưa kết thúc, Khách B thực hiện hủy/hoàn vé thành công. Thủ quỹ A truy vấn lại lần 2 trong cùng giao dịch và thấy tổng doanh thu bị thay đổi (giảm đi).

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Gây lỗi trực tiếp trên giao diện
1. Trên **Màn hình A (Trái)**, vào **Admin Portal** -> **Báo cáo Doanh thu**.
2. Nhấn nút **"Xem báo cáo (Tương tranh)"** (Giao dịch sử dụng mặc định READ COMMITTED).
3. **Hành động tương tranh**:
   * Giao dịch A đọc doanh thu lần 1 (ví dụ: hiển thị 10,000,000đ) và treo chờ 10 giây.
   * CSDL tự động kích hoạt một tiến trình nền thực hiện xóa vé mẫu `CNS_REVENUE_DEL` trị giá `1,200,000đ` (đại diện Khách B hủy vé thành công).
   * Giao dịch A thực hiện truy vấn lần 2.
4. **Hiện tượng**: Tổng doanh thu lần 2 bị **giảm đi 1,200,000đ** so với lần 1. Hệ thống hiển thị cảnh báo lỗi tương tranh không nhất quán trên Console log của trang Admin.

---

### 🛡️ Cách tiến hành Sửa lỗi (Dùng Dev Panel)
1. Trên **Dev Panel của màn hình Admin**, chuyển Isolation Level sang **REPEATABLE READ**.
2. Bấm nút **"Xem báo cáo (Tương tranh)"** lần nữa.
3. **Hiện tượng sau khi sửa**:
   * Lần đọc 1 hiển thị số tiền.
   * Tiến trình hủy vé mẫu của B cố gắng chạy nhưng bị CSDL **Block** do khóa đọc (Shared Lock) của REPEATABLE READ đang giữ chặt dòng doanh thu.
   * Lần đọc 2 cho ra kết quả **trùng khớp hoàn toàn** với lần 1.
   * Sau khi giao dịch A kết thúc, tiến trình B mới được phép hoàn tất.

---

## 4. Lỗi bóng ma (Phantom Read)

### 📌 Nguyên lý tương tranh
Khách A truy vấn danh sách suất chiếu của phim lần 1. Trong lúc đó, Admin B chèn thêm một suất chiếu mới. Khách A truy vấn lại lần 2 trong cùng giao dịch và thấy xuất hiện thêm suất chiếu mới (bóng ma).

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Gây lỗi trực tiếp trên giao diện
1. Trên **Màn hình A (Trái)**, vào **Admin Portal** -> tab **Quầy bán vé (Sales)**.
2. Chọn Phim, Rạp và Ngày chiếu.
3. Click vào nút **"Tra cứu suất chiếu (Tương tranh Phantom)"** (mức cô lập mặc định REPEATABLE READ).
4. **Hành động tương tranh**:
   * Giao dịch A quét đếm suất chiếu lần 1 và treo chờ 10 giây.
   * Trong 10 giây đó, hệ thống chạy ngầm lệnh `INSERT` thêm một suất chiếu bóng ma mới vào bảng `Showtime` (đại diện Admin B chèn thành công).
   * Hết 10 giây, giao dịch A quét lại lần 2.
5. **Hiện tượng**: Suất chiếu mới ID 999 (phòng PHANTOM) xuất hiện trên màn hình hiển thị của A. Nhật ký SQL báo lỗi Phantom Read.

---

### 🛡️ Cách tiến hành Sửa lỗi (Dùng Dev Panel)
1. Trên **Dev Panel**, chuyển đổi Isolation Level sang **SERIALIZABLE** (mức cô lập cao nhất).
2. Click lại nút **"Tra cứu suất chiếu (Tương tranh Phantom)"**.
3. **Hiện tượng sau khi sửa**:
   * Giao dịch A thực hiện áp đặt khóa phạm vi (Range Lock).
   * Tiến trình chèn suất chiếu ngầm bị CSDL **Block hoàn toàn** (treo chờ).
   * Lần đọc 2 đếm lại cho ra kết quả suất chiếu **nhất quán hoàn toàn** với lần 1. Sau khi A commit, suất chiếu mới mới được chèn vào.

---

## 5. Khóa chết (Deadlock)

### 📌 Nguyên lý tương tranh
Khách A mua ghế `A1` và `A2` (khóa `A1` trước, chờ khóa `A2`). Khách B mua cùng ghế nhưng theo thứ tự ngược lại `A2` và `A1` (khóa `A2` trước, chờ khóa `A1`). Cả hai khóa chéo nhau tạo thành vòng lặp vô hạn. SQL Server sẽ tự phát hiện và hủy (Kill) một giao dịch để giải phóng tài nguyên.

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Gây lỗi trực tiếp trên giao diện đặt vé
1. Trên cả hai màn hình, cùng chọn suất chiếu **09:30 (Hall 1)** phim **Dune: Part Two**.
2. **Màn hình A (Trái)**: Lần lượt click chọn ghế **A1** trước, sau đó click chọn ghế **A2** (thứ tự click: A1 -> A2).
3. **Màn hình B (Phải)**: Lần lượt click chọn ghế **A2** trước, sau đó click chọn ghế **A1** (thứ tự click: A2 -> A1).
4. Cả hai cùng nhấn nút **"Tiếp theo"** để vào trang **Xác nhận đặt vé (Trang QR)**.
5. **Hành động click tương tranh**:
   * Nhấp nút **"Xác nhận đặt vé"** ở **Màn hình A (Trái)**.
   * *Ngay lập tức* (trong vòng 1 giây), nhấp nút **"Xác nhận đặt vé"** ở **Màn hình B (Phải)**.

#### Bước 2: Hiện tượng xảy ra
* Sau khoảng 3 giây chờ xử lý:
  * Một màn hình đặt vé thành công.
  * Màn hình còn lại sẽ lập tức hiển thị thông báo lỗi màu đỏ nổi bật:
    > ❌ **LỖI KHÓA CHẾT (Deadlock 1205)**: *"Giao dịch của bạn đã bị SQL Server chọn làm nạn nhân của Deadlock (Error 1205) để tránh tắc nghẽn hệ thống. Giao dịch đã được rollback an toàn!"*
  * Bạn có thể mở Tab **"Nhật ký SQL"** để thấy mã lỗi 1205 được in ra.

---

### 🛡️ Cách tiến hành Sửa lỗi (Dùng Dev Panel)
1. Trên **cả hai màn hình A & B**:
   * Mở **Dev Panel** -> Bật nút: **"Đã áp dụng cách khắc phục"** (Hệ thống kích hoạt thuật toán tự động sắp xếp lại danh sách ghế chọn theo bảng chữ cái trước khi gửi câu lệnh khóa).
2. Lặp lại quy trình thao tác chọn ghế: màn A chọn A1 -> A2, màn B chọn A2 -> A1. Click Xác nhận cùng lúc ở trang QR.
3. **Hiện tượng sau khi sửa**:
   * Nhờ thuật toán sắp xếp tự động, cả hai luồng A và B dưới CSDL đều thống nhất khóa `A1` trước rồi mới khóa `A2`, loại bỏ hoàn toàn khả năng khóa chéo.
   * Giao dịch A thực hiện khóa thành công, Giao dịch B xếp hàng chờ một cách có trật tự ở ghế `A1` cho đến khi A commit xong. Không còn lỗi Deadlock xảy ra!
