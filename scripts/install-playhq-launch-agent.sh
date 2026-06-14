#!/bin/zsh
set -euo pipefail

REPO_DIR="/Users/openclawbuddy/Documents/Codex/Ethan website/ethans-site-repo"
LABEL="com.ethan.playhq-updater"
SOURCE_PLIST="$REPO_DIR/scripts/$LABEL.plist"
TARGET_DIR="$HOME/Library/LaunchAgents"
TARGET_PLIST="$TARGET_DIR/$LABEL.plist"
GUI_DOMAIN="gui/$(id -u)"

mkdir -p "$TARGET_DIR" "$REPO_DIR/logs"
cp "$SOURCE_PLIST" "$TARGET_PLIST"
chmod 644 "$TARGET_PLIST"
chmod +x "$REPO_DIR/scripts/run-weekly-playhq-update.sh"

launchctl bootout "$GUI_DOMAIN" "$TARGET_PLIST" 2>/dev/null || true
launchctl bootstrap "$GUI_DOMAIN" "$TARGET_PLIST"
launchctl enable "$GUI_DOMAIN/$LABEL"

echo "Installed $LABEL"
launchctl print "$GUI_DOMAIN/$LABEL" | sed -n '1,80p'
