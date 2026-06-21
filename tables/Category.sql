USE cinema_db;
GO

IF OBJECT_ID('Category', 'U') IS NOT NULL DROP TABLE Category;
CREATE TABLE Category (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE
);
GO