-- Kịch bản nhập dữ liệu mẫu (Seed Data) cho dự án CineStar RDBMS
-- Chạy kịch bản này sau khi đã thực thi thành công file schema.sql

USE RDBMS; -- Đảm bảo sử dụng đúng cơ sở dữ liệu của bạn
GO

-- 1. Thêm Thể loại phim
INSERT INTO Category (CategoryName) VALUES 
(N'Hành động (Action)'),
(N'Viễn tưởng (Sci-Fi)'),
(N'Phiêu lưu (Adventure)'),
(N'Hoạt hình (Animation)'),
(N'Hài hước (Comedy)'),
(N'Kinh dị (Horror)'),
(N'Giật gân (Thriller)'),
(N'Tâm lý (Drama)'),
(N'Siêu anh hùng (Superhero)');
GO

-- 2. Thêm Danh sách phim mẫu
INSERT INTO Movie (Title, Duration, CategoryId, ReleaseDate, Status) VALUES
(N'Xứ Cát: Phần Hai (Dune: Part Two)', 166, 2, '2026-06-05', 'now_showing'),
(N'Godzilla x Kong: Đế Chế Mới', 115, 1, '2026-06-10', 'now_showing'),
(N'Kung Fu Panda 4', 94, 4, '2026-06-07', 'now_showing'),
(N'Nội Chiến (Civil War)', 109, 8, '2026-06-12', 'now_showing'),
(N'Người Đóng Thế (The Fall Guy)', 126, 5, '2026-06-14', 'now_showing'),
(N'Những Mảnh Ghép Cảm Xúc 2 (Inside Out 2)', 100, 4, '2026-06-18', 'coming_soon'),
(N'Deadpool & Wolverine', 127, 9, '2026-06-29', 'coming_soon'),
(N'Alien: Romulus', 119, 6, '2026-07-15', 'coming_soon');
GO

-- 3. Thêm Danh sách Rạp phim
INSERT INTO Cinema (CinemaName, Address, City) VALUES
(N'CGV Vincom Center', N'72 Lê Thánh Tôn, Q.1', N'TP. Hồ Chí Minh'),
(N'CGV Aeon Mall Tân Phú', N'30 Bờ Bao Tân Thắng, Q. Tân Phú', N'TP. Hồ Chí Minh'),
(N'CGV Landmark 81', N'208 Nguyễn Hữu Cảnh, Q. Bình Thạnh', N'TP. Hồ Chí Minh'),
(N'CGV Vincom Bà Triệu', N'191 Bà Triệu, Q. Hai Bà Trưng', N'Hà Nội'),
(N'CGV Royal City', N'72A Nguyễn Trãi, Q. Thanh Xuân', N'Hà Nội'),
(N'CGV Vincom Đà Nẵng', N'910A Ngô Quyền, Q. Sơn Trà', N'Đà Nẵng');
GO

-- 4. Thêm Phòng chiếu cho các Rạp
-- CGV Vincom Center (CinemaId = 1)
INSERT INTO Room (RoomName, Capacity, CinemaId) VALUES 
(N'Hall 1 (IMAX)', 120, 1),
(N'Hall 2 (Standard)', 120, 1),
(N'Hall 3 (4DX)', 120, 1);

-- CGV Aeon Mall Tân Phú (CinemaId = 2)
INSERT INTO Room (RoomName, Capacity, CinemaId) VALUES 
(N'Hall A', 120, 2),
(N'Hall B', 120, 2);

-- CGV Landmark 81 (CinemaId = 3)
INSERT INTO Room (RoomName, Capacity, CinemaId) VALUES 
(N'Hall X', 120, 3),
(N'Hall Y', 120, 3);
GO

-- 4.5 Thêm Loại ghế (seat_type)
INSERT INTO seat_type (id, type_name, surcharge) VALUES 
(1, N'Standard', 0.00),
(2, N'VIP', 50000.00),
(3, N'Sweetbox', 100000.00);
GO

-- 5. Tự động sinh danh sách ghế (Seat) cho từng phòng chiếu bằng T-SQL Loop
-- Thiết kế phòng chuẩn gồm: 10 hàng (A -> J), mỗi hàng 12 ghế = 120 ghế/phòng
-- Hàng J: Sweetbox (Couple)
-- Hàng F, G, H: VIP
-- Các hàng khác: Standard
DECLARE @RoomId INT;
DECLARE @RowChar CHAR(1);
DECLARE @ColInt INT;
DECLARE @SeatType NVARCHAR(20);
DECLARE @SeatNumber VARCHAR(10);

-- Con trỏ duyệt qua tất cả các phòng đã tạo
DECLARE RoomCursor CURSOR FOR 
SELECT RoomId FROM Room;

OPEN RoomCursor;
FETCH NEXT FROM RoomCursor INTO @RoomId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Vòng lặp các hàng từ A đến J
    DECLARE @RowIdx INT = 1;
    WHILE @RowIdx <= 10
    BEGIN
        SET @RowChar = SUBSTRING('ABCDEFGHIJ', @RowIdx, 1);
        
        -- Xác định loại ghế dựa vào hàng
        IF @RowChar = 'J'
            SET @SeatType = 'Sweetbox'; -- Hàng cuối là Sweetbox/Couple
        ELSE IF @RowChar IN ('F', 'G', 'H')
            SET @SeatType = 'VIP'; -- Hàng giữa là VIP
        ELSE
            SET @SeatType = 'Standard';

        -- Vòng lặp cột ghế từ 1 đến 12
        SET @ColInt = 1;
        WHILE @ColInt <= 12
        BEGIN
            SET @SeatNumber = @RowChar + CAST(@ColInt AS VARCHAR(2));
            
            INSERT INTO Seat (RoomId, SeatNumber, SeatType) 
            VALUES (@RoomId, @SeatNumber, @SeatType);
            
            SET @ColInt = @ColInt + 1;
        END

        SET @RowIdx = @RowIdx + 1;
    END

    FETCH NEXT FROM RoomCursor INTO @RoomId;
END

CLOSE RoomCursor;
DEALLOCATE RoomCursor;
GO

-- 6. Thêm các Suất chiếu mẫu (Showtime)
-- Lấy MovieId = 1 (Xứ Cát: Phần Hai), RoomId = 1 (Hall 1 của CGV Vincom Center)
INSERT INTO Showtime (MovieId, RoomId, StartTime, EndTime, Price) VALUES
(1, 1, '2026-06-15 09:30:00', '2026-06-15 12:16:00', 130000.00), -- Suất IMAX
(1, 2, '2026-06-15 12:15:00', '2026-06-15 15:01:00', 90000.00),  -- Suất Standard
(1, 3, '2026-06-15 15:00:00', '2026-06-15 17:46:00', 150000.00), -- Suất 4DX
(1, 1, '2026-06-15 18:30:00', '2026-06-15 21:16:00', 130000.00), -- Suất IMAX tối
(2, 2, '2026-06-15 10:30:00', '2026-06-15 12:25:00', 90000.00);  -- Godzilla x Kong
GO

PRINT 'Hoàn tất nhập dữ liệu mẫu thành công!';
GO
