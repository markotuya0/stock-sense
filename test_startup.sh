#!/bin/bash
# Quick startup script for testing StockSense Phases 1-4

set -e

echo "🚀 StockSense Test Startup"
echo "=========================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "   Please create .env with required credentials"
    exit 1
fi

# Backend setup
echo ""
echo "📦 Backend Setup..."

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "✓ Virtual environment activated"

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Frontend setup
echo ""
echo "📦 Frontend Setup..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install -q
fi

echo "✓ Frontend dependencies ready"

# Build frontend
echo "Building frontend..."
npm run build -q 2>/dev/null || npm run build
echo "✓ Frontend built"

cd ..

# Display next steps
echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo ""
echo "Terminal 1 - Start Backend (port 8000):"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "Terminal 2 - Start Frontend (port 5173):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "📝 Testing Guide: See TESTING_GUIDE.md"
echo ""
echo "🔗 URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
