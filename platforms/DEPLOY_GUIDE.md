# 🚀 Guida Deploy Multi-Piattaforma

## Setup Progetti Vercel Separati

Devi creare **3 progetti Vercel separati** per avere URL diversi per ogni piattaforma.

### 1️⃣ Deploy Mobile

```bash
cd platforms/Mobile
vercel --prod
```

Quando richiesto:
- **Project name**: `aksuite-mobile` 
- Conferma tutte le altre opzioni

URL risultante: `https://aksuite-mobile.vercel.app`

---

### 2️⃣ Deploy Tablet

```bash
cd platforms/Tablet
vercel --prod
```

Quando richiesto:
- **Project name**: `aksuite-tablet`
- Conferma tutte le altre opzioni

URL risultante: `https://aksuite-tablet.vercel.app`

---

### 3️⃣ Deploy Desktop

```bash
cd platforms/Desktop
vercel --prod
```

Quando richiesto:
- **Project name**: `aksuite-desktop`
- Conferma tutte le altre opzioni

URL risultante: `https://aksuite-desktop.vercel.app`

---

## 🔀 Setup Routing Automatico (Root)

Il progetto nella root (`aksuite-web.vercel.app`) ha il middleware che:

1. **Rileva il device** (mobile/tablet/desktop)
2. **Reindirizza automaticamente** all'URL corretto

### Configura Environment Variables

Nel progetto root su Vercel, aggiungi:

```
NEXT_PUBLIC_MOBILE_URL=https://aksuite-mobile.vercel.app
NEXT_PUBLIC_TABLET_URL=https://aksuite-tablet.vercel.app
```

---

## 📱 Come Funziona

### Utente apre https://aksuite-web.vercel.app

**Da iPhone/Android**:
→ Redirect a `https://aksuite-mobile.vercel.app`

**Da iPad/Tablet Android**:
→ Redirect a `https://aksuite-tablet.vercel.app`

**Da Desktop/Laptop**:
→ Resta su `https://aksuite-web.vercel.app` (versione desktop)

---

## ✅ Checklist Deploy

- [ ] Deploy Mobile (`aksuite-mobile.vercel.app`)
- [ ] Deploy Tablet (`aksuite-tablet.vercel.app`)  
- [ ] Deploy Desktop (`aksuite-desktop.vercel.app`)
- [ ] Configura env vars sul progetto root
- [ ] Testa da iPhone → verifica redirect a mobile
- [ ] Testa da iPad → verifica redirect a tablet
- [ ] Testa da Desktop → verifica resta su desktop

---

## 🔧 Alternativa: Link Diretti

Se preferisci, puoi anche dare agli utenti i link diretti:

- Mobile: `https://aksuite-mobile.vercel.app`
- Tablet: `https://aksuite-tablet.vercel.app`
- Desktop: `https://aksuite-desktop.vercel.app`

Ogni versione funziona indipendentemente!

---

## 📦 Aggiornamenti

Per aggiornare una singola piattaforma:

```bash
# Solo Mobile
cd platforms/Mobile
git pull
npm install
vercel --prod

# Solo Tablet
cd platforms/Tablet
git pull
npm install
vercel --prod

# Solo Desktop  
cd platforms/Desktop
git pull
npm install
vercel --prod
```

Ogni deploy è **indipendente** e non tocca le altre piattaforme!
