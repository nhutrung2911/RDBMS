USE cinema_db;
GO

IF OBJECT_ID('Showtime', 'U') IS NOT NULL DROP TABLE Showtime;
CREATE TABLE Showtime (
    ShowtimeId INT IDENTITY(1,1) PRIMARY KEY,
    MovieId INT,
    RoomId INT,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    Price DECIMAL(18,2) NOT NULL CONSTRAINT chk_showtime_price CHECK (Price > 0),
    CONSTRAINT chk_showtime_times CHECK (EndTime > StartTime),
    CONSTRAINT fk_showtime_movie FOREIGN KEY (MovieId) REFERENCES Movie(MovieId),
    CONSTRAINT fk_showtime_room FOREIGN KEY (RoomId) REFERENCES Room(RoomId)
);
GO