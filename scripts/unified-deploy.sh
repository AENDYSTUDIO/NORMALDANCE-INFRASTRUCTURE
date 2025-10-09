#!/bin/bash

# ==============================================================================
# Unified Deployment Script for NORMALDANCE-Enterprise
#
# Target: Vercel
#
# This script provides a "golden path" for deploying the application to Vercel.
# It encapsulates all necessary steps, from dependency installation to final
# deployment, ensuring a consistent and reliable process.
#
# Usage:
#   ./scripts/unified-deploy.sh
#
# Prerequisites:
#   - Vercel CLI installed (`npm i -g vercel`)
#   - Environment variables set:
#     - VERCEL_TOKEN
#     - VERCEL_ORG_ID
#     - VERCEL_PROJECT_ID
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
# Color codes for logging
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Helper Functions ---
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

# --- Main Functions ---

# 1. Check for prerequisites and environment variables
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Please run 'npm i -g vercel'."
    fi

    if [ -z "$VERCEL_TOKEN" ]; then
        log_error "Environment variable VERCEL_TOKEN is not set."
    fi

    if [ -z "$VERCEL_ORG_ID" ]; then
        log_error "Environment variable VERCEL_ORG_ID is not set."
    fi

    if [ -z "$VERCEL_PROJECT_ID" ]; then
        log_error "Environment variable VERCEL_PROJECT_ID is not set."
    fi
    
    log_info "All prerequisites are met."
}

# 2. Install dependencies
install_dependencies() {
    log_info "Installing dependencies using 'npm ci'..."
    if npm ci; then
        log_info "Dependencies installed successfully."
    else
        log_error "Failed to install dependencies."
    fi
}

# 3. Build the application
build_application() {
    log_info "Building the application using 'npm run build'..."
    if npm run build; then
        log_info "Application built successfully."
    else
        log_error "Application build failed."
    fi
}

# 4. Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel for production..."
    
    # The Vercel CLI will automatically use the environment variables for token and project IDs.
    if vercel --prod --yes; then
        log_info "Deployment to Vercel initiated successfully."
        log_info "Check the Vercel dashboard for deployment status."
    else
        log_error "Vercel deployment command failed."
    fi
}


# --- Main Execution ---
main() {
    log_info "Starting Unified Vercel Deployment for NORMALDANCE-Enterprise..."
    
    check_prerequisites
    install_dependencies
    build_application
    deploy_to_vercel
    
    log_info "🎉 Deployment script finished successfully!"
}

# Run the main function
main
