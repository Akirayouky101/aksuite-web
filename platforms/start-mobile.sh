#!/bin/bash

echo "📱 Avvio AKSUITE Mobile..."
echo "Porta: 3001"
echo "URL: http://localhost:3001"
echo ""

cd "$(dirname "$0")/Mobile"
npm install
npm run dev
