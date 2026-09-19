@echo off
title NexusEMS - Stop Application
echo Stopping all running instances of NexusEMS (Backend on 8080 & Frontend on 4200)...

powershell -Command "Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force; Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"

echo.
echo Both Spring Boot (8080) and Angular (4200) have been stopped.
pause
