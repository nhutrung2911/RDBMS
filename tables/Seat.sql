USE cinema_db;
GO

IF OBJECT_ID('Seat', 'U') IS NOT NULL DROP TABLE Seat;
CREATE TABLE Seat (
    SeatId INT IDENTITY(1,1) PRIMARY KEY,
    RoomId INT,
    SeatNumber VARCHAR(10) NOT NULL,
    SeatType NVARCHAR(50) NOT NULL,
    CONSTRAINT fk_seat_room FOREIGN KEY (RoomId) REFERENCES Room(RoomId) ON DELETE CASCADE,
    CONSTRAINT fk_seat_type FOREIGN KEY (SeatType) REFERENCES seat_type(type_name),
    CONSTRAINT UQ_Room_SeatNumber UNIQUE (RoomId, SeatNumber)
);
GO