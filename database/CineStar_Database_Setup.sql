-- ==================================================================================
-- HỆ THỐNG QUẢN LÝ ĐẶT VÉ XEM PHIM CINESTAR - HỆ QUẢN TRỊ CSDL (RDBMS)
-- KỊCH BẢN THIẾT LẬP CƠ SỞ DỮ LIỆU TOÀN DIỆN (CHƯƠNG 4)
-- Đáp ứng đầy đủ từ mục 4.1 đến 4.8 theo yêu cầu của đề tài
-- ==================================================================================

-- ----------------------------------------------------------------------------------
-- 4.1. TẠO DATABASE
-- ----------------------------------------------------------------------------------
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'RDBMS')
BEGIN
    ALTER DATABASE RDBMS SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE RDBMS;
END
GO

CREATE DATABASE RDBMS;
GO

USE RDBMS;
GO

-- ----------------------------------------------------------------------------------
-- 4.2. CÀI ĐẶT CÁC BẢNG (Category, Movie, Room, Seat, Showtime, Customer, Ticket, TicketDetail)
-- ----------------------------------------------------------------------------------

-- 4.2.1 Bảng Thể loại phim (Category)
CREATE TABLE Category (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE
);

-- 4.2.2 Bảng Phim (Movie)
CREATE TABLE Movie (
    MovieId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(250) NOT NULL,
    Duration INT NOT NULL, -- Thời lượng phim (phút)
    CategoryId INT FOREIGN KEY REFERENCES Category(CategoryId),
    ReleaseDate DATE,
    Poster NVARCHAR(500),
    [Status] NVARCHAR(50) DEFAULT 'now_showing' CHECK (Status IN ('now_showing', 'coming_soon', 'ended'))
);

-- 4.2.3 Bảng Phòng chiếu (Room)
CREATE TABLE Room (
    RoomId INT IDENTITY(1,1) PRIMARY KEY,
    RoomName NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL CHECK (Capacity > 0),
    CinemaId INT, -- Sẽ bổ sung khóa ngoại sau khi tạo bảng Cinema
    CONSTRAINT UQ_Room_Cinema UNIQUE (CinemaId, RoomName)
);

-- 4.2.3.5 Bảng Loại ghế (seat_type)
CREATE TABLE seat_type (
    id INT PRIMARY KEY,
    type_name NVARCHAR(50) NOT NULL UNIQUE,
    surcharge DECIMAL(18,2) DEFAULT 0
);

-- 4.2.4 Bảng Ghế (Seat)
CREATE TABLE Seat (
    SeatId INT IDENTITY(1,1) PRIMARY KEY,
    RoomId INT FOREIGN KEY REFERENCES Room(RoomId) ON DELETE CASCADE,
    SeatNumber VARCHAR(10) NOT NULL,
    SeatType NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES seat_type(type_name),
    CONSTRAINT UQ_Room_SeatNumber UNIQUE (RoomId, SeatNumber)
);

-- 4.2.5 Bảng Suất chiếu (Showtime)
CREATE TABLE Showtime (
    ShowtimeId INT IDENTITY(1,1) PRIMARY KEY,
    MovieId INT FOREIGN KEY REFERENCES Movie(MovieId),
    RoomId INT FOREIGN KEY REFERENCES Room(RoomId),
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    Price DECIMAL(18,2) NOT NULL CHECK (Price > 0),
    CONSTRAINT CK_Showtime_Time CHECK (EndTime > StartTime)
);

-- 4.2.6 Bảng Khách hàng (Customer)
CREATE TABLE Customer (
    CustomerId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(15) UNIQUE,
    Email VARCHAR(100) UNIQUE
);

-- 4.2.7 Bảng Hóa đơn đặt vé (Ticket)
CREATE TABLE Ticket (
    TicketId VARCHAR(50) PRIMARY KEY, -- Sử dụng String (VD: CNSXXXXX) để đồng bộ mã giao dịch
    CustomerId INT FOREIGN KEY REFERENCES Customer(CustomerId),
    BookingTime DATETIME NOT NULL DEFAULT GETDATE(),
    TotalPrice DECIMAL(18,2) DEFAULT 0,
    PaymentMethod NVARCHAR(50) DEFAULT N'Tiền mặt',
    UserEmail VARCHAR(100),
    [Status] NVARCHAR(20) NOT NULL DEFAULT N'valid' CHECK (Status IN (N'valid', N'used', N'canceled'))
);

-- 4.2.8 Bảng Chi tiết vé bán (TicketDetail)
CREATE TABLE TicketDetail (
    TicketDetailId INT IDENTITY(1,1) PRIMARY KEY,
    TicketId VARCHAR(50) FOREIGN KEY REFERENCES Ticket(TicketId) ON DELETE CASCADE,
    ShowtimeId INT FOREIGN KEY REFERENCES Showtime(ShowtimeId),
    SeatId INT FOREIGN KEY REFERENCES Seat(SeatId),
    Price DECIMAL(18,2) NOT NULL
);
GO

-- Bổ sung thực thể Rạp phim để khớp cấu trúc giao diện
CREATE TABLE Cinema (
    CinemaId INT IDENTITY(1,1) PRIMARY KEY,
    CinemaName NVARCHAR(100) NOT NULL UNIQUE,
    [Address] NVARCHAR(250),
    City NVARCHAR(100)
);

ALTER TABLE Room ADD FOREIGN KEY (CinemaId) REFERENCES Cinema(CinemaId);
GO

-- NẠP DỮ LIỆU MẪU (SEED DATA)
INSERT INTO Category (CategoryName) VALUES 
(N'Hành động (Action)'), (N'Viễn tưởng (Sci-Fi)'), (N'Phiêu lưu (Adventure)'),
(N'Hoạt hình (Animation)'), (N'Hài hước (Comedy)'), (N'Kinh dị (Horror)'),
(N'Giật gân (Thriller)'), (N'Tâm lý (Drama)'), (N'Siêu anh hùng (Superhero)');

INSERT INTO Movie (Title, Duration, CategoryId, ReleaseDate, Status) VALUES
(N'Xứ Cát: Phần Hai (Dune: Part Two)', 166, 2, '2026-06-05', 'now_showing'),
(N'Godzilla x Kong: Đế Chế Mới', 115, 1, '2026-06-10', 'now_showing'),
(N'Kung Fu Panda 4', 94, 4, '2026-06-07', 'now_showing'),
(N'Nội Chiến (Civil War)', 109, 8, '2026-06-12', 'now_showing'),
(N'Người Đóng Thế (The Fall Guy)', 126, 5, '2026-06-14', 'now_showing'),
(N'Những Mảnh Ghép Cảm Xúc 2 (Inside Out 2)', 100, 4, '2026-06-18', 'coming_soon'),
(N'Deadpool & Wolverine', 127, 9, '2026-06-29', 'coming_soon'),
(N'Alien: Romulus', 119, 6, '2026-07-15', 'coming_soon');

INSERT INTO Cinema (CinemaName, Address, City) VALUES
(N'CGV Vincom Center', N'72 Lê Thánh Tôn, Q.1', N'TP. Hồ Chí Minh'),
(N'CGV Aeon Mall Tân Phú', N'30 Bờ Bao Tân Thắng, Q. Tân Phú', N'TP. Hồ Chí Minh'),
(N'CGV Landmark 81', N'208 Nguyễn Hữu Cảnh, Q. Bình Thạnh', N'TP. Hồ Chí Minh'),
(N'CGV Vincom Bà Triệu', N'191 Bà Triệu, Q. Hai Bà Trưng', N'Hà Nội');

INSERT INTO Room (RoomName, Capacity, CinemaId) VALUES 
(N'Hall 1 (IMAX)', 120, 1),
(N'Hall 2 (Standard)', 120, 1),
(N'Hall A', 120, 2),
(N'Hall B', 120, 2);
GO

-- Thêm Loại ghế (seat_type)
INSERT INTO seat_type (id, type_name, surcharge) VALUES 
(1, N'Standard', 0.00),
(2, N'VIP', 50000.00),
(3, N'Sweetbox', 100000.00);
GO

-- Tự động sinh danh sách ghế (120 ghế/phòng: 10 hàng A->J, 12 cột)
DECLARE @RoomId INT;
DECLARE @RowChar CHAR(1);
DECLARE @ColInt INT;
DECLARE @SeatType NVARCHAR(50);
DECLARE @SeatNumber VARCHAR(10);

DECLARE RoomCursor CURSOR FOR SELECT RoomId FROM Room;
OPEN RoomCursor;
FETCH NEXT FROM RoomCursor INTO @RoomId;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @RowIdx INT = 1;
    WHILE @RowIdx <= 10
    BEGIN
        SET @RowChar = SUBSTRING('ABCDEFGHIJ', @RowIdx, 1);
        IF @RowChar = 'J' SET @SeatType = 'Sweetbox';
        ELSE IF @RowChar IN ('F', 'G', 'H') SET @SeatType = 'VIP';
        ELSE SET @SeatType = 'Standard';

        SET @ColInt = 1;
        WHILE @ColInt <= 12
        BEGIN
            SET @SeatNumber = @RowChar + CAST(@ColInt AS VARCHAR(2));
            INSERT INTO Seat (RoomId, SeatNumber, SeatType) VALUES (@RoomId, @SeatNumber, @SeatType);
            SET @ColInt = @ColInt + 1;
        END
        SET @RowIdx = @RowIdx + 1;
    END
    FETCH NEXT FROM RoomCursor INTO @RoomId;
END
CLOSE RoomCursor;
DEALLOCATE RoomCursor;
GO

INSERT INTO Showtime (MovieId, RoomId, StartTime, EndTime, Price) VALUES
(1, 1, '2026-06-15 09:30:00', '2026-06-15 12:16:00', 130000.00),
(1, 2, '2026-06-15 12:15:00', '2026-06-15 15:01:00', 90000.00),
(1, 1, '2026-06-15 18:30:00', '2026-06-15 21:16:00', 130000.00);

INSERT INTO Customer (FullName, Phone, Email) VALUES
(N'Như Trung', '0901234567', 'nguyennhutrung788@gmail.com'),
(N'Nguyễn Khách Hàng', '0923456789', 'customer@gmail.com'),
(N'Nguyễn Văn B', '0123456789', 'customer2@gmail.com');
GO

-- Thêm hóa đơn đặc biệt dùng cho kịch bản báo cáo tương tranh (Non-repeatable Read / Phantom)
IF NOT EXISTS (SELECT 1 FROM Ticket WHERE TicketId = 'CNS_REVENUE_DEL')
BEGIN
    INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status) VALUES
    ('CNS_REVENUE_DEL', 1, '2026-06-15 10:00:00', 1200000.00, N'Tiền mặt', 'nguyennhutrung788@gmail.com', N'valid');

    INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price) VALUES
    ('CNS_REVENUE_DEL', 1, 1, 1200000.00);
END
GO


-- ----------------------------------------------------------------------------------
-- 4.3. XÂY DỰNG CÁC VIEW
-- ----------------------------------------------------------------------------------

-- 4.3.1. Khung nhìn hiển thị sơ đồ ghế theo suất chiếu (Trống/Đã bán)
CREATE VIEW v_ShowtimeSeats AS 
SELECT 
    st.ShowtimeId,
    st.MovieId,
    m.Title AS MovieTitle,
    st.RoomId,
    r.RoomName,
    s.SeatId,
    s.SeatNumber,
    s.SeatType,
    CASE 
        WHEN td.TicketDetailId IS NOT NULL AND t.Status != N'canceled' THEN N'SOLD'
        ELSE N'AVAILABLE'
    END AS Status 
FROM Showtime st 
JOIN Room r ON st.RoomId = r.RoomId 
JOIN Seat s ON r.RoomId = s.RoomId 
JOIN Movie m ON st.MovieId = m.MovieId 
LEFT JOIN TicketDetail td ON st.ShowtimeId = td.ShowtimeId AND s.SeatId = td.SeatId 
LEFT JOIN Ticket t ON td.TicketId = t.TicketId;
GO

-- 4.3.2. Khung nhìn hiển thị doanh thu theo phim
CREATE VIEW v_RevenueByMovie AS
SELECT 
    m.MovieId,
    m.Title AS MovieTitle,
    c.CategoryName,
    COUNT(DISTINCT td.TicketDetailId) AS TicketsSold,
    SUM(CASE WHEN t.TicketId IS NOT NULL THEN td.Price ELSE 0 END) AS TotalRevenue
FROM Movie m
LEFT JOIN Category c ON m.CategoryId = c.CategoryId
LEFT JOIN Showtime st ON m.MovieId = st.MovieId
LEFT JOIN TicketDetail td ON st.ShowtimeId = td.ShowtimeId
LEFT JOIN Ticket t ON td.TicketId = t.TicketId AND t.Status != N'canceled'
GROUP BY m.MovieId, m.Title, c.CategoryName;
GO


-- ----------------------------------------------------------------------------------
-- 4.4. XÂY DỰNG CÁC FUNCTION
-- ----------------------------------------------------------------------------------

-- 4.4.1. Hàm tính tổng tiền vé của một hóa đơn
CREATE FUNCTION fn_CalculateInvoice (@TicketId VARCHAR(50))
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @Total DECIMAL(18,2);
    SELECT @Total = SUM(Price) FROM TicketDetail WHERE TicketId = @TicketId;
    RETURN ISNULL(@Total, 0);
END;
GO

-- 4.4.2. Hàm đếm số ghế trống của một suất chiếu
CREATE FUNCTION fn_CountEmptySeats (@ShowtimeId INT)
RETURNS INT
AS
BEGIN
    DECLARE @TotalSeats INT;
    DECLARE @BookedSeats INT;
    
    SELECT @TotalSeats = Room.Capacity
    FROM Showtime
    INNER JOIN Room ON Showtime.RoomId = Room.RoomId
    WHERE Showtime.ShowtimeId = @ShowtimeId;
    
    SELECT @BookedSeats = COUNT(td.TicketDetailId)
    FROM TicketDetail td
    INNER JOIN Ticket t ON td.TicketId = t.TicketId
    WHERE td.ShowtimeId = @ShowtimeId AND t.Status != N'canceled';
    
    RETURN ISNULL(@TotalSeats, 0) - ISNULL(@BookedSeats, 0);
END;
GO


-- ----------------------------------------------------------------------------------
-- 4.5. XÂY DỰNG CÁC STORED PROCEDURE (CRUD & Nghiệp vụ)
-- ----------------------------------------------------------------------------------

-- 4.5.1 Thêm phim mới (usp_AddMovie)
CREATE PROCEDURE usp_AddMovie
    @Title NVARCHAR(250), @Duration INT, @CategoryId INT, @ReleaseDate DATE, @Poster NVARCHAR(500), @Status NVARCHAR(50), @MovieId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Movie (Title, Duration, CategoryId, ReleaseDate, Poster, Status)
    VALUES (@Title, @Duration, @CategoryId, @ReleaseDate, @Poster, @Status);
    SET @MovieId = SCOPE_IDENTITY();
END;
GO

-- 4.5.2 Sửa thông tin phim
CREATE PROCEDURE usp_UpdateMovie
    @MovieId INT, @Title NVARCHAR(250), @Duration INT, @CategoryId INT, @ReleaseDate DATE, @Poster NVARCHAR(500), @Status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Movie 
    SET Title = @Title, Duration = @Duration, CategoryId = @CategoryId, ReleaseDate = @ReleaseDate, Poster = @Poster, Status = @Status
    WHERE MovieId = @MovieId;
END;
GO

-- 4.5.3 Xóa phim
CREATE PROCEDURE usp_DeleteMovie
    @MovieId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Movie WHERE MovieId = @MovieId;
END;
GO

-- 4.5.4 Tìm kiếm phim (usp_SearchMovie)
CREATE PROCEDURE usp_SearchMovie
    @Keyword NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT m.MovieId, m.Title, m.Duration, c.CategoryName, m.ReleaseDate, m.Poster, m.Status
    FROM Movie m
    LEFT JOIN Category c ON m.CategoryId = c.CategoryId
    WHERE m.Title LIKE '%' + @Keyword + '%' OR c.CategoryName LIKE '%' + @Keyword + '%';
END;
GO

-- 4.5.5 Thêm suất chiếu mới (usp_AddShowtime)
CREATE PROCEDURE usp_AddShowtime
    @MovieId INT, @RoomId INT, @StartTime DATETIME, @EndTime DATETIME, @Price DECIMAL(18,2), @ShowtimeId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Showtime (MovieId, RoomId, StartTime, EndTime, Price)
    VALUES (@MovieId, @RoomId, @StartTime, @EndTime, @Price);
    SET @ShowtimeId = SCOPE_IDENTITY();
END;
GO

-- 4.5.6 Sửa thông tin suất chiếu
CREATE PROCEDURE usp_UpdateShowtime
    @ShowtimeId INT, @MovieId INT, @RoomId INT, @StartTime DATETIME, @EndTime DATETIME, @Price DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Showtime 
    SET MovieId = @MovieId, RoomId = @RoomId, StartTime = @StartTime, EndTime = @EndTime, Price = @Price
    WHERE ShowtimeId = @ShowtimeId;
END;
GO

-- 4.5.7 Xóa suất chiếu
CREATE PROCEDURE usp_DeleteShowtime
    @ShowtimeId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Showtime WHERE ShowtimeId = @ShowtimeId;
END;
GO

-- 4.5.8 Tìm kiếm suất chiếu (usp_SearchShowtime)
CREATE PROCEDURE usp_SearchShowtime
    @MovieId INT = NULL, @RoomId INT = NULL, @Date DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT st.ShowtimeId, m.Title AS MovieTitle, r.RoomName, st.StartTime, st.EndTime, st.Price
    FROM Showtime st
    JOIN Movie m ON st.MovieId = m.MovieId
    JOIN Room r ON st.RoomId = r.RoomId
    WHERE (@MovieId IS NULL OR st.MovieId = @MovieId)
      AND (@RoomId IS NULL OR st.RoomId = @RoomId)
      AND (@Date IS NULL OR CAST(st.StartTime AS DATE) = @Date);
END;
GO

-- 4.5.9 Đặt vé cơ bản (Gọi trong nghiệp vụ bình thường)
CREATE PROCEDURE usp_BookTicket
    @TicketId VARCHAR(50), @CustomerId INT, @ShowtimeId INT, @SeatNumbers VARCHAR(MAX), @UserEmail VARCHAR(100), @TotalPrice DECIMAL(18,2), @PaymentMethod NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status)
        VALUES (@TicketId, @CustomerId, GETDATE(), @TotalPrice, @PaymentMethod, @UserEmail, N'valid');

        -- Tách danh sách ghế để thêm chi tiết vé
        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
        SELECT @TicketId, @ShowtimeId, s.SeatId, @TotalPrice / (SELECT COUNT(*) FROM STRING_SPLIT(@SeatNumbers, ','))
        FROM STRING_SPLIT(@SeatNumbers, ',')
        INNER JOIN Seat s ON s.SeatNumber = value AND s.RoomId = (SELECT RoomId FROM Showtime WHERE ShowtimeId = @ShowtimeId);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 4.5.10 Hủy vé đặt
CREATE PROCEDURE usp_CancelTicket
    @TicketId VARCHAR(50)
AS
BEGIN
    UPDATE Ticket SET Status = N'canceled' WHERE TicketId = @TicketId;
END;
GO

-- 4.5.11 Xem chi tiết hóa đơn đặt vé
CREATE PROCEDURE usp_GetTicketDetails
    @TicketId VARCHAR(50)
AS
BEGIN
    SELECT t.TicketId, c.FullName, t.BookingTime, m.Title, td.Price, s.SeatNumber, t.Status
    FROM Ticket t
    INNER JOIN Customer c ON t.CustomerId = c.CustomerId
    INNER JOIN TicketDetail td ON t.TicketId = td.TicketId
    INNER JOIN Seat s ON td.SeatId = s.SeatId
    INNER JOIN Showtime sh ON td.ShowtimeId = sh.ShowtimeId
    INNER JOIN Movie m ON sh.MovieId = m.MovieId
    WHERE t.TicketId = @TicketId;
END;
GO


-- ----------------------------------------------------------------------------------
-- 4.6. XÂY DỰNG CÁC TRIGGER
-- ----------------------------------------------------------------------------------

-- 4.6.1. Bẫy lỗi bán trùng ghế (trg_PreventDoubleBooking)
CREATE TRIGGER trg_PreventDoubleBooking 
ON TicketDetail 
INSTEAD OF INSERT 
AS 
BEGIN     
    SET NOCOUNT ON;     
    IF EXISTS (         
        SELECT 1          
        FROM inserted i         
        JOIN TicketDetail td ON i.ShowtimeId = td.ShowtimeId AND i.SeatId = td.SeatId         
        JOIN Ticket t ON td.TicketId = t.TicketId         
        WHERE t.Status != N'canceled'     
    )     
    BEGIN         
        RAISERROR(N'Lỗi hệ thống: Ghế này đã được khách hàng khác đặt mua thành công cho suất chiếu này!', 16, 1);         
        ROLLBACK TRANSACTION;         
        RETURN;     
    END     
    INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)     
    SELECT TicketId, ShowtimeId, SeatId, Price     
    FROM inserted; 
END; 
GO

-- 4.6.2. Bẫy lỗi trùng lịch chiếu (trg_PreventOverlappingShowtimes)
CREATE TRIGGER trg_PreventOverlappingShowtimes  
ON Showtime  
FOR INSERT, UPDATE  
AS  
BEGIN          
    SET NOCOUNT ON;      
    -- Kiểm tra sự trùng lặp thời gian trong cùng một phòng
    -- Loại trừ chính khóa chính đang sửa (ShowtimeId) để tránh tự trùng lặp khi UPDATE
    IF EXISTS (                  
        SELECT 1                   
        FROM inserted i                  
        JOIN Showtime s ON i.RoomId = s.RoomId AND i.ShowtimeId != s.ShowtimeId                  
        WHERE i.StartTime < s.EndTime AND i.EndTime > s.StartTime          
    )          
    BEGIN                  
        RAISERROR(N'Lỗi hệ thống: Phòng chiếu này đang có lịch chiếu khác hoạt động trong khoảng thời gian được chọn!', 16, 1);                  
        ROLLBACK TRANSACTION;                  
        RETURN;          
    END  
END;  
GO


-- ----------------------------------------------------------------------------------
-- 4.7. XÁC ĐỊNH TÌNH HUỐNG TRANH CHẤP & 4.8. XỬ LÝ TRANH CHẤP
-- ----------------------------------------------------------------------------------

-- ==================================================================================
-- 4.7.1. MẤT DỮ LIỆU CẬP NHẬT (Lost Update) & 4.8.1. SỬA LỖI (OCC / VALIDATION)
-- ==================================================================================

-- [LỖI] SP Đặt vé gây Lost Update (Không dùng khóa giữ dòng)
CREATE PROCEDURE usp_BookTicket_LostUpdate_Conflict
    @TicketId VARCHAR(50), @CustomerId INT, @ShowtimeId INT, @SeatNumbers VARCHAR(MAX), @UserEmail VARCHAR(100), @TotalPrice DECIMAL(18,2), @PaymentMethod NVARCHAR(50), @LatencyMs INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED; -- Chạy dưới mức cô lập thông thường
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra TicketId đã tồn tại chưa
        IF EXISTS (SELECT 1 FROM Ticket WHERE TicketId = @TicketId)
            THROW 50004, N'TicketId đã tồn tại.', 1;

        -- Lấy RoomId tương ứng của suất chiếu
        DECLARE @RoomId INT;
        SELECT @RoomId = RoomId FROM Showtime WHERE ShowtimeId = @ShowtimeId;

        -- Kiểm tra các ghế có tồn tại trong phòng không
        IF EXISTS (
            SELECT 1 FROM STRING_SPLIT(@SeatNumbers, ',') 
            WHERE value NOT IN (SELECT SeatNumber FROM Seat WHERE RoomId = @RoomId)
        )
            THROW 50001, N'Một hoặc nhiều ghế được chọn không tồn tại.', 1;

        -- Tách chuỗi ghế thành bảng tạm
        DECLARE @SeatsTable TABLE (SeatNumber VARCHAR(10), SeatId INT);
        INSERT INTO @SeatsTable (SeatNumber, SeatId)
        SELECT value, s.SeatId FROM STRING_SPLIT(@SeatNumbers, ',')
        INNER JOIN Seat s ON s.SeatNumber = value AND s.RoomId = @RoomId;

        -- KIỂM TRA TRẠNG THÁI GHẾ KHÔNG KHÓA (Giao tác khác đọc thấy TRỐNG và ghi đè sau đó)
        IF EXISTS (
            SELECT 1 FROM TicketDetail td
            JOIN Ticket t ON td.TicketId = t.TicketId
            WHERE td.ShowtimeId = @ShowtimeId AND td.SeatId IN (SELECT SeatId FROM @SeatsTable) AND t.Status != N'canceled'
        )
        BEGIN
            THROW 50003, N'Ghế đã có người đặt thành công trước đó!', 1;
        END

        -- Giả lập độ trễ giao dịch
        IF @LatencyMs > 0
        BEGIN
            DECLARE @DelayStr CHAR(12);
            SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
            WAITFOR DELAY @DelayStr;
        END

        -- Thực hiện đặt vé (Có thể ghi đè/Lost Update nếu 2 khách chạy cùng lúc)
        INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status)
        VALUES (@TicketId, @CustomerId, GETDATE(), @TotalPrice, @PaymentMethod, @UserEmail, N'valid');

        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
        SELECT @TicketId, @ShowtimeId, SeatId, @TotalPrice / (SELECT COUNT(*) FROM @SeatsTable)
        FROM @SeatsTable;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- [SỬA LỖI] SP Đặt vé chống Lost Update bằng cơ chế Khóa bi quan (Pessimistic Locking - UPDLOCK, HOLDLOCK)
CREATE PROCEDURE usp_BookTicket_LostUpdate_Fixed
    @TicketId VARCHAR(50), @CustomerId INT, @ShowtimeId INT, @SeatNumbers VARCHAR(MAX), @UserEmail VARCHAR(100), @TotalPrice DECIMAL(18,2), @PaymentMethod NVARCHAR(50), @LatencyMs INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra TicketId đã tồn tại chưa
        IF EXISTS (SELECT 1 FROM Ticket WHERE TicketId = @TicketId)
            THROW 50004, N'TicketId đã tồn tại.', 1;

        -- Lấy RoomId tương ứng của suất chiếu
        DECLARE @RoomId INT;
        SELECT @RoomId = RoomId FROM Showtime WHERE ShowtimeId = @ShowtimeId;

        -- Kiểm tra các ghế có tồn tại trong phòng không
        IF EXISTS (
            SELECT 1 FROM STRING_SPLIT(@SeatNumbers, ',') 
            WHERE value NOT IN (SELECT SeatNumber FROM Seat WHERE RoomId = @RoomId)
        )
            THROW 50001, N'Một hoặc nhiều ghế được chọn không tồn tại.', 1;

        DECLARE @SeatsTable TABLE (SeatNumber VARCHAR(10), SeatId INT);
        INSERT INTO @SeatsTable (SeatNumber, SeatId)
        SELECT value, s.SeatId FROM STRING_SPLIT(@SeatNumbers, ',')
        INNER JOIN Seat s ON s.SeatNumber = value AND s.RoomId = @RoomId;

        -- 1. READ & LOCK PHASE: ĐỌC VÀ KHÓA GHẾ BẰNG UPDLOCK, HOLDLOCK
        -- Khóa các dòng tương ứng trong bảng Seat để chặn các giao dịch đặt trùng ghế đồng thời
        DECLARE @LockSeatId INT;
        SELECT @LockSeatId = SeatId 
        FROM Seat WITH (UPDLOCK, HOLDLOCK)
        WHERE SeatId IN (SELECT SeatId FROM @SeatsTable);

        -- Kiểm tra xem ghế đã được đặt và thanh toán bởi giao dịch khác chưa
        IF EXISTS (
            SELECT 1 FROM TicketDetail td
            JOIN Ticket t ON td.TicketId = t.TicketId
            WHERE td.ShowtimeId = @ShowtimeId AND td.SeatId IN (SELECT SeatId FROM @SeatsTable) AND t.Status != N'canceled'
        )
        BEGIN
            THROW 50003, N'Ghế đã có người đặt thành công trước đó!', 1;
        END

        -- Giả lập độ trễ giao dịch
        IF @LatencyMs > 0
        BEGIN
            DECLARE @DelayStr CHAR(12);
            SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
            WAITFOR DELAY @DelayStr;
        END

        -- 2. WRITE PHASE: GHI DỮ LIỆU (Đã có khóa bảo vệ nên không cần bước Validation)
        INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status)
        VALUES (@TicketId, @CustomerId, GETDATE(), @TotalPrice, @PaymentMethod, @UserEmail, N'valid');

        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
        SELECT @TicketId, @ShowtimeId, SeatId, @TotalPrice / (SELECT COUNT(*) FROM @SeatsTable)
        FROM @SeatsTable;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO


-- ==================================================================================
-- 4.7.2. ĐỌC DỮ LIỆU RÁC (Dirty Read) & 4.8.2. SỬA LỖI (READ COMMITTED)
-- ==================================================================================

-- [LỖI] Giả lập Dirty Read: Đọc khi giao tác đặt vé khác chưa Commit
CREATE PROCEDURE usp_GetSeatStatus_DirtyRead_Conflict
    @ShowtimeId INT, @SeatNumber VARCHAR(10)
AS
BEGIN
    -- Thiết lập mức cô lập cho phép đọc dữ liệu chưa commit
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
    BEGIN TRANSACTION;
    
    -- Trả về trạng thái ghế (Có thể đọc phải trạng thái 'SOLD' tạm thời)
    SELECT * FROM v_ShowtimeSeats 
    WHERE ShowtimeId = @ShowtimeId AND SeatNumber = @SeatNumber;
    
    COMMIT TRANSACTION;
END;
GO

-- [SỬA LỖI] Chống Dirty Read bằng mức cô lập READ COMMITTED
CREATE PROCEDURE usp_GetSeatStatus_DirtyRead_Fixed
    @ShowtimeId INT, @SeatNumber VARCHAR(10)
AS
BEGIN
    -- Chỉ được phép đọc dữ liệu đã commit
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    BEGIN TRANSACTION;
    
    SELECT * FROM v_ShowtimeSeats 
    WHERE ShowtimeId = @ShowtimeId AND SeatNumber = @SeatNumber;
    
    COMMIT TRANSACTION;
END;
GO


-- [GIẢ LẬP] Giao tác đặt vé để minh họa Dirty Read
CREATE PROCEDURE usp_DirtyRead_Demo
    @TicketId VARCHAR(20),
    @CustomerId INT,
    @ShowtimeId INT,
    @SeatId INT,
    @Price DECIMAL(18,2),
    @LatencyMs INT = 10000,
    @ShouldRollback BIT = 1
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Thêm hóa đơn vé tạm thời
        INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, Status)
        VALUES (@TicketId, @CustomerId, GETDATE(), @Price, N'MoMo', N'valid');
        
        -- Thêm chi tiết vé tạm thời cho ghế
        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
        VALUES (@TicketId, @ShowtimeId, @SeatId, @Price);
        
        -- Giả lập độ trễ giao dịch chưa commit
        DECLARE @DelayStr CHAR(12);
        SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
        WAITFOR DELAY @DelayStr;
        
        IF @ShouldRollback = 1
        BEGIN
            ROLLBACK TRANSACTION;
        END
        ELSE
        BEGIN
            COMMIT TRANSACTION;
        END
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO


-- ==================================================================================
-- 4.7.3. ĐỌC KHÔNG LẶP LẠI (Non-repeatable Read) & 4.8.3. SỬA LỖI (REPEATABLE READ)
-- ==================================================================================

-- [LỖI] Tính doanh thu bị thay đổi giữa chừng (Do có giao tác hủy vé commit xen vào)
CREATE PROCEDURE usp_GetRevenue_NonRepeatableRead_Conflict
    @StartDate DATETIME, @EndDate DATETIME, @LatencyMs INT = 0
AS
BEGIN
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    BEGIN TRANSACTION;
    
    -- Lần đọc 1
    SELECT SUM(TotalPrice) AS FirstRead FROM Ticket WHERE BookingTime BETWEEN @StartDate AND @EndDate AND Status != N'canceled';

    IF @LatencyMs > 0
    BEGIN
        DECLARE @DelayStr CHAR(12);
        SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
        WAITFOR DELAY @DelayStr;
    END

    -- Lần đọc 2 (Có thể cho kết quả khác Lần đọc 1 vì dữ liệu đã bị thay đổi)
    SELECT SUM(TotalPrice) AS SecondRead FROM Ticket WHERE BookingTime BETWEEN @StartDate AND @EndDate AND Status != N'canceled';
    
    COMMIT TRANSACTION;
END;
GO

-- [SỬA LỖI] Chống Đọc không lặp lại bằng Giao thức nhãn thời gian cơ bản (Basic TO)
CREATE PROCEDURE usp_GetRevenue_NonRepeatableRead_Fixed
    @StartDate DATETIME, @EndDate DATETIME, @LatencyMs INT = 0
AS
BEGIN
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED; -- Chạy dưới READ COMMITTED để cho phép ghi xen vào
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Lần đọc 1 (Đọc dữ liệu và ghi nhận làm nhãn đọc)
        DECLARE @FirstRead DECIMAL(18,2);
        SELECT @FirstRead = SUM(TotalPrice) FROM Ticket WHERE BookingTime BETWEEN @StartDate AND @EndDate AND Status != N'canceled';
        
        SELECT @FirstRead AS FirstRead;

        IF @LatencyMs > 0
        BEGIN
            DECLARE @DelayStr CHAR(12);
            SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
            WAITFOR DELAY @DelayStr;
        END

        -- Lần đọc 2
        DECLARE @SecondRead DECIMAL(18,2);
        SELECT @SecondRead = SUM(TotalPrice) FROM Ticket WHERE BookingTime BETWEEN @StartDate AND @EndDate AND Status != N'canceled';

        -- PHA XÁC THỰC NHÃN THỜI GIAN:
        -- Nếu dữ liệu bị thay đổi bởi giao dịch trẻ hơn, giao dịch cũ (Older) bị từ chối đọc và ROLLBACK
        IF ISNULL(@FirstRead, 0) != ISNULL(@SecondRead, 0)
        BEGIN
            THROW 50005, N'LỖI XUNG ĐỘT NHÃN THỜI GIAN (Timestamp Ordering): Dữ liệu đã bị sửa đổi bởi giao dịch trẻ hơn. Giao tác bị ROLLBACK.', 1;
        END

        SELECT @SecondRead AS SecondRead;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO


-- ==================================================================================
-- 4.7.4. LỖI BÓNG MA (Phantom) & 4.8.4. SỬA LỖI (SERIALIZABLE)
-- ==================================================================================

-- [LỖI] Xuất hiện suất chiếu "Bóng ma" (Do giao tác Admin INSERT thêm suất chiếu commit xen vào)
CREATE PROCEDURE usp_GetShowtimes_Phantom_Conflict
    @MovieId INT, @LatencyMs INT = 0
AS
BEGIN
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; -- REPEATABLE READ chỉ khóa dòng hiện tại, không khóa chèn dòng mới
    BEGIN TRANSACTION;
    
    -- Lần đọc 1
    SELECT COUNT(*) AS ShowtimesCount1 FROM Showtime WHERE MovieId = @MovieId;

    IF @LatencyMs > 0
    BEGIN
        DECLARE @DelayStr CHAR(12);
        SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
        WAITFOR DELAY @DelayStr;
    END

    -- Lần đọc 2 (Số lượng suất chiếu có thể tăng thêm do bóng ma xen vào)
    SELECT COUNT(*) AS ShowtimesCount2 FROM Showtime WHERE MovieId = @MovieId;
    
    COMMIT TRANSACTION;
END;
GO

-- [SỬA LỖI] Chống lỗi bóng ma bằng Giao thức Khóa 2 giai đoạn nghiêm ngặt (Strict 2PL)
CREATE PROCEDURE usp_GetShowtimes_Phantom_Fixed
    @MovieId INT, @LatencyMs INT = 0
AS
BEGIN
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; -- Kích hoạt Strict 2PL để ngăn chặn dữ liệu xen vào
    BEGIN TRANSACTION;
    
    SELECT COUNT(*) AS ShowtimesCount1 FROM Showtime WHERE MovieId = @MovieId;

    IF @LatencyMs > 0
    BEGIN
        DECLARE @DelayStr CHAR(12);
        SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
        WAITFOR DELAY @DelayStr;
    END

    SELECT COUNT(*) AS ShowtimesCount2 FROM Showtime WHERE MovieId = @MovieId;
    
    COMMIT TRANSACTION;
END;
GO


-- ==================================================================================
-- 4.7.5. KHÓA CHẾT (Deadlock) & 4.8.5. SỬA LỖI (SẮP XẾP THỨ TỰ TRUY CẬP)
-- ==================================================================================

-- [LỖI] Đặt combo 2 ghế gây Deadlock (Khi 2 khách hàng chọn ghế theo thứ tự ngược nhau)
CREATE PROCEDURE usp_BookComboSeats_Deadlock_Conflict
    @TicketId VARCHAR(50), @CustomerId INT, @ShowtimeId INT, @Seat1 VARCHAR(10), @Seat2 VARCHAR(10), @TotalPrice DECIMAL(18,2), @LatencyMs INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra TicketId đã tồn tại chưa
        IF EXISTS (SELECT 1 FROM Ticket WHERE TicketId = @TicketId)
            THROW 50004, N'TicketId đã tồn tại.', 1;

        -- Lấy RoomId tương ứng của suất chiếu
        DECLARE @RoomId INT;
        SELECT @RoomId = RoomId FROM Showtime WHERE ShowtimeId = @ShowtimeId;

        -- Lấy SeatId tương ứng
        DECLARE @SeatId1 INT, @SeatId2 INT;
        SELECT @SeatId1 = SeatId FROM Seat WHERE SeatNumber = @Seat1 AND RoomId = @RoomId;
        SELECT @SeatId2 = SeatId FROM Seat WHERE SeatNumber = @Seat2 AND RoomId = @RoomId;

        -- Kiểm tra ghế có tồn tại không
        IF @SeatId1 IS NULL
            THROW 50001, N'Ghế thứ nhất không tồn tại.', 1;
        IF @SeatId2 IS NULL
            THROW 50002, N'Ghế thứ hai không tồn tại.', 1;

        -- Tạo hóa đơn Ticket trước làm khóa ngoại cho TicketDetail
        INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, Status)
        VALUES (@TicketId, @CustomerId, GETDATE(), @TotalPrice, N'Momo', N'valid');

        -- Bước 1: Chèn ghế thứ nhất (Sẽ giữ khóa độc quyền X trên row mới chèn của TicketDetail)
        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
        VALUES (@TicketId, @ShowtimeId, @SeatId1, @TotalPrice/2);

        -- Giả lập độ trễ giữa 2 bước chèn để tạo điều kiện khóa chéo
        IF @LatencyMs > 0
        BEGIN
            DECLARE @DelayStr CHAR(12);
            SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
            WAITFOR DELAY @DelayStr;
        END

        -- Bước 2: Chèn ghế thứ hai
        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
        VALUES (@TicketId, @ShowtimeId, @SeatId2, @TotalPrice/2);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- [SỬA LỖI] Đặt combo ghế phòng chống Deadlock bằng giao thức Wait-Die
-- (Nếu giao dịch già hơn, cho phép Wait. Nếu giao dịch trẻ hơn, ép buộc Die bằng cách set Lock Timeout = 0)
CREATE PROCEDURE usp_BookComboSeats_Deadlock_Fixed
    @TicketId VARCHAR(50), @CustomerId INT, @ShowtimeId INT, @Seat1 VARCHAR(10), @Seat2 VARCHAR(10), @TotalPrice DECIMAL(18,2), @LatencyMs INT = 0, @DeadlockPriority NVARCHAR(20) = N'NORMAL'
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    
    -- Áp dụng giao thức Wait-Die (Mô phỏng qua Lock Timeout)
    -- Giả sử @DeadlockPriority = 'HIGH' là giao dịch ĐẾN TRƯỚC (Già hơn)
    -- Giả sử @DeadlockPriority = 'LOW' là giao dịch ĐẾN SAU (Trẻ hơn)
    IF @DeadlockPriority = N'HIGH'
        SET LOCK_TIMEOUT -1; -- Già hơn -> Wait (Chờ vô hạn)
    ELSE IF @DeadlockPriority = N'LOW'
        SET LOCK_TIMEOUT 0;  -- Trẻ hơn -> Die (Chết/Hủy ngay lập tức nếu có tranh chấp)
    ELSE
        SET LOCK_TIMEOUT -1;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra TicketId đã tồn tại chưa
        IF EXISTS (SELECT 1 FROM Ticket WHERE TicketId = @TicketId)
            THROW 50004, N'TicketId đã tồn tại.', 1;

        -- Lấy RoomId tương ứng của suất chiếu
        DECLARE @RoomId INT;
        SELECT @RoomId = RoomId FROM Showtime WHERE ShowtimeId = @ShowtimeId;

        -- Lấy SeatId tương ứng
        DECLARE @SeatId1 INT, @SeatId2 INT;
        SELECT @SeatId1 = SeatId FROM Seat WHERE SeatNumber = @Seat1 AND RoomId = @RoomId;
        SELECT @SeatId2 = SeatId FROM Seat WHERE SeatNumber = @Seat2 AND RoomId = @RoomId;

        -- Kiểm tra ghế có tồn tại không
        IF @SeatId1 IS NULL
            THROW 50001, N'Ghế thứ nhất không tồn tại.', 1;
        IF @SeatId2 IS NULL
            THROW 50002, N'Ghế thứ hai không tồn tại.', 1;

        -- Tạo hóa đơn Ticket trước làm khóa ngoại cho TicketDetail
        INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, Status)
        VALUES (@TicketId, @CustomerId, GETDATE(), @TotalPrice, N'Momo', N'valid');

        -- Bước 1: Chèn ghế thứ nhất (Sẽ giữ khóa độc quyền X trên row mới chèn của TicketDetail)
        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
        VALUES (@TicketId, @ShowtimeId, @SeatId1, @TotalPrice/2);

        IF @LatencyMs > 0
        BEGIN
            DECLARE @DelayStr CHAR(12);
            SET @DelayStr = '00:00:' + RIGHT('00' + CAST(@LatencyMs/1000 AS VARCHAR(2)), 2) + '.' + RIGHT('000' + CAST(@LatencyMs%1000 AS VARCHAR(3)), 3);
            WAITFOR DELAY @DelayStr;
        END

        -- Bước 2: Chèn ghế thứ hai
        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
        VALUES (@TicketId, @ShowtimeId, @SeatId2, @TotalPrice/2);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

