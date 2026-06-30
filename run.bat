@echo off
title CineStar Movie Management System
echo ====================================================================
echo              KHOI DONG HE THONG CINESTAR MOVIE MANAGEMENT
echo ====================================================================
echo.
echo [Buoc 1] Kiem tra Database SQL Server...
echo Dam bao rang SQL Server instance 'localhost\MSSQLSERVER2' da duoc bat
echo va CSDL 'RDBMS' da duoc khoi tao tu file Setup.sql.
echo.

echo [Buoc 2] Dang khoi dong Backend Server tren port 5000...
start cmd /k "title CineStar Backend Server && cd backend && npm run dev"

echo [Buoc 3] Dang khoi dong Frontend Server tren port 5173...
start cmd /k "title CineStar Frontend Server && cd project && npm run dev"

echo.
echo ====================================================================
echo   KHOI DONG HOAN TAT!
echo   - Backend tu dong chay tai: http://localhost:5000
echo   - Frontend tu dong chay tai: http://localhost:5173
echo   (Trinh duyet se tu dong mo hoac ban co the truy cap link tren)
echo ====================================================================
echo.
pause
