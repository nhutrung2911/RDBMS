USE cinema_db;
GO

IF OBJECT_ID('Ticket', 'U') IS NOT NULL DROP TABLE Ticket;
CREATE TABLE Ticket (
    TicketId VARCHAR(50) PRIMARY KEY,
    CustomerId INT,
    BookingTime DATETIME NOT NULL DEFAULT GETDATE(),
    TotalPrice DECIMAL(18,2),
    PaymentMethod NVARCHAR(50),
    UserEmail VARCHAR(100),
    [Status] NVARCHAR(20) NOT NULL CONSTRAINT chk_ticket_status CHECK ([Status] IN ('valid', 'used', 'canceled')),
    CONSTRAINT fk_ticket_customer FOREIGN KEY (CustomerId) REFERENCES Customer(CustomerId)
);
GO