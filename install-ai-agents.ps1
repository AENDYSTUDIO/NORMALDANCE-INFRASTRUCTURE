# PowerShell script for installing and configuring AI agents for NORMALDANCE Enterprise
# This script installs the required VS Code extensions and sets up agent configurations

Write-Host "Installing AI Agents for NORMALDANCE Enterprise..." -ForegroundColor Green

# Install Roo code extension
Write-Host "Installing Roo code extension..." -ForegroundColor Yellow
code --install-extension rooveterinaryinc.roo-cline

# Install kilocode extension  
Write-Host "Installing kilocode extension..." -ForegroundColor Yellow
code --install-extension kilocode.kilo-code

# Verify installation
Write-Host "Verifying installations..." -ForegroundColor Yellow

# Check if extensions are installed
$rooExtension = code --list-extensions | Select-String "roocode.roo-code"
$kiloExtension = code --list-extensions | Select-String "kilocode.kilo-code"

if ($rooExtension) {
    Write-Host "✓ Roo code extension installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Roo code extension installation failed" -ForegroundColor Red
}

if ($kiloExtension) {
    Write-Host "✓ kilocode extension installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ kilocode extension installation failed" -ForegroundColor Red
}

Write-Host "AI Agent installation complete!" -ForegroundColor Green
Write-Host "Please restart VS Code to activate the extensions." -ForegroundColor Yellow