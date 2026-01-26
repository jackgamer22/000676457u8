@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: Magxxic CEO - CFO SENDER - Setup and Run Script for Windows
:: ============================================================================
:: This script will:
:: 1. Install the necessary Node.js dependencies.
:: 2. Prompt you to enter your SMTP server configurations.
:: 3. Save your settings to a .env file.
:: 4. Run the email sender application.
::
:: PREREQUISITE: You must have Node.js and npm installed on your system.
:: You can download them from https://nodejs.org/
:: ============================================================================

echo.
echo Welcome to the Magxxic CEO - CFO SENDER Setup Script!
echo This script will help you configure and run the application.
echo.

:: ----------------------------------------------------------------------------
:: 1. Install Dependencies
:: ----------------------------------------------------------------------------
echo Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: 'npm install' failed. Please make sure Node.js is installed correctly.
    pause
    exit /b %errorlevel%
)
echo Dependencies installed successfully.
echo.

:: ----------------------------------------------------------------------------
:: 2. Configure .env file
:: ----------------------------------------------------------------------------
echo Now, let's configure your SMTP settings.
echo This will create a .env file with your credentials.
echo.

:: Clear the existing .env file
if exist .env del .env

set smtp_count=1
:add_smtp_server
echo --- Adding SMTP Server #%smtp_count% ---
set /p smtp_host="Enter SMTP Host (e.g., smtp.gmail.com): "
set /p smtp_port="Enter SMTP Port (e.g., 587): "
set /p smtp_user="Enter SMTP Username (your email): "
set /p smtp_pass="Enter SMTP Password/App Password: "

echo SMTP_HOST_%smtp_count%=%smtp_host%>> .env
echo SMTP_PORT_%smtp_count%=%smtp_port%>> .env
echo SMTP_SECURE_%smtp_count%=false>> .env
echo SMTP_USER_%smtp_count%=%smtp_user%>> .env
echo SMTP_PASS_%smtp_count%=%smtp_pass%>> .env
echo.>> .env

set /p add_another="Add another SMTP server? (y/n): "
if /i "%add_another%"=="y" (
    set /a smtp_count+=1
    goto :add_smtp_server
)

echo.
echo --- Email Content Configuration ---
set /p name_magxxic="Enter the Magxxic name to display: "

echo NAME_MAGXXIC="%name_magxxic%">> .env
echo.>> .env

echo --- Sending Options ---
echo CLONE_CEO_EMAIL=true>> .env
echo.

echo Configuration saved to .env file.
echo.

:: ----------------------------------------------------------------------------
:: 3. Run the Application
:: ----------------------------------------------------------------------------
echo Starting the Magxxic CEO - CFO SENDER...
echo.
call node index.js

echo.
echo The script has finished. Press any key to exit.
pause >nul

endlocal
