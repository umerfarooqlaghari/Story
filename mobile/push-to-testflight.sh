#!/usr/bin/env bash

# ==============================================================================
# Story Mobile - Push to Apple TestFlight Script
# Builds the iOS production release via EAS and submits it to TestFlight
# Uses App Store Connect API Key (No password/2FA required)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
BOLD='\033[1m'
NC='\033[0m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'

echo -e "${BOLD}${CYAN}====================================================${NC}"
echo -e "${BOLD}${CYAN}       Story Mobile - Push to Apple TestFlight      ${NC}"
echo -e "${BOLD}${CYAN}====================================================${NC}"

# App Store Connect API Key environment variables (bypass Apple ID / 2FA login)
export EXPO_ASC_API_KEY_PATH="$SCRIPT_DIR/AuthKey_VTVNRS996B.p8"
export EXPO_ASC_KEY_ID="VTVNRS996B"
export EXPO_ASC_ISSUER_ID="138bd8ae-ea40-4c7b-a543-2964deb4a55b"
export EXPO_APPLE_TEAM_ID="2WQ7LU7T5X"
export EXPO_APPLE_TEAM_TYPE="INDIVIDUAL"

# 1. Check EAS CLI
if ! command -v eas &>/dev/null; then
  echo -e "${YELLOW}ℹ 'eas' not found globally, using npx eas-cli...${NC}"
  EAS_BIN="npx -y eas-cli@latest"
else
  EAS_BIN="eas"
fi

# 2. Check EAS login status
echo -e "\n${YELLOW}→ Checking EAS authentication...${NC}"
if ! $EAS_BIN whoami &>/dev/null; then
  echo -e "${RED}❌ You are not logged into Expo Application Services (EAS).${NC}"
  echo -e "Please run: ${YELLOW}eas login${NC}"
  exit 1
fi

LOGGED_USER="$($EAS_BIN whoami 2>/dev/null | tail -n 1 || echo 'Logged in')"
echo -e "${GREEN}✔ Authenticated with EAS as: ${BOLD}${LOGGED_USER}${NC}"

# 3. Check API key exists
if [ ! -f "$EXPO_ASC_API_KEY_PATH" ]; then
  echo -e "${RED}❌ Error: AuthKey_VTVNRS996B.p8 not found in $SCRIPT_DIR${NC}"
  exit 1
fi

# 4. Action selection
echo -e "\n${BOLD}${CYAN}Select Action:${NC}"
echo -e "1) ${BOLD}Build & Auto-Submit to TestFlight${NC} (Recommended)"
echo -e "2) Build only (store IPA on Expo without submitting)"
echo -e "3) Submit latest existing build to TestFlight"
read -p "Select option [1-3] (Default: 1): " -r CHOICE
CHOICE="${CHOICE:-1}"

case "$CHOICE" in
  1)
    echo -e "\n${GREEN}→ Initiating iOS Production Build with Auto-Submit to TestFlight...${NC}"
    $EAS_BIN build --platform ios --profile production --auto-submit --non-interactive
    ;;
  2)
    echo -e "\n${GREEN}→ Initiating iOS Production Build...${NC}"
    $EAS_BIN build --platform ios --profile production --non-interactive
    ;;
  3)
    echo -e "\n${GREEN}→ Submitting latest existing iOS build to TestFlight...${NC}"
    $EAS_BIN submit --platform ios --profile production --latest --non-interactive
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

echo -e "\n${BOLD}${GREEN}✔ EAS task dispatched successfully!${NC}"
echo -e "Check build & submission status on your Expo Dashboard:"
echo -e "${CYAN}https://expo.dev/accounts/umer.farooq/projects/story-mobile/builds${NC}\n"
