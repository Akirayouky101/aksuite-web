# 🎨 Guida alle Modifiche per Piattaforma

## Obiettivo
Ogni piattaforma deve essere ottimizzata per il suo dispositivo target. Questa guida spiega le modifiche consigliate per ciascuna versione.

---

## 🖥️ MODIFICHE DESKTOP

### Layout & Grid
**File**: `app/page.tsx`

```tsx
// Aumenta numero colonne nella griglia
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {/* Le card Desktop possono essere più piccole perché hai più spazio */}
</div>
```

### Dimensioni Card
**File**: `app/page.tsx`

```tsx
// Card più compatte per Desktop
<motion.div className="w-72 h-80"> {/* Desktop: più piccole */}
```

### Sidebar
**File**: Crea `app/components/DesktopSidebar.tsx`

```tsx
export default function DesktopSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/50 backdrop-blur-xl">
      {/* Menu sempre visibile */}
      <nav>
        <button>🔑 Password</button>
        <button>📝 Note</button>
        <button>📅 Calendario</button>
        {/* Altri link */}
      </nav>
    </aside>
  )
}
```

### Keyboard Shortcuts
**File**: `app/hooks/useKeyboardShortcuts.ts`

```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl+K: Search
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      openSearch()
    }
    // Ctrl+N: New Password
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault()
      openNewPassword()
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

---

## 📱 MODIFICHE MOBILE

### Layout Verticale
**File**: `app/page.tsx`

```tsx
// Single column per Mobile
<div className="flex flex-col gap-4 px-4 pb-24"> {/* pb-24 per bottom nav */}
  {/* Card stack verticale */}
</div>
```

### Dimensioni Card Mobile
**File**: `app/page.tsx`

```tsx
// Card più grandi e touch-friendly
<motion.div className="w-full h-[180px]"> {/* Mobile: full width */}
```

### Bottom Navigation
**File**: Crea `app/components/MobileBottomNav.tsx`

```tsx
export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-xl 
                    border-t border-purple-500/30 flex justify-around items-center px-4
                    pb-safe"> {/* pb-safe per iPhone notch */}
      <button className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px]">
        <span className="text-2xl">🔑</span>
        <span className="text-xs">Password</span>
      </button>
      <button className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px]">
        <span className="text-2xl">📝</span>
        <span className="text-xs">Note</span>
      </button>
      {/* Altri pulsanti */}
    </nav>
  )
}
```

### Touch Gestures
**File**: `app/components/SwipeableCard.tsx`

```tsx
import { motion } from 'framer-motion'

export default function SwipeableCard({ children, onSwipeLeft, onSwipeRight }) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.x > 100) onSwipeRight()
        if (offset.x < -100) onSwipeLeft()
      }}
    >
      {children}
    </motion.div>
  )
}
```

### Pull to Refresh
**File**: `app/hooks/usePullToRefresh.ts`

```tsx
export function usePullToRefresh(onRefresh: () => void) {
  useEffect(() => {
    let startY = 0
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY
      if (endY - startY > 100 && window.scrollY === 0) {
        onRefresh()
      }
    }
    
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh])
}
```

### Tap Target Size
**File**: Tutti i componenti

```tsx
// SEMPRE minimo 44x44px per elementi touch
<button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
  Tap me
</button>
```

---

## 📋 MODIFICHE TABLET

### Layout 2 Colonne
**File**: `app/page.tsx`

```tsx
// Layout ibrido per Tablet
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* 2 colonne in portrait, potrebbe diventare 3 in landscape */}
</div>
```

### Sidebar Collapsabile
**File**: Crea `app/components/TabletSidebar.tsx`

```tsx
export default function TabletSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50">
        {isOpen ? '✕' : '☰'}
      </button>
      
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        className="fixed left-0 top-0 h-screen w-80 bg-slate-900/50 backdrop-blur-xl"
      >
        {/* Sidebar content */}
      </motion.aside>
    </>
  )
}
```

### Responsive Orientation
**File**: `app/hooks/useOrientation.ts`

```tsx
export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  )
  
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return isLandscape
}
```

Poi in `app/page.tsx`:

```tsx
const isLandscape = useOrientation()

return (
  <div className={isLandscape ? 'grid grid-cols-3' : 'grid grid-cols-2'}>
    {/* Adatta layout a orientamento */}
  </div>
)
```

### Split Screen Support
**File**: `app/page.tsx`

```tsx
// Layout che funziona bene in split-screen iPad
<div className="min-w-[400px]"> {/* Minimo per split screen */}
  {/* Content che si adatta */}
</div>
```

---

## 📐 Breakpoints Consigliati

### Desktop
```css
/* tailwind.config.js */
screens: {
  'desktop': '1024px',
  'desktop-lg': '1440px',
  'desktop-xl': '1920px',
}
```

### Mobile
```css
/* tailwind.config.js */
screens: {
  'mobile-sm': '320px',  // iPhone SE
  'mobile': '375px',     // iPhone standard
  'mobile-lg': '428px',  // iPhone Pro Max
}
```

### Tablet
```css
/* tailwind.config.js */
screens: {
  'tablet': '768px',     // iPad Mini
  'tablet-lg': '1024px', // iPad Pro
}
```

---

## 🎯 Font Sizes

### Desktop
```tsx
h1: "text-4xl md:text-5xl"
h2: "text-3xl md:text-4xl"
body: "text-base"
small: "text-sm"
```

### Mobile
```tsx
h1: "text-3xl"
h2: "text-2xl"
body: "text-base"  // 16px minimo per leggibilità
small: "text-sm"
```

### Tablet
```tsx
h1: "text-4xl"
h2: "text-3xl"
body: "text-base md:text-lg"
small: "text-sm"
```

---

## 🎨 Spacing

### Desktop
```tsx
gap: "gap-6 lg:gap-8"
padding: "p-6 lg:p-8"
margin: "m-6 lg:m-8"
```

### Mobile
```tsx
gap: "gap-4"
padding: "p-4"
margin: "m-4"
// Più compatto per schermi piccoli
```

### Tablet
```tsx
gap: "gap-5 md:gap-6"
padding: "p-5 md:p-6"
margin: "m-5 md:m-6"
// Medio tra mobile e desktop
```

---

## 🚀 Testing

### Desktop
```bash
cd Desktop
npm run dev
# Apri http://localhost:3000 in browser normale
# Testa su 1920x1080
```

### Mobile
```bash
cd Mobile
npm run dev
# Apri http://localhost:3001
# Chrome DevTools → Toggle Device Toolbar (Cmd+Shift+M)
# Seleziona iPhone 12 Pro o simile
```

### Tablet
```bash
cd Tablet
npm run dev
# Apri http://localhost:3002
# Chrome DevTools → Toggle Device Toolbar
# Seleziona iPad Air o iPad Pro
# Testa sia Portrait che Landscape
```

---

## 📝 Checklist Modifiche

### Desktop
- [ ] Aumentato numero colonne grid (3-4)
- [ ] Ridotte dimensioni card
- [ ] Aggiunta sidebar fissa
- [ ] Implementati keyboard shortcuts
- [ ] Hover effects su tutti gli elementi interattivi
- [ ] Ottimizzato per mouse precision

### Mobile
- [ ] Layout single-column
- [ ] Card full-width
- [ ] Bottom navigation bar
- [ ] Tap targets min 44x44px
- [ ] Pull to refresh
- [ ] Swipe gestures
- [ ] Safe area per notch
- [ ] Ottimizzato per pollice

### Tablet
- [ ] Layout 2 colonne
- [ ] Sidebar collapsabile
- [ ] Supporto portrait/landscape
- [ ] Split-screen friendly
- [ ] Touch + hover support
- [ ] Media queries per orientamento

---

**Nota**: Queste sono linee guida. Adatta in base alle tue esigenze specifiche!
