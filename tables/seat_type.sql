USE cinema_db;
GO

IF OBJECT_ID('seat_type', 'U') IS NOT NULL DROP TABLE seat_type;
CREATE TABLE seat_type (
    id INT PRIMARY KEY,
    type_name NVARCHAR(50) NOT NULL UNIQUE,
    surcharge DECIMAL(18,2) DEFAULT 0
);
GO
