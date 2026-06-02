#!/usr/bin/env bash

echo "================================"
echo "Society Management System Setup"
echo "================================"
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✓ Node.js installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✓ npm installed: $(npm --version)"

# Check if MySQL is running
echo ""
echo "Checking MySQL connection..."
if nc -z localhost 3306 2>/dev/null; then
    echo "✓ MySQL is running on port 3306"
else
    echo "⚠ MySQL does not appear to be running on port 3306"
    echo "   Start MySQL before running the backend"
    echo "   Windows: Run 'mysql' service"
    echo "   macOS: brew services start mysql"
    echo "   Linux: sudo systemctl start mysql"
fi

echo ""
echo "Setup Instructions:"
echo "==================="
echo ""
echo "1. BACKEND SETUP (Terminal 1)"
echo "   cd fullstack-project/backend"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "2. FRONTEND SETUP (Terminal 2)"
echo "   cd fullstack-project/frontend"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "3. DATABASE SETUP"
echo "   If database doesn't exist, run:"
echo "   mysql -u root -p < fullstack-project/backend/database/schema.sql"
echo ""
echo "4. OPEN IN BROWSER"
echo "   http://localhost:5173/login"
echo ""
echo "Default credentials:"
echo "   Email: demo@example.com"
echo "   Password: Demo@1234"
echo ""
