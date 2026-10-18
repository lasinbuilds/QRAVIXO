# QRAVIXO

A static, browser-based QR studio with styled PNG, SVG and JPEG exports.
No account, database, backend, build step or saved QR history is required.

## Run and deploy

Open `index.html` in a modern browser, or run `python3 -m http.server 8000`
from this directory and visit http://localhost:8000. Publish the entire
repository's web files, including `monitoring.js` and `vendor/`, to a static
host. Uploading only index.html will no longer work.

The QR engine is bundled locally. Google Fonts are optional network requests;
system fonts are used if unavailable. The engine is qr-code-styling 1.9.2
from https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js.
Its license is in vendor/LICENSE.qr-code-styling. Review and test dependency
updates before replacing the vendored file.

## Files and data flow

- `index.html`: layout, CSS, TYPES format definitions, THEMES and application logic.
- `monitoring.js`: privacy-limited browser error reporting, disabled remotely by default.
- `vendor/`: pinned QR library and license.
- `tests/`: payload, privacy, generation-state and browser regression checks.

`renderForm()` builds the current format's fields. Input handlers update
`state.fields` in tab memory. `currentData()` validates and builds a payload;
`updateCapacityMeter()` estimates capacity. `generate()` creates a QR and
waits for rendering before enabling downloads. A generation counter prevents
older asynchronous results from replacing newer input. `download()` exports
the current successfully rendered instance.

Switching formats or pressing Clear entered data clears the current form;
refreshing resets the whole application. There is no localStorage or server
persistence. Clearing does not delete previously downloaded images.

Website/media formats encode URLs; no media is uploaded. Business, Menu and
Coupon encode text, not hosted pages. Social Media and List of Links encode
one URL or a text list. Apps encodes one store URL or a list of two URLs.
Wi-Fi and vCard use their corresponding QR payload formats.

## Privacy and authorization

There are no shared records or remote user-data endpoints to authorize.
Anyone holding a QR image can decode its contents, including Wi-Fi passwords.
Password masking protects the on-screen field only, not the QR payload.
Use guest-network credentials for broadly distributed Wi-Fi codes.

Entered data is escaped before being inserted into form HTML. Web-link fields
allow HTTP/HTTPS only and reject embedded credentials. vCard values receive
format-specific escaping. Third-party fonts still make network requests.

If accounts or saved records are added, enforce authentication and record
ownership on every server-side read, update and delete. A browser-only login
or hidden admin panel is not access control. Keep secret keys on the server;
frontend environment variables are public once shipped.

## Error reporting: action still required

Errors are logged locally now. **No remote collector or email alert is active.**
To receive alerts:

1. Provision an HTTPS error collector under your control (or a small server
   endpoint forwarding to your monitoring service).
2. Set `endpoint` in monitoring.js to that collector's public URL. Do not add
   service credentials to browser code.
3. Accept POST JSON with app, operation and release fields; allow this site's
   origin through CORS. Apply rate limits and validate the operation allowlist.
4. Configure your monitoring service to email you on new errors.
5. On a staging deployment, run
   `QravixoMonitoring.report("render")` in the browser console and verify both
   receipt and an actual email notification before considering setup complete.

The reporter intentionally omits exception messages/stacks, page URLs, form
values and QR data to avoid transmitting credentials or personal information.
It sends at most one event per operation per page load. Monitoring network
failures are caught without recursion. An unavailable collector cannot block
QR generation. No session replay is installed.

## Development and verification

Use branches and descriptive commits, review changes in pull requests, and
keep the existing Git history. `.gitignore` excludes local environment files.

Run `node tests/payload.cjs` and `node tests/generation.cjs` for dependency-free
checks of validation, escaping, telemetry privacy and asynchronous rendering.

For browser regression checks, install Playwright in your development environment
(`npm install --no-save playwright`, then `npx playwright install chromium`).
Start the local server above, then run `node tests/smoke.cjs`.

Before deployment, scan representative exports with a phone, especially large
payloads and custom colours. Capacity is an estimate, not a scan guarantee.
Dark/inverted or low-contrast themes may not scan on every camera. Codes are
static; QRAVIXO cannot revoke exported codes or control linked sites.
