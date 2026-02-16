/**
 * Console Guard - Professional Security Warning
 * Displays warning in browser console for unauthorized access attempts
 */

export function initConsoleGuard() {
  if (typeof window === 'undefined') return;

  const headerStyle = `
    color: #2dd4bf;
    font-size: 14px;
    font-weight: bold;
    font-family: monospace;
  `;

  const warningStyle = `
    color: #f87171;
    font-size: 13px;
    font-weight: bold;
  `;

  const infoStyle = `
    color: #94a3b8;
    font-size: 12px;
  `;

  // Clear console and display warning
  console.clear();
  console.log('%c╔══════════════════════════════════════════╗', headerStyle);
  console.log('%c║         AK Suite — Console Guard         ║', headerStyle);
  console.log('%c╚══════════════════════════════════════════╝', headerStyle);
  console.log('%c⛔ Accesso non autorizzato alla console.', warningStyle);
  console.log('%cEffettua il login per sbloccare l\'ambiente.', infoStyle);

  // Store original console methods
  const originalMethods = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  // Block console access for non-authenticated users
  const blockConsole = () => {
    const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
    
    methods.forEach(method => {
      (console as any)[method] = (...args: any[]) => {
        originalMethods.log.call(console, '%c�� Console bloccata — effettua il login.', warningStyle);
      };
    });
  };

  // Unblock console (restore original methods)
  const unblockConsole = () => {
    console.log = originalMethods.log;
    console.info = originalMethods.info;
    console.warn = originalMethods.warn;
    console.error = originalMethods.error;
    console.debug = originalMethods.debug;
    
    console.clear();
    console.log('%c✅ Console sbloccata. Benvenuto in AK Suite.', `
      color: #2dd4bf;
      font-size: 14px;
      font-weight: bold;
    `);
  };

  return {
    blockConsole,
    unblockConsole
  };
}
