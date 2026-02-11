#!/bin/bash
# Nex v1.0.0 Dashboard Launcher
# Starts gateway and provides dashboard access info

set -e

cd "$(dirname "$0")"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           🚀 NEX v1.0.0 DASHBOARD LAUNCHER                    ║"
echo "║                                                                ║"
echo "║        Zero-Human-Code Bootstrap Foundation                   ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Parse arguments
PORT=${1:-18789}
echo "📍 Starting gateway on port $PORT..."
echo ""

# Start gateway
NEX_PORT=$PORT npx tsx nex-gateway.ts &
GATEWAY_PID=$!

# Give it time to start
sleep 3

# Check if gateway is running
if kill -0 $GATEWAY_PID 2>/dev/null; then
    echo "✅ Gateway started (PID: $GATEWAY_PID)"
    echo ""
else
    echo "❌ Gateway failed to start"
    exit 1
fi

# Display information
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   DASHBOARD READY                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Open your browser:"
echo "   file:///data/data/com.termux/files/home/Nex/dashboard.html"
echo ""
echo "📊 Or use HTTP server:"
echo "   python3 -m http.server 8000"
echo "   Then: http://localhost:8000/dashboard.html"
echo ""
echo "🔌 Gateway API:"
echo "   http://localhost:$PORT"
echo ""
echo "✨ Features:"
echo "   ✅ Real-time status monitoring"
echo "   ✅ Interactive graph executor"
echo "   ✅ Pre-built example graphs"
echo "   ✅ Live performance metrics"
echo "   ✅ Quick reference guide"
echo ""
echo "🎯 Quick Test:"
echo "   1. Open dashboard.html"
echo "   2. Click 'Simple Graph' button"
echo "   3. Click '⚡ Execute Graph'"
echo "   4. Watch results appear instantly"
echo ""
echo "📖 Documentation:"
echo "   • DASHBOARD.md — Complete guide"
echo "   • START_HERE_v1.0.0.md — Quick start"
echo "   • QUICK_REFERENCE_v1.0.0.md — API reference"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Press Ctrl+C to stop gateway                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Keep script running
trap "kill $GATEWAY_PID" EXIT INT TERM
wait $GATEWAY_PID
