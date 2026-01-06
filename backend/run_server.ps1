# Run backend server with correct Python interpreter
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Activate virtual environment
$venvPath = "..\.venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    & $venvPath
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Virtual environment not found at: $venvPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Checking Python environment..." -ForegroundColor Cyan
python --version
Write-Host ""

# Check google.genai
Write-Host "Checking google.genai..." -ForegroundColor Cyan
try {
    python -c "import google.genai; print('✅ google.genai available')"
} catch {
    Write-Host "❌ google.genai not found!" -ForegroundColor Red
    Write-Host "Installing google-genai..." -ForegroundColor Yellow
    pip install google-genai --upgrade
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host ""

# Run server
python -m uvicorn main_ai:app --host 0.0.0.0 --port 8000 --reload

