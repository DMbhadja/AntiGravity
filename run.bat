@echo off
title NexusEMS - Full Stack Launcher
echo ========================================================
echo   Launching NexusEMS (Angular + Spring Boot + MySQL)
echo ========================================================
echo.

echo 1. Launching Spring Boot Backend (Port 8080)...
start "NexusEMS Backend" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run"

echo 2. Launching Angular Frontend (Port 4200)...
start "NexusEMS Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================================
echo   Both services are launching in separate windows!
echo   - Backend API : http://localhost:8080/api/employees
echo   - Frontend App: http://localhost:4200
echo ========================================================
pause
