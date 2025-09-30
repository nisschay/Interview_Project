#!/bin/bash

# AI Interview Platform - Quick Start Script

echo "🤖 AI Interview Platform - Starting..."
echo ""

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "❌ Error: .env file not found in server/ folder"
    echo ""
    echo "Please create server/.env file with:"
    echo "GEMINI_API_KEY=your_api_key_here"
    echo "PORT=3001"
    echo ""
    echo "Get your API key from: https://makersuite.google.com/app/apikey"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install backend dependencies if needed
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server
    npm install
    cd ..
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

# Install frontend dependencies if needed
if [ ! -d "interview-app/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd interview-app
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "🚀 Starting the application..."
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
cd server
node index.js &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
cd interview-app
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
