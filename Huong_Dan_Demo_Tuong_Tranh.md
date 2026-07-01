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

## 1. Mất cập nhật (Lost Update)

### 📌 Nguyên lý tương tranh
Khách A và Khách B cùng mở sơ đồ ghế và chọn cùng ghế `A5`. Khi cả hai cùng nhấn thanh toán, do không sử dụng khóa độc quyền để giữ hàng, cả hai luồng đều đọc thấy ghế trống và thực hiện chèn vé đè lên nhau.

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Gây lỗi trực tiếp trên giao diện đặt vé
1. Trên cả hai màn hình, cùng chọn phim **Dune: Part Two** -> chọn suất chiếu **09:30 (Hall 1)** ngày hôm nay.
2. Cả hai cùng click chọn ghế **A5** (ghế chuyển sang màu cam).
3. Nhấn **"Tiếp theo"** ở cả 2 bên để cùng tiến tới trang **Xác nhận đặt vé (Trang QR Thanh toán)**.
4. **Hành động click tương tranh**:
   * Click nút **"Xác nhận đặt vé"** ở **Màn hình A (Trái)**.
   * *Ngay lập tức* (trong vòng 5 giây khi giao dịch A đang xử lý), di chuột sang click nút **"Xác nhận đặt vé"** ở **Màn hình B (Phải)**.
5. **Hiện tượng**: Cả hai màn hình đều báo đặt vé **Thành công**! Tuy nhiên, khi kiểm tra CSDL, vé của B đã ghi đè và xóa mất cập nhật của A.

---

### 🛡️ Cách tiến hành Sửa lỗi (Dùng Dev Panel)
1. Trên **cả hai màn hình A & B**:
   * Mở **Dev Panel** -> Bật nút: **"Đã áp dụng cách khắc phục"** (UPDLOCK, HOLDLOCK).
2. Lặp lại các thao tác đặt trùng ghế khác (ví dụ: ghế **A6**):
   * Cả hai chọn ghế **A6** -> vào trang xác nhận QR.
   * Click **"Xác nhận đặt vé"** bên màn hình A trước.
   * Ngay sau đó, click **"Xác nhận đặt vé"** bên màn hình B.
3. **Hiện tượng sau khi sửa**:
   * Màn hình B bị xoay vòng chờ (Block) vì giao dịch của A đang giữ khóa UPDLOCK trên ghế.
   * Sau khi A hoàn tất thành công (hết 5 giây), B được tiếp tục chạy nhưng CSDL báo ghế đã bán -> Giao dịch B hiển thị lỗi: `"Ghế A6 đã bị bán trước đó. Giao dịch thất bại!"` và rollback an toàn.

---

## 2. Đọc dữ liệu rác (Dirty Read)

### 📌 Nguyên lý tương tranh
Giao dịch A đang thực hiện thanh toán mua ghế `A2` (chưa commit). Giao dịch B thực hiện đọc trạng thái sơ đồ ghế. Do B chạy dưới mức cô lập cho phép đọc dữ liệu chưa commit, B thấy ghế đã bán. Sau đó giao dịch của A bị hủy hoặc rollback, nhưng B đã đọc phải thông tin rác.

---

### 🖥️ Các bước thực hiện Demo

#### Bước 1: Gây lỗi trực tiếp trên giao diện
1. Thiết lập mức cô lập đọc rác cho Khách B: Trên **Màn hình B (Phải)**, mở **Dev Panel** -> chọn Isolation Level là **READ UNCOMMITTED**.
2. Trên cả hai màn hình, cùng chọn phim **Dune: Part Two**, suất chiếu **09:30**.
3. **Màn hình A (Trái)**: Chọn ghế **A2** -> nhấn **"Tiếp theo"** -> nhấn **"Xác nhận đặt vé"**. Giao dịch A đang thực hiện giữ ghế trong vòng 5 giây (chưa commit).
4. **Màn hình B (Phải)**: *Ngay lập tức* (trong 5 giây đó), nhấn **F5** để tải lại sơ đồ ghế.
5. **Hiện tượng**:
   * Màn hình B hiển thị ghế **A2** màu đỏ (Đã bán) vì đã đọc được dữ liệu chưa commit của A.
   * Hết 5 giây, giao dịch A gặp lỗi thanh toán hoặc bạn đóng tab (giả lập lỗi) -> Giao dịch A bị **Rollback**. Ghế `A2` thực chất vẫn trống, nhưng B đã đọc sai thông tin.

---

### 🛡️ Cách tiến hành Sửa lỗi (Dùng Dev Panel)
1. Trên **Dev Panel của màn hình B**, chuyển đổi Isolation Level về **READ COMMITTED** (mức mặc định ngăn chặn đọc rác).
2. Lặp lại thao tác đặt ghế A2 ở màn hình A.
3. Trong lúc A đang xoay vòng chờ thanh toán, màn hình B bấm F5 tải lại sơ đồ ghế.
4. **Hiện tượng sau khi sửa**:
   * Màn hình B sẽ bị treo xoay vòng chờ tải trang (Block) hoặc sơ đồ ghế chỉ hiện thị `A2` ở trạng thái **Trống** cho đến khi giao dịch của A thực sự Commit hoặc Rollback xong, ngăn ngừa hoàn toàn Dirty Read.

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
   * Giao dịch A đọc doanh thu lần 1 (ví dụ: hiển thị 10,000,000đ) và treo chờ 5 giây.
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
   * Giao dịch A quét đếm suất chiếu lần 1 và treo chờ 5 giây.
   * Trong 5 giây đó, hệ thống chạy ngầm lệnh `INSERT` thêm một suất chiếu bóng ma mới vào bảng `Showtime` (đại diện Admin B chèn thành công).
   * Hết 5 giây, giao dịch A quét lại lần 2.
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
