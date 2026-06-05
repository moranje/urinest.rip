# Telemetry en privacy

Status: gereconcilieerd op 2026-06-01.

Framework-brede security- en privacycontracten staan in `docs/framework-security-privacy.md`.
Die contracten zijn leidend voor consumer apps, nieuwe domeinpakketten en package boundaries.

## Stack

De app gebruikt bewust de lokale telemetry-stack in plaats van `@oranje/telemetry`.
Dat is de huidige gekozen lijn omdat urinest.rip al een compacte, app-specifieke
pipeline heeft:

- `handleError()` classificeert fouten, toont gebruikerstaal en schrijft naar de sink.
- `log-sink.ts` buffert events, scrubt context, bewaart flow-trail en schrijft naar Supabase `app_logs`.
- `flow-trail.ts` legt flow-start, vraagstappen, redirects en resultaten vast.
- `scrub.ts` verwijdert BSN-achtige nummers, e-mailadressen, JWT's, tokens en geneste PHI-achtige waarden.
- `web-vitals.ts` meet FCP, LCP, CLS en INP via `PerformanceObserver` en schrijft alleen
  metricnaam, afgeronde waarde, rating en visibility-state naar dezelfde sink.
- `main.ts` en `App.vue` vangen global errors, unhandled rejections en renderfouten af.

## Privacyregels

- Vrije tekst en technische context gaan altijd door `scrubValue()` voordat ze naar `app_logs` gaan.
- Questionnaire-progress wordt alleen in `sessionStorage` bewaard, met TTL, en bevat per flow de
  geselecteerde antwoordobjecten (`value`/`text`) voor actuele manifestvragen. De huidige flows
  vragen geen vrije tekst of patientidentificatoren; stale vraagkeys worden bij restore gefilterd.
- Er worden geen namen, geboortedata, BSN's of patiëntidentificatoren gevraagd of opgeslagen.
- Bij storage-blokkades degradeert de app functioneel door zonder crash.

## Sink en observability

- `VITE_TELEMETRY_SOURCE` bepaalt de discriminator voor gedeelde Supabase-logtabellen.
  Default is `urinestrip`; consumer apps kunnen bijvoorbeeld `huisarts.land`,
  `cvrm-prevent` of `poh.dm-care` gebruiken zonder frameworkcode aan te passen.
- De sink heeft een circuit breaker; bij herhaalde failures wordt `localStorage.log_sink_down` gezet.
- Als de circuit breaker gezet is, blijft persistence na reload uit tot de flag wordt gewist.
- In dev staat Supabase-persistence standaard uit; zet `VITE_ENABLE_LOG_PERSISTENCE=true` om lokaal echt naar `app_logs` te schrijven.
- De admin-log UI toont een banner wanneer die breaker actief is geweest.
- Source maps worden in GitHub Actions geupload na productiebuild.
- Richtlijn- en flowversies worden bij `loadInitialData()` als `flow.versions` telemetry-event vastgelegd.
- Web-vitals worden als `web_vital.fcp`, `web_vital.lcp`, `web_vital.cls` en `web_vital.inp`
  vastgelegd wanneer de browser de benodigde `PerformanceObserver` entrytypes ondersteunt.

## Tests

Verplicht groen:

- `src/lib/__tests__/scrub.test.ts`
- `src/lib/__tests__/errors.test.ts`
- `src/lib/__tests__/flow-trail.test.ts`
- `src/lib/__tests__/log-sink.test.ts`
- `src/lib/__tests__/web-vitals.test.ts`
- `src/lib/__tests__/storage.test.ts`
- `src/lib/__tests__/app-compatibility.test.ts`
- `fixtures/urinestrip-consumer/src/urinestrip.consumer.test.ts`
