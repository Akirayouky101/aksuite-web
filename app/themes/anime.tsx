'use client'

import { motion } from 'framer-motion'

// ANIME HOLOGRAM THEME - Futuristic anime style with holographic characters
export const animeTheme = {
  name: 'Anime Hologram',
  
  // Background with cyberpunk grid
  Background: () => (
    <div className="absolute inset-0 overflow-hidden">
      {/* Deep space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950 to-black" />
      
      {/* Animated grid - cyberpunk style */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(138, 43, 226, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(138, 43, 226, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridScroll 20s linear infinite'
        }} />
      </div>

      {/* Floating particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Holographic scan lines */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)',
        }}
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      <style jsx global>{`
        @keyframes gridScroll {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }
      `}</style>
    </div>
  ),

  // Animated holographic characters
  HologramCharacters: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Character 1 - Left side warrior */}
      <motion.div
        className="absolute left-10 top-1/4"
        initial={{ opacity: 0, x: -100 }}
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          x: [-20, 0, -20],
          y: [0, -20, 0],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="relative w-40 h-60">
          {/* Hologram effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-purple-500/20 to-transparent rounded-lg backdrop-blur-sm border-2 border-cyan-400/50" />
          
          {/* Character silhouette */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl">⚔️</div>
          </div>
          
          {/* Scan lines */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"
            animate={{ y: [-60, 60] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Glitch effect */}
          <motion.div
            className="absolute inset-0 border-2 border-cyan-400/70"
            animate={{ 
              opacity: [0, 1, 0],
              x: [0, 2, -2, 0],
            }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
          />
        </div>
      </motion.div>

      {/* Character 2 - Right side mage */}
      <motion.div
        className="absolute right-10 top-1/3"
        initial={{ opacity: 0, x: 100 }}
        animate={{ 
          opacity: [0.3, 0.7, 0.3],
          x: [20, 0, 20],
          y: [0, 20, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="relative w-40 h-60">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-pink-500/20 to-transparent rounded-lg backdrop-blur-sm border-2 border-purple-400/50" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl">🔮</div>
          </div>
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"
            animate={{ y: [60, -60] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
          
          <motion.div
            className="absolute inset-0 border-2 border-purple-400/70"
            animate={{ 
              opacity: [0, 1, 0],
              x: [0, -2, 2, 0],
            }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2.5 }}
          />
        </div>
      </motion.div>

      {/* Character 3 - Bottom ninja */}
      <motion.div
        className="absolute left-1/4 bottom-20"
        initial={{ opacity: 0, y: 100 }}
        animate={{ 
          opacity: [0.4, 0.8, 0.4],
          y: [10, 0, 10],
          scale: [0.9, 1, 0.9],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="relative w-40 h-60">
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 via-orange-500/20 to-transparent rounded-lg backdrop-blur-sm border-2 border-red-400/50" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl">🥷</div>
          </div>
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/30 to-transparent"
            animate={{ x: [-60, 60] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* Character 4 - Robot/Cyborg */}
      <motion.div
        className="absolute right-1/4 bottom-32"
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          y: [0, -15, 0],
          rotate: [0, -3, 0, 3, 0],
        }}
        transition={{ duration: 4.5, repeat: Infinity }}
      >
        <div className="relative w-40 h-60">
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 via-cyan-500/20 to-transparent rounded-lg backdrop-blur-sm border-2 border-green-400/50" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl">🤖</div>
          </div>
          
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-transparent via-green-400/30 to-transparent"
            animate={{ y: [60, -60] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* Floating energy orbs around characters */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            background: `radial-gradient(circle, ${
              ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'][i % 4]
            }, transparent)`,
            boxShadow: `0 0 20px ${['#00ffff', '#ff00ff', '#ffff00', '#00ff00'][i % 4]}`,
          }}
          animate={{
            y: [0, -50 - Math.random() * 50, 0],
            x: [0, (Math.random() - 0.5) * 100, 0],
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
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

  // Title with anime styling
  Title: () => (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="relative inline-block"
      >
        {/* Glow effect */}
        <div className="absolute -inset-8 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-30 blur-3xl animate-pulse" />
        
        {/* Main title */}
        <h2 className="relative text-8xl md:text-9xl font-black mb-6 leading-tight">
          <span className="relative inline-block">
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent blur-sm">
              AK SUITE
            </span>
            <span className="relative bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              AK SUITE
            </span>
            
            {/* Hologram lines */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
                style={{ top: `${i * 20}%` }}
                animate={{ x: [-100, 200] }}
                transition={{ 
                  duration: 1 + i * 0.2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </span>
        </h2>

        {/* Subtitle */}
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-black uppercase tracking-widest"
        >
          <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
            ⚡ DIGITAL VAULT SYSTEM ⚡
          </span>
        </motion.p>

        {/* Japanese text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          className="text-lg mt-2 text-cyan-300 font-bold"
        >
          デジタル金庫システム
        </motion.p>
      </motion.div>
    </div>
  ),

  colors: {
    primary: 'cyan',
    secondary: 'purple',
    accent: 'pink',
  },
}
