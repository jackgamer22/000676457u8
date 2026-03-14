@echo off
title MAGXXICVOT Email Extractor - Setup
echo ==========================================
echo    MAGXXICVOT EMAIL EXTRACTOR SETUP
echo ==========================================
echo.

echo Setting up Python dependencies...
cd email_extractor
python -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies. Make sure Python is installed and added to PATH.
    pause
    exit /b
)
cd ..

echo.
echo ==========================================
echo        SETUP PROCESS COMPLETED
echo ==========================================
pause
