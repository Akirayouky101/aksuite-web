#!/bin/bash

echo "📋 Avvio AKSUITE Tablet..."
echo "Porta: 3002"
echo "URL: http://localhost:3002"
echo ""

cd "$(dirname "$0")/Tablet"
npm install
npm run dev
