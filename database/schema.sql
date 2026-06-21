-- Kịch bản khởi tạo cơ sở dữ liệu CineStar RDBMS
-- Tích hợp cơ chế kiểm thử tương tranh (Lost Update, Deadlock, Dirty Read)

-- 1. Tạo bảng Thể loại phim (Category)
CREATE TABLE Category (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE
);

-- 2. Tạo bảng Phim (Movie)
CREATE TABLE Movie (
    MovieId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(250) NOT NULL,
    Duration INT NOT NULL, -- Thời lượng phim (phút)
    CategoryId INT FOREIGN KEY REFERENCES Category(CategoryId),
    ReleaseDate DATE,
    Poster NVARCHAR(500),
    Status NVARCHAR(50) DEFAULT 'now_showing' CHECK (Status IN ('now_showing', 'coming_soon', 'ended'))
);

-- 3. Tạo bảng Rạp chiếu phim (Cinema)
CREATE TABLE Cinema (
    CinemaId INT IDENTITY(1,1) PRIMARY KEY,
    CinemaName NVARCHAR(100) NOT NULL UNIQUE,
    Address NVARCHAR(250),
    City NVARCHAR(100)
);

-- 4. Tạo bảng Phòng chiếu (Room)
CREATE TABLE Room (
    RoomId INT IDENTITY(1,1) PRIMARY KEY,
    RoomName NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL CHECK (Capacity > 0),
    CinemaId INT FOREIGN KEY REFERENCES Cinema(CinemaId),
    CONSTRAINT UQ_Room_Cinema UNIQUE (CinemaId, RoomName)
);

-- 4.5 Tạo bảng Loại ghế (seat_type)
CREATE TABLE seat_type (
    id INT PRIMARY KEY,
    type_name NVARCHAR(50) NOT NULL UNIQUE,
    surcharge DECIMAL(18,2) DEFAULT 0
);

-- 5. Tạo bảng Thiết kế ghế trong phòng (Seat)
CREATE TABLE Seat (
    SeatId INT IDENTITY(1,1) PRIMARY KEY,
    RoomId INT FOREIGN KEY REFERENCES Room(RoomId) ON DELETE CASCADE,
    SeatNumber VARCHAR(10) NOT NULL,
    SeatType NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES seat_type(type_name),
    CONSTRAINT UQ_Room_SeatNumber UNIQUE (RoomId, SeatNumber)
);

-- 6. Tạo bảng Suất chiếu (Showtime)
CREATE TABLE Showtime (
    ShowtimeId INT IDENTITY(1,1) PRIMARY KEY,
    MovieId INT FOREIGN KEY REFERENCES Movie(MovieId),
    RoomId INT FOREIGN KEY REFERENCES Room(RoomId),
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    Price DECIMAL(18,2) NOT NULL CHECK (Price > 0),
    CONSTRAINT CK_Showtime_Time CHECK (EndTime > StartTime)
);

-- 7. Tạo bảng Khách hàng (Customer)
CREATE TABLE Customer (
    CustomerId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Phone VARCHAR(15) UNIQUE,
    Email VARCHAR(100) UNIQUE
);

-- 8. Tạo bảng Hóa đơn đặt vé (Ticket)
CREATE TABLE Ticket (
    TicketId VARCHAR(50) PRIMARY KEY, -- Sử dụng String (VD: CNSXXXXX) để đồng bộ với định danh giao dịch
    CustomerId INT FOREIGN KEY REFERENCES Customer(CustomerId),
    BookingTime DATETIME NOT NULL DEFAULT GETDATE(),
    TotalPrice DECIMAL(18,2) DEFAULT 0,
    PaymentMethod NVARCHAR(50) DEFAULT N'Tiền mặt',
    UserEmail VARCHAR(100), -- Email của account đang đăng nhập (phục vụ phân hệ Supabase/Mock Auth)
    Status NVARCHAR(20) NOT NULL DEFAULT N'valid' CHECK (Status IN (N'valid', N'used', N'canceled'))
);

-- 9. Tạo bảng Chi tiết vé bán (TicketDetail)
CREATE TABLE TicketDetail (
    TicketDetailId INT IDENTITY(1,1) PRIMARY KEY,
    TicketId VARCHAR(50) FOREIGN KEY REFERENCES Ticket(TicketId) ON DELETE CASCADE,
    ShowtimeId INT FOREIGN KEY REFERENCES Showtime(ShowtimeId),
    SeatId INT FOREIGN KEY REFERENCES Seat(SeatId),
    Price DECIMAL(18,2) NOT NULL
);
GO

-- 10. Tạo Khung nhìn (View) để tra cứu trạng thái ghế ngồi theo thời gian thực của suất chiếu
-- Giúp Backend kiểm tra trạng thái ghế 'AVAILABLE' hoặc 'SOLD' dễ dàng mà không làm thay đổi luồng xử lý chính
CREATE VIEW v_ShowtimeSeats AS
SELECT 
    sh.ShowtimeId,
    s.SeatId,
    s.SeatNumber,
    s.SeatType,
    CASE 
        WHEN td.TicketDetailId IS NOT NULL AND t.Status != N'canceled' THEN 'SOLD'
        ELSE 'AVAILABLE'
    END AS Status
FROM Showtime sh
INNER JOIN Seat s ON sh.RoomId = s.RoomId
LEFT JOIN TicketDetail td ON sh.ShowtimeId = td.ShowtimeId AND s.SeatId = td.SeatId
LEFT JOIN Ticket t ON td.TicketId = t.TicketId;
GO
