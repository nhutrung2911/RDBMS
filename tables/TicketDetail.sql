USE cinema_db;
GO

IF OBJECT_ID('TicketDetail', 'U') IS NOT NULL DROP TABLE TicketDetail;
CREATE TABLE TicketDetail (
    TicketDetailId INT IDENTITY(1,1) PRIMARY KEY,
    TicketId VARCHAR(50),
    ShowtimeId INT,
    SeatId INT,
    Price DECIMAL(18,2) NOT NULL,
    CONSTRAINT fk_detail_ticket FOREIGN KEY (TicketId) REFERENCES Ticket(TicketId) ON DELETE CASCADE,
    CONSTRAINT fk_detail_showtime FOREIGN KEY (ShowtimeId) REFERENCES Showtime(ShowtimeId),
    CONSTRAINT fk_detail_seat FOREIGN KEY (SeatId) REFERENCES Seat(SeatId),
    CONSTRAINT uq_showtime_seat UNIQUE (ShowtimeId, SeatId)
);
GO