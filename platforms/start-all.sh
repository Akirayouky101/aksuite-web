#!/bin/bash

# 🚀 AKSUITE - Avvia Tutte le Piattaforme
# Questo script avvia Desktop, Mobile e Tablet contemporaneamente

echo "🚀 Avvio AKSUITE su tutte le piattaforme..."
echo ""

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Verifica che le cartelle esistano
if [ ! -d "Desktop" ] || [ ! -d "Mobile" ] || [ ! -d "Tablet" ]; then
    echo "❌ Errore: Esegui questo script dalla cartella platforms/"
    exit 1
fi

echo "${GREEN}🖥️  Desktop:${NC} http://localhost:3000"
echo "${BLUE}📱 Mobile:${NC}  http://localhost:3001"
echo "${PURPLE}📋 Tablet:${NC}  http://localhost:3002"
echo ""
echo "⏳ Installazione dipendenze..."

# Installa dipendenze per tutte le piattaforme
cd Desktop && npm install &> /dev/null &
cd ../Mobile && npm install &> /dev/null &
cd ../Tablet && npm install &> /dev/null &

# Aspetta che le installazioni finiscano
wait

echo "✅ Dipendenze installate!"
echo ""
echo "🚀 Avvio server di sviluppo..."
echo ""

# Avvia i server in background
cd Desktop && npm run dev &
DESKTOP_PID=$!

cd ../Mobile && npm run dev &
MOBILE_PID=$!

cd ../Tablet && npm run dev &
TABLET_PID=$!

# Salva i PID in un file
echo $DESKTOP_PID > /tmp/aksuite-desktop.pid
echo $MOBILE_PID > /tmp/aksuite-mobile.pid
echo $TABLET_PID > /tmp/aksuite-tablet.pid

echo ""
echo "✅ Tutti i server sono partiti!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🖥️  DESKTOP: http://localhost:3000"
echo "  📱 MOBILE:  http://localhost:3001"
echo "  📋 TABLET:  http://localhost:3002"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Premi Ctrl+C per fermare tutti i server"
echo ""

# Funzione per cleanup quando si preme Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Arresto server..."
    kill $DESKTOP_PID $MOBILE_PID $TABLET_PID 2>/dev/null
    rm -f /tmp/aksuite-*.pid
    echo "✅ Tutti i server sono stati fermati"
    exit 0
}

# Intercetta Ctrl+C
trap cleanup INT

# Mantieni lo script attivo
wait
