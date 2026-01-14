#!/bin/bash

echo "🖥️  Avvio AKSUITE Desktop..."
echo "Porta: 3000"
echo "URL: http://localhost:3000"
echo ""

cd "$(dirname "$0")/Desktop"
npm install
npm run dev
