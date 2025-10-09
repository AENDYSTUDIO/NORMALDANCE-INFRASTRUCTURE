#!/bin/bash

# Bash script for installing and configuring AI agents for NORMALDANCE Enterprise
# This script installs the required VS Code extensions and sets up agent configurations

echo "Installing AI Agents for NORMALDANCE Enterprise..."

# Install Roo code extension
echo "Installing Roo code extension..."
code --install-extension rooveterinaryinc.roo-cline

# Install kilocode extension  
echo "Installing kilocode extension..."
code --install-extension kilocode.kilo-code

# Verify installation
echo "Verifying installations..."

# Check if extensions are installed
if code --list-extensions | grep -q "roocode.roo-code"; then
    echo "✓ Roo code extension installed successfully"
else
    echo "✗ Roo code extension installation failed"
fi

if code --list-extensions | grep -q "kilocode.kilo-code"; then
    echo "✓ kilocode extension installed successfully"
else
    echo "✗ kilocode extension installation failed"
fi

echo "AI Agent installation complete!"
echo "Please restart VS Code to activate the extensions."