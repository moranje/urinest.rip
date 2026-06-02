# Framework Security En Privacy Contract

Status: vastgesteld op 2026-06-02.

Dit contract geldt voor `@beslismodel/core`, `@beslismodel/compiler`, `@beslismodel/vue`,
`@beslismodel/testing` en consumer apps zoals Urinest.rip en huisarts.land.

## Boundaries

| Laag                    | Mag wel                                                                        | Mag niet                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `@beslismodel/core`     | Pure beslislogica, runtime context, calculatorcontracten, audit trail modellen | Vue, DOM, fetch, storage, Supabase, appnamen, CVRM/PREVENT-specifieke API                      |
| `@beslismodel/compiler` | Flowvalidatie, schema, manifestgeneratie, Vite/Rolldown plugin                 | Runtime storage, telemetry sink, app-adminbeleid                                               |
| `@beslismodel/vue`      | Headless UI, Pinia store factory, route helpers, telemetry adapter interface   | Supabase client, admin dashboard, hard-coded app source, direct browser storage buiten adapter |
| `@beslismodel/testing`  | Snapshot helpers, fixture runners, clinical safety checks                      | Productie-telemetry, Supabase, patientdata                                                     |
| Consumer app            | Branding, flows, icons, Supabase adapter, admin routes, deployment headers     | Package-contracten breken of PHI naar package telemetry/storage sturen                         |

Admin- en RLS-logica blijft app-only. Framework packages mogen geen admin route, Supabase import,
RLS-policy, service-keygebruik of logdashboard bevatten.

## Threat Model

| Dreiging                                                         | Impact  | Mitigatie                                                                           | Eigenaar                         |
| ---------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| XSS wijzigt klinische UI-copy of resultaatadvies                 | Kritiek | Sanitizer contract voor markdown/html, CSP, geen user HTML in flows                 | Consumer app + compiler          |
| Malicious flow metadata injecteert links, HTML of vreemde velden | Hoog    | Strict schema, sanitizer, security tests voor metadata, source allowlist waar nodig | Compiler + consumer app          |
| PHI/PII lekt via telemetry                                       | Hoog    | No-PHI telemetry contract, scrubber, forbidden fields, adapter tests                | Consumer app                     |
| PHI/PII lekt via storage                                         | Hoog    | No-PHI storage contract, TTL, key scoping, geen vrije tekst                         | Consumer app + Vue store adapter |
| Source maps publiek deployen                                     | Hoog    | Upload naar private Supabase Storage, daarna `.map` uit `dist` verwijderen          | CI/CD                            |
| Admin logs toegankelijk voor niet-admin users                    | Hoog    | RLS met admin claim/email allowlist, app-only admin routes, auth guard              | Consumer app                     |
| Consumer app gebruikt te brede CSP                               | Midden  | CSP guidance hieronder, route smoke tests, security headers test                    | Consumer app                     |
| Calculator gebruikt verkeerde formuleversie                      | Hoog    | Domeinpackage met versie, bron, testvectors, geen calculatorimplementatie in core   | Domain package                   |
| Richtlijn veroudert zonder signaal                               | Hoog    | Reviewdatums, traceability gate, release notes, max review age                      | Consumer app                     |

## No-PHI Telemetry Contract

Telemetry mag technische kwaliteit meten, maar mag geen patientroute kunnen reconstrueren.

Toegestaan:

- app/source ID;
- flow ID en flowversie;
- rol of contextlabel, bijvoorbeeld `arts`, `triagist`, `doktersassistent`, `verpleegkundige`, `poh`;
- technische vraag-ID of stap-ID;
- outcome-type, bijvoorbeeld `result`, `redirect` of `none`;
- rule ID;
- package-, build- en featureversie;
- gehashte of geredacte route/context;
- foutklasse, statuscode, module en fingerprint.

Verboden:

- naam, geboortedatum, BSN, adres, telefoonnummer, e-mail;
- vrije tekst uit vragen of notities;
- ruwe antwoordwaarden wanneer die klinisch herleidbaar zijn;
- ruwe calculatorinputs of meetwaarden;
- volledige antwoordsets;
- URL's met klinische parameters;
- Supabase tokens, JWT's, API keys of service keys;
- bronbestanden of snippets die patientdata bevatten.

Adapterregel: packages sturen alleen events naar een geinjecteerde telemetry adapter. Zonder adapter
is telemetry no-op. Consumer apps zijn verantwoordelijk voor scrubber, batching, persistence,
retentie en backendpolicy.

## No-PHI Storage Contract

Storage mag alleen functionele voortgang bevatten wanneer dit nodig is voor UX of safety.

Eisen:

- storage adapter is injecteerbaar;
- keys zijn app-configurabel en app-gescoped;
- TTL verplicht voor antwoorden, redirect trails en recovery state;
- storage degradeert naar memory/no-op wanneer browser storage faalt;
- geen vrije tekst, patient-ID, geboortedatum, BSN, contactdata of ruwe calculatorinputs;
- rol en flowvoortgang mogen alleen als technische context worden bewaard;
- localStorage alleen voor niet-klinische voorkeuren zoals thema of rol;
- sessionStorage voor tijdelijke flowstate wanneer persistence nodig is;
- clear/reset pad aanwezig bij rolwissel, flowwissel en verlopen TTL.

## CSP Guidance Voor Consumers

Minimale CSP voor consumer apps:

```text
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self';
style-src 'self';
img-src 'self' data: blob:;
manifest-src 'self';
worker-src 'self' blob:;
connect-src 'self' <telemetry-backend> <supabase-rest> <supabase-wss>;
upgrade-insecure-requests
```

Aanpassen per app:

- Voeg alleen noodzakelijke `connect-src` domeinen toe.
- Gebruik geen `unsafe-inline` voor scripts.
- Gebruik `style-src-attr 'unsafe-inline'` alleen wanneer legacy inline style-attributen nog nodig zijn.
- Sta fonts/images alleen toe vanaf expliciet gebruikte domeinen.
- Houd `frame-ancestors 'none'` voor klinische tools.
- Voeg report-only CSP toe bij migraties, maar productie moet enforcing CSP hebben.
- Test headers in CI, zoals Urinest.rip doet met `src/lib/__tests__/security-headers.test.ts`.

Urinest.rip gebruikt `public/_headers` voor CSP, HSTS, X-Frame-Options, Referrer-Policy en
Permissions-Policy.

## Source Map Contract

Productie-source maps zijn nodig voor foutanalyse, maar mogen niet publiek in deploy artifacts
blijven.

CI-volgorde:

1. Bouw productie-app met source maps.
2. Upload `.map` files naar private Supabase Storage of gelijkwaardige private backend.
3. Gebruik service key alleen als CI-secret.
4. Log alleen bestandsnamen en HTTP-statussen, nooit secrets.
5. Verwijder alle `.map` files uit `dist`.
6. Laat deploy falen wanneer nog `.map` files in `dist` staan.
7. Controleer bucket/pad private is en niet via publieke asset-URL uitlekt.

Urinest.rip doet dit in `.github/workflows/ci.yml` met `Upload source maps` gevolgd door
`Remove source maps from deploy artifact`.

Consumer apps moeten eigen sourcemap pad gebruiken:

```text
sourcemaps/<app-id>/<release>/<asset-name>.map
```

Gebruik geen gedeeld pad zonder app-ID, anders kunnen releases elkaar overschrijven.

## Admin En RLS

Admin dashboards blijven buiten framework packages.

Eisen voor consumer apps:

- admin routes lazy-loaden;
- admin auth guard voor iedere admin route;
- RLS gebruikt admin claim/email allowlist;
- log reads/writes lopen via app-scoped RPC of policies;
- anon insert wordt begrensd op source, payload size en rate;
- service-role key alleen in CI/server context;
- admin UI toont alleen gescrubde logs;
- package boundary check faalt bij Supabase/import/admin lek in framework package.

## Consumer Release Checklist

- [x] Framework packages bevatten geen Supabase/admin/storage hardcoding (`npm run check:framework-boundaries`).
- [x] Telemetry adapter is no-op zonder consumer config (`packages/vue/src/telemetry.ts`, `npm run check:vue-package`).
- [x] No-PHI telemetry contract is getest (`telemetry-privacy`, `log-sink`, `error-matrix`).
- [x] No-PHI storage contract is getest (`storage`, `redirect-trail`, package boundary checks).
- [x] CSP headers zijn enforcing en getest (`security-headers`).
- [x] Source maps worden prive geupload en uit deploy artifact verwijderd (`.github/workflows/ci.yml`).
- [x] Admin routes zijn app-only, lazy en auth-gated (`router/index.ts`, package boundary checks).
- [x] RLS/admin policies zijn getest met admin en niet-admin user (`supabase-migrations`).
- [x] Malicious flow metadata tests zijn groen (`flow-compiler`, `compiler`).
- [ ] Calculatorformules zitten in domain packages met testvectors.
- [x] Traceability en reviewdatums zijn actueel (`npm run check:guidelines`).
