@echo off
echo 🔧 Installing required tools for NORMAL DANCE deployment...

REM Check if Chocolatey is installed
where choco >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Chocolatey...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
)

REM Install kubectl
echo Installing kubectl...
choco install kubernetes-cli -y

REM Install Helm
echo Installing Helm...
choco install kubernetes-helm -y

REM Install Docker Desktop
echo Installing Docker Desktop...
choco install docker-desktop -y

echo ✅ Tools installation completed!
echo Please restart your terminal and run: scripts\deploy-production.bat