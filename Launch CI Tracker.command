#!/bin/bash
cd "$(dirname "$0")"

# Start server if not already running on port 8765
if ! lsof -i :8765 | grep -q LISTEN; then
    python3 -m http.server 8765 &>/dev/null &
    sleep 1
fi

# Open the app in the browser
open http://localhost:8765
