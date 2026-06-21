USE cinema_db;
GO

IF OBJECT_ID('Movie', 'U') IS NOT NULL DROP TABLE Movie;
CREATE TABLE Movie (
    MovieId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(250) NOT NULL,
    Duration INT NOT NULL CONSTRAINT chk_movie_duration CHECK (Duration > 0),
    CategoryId INT,
    ReleaseDate DATE,
    Poster NVARCHAR(500),
    [Status] NVARCHAR(50) CONSTRAINT chk_movie_status CHECK ([Status] IN ('now_showing', 'coming_soon', 'ended')),
    CONSTRAINT fk_movie_category FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId)
);
GO