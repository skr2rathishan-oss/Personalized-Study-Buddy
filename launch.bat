@echo off
REM Personalized Study Buddy - Windows Launcher
REM This script launches the entire project with backend and frontend

setlocal enabledelayedexpansion

REM Colors don't work well in batch, so we'll use text instead
echo.
echo ============================================================
echo          Personalized Study Buddy - Project Launcher
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and add it to your system PATH
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully
)

REM Activate virtual environment
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo Error: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install backend dependencies
echo.
echo Installing backend dependencies...
pip install --upgrade pip >nul 2>&1
if exist backend\requirements.txt (
    pip install -r backend\requirements.txt
    if errorlevel 1 (
        echo Warning: Failed to install some backend dependencies
    )
) else (
    echo Warning: backend\requirements.txt not found
)

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
if exist frontend (
    cd frontend
    call npm install
    if errorlevel 1 (
        echo Warning: Failed to install frontend dependencies
    )
    cd ..
) else (
    echo Warning: frontend directory not found
)

REM Check for database
echo.
echo Verifying project structure...
if exist backend\data\db.sqlite3 (
    echo Database file found
) else (
    echo Warning: Database file not found. It will be created on first run.
)

REM Train ML models (optional, can be time-consuming)
echo.
echo Training ML recommendation models (this may take a moment)...
python ml\train.py
if errorlevel 1 (
    echo Warning: ML training failed, but continuing anyway
)

REM Build frontend
echo.
echo Building frontend...
if exist frontend (
    cd frontend
    call npm run build
    if errorlevel 1 (
        echo Warning: Frontend build failed, but continuing anyway
    )
    cd ..
)

REM Display launch information
echo.
echo ============================================================
echo          PROJECT LAUNCHED SUCCESSFULLY
echo ============================================================
echo.
echo Opening application in browser...
echo.
echo Main Application:    http://localhost:5173
echo Backend API:         http://localhost:5000
echo.
echo Press CTRL+C to stop all services
echo.

REM Launch backend
cd backend
echo Starting backend server on port 5000...
start "Backend Server" python -m flask run --host=0.0.0.0 --port=5000
cd ..

REM Wait a moment for backend to start
timeout /t 2 /nobreak

REM Launch frontend
echo Starting frontend server on port 5173...
cd frontend
call npm run dev
cd ..

pause
