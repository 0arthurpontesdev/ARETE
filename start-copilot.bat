@echo off
echo ========================================================
echo   Iniciando Backend Python AI Copilot (Porta 5001)
echo ========================================================
cd /d "%~dp0backend-python"
call venv\Scripts\activate.bat
python -m src.app
pause
