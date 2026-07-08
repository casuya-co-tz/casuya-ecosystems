@echo off
cd /d "C:\Users\Admin\Desktop\casuya-ecosytems\casuya-platform"
echo Starting backend on port 8000...
start "casuya-backend" python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
echo Starting frontend on port 5173...
cd frontend
start "casuya-frontend" python -m http.server 5173
cd ..
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Close this window or press any key to view status...
pause
netstat -ano | findstr ":8000 :5173"
pause
