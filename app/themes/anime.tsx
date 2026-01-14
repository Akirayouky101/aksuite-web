'use client'

import { motion } from 'framer-motion'

// ONE PIECE THEME - Straw Hat Pirates Holographic Crew! 🏴‍☠️
export const animeTheme = {
  name: 'One Piece - Mugiwara Crew',
  
  // Background with ocean waves and pirate atmosphere
  Background: () => (
    <div className="absolute inset-0 overflow-hidden">
      {/* One Piece Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: 'url(/onepiece/sfondo.jpg)',
        }}
      />
      
      {/* Ocean overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/60 via-cyan-900/50 to-blue-950/60" />
      
      {/* Animated waves - Grand Line style */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 191, 255, 0.5) 2px, transparent 2px),
            linear-gradient(90deg, rgba(0, 191, 255, 0.5) 2px, transparent 2px)
          `,
          backgroundSize: '60px 60px',
          animation: 'waveScroll 25s linear infinite'
        }} />
      </div>

      {/* Floating Jolly Rogers and symbols */}
      {[...Array(40)].map((_, i) => {
        const symbols = ['🏴‍☠️', '⚓', '🌊', '💀', '👒', '⚔️', '🍖', '💎'];
        return (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -150, 0],
              rotate: [0, 360],
              opacity: [0.1, 0.3, 0.1],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            {symbols[i % symbols.length]}
          </motion.div>
        );
      })}

      {/* Holographic scan lines (like Haki detection) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255, 215, 0, 0.05) 3px, rgba(255, 215, 0, 0.05) 6px)',
        }}
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Devil Fruit glow effect */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-red-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

      <style jsx global>{`
        @keyframes waveScroll {
          0% { transform: perspective(600px) rotateX(55deg) translateY(0) translateZ(0); }
          100% { transform: perspective(600px) rotateX(55deg) translateY(60px) translateZ(0); }
        }
      `}</style>
    </div>
  ),

  // STRAW HAT PIRATES - Holographic Crew Members! 🏴‍☠️
  HologramCharacters: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      
      {/* LUFFY - Captain with Straw Hat */}
      <motion.div
        className="absolute left-10 top-1/4"
        initial={{ opacity: 0, x: -100 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          x: [-20, 0, -20],
          y: [0, -25, 0],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="relative w-48 h-72">
          {/* Red aura (Gear 5th inspired) */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/30 via-yellow-500/20 to-transparent rounded-xl backdrop-blur-sm border-3 border-red-400/60 shadow-[0_0_30px_rgba(255,0,0,0.5)]" />
          
          {/* Luffy character IMAGE */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-red-500/10 to-transparent">
              <img 
                src="/onepiece/luffy4.png" 
                alt="Luffy"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,0,0,1)]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="text-red-400 font-black text-2xl tracking-wider" style={{ textShadow: '0 0 20px rgba(255,0,0,0.8)' }}>
              LUFFY
            </div>
            <div className="text-rose-300 font-bold text-sm">Captain</div>
          </div>
          
          {/* Gomu Gomu power scan */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-red-400/40 to-transparent"
            animate={{ y: [-80, 80] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Haki glow */}
          <motion.div
            className="absolute inset-0 border-3 border-red-500/80 rounded-xl"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* ZORO - Swordsman with Three Swords */}
      <motion.div
        className="absolute right-10 top-1/4"
        initial={{ opacity: 0, x: 100 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          x: [20, 0, 20],
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 4.5, repeat: Infinity }}
      >
        <div className="relative w-48 h-72">
          {/* Green aura (Santoryu) */}
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/30 via-emerald-500/20 to-transparent rounded-xl backdrop-blur-sm border-3 border-green-400/60 shadow-[0_0_30px_rgba(0,255,0,0.5)]" />
          
          {/* Zoro character IMAGE */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-green-500/10 to-transparent">
              <img 
                src="/onepiece/Zoro1.png" 
                alt="Zoro"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,255,0,1)]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="text-green-400 font-black text-2xl tracking-wider" style={{ textShadow: '0 0 20px rgba(0,255,0,0.8)' }}>
              ZORO
            </div>
            <div className="text-emerald-300 font-bold text-sm">Swordsman</div>
          </div>
          
          {/* Santoryu energy scan */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/40 to-transparent"
            animate={{ y: [-80, 80] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Haki outline */}
          <motion.div
            className="absolute inset-0 border-3 border-green-500/80 rounded-xl"
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* NAMI - Navigator with Weather abilities */}
      <motion.div
        className="absolute left-1/4 bottom-20"
        initial={{ opacity: 0, y: 100 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          y: [20, 0, 20],
          x: [0, 15, 0],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="relative w-44 h-64">
          {/* Orange/Electric aura (Climate Tact) */}
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 via-yellow-500/20 to-cyan-500/20 rounded-xl backdrop-blur-sm border-3 border-orange-400/60 shadow-[0_0_30px_rgba(255,165,0,0.5)]" />
          
          {/* Nami character IMAGE */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gradient-to-br from-orange-500/10 to-transparent">
              <img 
                src="/onepiece/nami2.jpg" 
                alt="Nami"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,165,0,1)]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="text-orange-400 font-black text-2xl tracking-wider" style={{ textShadow: '0 0 20px rgba(255,165,0,0.8)' }}>
              NAMI
            </div>
            <div className="text-amber-300 font-bold text-sm">Navigator</div>
          </div>
          
          {/* Weather scan */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-400/40 to-transparent"
            animate={{ y: [-70, 70] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Lightning effect */}
          <motion.div
            className="absolute inset-0 border-3 border-yellow-500/80 rounded-xl"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* SANJI - Cook with Fire Kick */}
      <motion.div
        className="absolute right-1/4 bottom-20"
        initial={{ opacity: 0, y: 100 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          y: [20, 0, 20],
          x: [0, -15, 0],
        }}
        transition={{ duration: 4.8, repeat: Infinity }}
      >
        <div className="relative w-44 h-64">
          {/* Blue/Orange fire aura (Diable Jambe) */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/30 via-orange-500/20 to-transparent rounded-xl backdrop-blur-sm border-3 border-blue-400/60 shadow-[0_0_30px_rgba(0,100,255,0.5)]" />
          
          {/* Sanji character IMAGE */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/10 to-transparent">
              <img 
                src="/onepiece/sanjy2.jpg" 
                alt="Sanji"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,100,255,1)]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="text-blue-400 font-black text-2xl tracking-wider" style={{ textShadow: '0 0 20px rgba(0,100,255,0.8)' }}>
              SANJI
            </div>
            <div className="text-cyan-300 font-bold text-sm">Cook</div>
          </div>
          
          {/* Fire scan */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-400/40 to-transparent"
            animate={{ y: [-70, 70] }}
            transition={{ duration: 2.3, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Fire outline */}
          <motion.div
            className="absolute inset-0 border-3 border-orange-500/80 rounded-xl"
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* CHOPPER - Doctor */}
      <motion.div
        className="absolute left-1/4 top-20"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          scale: [0.95, 1.05, 0.95],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="relative w-44 h-64">
          {/* Pink medical aura */}
          <div className="absolute inset-0 bg-gradient-to-t from-pink-500/30 via-rose-400/20 to-transparent rounded-xl backdrop-blur-sm border-3 border-pink-400/60 shadow-[0_0_30px_rgba(255,105,180,0.5)]" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gradient-to-br from-pink-500/10 to-transparent">
              <img 
                src="/onepiece/chopper1.png" 
                alt="Chopper"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,105,180,1)]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="text-pink-400 font-black text-2xl tracking-wider" style={{ textShadow: '0 0 20px rgba(255,105,180,0.8)' }}>
              CHOPPER
            </div>
            <div className="text-rose-300 font-bold text-sm">Doctor</div>
          </div>
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-400/40 to-transparent"
            animate={{ y: [-70, 70] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* USOPP - Sniper */}
      <motion.div
        className="absolute right-20 top-1/3"
        initial={{ opacity: 0, x: 100 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          x: [10, 0, 10],
          y: [0, -10, 0],
        }}
        transition={{ duration: 4.2, repeat: Infinity }}
      >
        <div className="relative w-44 h-64">
          {/* Yellow sniper aura */}
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 via-amber-400/20 to-transparent rounded-xl backdrop-blur-sm border-3 border-yellow-400/60 shadow-[0_0_30px_rgba(255,215,0,0.5)]" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gradient-to-br from-yellow-500/10 to-transparent">
              <img 
                src="/onepiece/usopp3.png" 
                alt="Usopp"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,215,0,1)]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="text-yellow-400 font-black text-2xl tracking-wider" style={{ textShadow: '0 0 20px rgba(255,215,0,0.8)' }}>
              USOPP
            </div>
            <div className="text-amber-300 font-bold text-sm">Sniper</div>
          </div>
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-400/40 to-transparent"
            animate={{ y: [-70, 70] }}
            transition={{ duration: 2.7, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* FRANKY - Shipwright */}
      <motion.div
        className="absolute left-20 bottom-1/4"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3.8, repeat: Infinity }}
      >
        <div className="relative w-44 h-64">
          {/* Cyan cyborg aura */}
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/30 via-sky-400/20 to-transparent rounded-xl backdrop-blur-sm border-3 border-cyan-400/60 shadow-[0_0_30px_rgba(0,255,255,0.5)]" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500/10 to-transparent">
              <img 
                src="/onepiece/franky3.png" 
                alt="Franky"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,255,255,1)]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="text-cyan-400 font-black text-2xl tracking-wider" style={{ textShadow: '0 0 20px rgba(0,255,255,0.8)' }}>
              FRANKY
            </div>
            <div className="text-sky-300 font-bold text-sm">Shipwright</div>
          </div>
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent"
            animate={{ y: [-70, 70] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* ROBIN - Archaeologist */}
      <motion.div
        className="absolute right-1/3 bottom-10"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          y: [0, -15, 0],
        }}
        transition={{ duration: 5.2, repeat: Infinity }}
      >
        <div className="relative w-44 h-64">
          {/* Purple mysterious aura */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/30 via-violet-400/20 to-transparent rounded-xl backdrop-blur-sm border-3 border-purple-400/60 shadow-[0_0_30px_rgba(138,43,226,0.5)]" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/10 to-transparent">
              <img 
                src="/onepiece/nico1.jpg" 
                alt="Robin"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(138,43,226,1)]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="text-purple-400 font-black text-2xl tracking-wider" style={{ textShadow: '0 0 20px rgba(138,43,226,0.8)' }}>
              ROBIN
            </div>
            <div className="text-violet-300 font-bold text-sm">Archaeologist</div>
          </div>
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/40 to-transparent"
            animate={{ y: [-70, 70] }}
            transition={{ duration: 2.9, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* Floating energy orbs (Devil Fruit powers) */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${10 + Math.random() * 20}px`,
            height: `${10 + Math.random() * 20}px`,
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            background: ['#ff0000', '#00ff00', '#ffa500', '#0066ff', '#ffd700'][i % 5],
            boxShadow: `0 0 20px ${['#ff0000', '#00ff00', '#ffa500', '#0066ff', '#ffd700'][i % 5]}`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  ),

  // ONE PIECE Title with Straw Hat Logo
  Title: () => (
    <div className="relative">
      {/* Main title */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="relative inline-block"
        >
          {/* Giant Straw Hat */}
          <div className="text-9xl mb-4">
            <motion.span
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block"
            >
              👒
            </motion.span>
          </div>

          {/* AK SUITE title with pirate style */}
          <h1 className="text-8xl font-black mb-4">
            <span className="bg-gradient-to-r from-yellow-300 via-red-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]">
              AK SUITE
            </span>
          </h1>

          {/* Holographic scan lines across title */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"
              style={{ top: `${i * 25}%` }}
              animate={{ 
                x: ['-100%', '200%'],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'linear'
              }}
            />
          ))}
        </motion.div>

        {/* Subtitle with pirate theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3 text-2xl font-bold"
        >
          <span className="text-red-400">🏴‍☠️</span>
          <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            DIGITAL TREASURE VAULT
          </span>
          <span className="text-red-400">🏴‍☠️</span>
        </motion.div>

        {/* One Piece subtitle in Japanese */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-cyan-300 text-lg mt-4 font-medium tracking-widest"
        >
          ワンピース - 麦わらの一味
        </motion.p>

        {/* Wanted poster style badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9, type: 'spring' }}
          className="inline-block mt-6 px-6 py-3 bg-yellow-600/20 border-4 border-yellow-500 rounded-lg"
        >
          <p className="text-yellow-200 font-black text-xl">
            WANTED
          </p>
          <p className="text-white text-sm">
            Secure Your Treasures!
          </p>
        </motion.div>
      </div>

      {/* Floating mini Jolly Rogers around title */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl"
          style={{
            left: `${(i % 4) * 25}%`,
            top: `${Math.floor(i / 4) * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 360],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          🏴‍☠️
        </motion.div>
      ))}
    </div>
  ),
}
