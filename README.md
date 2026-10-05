# AK Suite

Your Digital Command Center - Secure password manager and productivity suite with modern glassmorphism design.

## 🚀 Deploy to Vercel

The Vercel project `aksuite-web` is connected to
`Akirayouky101/aksuite-web`. Its production branch is `main`, and the
production domain is `aksuite.app`.

1. Validate the web build with `npm run build`.
2. Commit all related source changes, excluding credentials and generated files.
3. Push to `main` to trigger the production deployment.
4. Check that the deployment is Ready and its Git commit matches GitHub.

Avoid production deployments from a working tree with uncommitted changes:
they cannot be reproduced from GitHub. Native Apple sources are versioned in
GitHub but excluded from Vercel uploads.

## 🌐 Domains

- **Primary**: aksuite.app
- **Redirects**: aksuite.net, aksuite.org

## 💻 Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Copy `.env.local.example` to `.env.local` and configure the Supabase URL and
public key before running the app. Administrative API routes also require
`SUPABASE_SERVICE_ROLE_KEY`, which must remain server-side.

The current local configuration and the production website use the same
Supabase project, `tecvggqaunfbelqksghj`. Local writes can therefore affect
production data. Use a separate Supabase project for isolated development.
Vercel Preview environments also need their own environment configuration;
the existing application variables are configured for Production only.

## Native Apple Apps

The local source tree includes the web app under `platforms/Desktop` and
native Apple sources under `platforms/MobileNative`. The iOS target supports
both iPhone and iPad. Keep the native sources and macOS-related files in Git
alongside the web sources; Vercel deploys only the web app.

Native credentials belong in the ignored
`platforms/MobileNative/Config/Secrets.xcconfig`, using
`Secrets.example.xcconfig` as a template. Xcode projects, user state, and
build output are generated/local artifacts and are not versioned.

## Supabase Synchronization

Authenticate using `supabase login` in an interactive terminal. Verify the
linked project with `supabase projects list`, then compare migration history
using `supabase migration list --linked`.

Versioned migrations live in `supabase/migrations`. The other SQL files in
`supabase` include historical setup and maintenance scripts: do not execute
them all to synchronize an existing production database. Review pending
migrations and back up the database before applying any database changes.
Edge Function sources are versioned in `supabase/functions`; deploy them
only when their source changes.

## Shopping Lists (Web, iPhone and iPad)

The `Spesa` section provides multiple personal shopping lists with products,
positive numeric quantities with a unit selector (pieces, g, kg, ml, l),
optional notes, purchased checkboxes, search,
filters, and progress. Existing to-do checklists are not converted or removed.

Apply `supabase/migrations/20261005000000_shopping_lists.sql` through the
normal migration workflow before deploying the web feature. It adds
`shopping_lists` and `shopping_items`; row-level security permits only the
owner to access a list and its products, and deleting a list cascades to its
products. This feature does not grant other users access to private lists.

Apply `supabase/migrations/20261005010000_shopping_quantity.sql` before
deploying the numeric quantity editor. Quantities support up to three decimal
places, from 0.001 to 999999999. Existing free-text quantities are preserved
and displayed without guessing conversions; editing those products requires
entering a numeric quantity and selecting a unit. The original `quantity`
text column remains available to older clients and is updated alongside the
new `quantity_value` and `quantity_unit` columns by the web app.

`PDF` exports the complete selected list, with pending products first and
purchased products marked. `Condividi PDF` uses file sharing on supported
devices/browsers, so the user can choose an installed app such as WhatsApp,
Telegram, or email. Otherwise, it downloads a PDF to attach manually.
Sharing sends a static copy, not an editable or synchronized list.
The native iPhone/iPad dashboard also includes `Spesa`, backed by the same
owner-only Supabase tables. It supports creating and renaming lists,
adding/editing products with numeric quantities and unit selection, purchased
status, progress, search, filters, refresh, and confirmed deletion. The
numeric keyboard accepts Italian decimal commas; validation matches the web
limits. Pull to refresh or use `Aggiorna` to fetch changes made on another
device.

Native PDF export includes the complete selected list, pending products
first, and supports `Condividi PDF` through the system share menu or `Salva
PDF` through the file exporter. The PDF code uses Core Graphics/Core Text
and supports paginated text without truncating long notes. Sharing does not
grant access to the list.

After pulling native source changes, regenerate the ignored Xcode project:

```sh
xcodegen generate --spec platforms/MobileNative/project.yml
```

Build the `AKSuite` scheme for an iPhone or iPad simulator, or sign it for
your device using the existing native configuration. Publishing web
changes does not install or update the native app on devices.

Run focused shopping validation with `node --test tests/shopping.test.cjs`
and the web build with `npm run build`.
`tests/shopping.integration.sql` checks owner CRUD, isolation between
identities, ownership-transfer denial, and cascading deletion using
temporary fixtures in a transaction that is always rolled back. Run it
through an administrator SQL connection after applying the migration.
Native model and PDF regression tests can be run on a Mac with Xcode:

```sh
xcrun swiftc \
  platforms/MobileNative/AKSuite/Features/Shopping/ShoppingModels.swift \
  platforms/MobileNative/AKSuite/Features/Shopping/ShoppingPDF.swift \
  tests/ShoppingNativeTests.swift -o /tmp/aksuite-shopping-tests
/tmp/aksuite-shopping-tests
rm /tmp/aksuite-shopping-tests
```

## Calendar Push Reminders

Calendar reminders are sent by Supabase, including when the app is closed. Apply `supabase/calendar-push-reminders.sql` after the events and push-device schemas, replacing `YOUR_PROJECT_REF` with the Supabase project reference. Before applying its final cron section, store the service-role key in Vault:

```sql
SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'calendar_reminders_service_key');
```

Deploy both Edge Functions with the Supabase CLI:

```sh
supabase functions deploy send-push
supabase functions deploy calendar-reminders
```

`send-push` requires `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`, `APNS_BUNDLE_ID`, and `APNS_ENVIRONMENT` to be configured as Supabase Edge Function secrets.

## 📦 Features

- 🔐 Password Manager
- 📝 Notes
- 📅 Calendar
- 👥 Contacts
- 🔖 Bookmarks
- ✅ Tasks
- 💰 Bilancio
- 📁 Documents

## 🎨 Design

Modern glassmorphism aesthetic with:
- Animated gradient orb background
- Glass-effect cards with backdrop blur
- Smooth hover animations and glows
- Bold gradient typography
- Responsive grid layout (1-4 columns)

## 🔧 Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase
