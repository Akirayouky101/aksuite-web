# 🚀 AKSUITE - PIATTAFORME MULTIPLE

## Struttura del Progetto

Questo progetto è diviso in **3 versioni completamente indipendenti**, ognuna ottimizzata per una specifica piattaforma:

```
platforms/
├── Desktop/     🖥️  Versione Desktop (1920x1080+)
├── Mobile/      📱  Versione Mobile (375x812)
└── Tablet/      📋  Versione Tablet (820x1180)
```

---

## 🖥️ DESKTOP
**Target**: Computer, laptop, monitor grandi
**Porta**: 3000
**URL**: http://localhost:3000

### Caratteristiche
- Layout a griglia espanso
- Hover effects avanzati
- Sidebar sempre visibile
- Shortcut da tastiera completi
- Multi-window support

### Avvio
```bash
cd Desktop
npm install
npm run dev
```

---

## 📱 MOBILE
**Target**: iPhone, Android phones
**Porta**: 3001
**URL**: http://localhost:3001

### Caratteristiche
- Layout verticale ottimizzato
- Touch gestures (swipe, pull-to-refresh)
- Bottom navigation
- PWA ready
- Ottimizzato per pollice

### Avvio
```bash
cd Mobile
npm install
npm run dev
```

---

## 📋 TABLET
**Target**: iPad, tablet Android
**Porta**: 3002
**URL**: http://localhost:3002

### Caratteristiche
- Layout ibrido (2 colonne)
- Touch + hover support
- Portrait & Landscape ottimizzati
- Split-screen ready
- Sidebar collapsable

### Avvio
```bash
cd Tablet
npm install
npm run dev
```

---

## ⚠️ IMPORTANTE

### Indipendenza Totale
Ogni piattaforma è **COMPLETAMENTE SEPARATA**:
- ✅ Modifiche in Desktop NON influenzano Mobile o Tablet
- ✅ Modifiche in Mobile NON influenzano Desktop o Tablet  
- ✅ Modifiche in Tablet NON influenzano Desktop o Mobile

### Database Condiviso
Tutte e 3 le versioni usano lo **stesso database Supabase**:
- I dati sono sincronizzati
- L'autenticazione è condivisa
- Le password sono accessibili da tutte le piattaforme

### Sviluppo Simultaneo
Puoi avviare tutte e 3 le versioni contemporaneamente:
```bash
# Terminal 1
cd Desktop && npm run dev

# Terminal 2  
cd Mobile && npm run dev

# Terminal 3
cd Tablet && npm run dev
```

Poi apri:
- Desktop: http://localhost:3000
- Mobile: http://localhost:3001
- Tablet: http://localhost:3002

---

## 🎨 Personalizzazione per Piattaforma

### Desktop
- Aumenta dimensioni card
- Aggiungi più colonne nella griglia
- Implementa shortcut da tastiera
- Sidebar fissa e espansa

### Mobile
- Riduci dimensioni elementi
- Layout single-column
- Aggiungi gesture handlers
- Bottom navigation bar
- Safe area insets

### Tablet
- Layout 2 colonne
- Sidebar collapsabile
- Supporto landscape/portrait
- Picture-in-picture per video
- Split-screen friendly

---

## 📦 Deploy

### Desktop
Vercel production (attuale):
```bash
cd Desktop
vercel --prod
```

### Mobile
Vercel preview (mobile-specific):
```bash
cd Mobile
vercel --prod
```

### Tablet
Vercel preview (tablet-specific):
```bash
cd Tablet
vercel --prod
```

Oppure puoi deployarli su domini diversi:
- `desktop.aksuite.app`
- `mobile.aksuite.app`
- `tablet.aksuite.app`

---

## 🔄 Sincronizzazione Codice

Se vuoi sincronizzare una modifica tra piattaforme:
```bash
# Copia un file da Desktop a Mobile
cp Desktop/app/components/NewFeature.tsx Mobile/app/components/

# Oppure usa rsync per sincronizzare cartelle
rsync -av Desktop/app/components/ Mobile/app/components/
```

**ATTENZIONE**: Fai questo solo se sei sicuro! Le piattaforme sono separate per un motivo.

---

## 🛠️ Workflow Consigliato

1. **Sviluppa feature su una piattaforma specifica**
   ```bash
   cd Desktop
   npm run dev
   # Implementa la feature
   ```

2. **Testa sulla piattaforma target**
   - Desktop: Browser normale
   - Mobile: Chrome DevTools responsive mode
   - Tablet: iPad simulator o device reale

3. **Se la feature è universale, adatta per altre piattaforme**
   - Copia il codice manualmente
   - Modifica per adattare al layout/UX della piattaforma

4. **Deploy solo quando pronto**
   ```bash
   vercel --prod
   ```

---

## 📊 Confronto Rapido

| Feature | Desktop | Mobile | Tablet |
|---------|---------|--------|--------|
| Porta | 3000 | 3001 | 3002 |
| Layout | Grid 3-4 col | Single col | 2 col |
| Navigation | Sidebar | Bottom bar | Collapsable |
| Gestures | Hover | Touch | Both |
| Keyboard | Full support | Limited | Limited |
| Screen | 1920x1080+ | 375x812 | 820x1180 |

---

**Creato**: 14 gennaio 2026  
**Versione**: 1.0.0  
**Database**: Supabase condiviso  
**Framework**: Next.js 14.1.0
