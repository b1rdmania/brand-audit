#!/bin/bash
# Deploy a brand audit report to Vercel
# Usage: ./scripts/deploy.sh willow-leather

set -e

SLUG=$1

if [ -z "$SLUG" ]; then
  echo "Usage: ./scripts/deploy.sh <slug>"
  echo "Example: ./scripts/deploy.sh willow-leather"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="${PROJECT_DIR}/reports/${SLUG}"

if [ ! -f "${REPORT_DIR}/audit-report.html" ]; then
  echo "Error: ${REPORT_DIR}/audit-report.html not found"
  exit 1
fi

# Ensure public directory and vercel.json exist
mkdir -p "${REPORT_DIR}/public"

if [ ! -f "${REPORT_DIR}/vercel.json" ]; then
  echo '{"buildCommand": null, "outputDirectory": "public"}' > "${REPORT_DIR}/vercel.json"
fi

# Copy report to public
cp "${REPORT_DIR}/audit-report.html" "${REPORT_DIR}/public/index.html"

# Deploy
echo "Deploying ${SLUG}..."
cd "${REPORT_DIR}" && vercel --yes --prod --name "${SLUG}-audit" 2>&1

echo ""
echo "Live at: https://${SLUG}-audit.vercel.app"
