@echo off
title MAGXXIC EMAIL SVCK3R - Setup and Start
echo ==========================================
echo    MAGXXIC EMAIL SVCK3R SETUP
echo ==========================================
echo.
echo Installing requirements...
python -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies. Make sure Python is installed and added to PATH.
    pause
    exit /b
)
echo.
echo Requirements installed successfully.
echo.
echo Starting the extractor...
python email_extractor.py
pause
