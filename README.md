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
both iPhone and iPad, plus macOS through Mac Catalyst. Keep the native sources and macOS-related files in Git
alongside the web sources; Vercel deploys only the web app.

Native credentials belong in the ignored
`platforms/MobileNative/Config/Secrets.xcconfig`, using
`Secrets.example.xcconfig` as a template. Xcode projects, user state, and
build output are generated/local artifacts and are not versioned.

### Operational dashboard and navigation

Web, iPhone, iPad and Mac Catalyst open an operational dashboard instead of
a grid of section cards. All sections remain accessible from the section menu.
The user-management entry remains admin-only on the web.

The web interface uses the native Mac blue glass shell, bottom menu
launcher and grouped orbital navigation (Dashboard, Operatività, Gestione,
Strumenti). The atomic menu has three elliptical electron orbits and independently
expandable categories. Desktop web, Mac and full-size iPad windows place
destinations outside the central atom; iPhone and narrow web windows show
scrollable destination panels below a compact atom.
Command/Control-K opens the menu, Escape closes it and
Shift-Command/Control-F opens global search. The native HTML dialog keeps
keyboard focus within the menu and restores focus when closed.
The atom rotates outward on opening. Closing retracts each expanded category
in sequence, then collapses the satellites and finally the nucleus. Selecting
a destination waits for the exit to finish before navigating. The page behind
the web menu is blurred without an added dark veil. The launcher has a subtle breathing glow
and hover feedback. The dialog keeps focus and scroll locked until its exit
finishes; reopening cancels the pending close. Reduced-motion preferences
disable electron motion and close the dialog without the exit delay. Native
Apple menus use the same atomic component, with positive minimum animation
scales to avoid singular AppKit transforms.
Web sections share the native navigation accents: green calls, blue calendar,
gold to-dos, sage work, teal contacts/shopping, orange notes, coral payments,
purple passwords and pink photos. Menu icons/tiles and workspace headings,
borders and subtle surface tints use the same per-section palette.
The login, section workspaces, editors, summaries, vault controls and date
popovers now share semantic dark colors defined in `tailwind.config.js`, with
glass surfaces in `app/mac-theme.css`. Status/error colors remain distinct.
Calendar and Notes are embedded workspaces, so the header and navigation stay
available while browsing; editing and closing a draft returns to the same
workspace. The calendar agenda moves below the month grid on narrow screens.
Portaled date/photo previews are themed explicitly rather than relying on
global overrides of every fixed-position element.
These visual changes are separate from the production password-vault release.

Three summaries show today's active appointments (including overlapping
multi-day events), pending to-dos and nearby/overdue work deadlines, callbacks
and payment reminders. Each panel displays at most five entries, not a
total count. Five parallel database queries select only summary fields and
fetch at most five rows each; completed/archived events and tasks are excluded.
The web weekly chart shows event start dates and pending to-do due dates for
the next seven local calendar days, matching the native chart. Its daily exact
count queries do not inherit the five-item summary limit or the database row
return cap. An accessible table exposes the same values to screen readers.
Payment reminders are not a complete installment/advance overview: use the
Payments section for those details. Errors expose a retry rather than
pretending the dashboard is empty.

Quick actions open new event, to-do and note editors. Selecting a summary
entry opens its details; refresh and returning from a section update the
summaries. The web reloads the dashboard after an editor closes. Full web
section hooks load only when that section/editor or global search is opened,
so passwords, contacts, shopping lists and archives are not preloaded just
to build navigation counts. Open-page web reminders retain a separate
minute-refreshed metadata feed; server Web Push/APNs scheduling is unchanged.
Native section loading remains scoped to the selected workspace.

Mac Catalyst uses `Optimize Interface for Mac` (device family 6), not the
scaled iPad interface, so layout points render at native Mac size. iOS
continues to target device families 1 and 2.
Mac Catalyst defaults to the larger `Molto grande` text preset and large
controls. The account menu provides `Dimensione interfaccia` with Standard,
Grande and Molto grande; the preference persists locally on the Mac.
Sidebar and dashboard panel widths adapt to the text size. Larger system
accessibility text settings are preserved. iPhone/iPad and the web do not
use this Mac-only preset.

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

### Web calendar, task history and photos

Apply the four additive migrations `20261005020000` through `20261005050000`
before deploying the web version. The iPhone/iPad app now uses the same
lifecycle and photo schema. Existing native status strings remain valid.

Calendar events now have completion timestamps and an archive timestamp.
Completing cancels their pre-event reminders and end-event confirmation
queue. Reopening clears both timestamps; rescheduling an unfinished event
requeues its confirmation. Events without an end expire at their start.
All-day events expire at midnight after their inclusive last day, in
`Europe/Rome`, with daylight saving accounted for.

`Cose da fare` opens on `Da fare`. `Eseguite` and `Archiviate` fetch only
on an explicit search/load request, with five visible records per page
and one database lookahead. Completion date filters are inclusive.
The global search includes a separate user-triggered database search
over completed and archived events/tasks, including description and
checklist text; it does not preload the archive.

A Supabase cron job runs every five minutes, archiving **events and to-dos**
completed at least seven days ago. Work items are not automatically archived.
Existing completed tasks use their previous `updated_at` as the best
available estimate of completion time. The original status is preserved.
Archives can be restored to pending; nothing is automatically deleted.

### Native iPhone/iPad enhancements

Regenerate the Xcode project with XcodeGen after pulling. The universal
iOS target includes event completion/restoration/rescheduling, pending-only
calendar and task queries, five-item on-demand history with title/date
filters, explicit global database/history search, and private photo galleries
for notes, work items, saved checklist entries/subtasks and the dashboard.
PhotosPicker converts selected images to JPEG and enforces the existing
10 MB storage limit. Unsaved entries must be saved before attaching photos.

User-triggered Italian dictation uses Apple's Speech framework, with explicit
microphone/speech permission messages and cleanup when the editor closes.
Microphone and speech usage descriptions are generated from `project.yml`.
Real audio recognition still requires a device test.

Calendar settings reuse the existing authenticated web APIs and the selected
Google connection. Initial Google consent/renewal opens the protected web
application in the system browser: sign into the same AK Suite account,
authorize from Calendar settings and return to refresh the native connection.
Selection, date cutoff, sync, conflict choices and disconnection are native.
No Google client secret or encryption key is included in the app.

Apply `20261005060000_native_event_confirmations.sql` before releasing the
updated iOS app and deploy the updated `send-push` Edge Function and web
confirmation worker. New native devices opt into `event_confirmations`;
existing registrations default to false so older app versions do not receive
unknown confirmation destinations. The same scheduler delivers Web Push and
APNs, retrying failures. APNs category `EVENT_CONFIRMATION` offers authenticated
foreground Yes/No actions: Yes completes after sign-in, No opens the date/time
editor, and a body tap opens the confirmation summary. Signing out removes
the device registration. APNs credentials, environment, signing/provisioning
and actual iPhone/iPad receipt must be validated on physical devices.

Native lifecycle regression checks (on macOS):

```bash
swiftc platforms/MobileNative/AKSuite/Core/Networking/NativeLifecycle.swift \
  tests/NativeLifecycleTests.swift -o /tmp/aksuite-lifecycle-tests
/tmp/aksuite-lifecycle-tests
```

The shared Xcode target enables Mac Catalyst. After regenerating the project,
choose `My Mac (Mac Catalyst)` with scheme `AKSuite`. It uses the same bundle
identifier, Supabase backend and source code as iPhone/iPad, not a WebView.
Mac builds use separate sandbox entitlements for outgoing network requests,
user-selected files, microphone input and APNs; iOS retains its entitlements.
Debug uses development APNs and Release uses production APNs. The current
APNs sender environment must match the installed build.

Automatic signing requires a Mac Catalyst provisioning profile for
`com.aksuite.app`, with Push Notifications enabled. An iOS profile alone
does not cover Mac Catalyst. Actual Mac push delivery, microphone, file/photo
selection and window layouts require interactive validation. Distribution
outside the Mac App Store additionally requires Developer ID signing and
notarization. Keyboard/menu/desktop visual refinements remain incremental.
Reopened/deleted events are removed from the currently displayed history
without an extra archive query, preserving text/date filters. An explicit
new search can load an event again if it was subsequently completed again.
Authenticated event errors are now surfaced rather than saved silently
only in browser localStorage. Previously stored localStorage copies are
not deleted, but the authoritative calendar requires sign-in and Supabase.

Photos use a private `photos` Storage bucket plus owner-only `photo_assets`
metadata. JPEG, PNG and WebP are supported, up to 10 MiB per image.
The general gallery and galleries on saved notes/work items/checklist
entries load five images at a time only when requested. Images use expiring
signed URLs; refresh the gallery when previews expire. Unsaved checklist
entries must be saved before attaching photos. Deleting a note or work item
keeps its photos in the general gallery instead of leaving inaccessible
storage objects. Deleting a photo removes both object and metadata.

Dictation is available for notes, event descriptions, work notes and new
checklist/subtask entries. It is user-triggered, Italian, and appends text.
Browser support varies; unsupported browsers can use keyboard dictation.
The microphone is never activated automatically. Browser speech services
may process audio remotely; do not dictate passwords or sensitive data.

### Closed-page Web Push

Confirmation delivery uses `/api/web-push/send`, not an open-tab timer.
The worker also invokes the native APNs sender for opted-in iPhone/iPad
registrations; existing pre-event native reminder functions remain separate.
Configure server-only variables in Vercel Production:

- `WEB_PUSH_PUBLIC_KEY` and `WEB_PUSH_PRIVATE_KEY`: generate a VAPID pair
  with the installed `web-push` package. Keep the same keys on redeploys.
- `WEB_PUSH_SUBJECT`: a contact URL such as `https://aksuite.app` or `mailto:`.
- `CRON_SECRET`: a random secret shared only with the Supabase scheduler.
- `SUPABASE_SERVICE_ROLE_KEY`: the existing server-only key.

Store `CRON_SECRET` in Supabase Vault as `aksuite_web_cron_secret`. Enable
the **web-event-confirmations** section of
`supabase/web-integrations-cron.sql` only after deploying and checking the
endpoint. The worker claims at most five jobs per run with a five-minute
lease, retries up to twelve times, records delivery failures, and removes
expired browser subscriptions. A partially failed multi-device delivery
may be retried; a stable notification tag replaces duplicate visible
notifications. Jobs without subscriptions are counted as skipped, not
delivered. Existing past events are not backfilled with push requests.

The user must opt in from Calendar settings on each browser/device.
Denied permission and unsupported browsers are displayed explicitly.
Web Push on iOS/iPadOS requires a Home Screen web app and iOS 16.4+;
use `https://aksuite.app/?web=1` to install the primary web version rather
than the legacy mobile/tablet redirect. The PWA launch URL and notification/
OAuth response links stay on this origin, as do API/service-worker resources.
Normal browser root navigation retains the existing device redirects;
legacy mobile/tablet web deployments retain their existing behavior. Native
app updates require a separate signed installation/build.
The browser may omit notification action buttons. Clicking the body opens
the same authenticated response screen. `Sì` completes only after sign-in;
`No` opens an editor where the user chooses the new date/time. Subscription
revocation on logout prevents subsequent notifications to a signed-out
browser; unreachable subscriptions are removed by the sender.

### Google Calendar configuration

OAuth is intentionally disabled until the following **server-only**
variables are configured:

- `APP_URL=https://aksuite.app` (local OAuth needs a separately registered
  localhost redirect and a local APP_URL).
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- `GOOGLE_TOKEN_ENCRYPTION_KEY`: a random 32-byte key, encoded as Base64.
  Back it up securely; changing it prevents decryption of saved tokens.

Create a Google Cloud project, enable Google Calendar API, configure the
OAuth consent screen and add test users while in Testing, then create
a **Web application** OAuth client. Register this exact production redirect:
`https://aksuite.app/api/google-calendar/callback`. Configure secrets via
the Vercel CLI/dashboard, never source code or chat. Testing-mode Google
refresh tokens may expire after seven days; production use may require
Google app verification for Calendar scopes.

Linking uses a one-time, ten-minute state bound to an HttpOnly cookie,
PKCE, and encrypted server-only credentials. Choose a calendar with write
access and the date from which to initially import Google events. AK Suite
exports only active appointments owned by that user at initial selection;
future changes and deletions are queued transactionally. Photos, notes,
passwords and other users' appointments are not exported.

Manual sync processes ten remote events and up to ten local changes per
lot. Pagination, stable identity mappings, deletion tombstones, conditional
writes and a server lease prevent duplicate creation or silent conflict
overwrites. Choose the AK Suite or Google version for conflicts; the
cursor is not advanced past unresolved changes. Expired sync tokens cause
a full reread without wiping local events. Google all-day exclusive ends
are converted to the inclusive dates used by the app. Complex recurrence
rules are preserved; completing a recurring master applies to the series,
not an individual occurrence.

Only after a real OAuth/manual-sync test succeeds, enable the **Google**
section of `supabase/web-integrations-cron.sql`. It processes one selected
connection per minute, with the least recently synced first. Connections
with errors/conflicts require manual resolution before background retries.
Disconnect revokes OAuth where possible and deletes private integration
credentials/mappings, without deleting appointments on either service.
Revocation failures explicitly instruct the user to revoke access in Google.

Validate with:

```sh
node --test tests/web-enhancements.test.cjs tests/google-sync.test.cjs tests/shopping.test.cjs
npm run build
```

`tests/web-enhancements.integration.sql` checks real lifecycle triggers,
the exact seven-day boundary, archive cursor pagination, private photos,
saved checklist scopes, queue leases, server-only RPC permissions and
Google outbox/tombstone behavior inside a transaction that rolls back.
Google sync unit tests use simulated API responses: they do **not**
replace a real OAuth, selected-calendar and closed-page push smoke test.

### Existing native APNs reminders

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
