'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Copy, Check } from 'lucide-react'

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void
}

export default function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const generatePassword = () => {
    let charset = ''
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeNumbers) charset += '0123456789'
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (charset === '') charset = 'abcdefghijklmnopqrstuvwxyz'

    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    setGeneratedPassword(password)
    return password
  }

  const calculateStrength = (password: string) => {
    let strength = 0
    if (password.length >= 12) strength++
    if (password.length >= 16) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 2) return { label: 'Debole', color: 'red', width: '33%' }
    if (strength <= 4) return { label: 'Media', color: 'yellow', width: '66%' }
    return { label: 'Forte', color: 'green', width: '100%' }
  }

  const handleGenerate = () => {
    const pwd = generatePassword()
    onGenerate(pwd)
  }

  const copyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const strength = generatedPassword ? calculateStrength(generatedPassword) : null

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-300">🎲 Generatore Password</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerate}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-bold text-white flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Genera
        </motion.button>
      </div>

      {/* Generated Password Display */}
      {generatedPassword && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={generatedPassword}
              readOnly
              className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white font-mono text-lg"
            />
            <button
              onClick={copyPassword}
              className="p-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
              title="Copia password"
            >
              {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>

          {/* Strength Indicator */}
          {strength && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Forza Password:</span>
                <span className={`font-bold ${
                  strength.color === 'red' ? 'text-red-400' :
                  strength.color === 'yellow' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: strength.width }}
                  className={`h-full ${
                    strength.color === 'red' ? 'bg-red-500' :
                    strength.color === 'yellow' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Length Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-white/50">Lunghezza: {length}</label>
        </div>
        <input
          type="range"
          min="8"
          max="32"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeUppercase}
            onChange={(e) => setIncludeUppercase(e.target.checked)}
            className="w-4 h-4 rounded accent-purple-500"
          />
          <span className="text-white/50">Maiuscole (A-Z)</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeLowercase}
            onChange={(e) => setIncludeLowercase(e.target.checked)}
            className="w-4 h-4 rounded accent-purple-500"
          />
          <span className="text-white/50">Minuscole (a-z)</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={(e) => setIncludeNumbers(e.target.checked)}
            className="w-4 h-4 rounded accent-purple-500"
          />
          <span className="text-white/50">Numeri (0-9)</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeSymbols}
            onChange={(e) => setIncludeSymbols(e.target.checked)}
            className="w-4 h-4 rounded accent-purple-500"
          />
          <span className="text-white/50">Simboli (!@#$)</span>
        </label>
      </div>
    </div>
  )
}
