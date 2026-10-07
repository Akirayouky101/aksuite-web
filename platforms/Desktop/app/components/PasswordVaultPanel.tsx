'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, KeyRound, Lock, Unlock, RefreshCw, ShieldAlert, ShieldCheck, Users } from 'lucide-react'
import { MIN_MASTER_PASSWORD_LENGTH } from '@/lib/passwordVault/crypto'
import {
  PreparedRecoveryKey, VaultDirectoryEntry, changeMasterPassword, createSharedVault, describeVaultError, grantVaultAccess,
  loadVaultDirectory, lockVault, migrateLegacyPasswords, prepareEnrollment, prepareRecovery, prepareRecoveryKeyRotation,
  refreshVault, resetMyVaultKeys, unlockVault, usePasswordVault,
} from '@/lib/passwordVault/store'

const input = 'w-full px-3 py-2 bg-ak-panel border border-ak-line rounded-lg text-sm text-ak-text focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400'
const primary = 'px-3 py-2 bg-ak-accent hover:bg-ak-accent-hover text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
const secondary = 'px-3 py-2 bg-ak-panel hover:bg-ak-panel border border-ak-line text-ak-text text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
const danger = 'px-3 py-2 bg-ak-panel hover:bg-ak-danger-bg border border-ak-danger text-ak-danger text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'

type Mode = 'default' | 'recover' | 'reset' | 'change' | 'rotate' | 'members'

function RecoveryKeyConfirm({ prepared, title, onDone, onCancel }: { prepared: PreparedRecoveryKey; title: string; onDone: () => void; onCancel: () => void }) {
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const confirm = async () => {
    setBusy(true); setError('')
    try { await prepared.commit(); onDone() } catch (err) { setError(describeVaultError(err, 'salvare le chiavi')); setBusy(false) }
  }
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ak-text">{title}</p>
      <p className="text-sm text-ak-text">Questa chiave di recupero è l’unico modo per tornare alle password se dimentichi la master password. Non viene salvata in chiaro da nessuna parte: conservala offline (stampata o in un gestore sicuro). Non verrà mostrata di nuovo.</p>
      <code className="block p-3 bg-ak-inset text-emerald-200 rounded-lg text-sm font-mono break-all select-all" aria-label="Chiave di recupero">{prepared.recoveryKey}</code>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondary} onClick={async () => {
          setError('')
          try { await navigator.clipboard.writeText(prepared.recoveryKey); setCopied(true) }
          catch { setError('Impossibile copiare la chiave. Trascrivila e conservala in un posto sicuro.') }
        }}><Copy className="inline w-4 h-4 mr-1" />{copied ? 'Copiata' : 'Copia'}</button>
      </div>
      <label className="flex items-center gap-2 text-sm text-ak-text"><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} /> Ho salvato la chiave di recupero in un posto sicuro</label>
      {error && <p className="text-sm text-ak-danger" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className={primary} disabled={!saved || busy} onClick={confirm}>{busy ? 'Salvataggio…' : 'Conferma'}</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => { prepared.discard(); onCancel() }}>Annulla</button>
      </div>
    </div>
  )
}

function MembersPanel() {
  const [entries, setEntries] = useState<VaultDirectoryEntry[] | null>(null)
  const [verified, setVerified] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const load = async () => {
    setMessage('')
    try { setEntries(await loadVaultDirectory()) } catch (err) { setMessage(describeVaultError(err, 'caricare i membri')) }
  }
  useEffect(() => { void load() }, [])
  const grant = async (entry: VaultDirectoryEntry) => {
    setBusy(entry.userId); setMessage('')
    try { await grantVaultAccess(entry); setMessage(`Accesso concesso a ${entry.fullName || entry.email || 'collega'}.`); await load() } catch (err) { setMessage(describeVaultError(err, 'concedere l’accesso')) }
    setBusy(null)
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-ak-text">Prima di concedere l’accesso, confronta l’impronta con quella che il collega vede nella sua app (di persona o al telefono). Così sei sicuro di cifrare la chiave per la persona giusta.</p>
      {message && <p className="text-sm text-ak-text" role="status">{message}</p>}
      {!entries ? <p className="text-sm text-ak-muted">Caricamento…</p> : entries.length === 0 ? <p className="text-sm text-ak-muted">Nessun utente ha ancora configurato la master password.</p> : (
        <ul className="divide-y divide-ak-line border border-ak-line rounded-lg">
          {entries.map(entry => (
            <li key={entry.userId} className="p-3 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ak-text truncate">{entry.fullName || entry.email || entry.userId}</p>
                {entry.fullName && entry.email && <p className="text-xs text-ak-muted truncate">{entry.email}</p>}
                <p className="text-xs font-mono text-ak-text mt-1">Impronta: {entry.fingerprint}</p>
              </div>
              {entry.hasAccess ? <span className="text-xs font-semibold text-ak-success">Ha accesso</span> : (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-ak-text"><input type="checkbox" checked={Boolean(verified[entry.userId])} onChange={e => setVerified(prev => ({ ...prev, [entry.userId]: e.target.checked }))} /> Impronta verificata</label>
                  <button type="button" className={primary} disabled={!verified[entry.userId] || busy !== null} onClick={() => grant(entry)}>{busy === entry.userId ? 'Concessione…' : 'Concedi accesso'}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className={secondary} onClick={load}><RefreshCw className="inline w-4 h-4 mr-1" />Aggiorna</button>
    </div>
  )
}

export default function PasswordVaultPanel({ legacyCount = 0, compact = false }: { legacyCount?: number; compact?: boolean }) {
  const vault = usePasswordVault()
  const [mode, setMode] = useState<Mode>('default')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [resetText, setResetText] = useState('')
  const [prepared, setPrepared] = useState<{ value: PreparedRecoveryKey; title: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const clearFields = () => { setPassword(''); setNewPassword(''); setConfirmation(''); setRecoveryKey(''); setResetText('') }
  useEffect(() => { clearFields(); setError(''); setMode('default') }, [vault.status, vault.userId])
  const preparedRef = useRef<PreparedRecoveryKey | null>(null)
  preparedRef.current = prepared?.value ?? null
  useEffect(() => () => { preparedRef.current?.discard() }, [])

  const run = async (action: string, task: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('')
    try { await task() } catch (err) { setError(describeVaultError(err, action)) }
    setBusy(false)
  }

  if (vault.status === 'signed-out') return null

  const box = `border rounded-xl ${compact ? 'p-3' : 'p-4'} space-y-3`
  const header = (icon: React.ReactNode, title: string, tone = 'border-ak-line bg-ak-panel') => ({ tone, title: <div className="flex items-center gap-2 text-sm font-semibold text-ak-text">{icon}{title}</div> })
  const errorLine = error ? <p className="text-sm text-ak-danger" role="alert">{error}</p> : null

  if (prepared) {
    return <section className={`${box} border-ak-warning bg-ak-warning-bg`}><RecoveryKeyConfirm prepared={prepared.value} title={prepared.title} onDone={() => { setPrepared(null); clearFields(); setMode('default') }} onCancel={() => setPrepared(null)} /></section>
  }

  if (vault.status === 'loading') return <section className={`${box} border-ak-line bg-ak-panel`}><p className="text-sm text-ak-muted">Caricamento cassaforte password…</p></section>

  if (vault.status === 'unavailable' || vault.status === 'error') {
    const h = header(<ShieldAlert className="w-4 h-4 text-ak-danger" />, 'Cassaforte password non disponibile')
    return <section className={`${box} border-ak-danger bg-ak-danger-bg`}>{h.title}<p className="text-sm text-ak-danger">{vault.error}</p>{vault.status === 'error' && <button type="button" className={secondary} onClick={() => refreshVault(vault.userId)}>Riprova</button>}</section>
  }

  const newPasswordFields = (
    <>
      <input className={input} type="password" autoComplete="new-password" placeholder={`Nuova master password (min. ${MIN_MASTER_PASSWORD_LENGTH} caratteri)`} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      <input className={input} type="password" autoComplete="new-password" placeholder="Conferma master password" value={confirmation} onChange={e => setConfirmation(e.target.value)} />
    </>
  )

  if (vault.status === 'needs-enrollment') {
    const h = header(<KeyRound className="w-4 h-4 text-ak-cyan" />, 'Configura la tua master password')
    return (
      <section className={`${box} border-ak-line bg-ak-hover/60`}>
        {h.title}
        <p className="text-sm text-ak-text">Le password condivise sono cifrate sul tuo dispositivo. Scegli una master password diversa da quella di accesso: serve a sbloccare la cassaforte su web, iPhone, iPad e Mac. Il server non la riceve mai.</p>
        <form className="space-y-2" onSubmit={e => { e.preventDefault(); void run('configurare la cassaforte', async () => { const value = await prepareEnrollment(newPassword, confirmation); setPrepared({ value, title: 'Salva la tua chiave di recupero' }) }) }}>
          {newPasswordFields}
          {errorLine}
          <button className={primary} disabled={busy}>{busy ? 'Generazione chiavi…' : 'Continua'}</button>
        </form>
      </section>
    )
  }

  const fingerprintLine = vault.fingerprint ? <p className="text-xs text-ak-text">La tua impronta: <span className="font-mono font-semibold">{vault.fingerprint}</span></p> : null

  const resetForm = (
    <form className="space-y-2" onSubmit={e => { e.preventDefault(); void run('reimpostare le chiavi', async () => { await resetMyVaultKeys() }) }}>
      <p className="text-sm text-ak-danger">Usa questa opzione solo se hai perso sia la master password sia la chiave di recupero. Le tue chiavi verranno eliminate: dovrai configurarne di nuove e farti concedere di nuovo l’accesso da un collega. Le password condivise non vengono cancellate.</p>
      <input className={input} placeholder="Scrivi REIMPOSTA per confermare" value={resetText} onChange={e => setResetText(e.target.value)} />
      {errorLine}
      <div className="flex gap-2"><button className={danger} disabled={busy || resetText !== 'REIMPOSTA'}>Reimposta le mie chiavi</button><button type="button" className={secondary} onClick={() => setMode('default')}>Annulla</button></div>
    </form>
  )

  if (vault.status === 'pending') {
    const h = header(<ShieldAlert className="w-4 h-4 text-ak-warning" />, vault.vaultExists ? 'In attesa di accesso alla cassaforte' : 'Cassaforte condivisa non ancora creata')
    return (
      <section className={`${box} border-ak-warning bg-ak-warning-bg`}>
        {h.title}
        {vault.vaultExists
          ? <p className="text-sm text-ak-text">La tua master password è configurata. Chiedi a un collega che ha già accesso di concedertelo dalla sezione “Membri”, dopo aver confrontato con lui questa impronta.</p>
          : <p className="text-sm text-ak-text">Un amministratore deve creare la cassaforte condivisa (dopo aver configurato la propria master password).</p>}
        {fingerprintLine}
        {mode === 'reset' ? resetForm : (
          <>
            {errorLine}
            <div className="flex flex-wrap gap-2">
              {!vault.vaultExists && <button type="button" className={primary} disabled={busy} onClick={() => run('creare la cassaforte', createSharedVault)}>Crea cassaforte condivisa (admin)</button>}
              <button type="button" className={secondary} disabled={busy} onClick={() => refreshVault(vault.userId)}><RefreshCw className="inline w-4 h-4 mr-1" />Controlla di nuovo</button>
              <button type="button" className={secondary} onClick={() => setMode('reset')}>Reimposta chiavi</button>
            </div>
          </>
        )}
      </section>
    )
  }

  if (vault.status === 'locked') {
    const h = header(<Lock className="w-4 h-4 text-ak-text" />, 'Cassaforte bloccata')
    return (
      <section className={`${box} border-ak-line bg-ak-panel`}>
        {h.title}
        {mode === 'recover' ? (
          <form className="space-y-2" onSubmit={e => { e.preventDefault(); void run('recuperare l’accesso', async () => { const value = await prepareRecovery(recoveryKey, newPassword, confirmation); setPrepared({ value, title: 'Nuova chiave di recupero' }) }) }}>
            <p className="text-sm text-ak-text">Inserisci la chiave di recupero (AKR1-…) e scegli una nuova master password. Verrà generata anche una nuova chiave di recupero.</p>
            <input className={`${input} font-mono`} autoComplete="off" spellCheck={false} placeholder="AKR1-XXXX-XXXX-…" value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} />
            {newPasswordFields}
            {errorLine}
            <div className="flex flex-wrap gap-2"><button className={primary} disabled={busy}>{busy ? 'Verifica…' : 'Recupera'}</button><button type="button" className={secondary} onClick={() => setMode('default')}>Annulla</button><button type="button" className={danger} onClick={() => setMode('reset')}>Ho perso anche la chiave di recupero</button></div>
          </form>
        ) : mode === 'reset' ? resetForm : (
          <form className="space-y-2" onSubmit={e => { e.preventDefault(); void run('sbloccare la cassaforte', async () => { await unlockVault(password); setPassword('') }) }}>
            <p className="text-sm text-ak-text">Inserisci la master password per vedere e modificare le password condivise.</p>
            <input className={input} type="password" autoComplete="current-password" placeholder="Master password" value={password} onChange={e => setPassword(e.target.value)} autoFocus={!compact} />
            {errorLine}
            <div className="flex flex-wrap gap-2"><button className={primary} disabled={busy || !password}>{busy ? 'Sblocco…' : 'Sblocca'}</button><button type="button" className={secondary} onClick={() => setMode('recover')}>Master password dimenticata?</button></div>
          </form>
        )}
      </section>
    )
  }

  // unlocked
  if (compact) return null
  const h = header(<Unlock className="w-4 h-4 text-ak-success" />, 'Cassaforte sbloccata')
  return (
    <section className={`${box} border-ak-success bg-ak-success-bg/50`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {h.title}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondary} onClick={() => setMode(mode === 'members' ? 'default' : 'members')}><Users className="inline w-4 h-4 mr-1" />Membri</button>
          <button type="button" className={secondary} onClick={() => setMode(mode === 'change' ? 'default' : 'change')}>Cambia master password</button>
          <button type="button" className={secondary} onClick={() => setMode(mode === 'rotate' ? 'default' : 'rotate')}>Nuova chiave di recupero</button>
          <button type="button" className={primary} onClick={() => lockVault()}><Lock className="inline w-4 h-4 mr-1" />Blocca</button>
        </div>
      </div>
      {fingerprintLine}
      {notice && <p className="text-sm text-ak-success" role="status">{notice}</p>}
      {legacyCount > 0 && mode === 'default' && (
        <div className="p-3 border border-ak-warning bg-ak-warning-bg rounded-lg space-y-2">
          <p className="text-sm text-ak-warning flex items-center gap-2"><ShieldAlert className="w-4 h-4" />{legacyCount === 1 ? '1 credenziale è' : `${legacyCount} credenziali sono`} ancora nel vecchio formato non cifrato (Base64/PIN in chiaro).</p>
          <p className="text-xs text-ak-warning">La migrazione cifra password e PIN con la cassaforte condivisa, verifica ogni riga decifrandola e aggiorna solo le righe non modificate nel frattempo. Dopo la migrazione serviranno le app aggiornate per leggerle. Fai prima un backup del database.</p>
          {errorLine}
          <button type="button" className={primary} disabled={busy} onClick={() => run('migrare le password', async () => {
            if (!window.confirm(`Cifrare ora ${legacyCount} credenziali nel nuovo formato? Le versioni vecchie dell’app non potranno più leggerle.`)) return
            const result = await migrateLegacyPasswords()
            setNotice(`Migrazione completata: ${result.migrated} cifrate, ${result.skipped} saltate (modificate nel frattempo), ${result.failed} non riuscite.`)
          })}>{busy ? 'Migrazione…' : 'Migra ora'}</button>
        </div>
      )}
      {mode === 'members' && <MembersPanel />}
      {mode === 'change' && (
        <form className="space-y-2" onSubmit={e => { e.preventDefault(); void run('cambiare la master password', async () => { await changeMasterPassword(password, newPassword, confirmation); clearFields(); setMode('default'); setNotice('Master password aggiornata. La chiave di recupero resta valida.') }) }}>
          <input className={input} type="password" autoComplete="current-password" placeholder="Master password attuale" value={password} onChange={e => setPassword(e.target.value)} />
          {newPasswordFields}
          {errorLine}
          <button className={primary} disabled={busy}>{busy ? 'Aggiornamento…' : 'Aggiorna'}</button>
        </form>
      )}
      {mode === 'rotate' && (
        <form className="space-y-2" onSubmit={e => { e.preventDefault(); void run('generare la chiave di recupero', async () => { const value = await prepareRecoveryKeyRotation(password); setPassword(''); setPrepared({ value, title: 'Nuova chiave di recupero (la precedente smetterà di funzionare)' }) }) }}>
          <input className={input} type="password" autoComplete="current-password" placeholder="Master password" value={password} onChange={e => setPassword(e.target.value)} />
          {errorLine}
          <button className={primary} disabled={busy}>{busy ? 'Generazione…' : 'Genera nuova chiave'}</button>
        </form>
      )}
      {mode === 'default' && legacyCount === 0 && <p className="text-xs text-ak-text flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-ak-success" />Tutte le credenziali sono cifrate. Blocco automatico dopo 10 minuti di inattività.</p>}
    </section>
  )
}
