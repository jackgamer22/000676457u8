@echo off
title MAGXXIC SUITE - Master Setup
echo ==========================================
echo       MAGXXIC SUITE MASTER SETUP
echo ==========================================
echo.

:: --- Email Extractor Setup ---
echo [1/2] Setting up MAGXXICVOT Email Extractor...
cd email_extractor
python -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Python dependencies for Email Extractor.
) else (
    echo [SUCCESS] Email Extractor dependencies installed.
)
cd ..
echo.

:: --- Magxxic Sender Setup ---
if exist "magxxic-sender\" (
    echo [2/2] Setting up Magxxic Sender...
    cd magxxic-sender
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Node.js dependencies for Magxxic Sender.
    ) else (
        echo [SUCCESS] Magxxic Sender dependencies installed.
    )
    cd ..
) else (
    echo [SKIP] Magxxic Sender directory not found.
)

echo.
echo ==========================================
echo        SETUP PROCESS COMPLETED
echo ==========================================
pause
