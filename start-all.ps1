Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Ecossistema Completo de Videoconferência    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Iniciar LiveKit Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- LiveKit Server ---' -ForegroundColor Green; cd '$PSScriptRoot\livekit'; .\livekit-server.exe --config livekit.yaml"

# 2. Iniciar Backend Node.js API (Porta 4000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- Backend Node.js API ---' -ForegroundColor Yellow; cd '$PSScriptRoot\server'; npm run dev"

# 3. Iniciar Backend Python AI Copilot (Porta 5001)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- Backend Python AI Copilot ---' -ForegroundColor Blue; cd '$PSScriptRoot\backend-python'; .\venv\Scripts\python.exe -m src.app"

# 4. Iniciar Frontend Expo Web (Porta 8081)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- Frontend Expo Web ---' -ForegroundColor Magenta; cd '$PSScriptRoot\frontend'; npm run web"

Write-Host "Todos os servicos foram iniciados em janelas dedicadas!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8081" -ForegroundColor White
Write-Host "Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "AI Copilot API: http://localhost:5001" -ForegroundColor White
Write-Host "LiveKit WebRTC: ws://127.0.0.1:7880" -ForegroundColor White
