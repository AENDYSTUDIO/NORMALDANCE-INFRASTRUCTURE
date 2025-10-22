# Тест подключения к root серверу
$ServerIP = "89.104.67.165"
$Username = "root"
$Password = "Ll6DLuwyKalfvGbF"

Write-Host "🔐 Тестирование SSH подключения к root серверу $ServerIP..." -ForegroundColor Blue

# Создаем SSH команду для тестирования
$sshCommand = @"
echo 'Server access test'
uname -a
df -h /
free -h
whoami
"@

# Кодируем пароль для sshpass
$encodedPassword = [System.Text.Encoding]::UTF8.GetBytes($Password)
$base64Password = [Convert]::ToBase64String($encodedPassword)

# Пытаемся подключиться через plink (из Putty)
try {
    $result = & "plink.exe" -ssh -pw $Password -P 22 -no-antispoof $Username@$ServerIP $sshCommand 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH подключение успешно" -ForegroundColor Green
        Write-Host $result
    } else {
        Write-Host "❌ SSH подключение не удалось" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ошибка при подключении: $($_.Exception.Message)" -ForegroundColor Red
}

# Проверяем доступность сервера через ping
Write-Host "📡 Проверка доступности сервера..." -ForegroundColor Blue
try {
    $pingResult = Test-Connection -ComputerName $ServerIP -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "✅ Сервер доступен по сети" -ForegroundColor Green
    } else {
        Write-Host "❌ Сервер недоступен по сети" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ошибка при проверке доступности" -ForegroundColor Red
}