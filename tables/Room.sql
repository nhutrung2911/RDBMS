USE cinema_db;
GO

IF OBJECT_ID('Room', 'U') IS NOT NULL DROP TABLE Room;
CREATE TABLE Room (
    RoomId INT IDENTITY(1,1) PRIMARY KEY,
    RoomName NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL CONSTRAINT chk_room_capacity CHECK (Capacity > 0),
    CinemaId INT,
    CONSTRAINT fk_room_cinema FOREIGN KEY (CinemaId) REFERENCES Cinema(CinemaId),
    CONSTRAINT UQ_Room_Cinema UNIQUE (CinemaId, RoomName)
);
GO