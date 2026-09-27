@echo off
title MHP AI Platform
echo.
echo  ███╗   ███╗██╗  ██╗██████╗ 
echo  ████╗ ████║██║  ██║██╔══██╗
echo  ██╔████╔██║███████║██████╔╝
echo  ██║╚██╔╝██║██╔══██║██╔═══╝ 
echo  ██║ ╚═╝ ██║██║  ██║██║     
echo  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     
echo.
echo  Starting MHP AI Platform...
echo  URL: http://localhost:3000
echo.

SET NODE_PATH=C:\Users\Hassan\.gemini\antigravity\tools\node
SET PATH=%NODE_PATH%;%PATH%

cd /d "%~dp0"
"%NODE_PATH%\node.exe" .\node_modules\next\dist\bin\next start -p 3000

pause
