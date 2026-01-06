@echo off
REM Run backend server with correct Python interpreter
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

REM Activate virtual environment
call ..\.venv\Scripts\activate.bat

REM Check Python
echo Checking Python environment...
python --version
echo.

REM Check google.genai
echo Checking google.genai...
python -c "import google.genai; print('✅ google.genai available')" 2>nul || (
    echo ❌ google.genai not found!
    echo Installing google-genai...
    pip install google-genai --upgrade
)

echo.
echo Starting server...
echo.

REM Run server
python -m uvicorn main_ai:app --host 0.0.0.0 --port 8000 --reload

pause

