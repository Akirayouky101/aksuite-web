'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, FileText, Calendar, Users, Bookmark, CheckSquare, DollarSign, Folder, Shield, Sparkles } from 'lucide-react'

interface AppCard {
  id: string
  title: string
  description: string
  icon: any
  color: string
}

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const apps: AppCard[] = [
    { id: 'passwords', title: 'Passwords', description: 'Custodisce le chiavi del regno digitale. Quando attivata, protegge tutti i tuoi accessi con potere assoluto.', icon: Lock, color: '#3b82f6' },
    { id: 'notes', title: 'Notes', description: 'Carta magica che conserva i tuoi pensieri. Può essere evocata in qualsiasi momento per consultare la saggezza.', icon: FileText, color: '#f59e0b' },
    { id: 'calendar', title: 'Calendar', description: 'Controlla il flusso del tempo. Questa carta ti permette di organizzare eventi con precisione millimetrica.', icon: Calendar, color: '#ef4444' },
    { id: 'contacts', title: 'Contacts', description: 'Evoca alleati dal tuo network. Mantiene i legami con tutti i tuoi contatti importanti.', icon: Users, color: '#8b5cf6' },
    { id: 'bookmarks', title: 'Bookmarks', description: 'Segna i luoghi importanti del web. Ritorna istantaneamente ai siti salvati.', icon: Bookmark, color: '#ec4899' },
    { id: 'tasks', title: 'Tasks', description: 'Organizza le tue missioni. Ogni task completato aumenta il tuo potere produttivo.', icon: CheckSquare, color: '#10b981' },
    { id: 'bilancio', title: 'Bilancio', description: 'Controlla le risorse finanziarie. Monitora entrate e uscite con potere divino.', icon: DollarSign, color: '#6366f1' },
    { id: 'documents', title: 'Documents', description: 'Conserva i documenti sacri. Archivio indistruttibile per i tuoi file importanti.', icon: Folder, color: '#06b6d4' },
  ]

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Background stelle animate */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 2,
              height: Math.random() * 3 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.2 + 0.1,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 p-8 pt-24 overflow-y-auto min-h-screen">
        {/* Header epico */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-16 h-16 text-yellow-400" />
            <Sparkles className="w-12 h-12 text-cyan-400" />
          </div>
          <h1 className="text-6xl font-black mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl">
            ✨ AK SUITE ✨
          </h1>
          <p className="text-white/70 text-xl font-semibold mb-2">Your Digital Vault</p>
          <p className="text-purple-400 text-sm">Scegli la tua carta</p>
        </motion.div>

        {/* Grid di carte Yu-Gi-Oh! */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center pb-20">
            {apps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.08, rotateX: 8, rotateY: 8 }}
                onHoverStart={() => setHoveredCard(app.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="cursor-pointer relative"
                style={{ 
                  perspective: '1000px',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* CARTA YU-GI-OH! AUTENTICA */}
                <div className="yugioh-authentic-card">
                  {/* 1. HEADER - Nome carta con bordo dorato */}
                  <div className="h-15 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 flex items-center justify-between px-4 py-3">
                    <h3 className="text-black text-xl font-black uppercase tracking-wide">
                      {app.title}
                    </h3>
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <span key={i} className="text-orange-600 text-lg">★</span>
                      ))}
                    </div>
                  </div>

                  {/* 2. BOX IMMAGINE - Artwork centrale */}
                  <div className="relative h-64 overflow-hidden border-y-4 border-yellow-600">
                    {/* Background sfumato viola/rosso */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-red-900 to-orange-700" />
                    
                    {/* Pattern raggi */}
                    <div className="absolute inset-0">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-1/2 left-1/2 w-1 h-full bg-white/10 origin-top"
                          style={{
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Glow e Icona centrale */}
                    <div className="relative z-10 h-full flex items-center justify-center">
                      {/* Glow colorato */}
                      <motion.div
                        animate={hoveredCard === app.id ? { scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute w-44 h-44 rounded-full blur-3xl"
                        style={{ backgroundColor: `${app.color}80` }}
                      />
                      
                      {/* Icona */}
                      <app.icon className="w-28 h-28 text-white drop-shadow-2xl relative z-20" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* 3. BOX DESCRIZIONE - Testo effetto */}
                  <div className="p-3 bg-amber-100">
                    {/* Tipo carta */}
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <app.icon className="w-3 h-3 text-black" />
                      <span className="text-xs font-bold text-black">[App/Leggendaria]</span>
                    </div>

                    {/* Descrizione effetto */}
                    <div className="bg-yellow-50 border border-black/20 rounded-lg p-3 mb-2">
                      <p className="text-xs text-black font-medium leading-tight line-clamp-4">
                        {app.description}
                      </p>
                    </div>

                    {/* Level */}
                    <div className="flex justify-end px-2">
                      <span className="text-xs font-black text-black">LEVEL ★★★★</span>
                    </div>
                  </div>
                </div>

                {/* Glow esterno animato */}
                {hoveredCard === app.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 -z-10 bg-yellow-500/30 blur-2xl rounded-2xl"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coming Soon Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl"
        >
          🚀 Coming Soon
        </motion.div>
      </div>

      <style jsx global>{`
        .yugioh-authentic-card {
          width: 360px;
          height: 520px;
          background: linear-gradient(180deg, #f5deb3 0%, #d2b48c 100%);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 
            0 0 0 8px #d4af37,
            0 0 0 9px #ffd700,
            0 20px 60px rgba(0, 0, 0, 0.8);
          position: relative;
        }

        .yugioh-authentic-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 8px;
          background: linear-gradient(135deg, #d4af37, #ffd700, #ffed4e, #ffd700, #d4af37);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
