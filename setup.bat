@echo off
title Telegram Email Bot Setup

:: Check for Node.js
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in the PATH.
    echo Please install Node.js and try again.
    pause
    exit /b
)

:: Check for npm
echo Checking for npm...
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo npm is not installed or not in the PATH.
    echo Please install npm and try again.
    pause
    exit /b
)

echo.
echo Installing dependencies...
npm install

echo.
echo Creating configuration files if they do not exist...

:: Create .env file
if not exist .env (
    echo TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN > .env
    echo TELEGRAM_USER_ID=YOUR_TELEGRAM_USER_ID >> .env
)

:: Create config.json file
if not exist config.json (
    (
        echo {
        echo     "from_emails": [
        echo         "example.sender1@yourdomain.com",
        echo         "example.sender2@yourdomain.com"
        echo     ],
        echo     "subjects": [
        echo         "Your weekly update",
        echo         "A special offer for you"
        echo     ],
        echo     "smtp_settings": [
        echo         {
        echo             "host": "smtp1.example.com",
        echo             "port": 587,
        echo             "secure": false,
        echo             "auth": {
        echo                 "user": "your_smtp_user1",
        echo                 "pass": "your_smtp_password1"
        echo             }
        echo         }
        echo     ]
        echo }
    ) > config.json
)

echo.
echo =================================================================
echo  Setup Complete!
echo.
echo  Please edit the following files to configure the bot:
echo   - .env (for your Telegram Bot Token and User ID)
echo   - config.json (for your SMTP settings)
echo =================================================================
echo.
echo Opening the configuration files in Notepad...
start notepad .env
start notepad config.json

pause
