#!/bin/bash
# Start HTTP server and open dashboard

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║         NEX v1.0.0 DASHBOARD LAUNCHER                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Starting HTTP server on port 8000..."
echo ""

cd /data/data/com.termux/files/home/Nex

# Start Python HTTP server in background
python3 -m http.server 8000 &
SERVER_PID=$!

sleep 2

echo "✅ HTTP Server running (PID: $SERVER_PID)"
echo ""
echo "📍 Open in browser:"
echo "   http://localhost:8000/dashboard.html"
echo ""
echo "🌐 Gateway is responding on:"
echo "   http://localhost:7777/health"
echo "   http://localhost:18789/health"
echo ""
echo "🎯 Once dashboard loads:"
echo "   1. You'll see 'Gateway: Online ●'"
echo "   2. Click 'Simple Graph' button"
echo "   3. Click '⚡ Execute Graph'"
echo "   4. See instant results"
echo ""
echo "Press Ctrl+C to stop server"
echo ""

# Keep server running
wait $SERVER_PID
