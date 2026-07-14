# Start a PowerShell session in casuya-platform directory
# Update PATH to include Python site-packages for uvicorn
$env:PATH = "$env:PATH;$env:USERPROFILE\.conda\envs\base\Lib\site-packages\uvicorn;$env:USERPROFILE\.conda\envs\base\Lib\site-packages\uvicorn-0.50.0-dist-info"

# Start backend (run in PowerShell)
cd casuya-platform
python -m pip install uvicorn fastapi --quiet

# Start backend in background
$backend = Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000" -NoNewWindow -PassThru

# Start frontend (run in separate PowerShell window)
cd casuya-platform
$frontend = Start-Process -FilePath "npx" -ArgumentList "serve frontend -l 5173" -NoNewWindow -PassThru

# Wait for both processes
$backend.WaitForExit()
$frontend.WaitForExit()
