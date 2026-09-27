@echo off
title MHP AI Platform (Dev Mode)
echo.
echo  MHP - Development Mode (Hot Reload)
echo  URL: http://localhost:3000
echo.

SET NODE_PATH=C:\Users\Hassan\.gemini\antigravity\tools\node
SET PATH=%NODE_PATH%;%PATH%

cd /d "%~dp0"
"%NODE_PATH%\node.exe" .\node_modules\next\dist\bin\next dev -p 3000

pause
