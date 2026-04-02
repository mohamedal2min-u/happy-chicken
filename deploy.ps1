# Configuration (Change if needed)
$DASHBOARD_USER = "maa"
$DASHBOARD_HOST = "ch.alamin.se"
$DASHBOARD_PATH = "/home/maa/htdocs/ch.alamin.se"

$API_USER = "alamin-api"
$API_HOST = "api.alamin.se"
$API_PATH = "/home/alamin-api/htdocs/api.alamin.se"

Write-Host "--- Starting Deployment Process ---" -ForegroundColor Cyan

# 1. Update Backend (CORS config)
Write-Host "[1/3] Uploading Backend updates (CORS)..." -ForegroundColor Yellow
scp backend/config/cors.php ${API_USER}@${API_HOST}:${API_PATH}/config/cors.php

# 2. Build Dashboard locally
Write-Host "[2/3] Building Dashboard locally..." -ForegroundColor Yellow
Set-Location dashboard
npm run build
Set-Location ..

# 3. Upload Dashboard to server
Write-Host "[3/3] Uploading Dashboard files..." -ForegroundColor Yellow

# Upload .next folder (main build)
Write-Host "--- Uploading .next directory ---"
scp -r dashboard/.next ${DASHBOARD_USER}@${DASHBOARD_HOST}:${DASHBOARD_PATH}/

# Check if public folder exists before uploading
if (Test-Path "dashboard/public") {
    Write-Host "--- Uploading public directory ---"
    scp -r dashboard/public ${DASHBOARD_USER}@${DASHBOARD_HOST}:${DASHBOARD_PATH}/
} else {
    Write-Host "--- Skipping public directory (not found) ---" -ForegroundColor Gray
}

# Upload package.json and next.config files
scp dashboard/package.json dashboard/next.config.mjs ${DASHBOARD_USER}@${DASHBOARD_HOST}:${DASHBOARD_PATH}/

Write-Host "`nDONE! System updated successfully." -ForegroundColor Green
Write-Host "Note: If you still see 'Permission Denied', you may need to run 'chown -R $DASHBOARD_USER' on the server." -ForegroundColor Gray
