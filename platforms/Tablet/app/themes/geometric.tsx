// GEOMETRIC MINIMAL THEME - Current design
export const geometricTheme = {
  name: 'Geometric Minimal',
  background: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
  
  backgroundPattern: (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
    </>
  ),

  orbs: [
    {
      className: 'absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-full blur-3xl',
      animate: {
        x: [0, 100, 0],
        y: [0, -100, 0],
        scale: [1, 1.2, 1],
      },
      transition: { duration: 20, repeat: Infinity, ease: "easeInOut" }
    },
    {
      className: 'absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl',
      animate: {
        x: [0, -100, 0],
        y: [0, 100, 0],
        scale: [1.2, 1, 1.2],
      },
      transition: { duration: 25, repeat: Infinity, ease: "easeInOut" }
    }
  ],

  colors: {
    primary: 'violet',
    secondary: 'fuchsia',
    accent: 'cyan',
  },

  logo: {
    gradient: 'from-violet-600 to-fuchsia-600',
    blur: 'from-violet-500 to-fuchsia-500',
  },

  title: {
    line1: 'Your Digital',
    line2: 'Command Center',
    gradient1: 'from-white via-violet-200 to-fuchsia-200',
    gradient2: 'from-violet-400 via-fuchsia-400 to-cyan-400',
  }
}
