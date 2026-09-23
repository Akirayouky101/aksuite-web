import type { CapacitorConfig } from '@capacitor/cli'

// Loads the live deployed web app inside a native WKWebView shell.
// The Next.js app uses server middleware/API routes, so it cannot be statically exported.
const config: CapacitorConfig = {
  appId: 'com.aksuite.app',
  appName: 'AK Suite',
  webDir: 'www',
  server: {
    url: 'https://aksuite.app',
    cleartext: false,
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile'
  }
}

export default config
