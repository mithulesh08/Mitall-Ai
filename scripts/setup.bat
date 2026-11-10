@echo off
REM =========================================================================
REM  MITALL Personal Intelligence - Windows Setup Script (setup.bat)
REM =========================================================================

echo.
echo ===================================================
echo   Setting up MITALL Personal Intelligence System
echo ===================================================
echo.

REM 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js (v18+) from https://nodejs.org
    pause
    exit /b 1
) else (
    echo [OK] Node.js is installed.
)

REM 2. Install npm dependencies
echo.
echo [1/3] Installing frontend and backend npm packages...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm packages.
    pause
    exit /b 1
)

REM 3. Check for .env file
if not exist .env (
    echo.
    echo [2/3] Creating .env file from .env.example...
    copy .env.example .env >nul
    echo Please edit .env to insert your GEMINI_API_KEY if desired.
) else (
    echo [OK] .env file already exists.
)

REM 4. Setup Python virtualenv (Optional for FastAPI backend)
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo [3/3] Setting up Python virtual environment in backend\.venv...
    if not exist backend\.venv (
        python -m venv backend\.venv
    )
    call backend\.venv\Scripts\activate.bat
    pip install -r backend\requirements.txt --quiet
    echo [OK] Python dependencies installed successfully.
) else (
    echo [NOTICE] Python was not detected. The full-stack Node.js server will be used.
)

echo.
echo ===================================================
echo   Setup Complete!
echo   Run 'start.bat' to launch MITALL.
echo ===================================================
echo.
pause
