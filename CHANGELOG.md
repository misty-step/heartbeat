# [1.7.0](https://github.com/misty-step/heartbeat/compare/v1.6.0...v1.7.0) (2026-02-21)

### Features

- **ux:** Replace browser confirm() with custom DeleteConfirmModal ([#96](https://github.com/misty-step/heartbeat/issues/96)) ([9e74067](https://github.com/misty-step/heartbeat/commit/9e740675771029bbebd89add014940015d07c3df)), closes [#41](https://github.com/misty-step/heartbeat/issues/41) [#41](https://github.com/misty-step/heartbeat/issues/41)

# [1.6.0](https://github.com/misty-step/heartbeat/compare/v1.5.0...v1.6.0) (2026-02-21)

### Bug Fixes

- **ci:** use GH_RELEASE_TOKEN for semantic-release ([8d5f45d](https://github.com/misty-step/heartbeat/commit/8d5f45d9f6e9ebc4a1794bf12e6bbf410601a250))
- **security:** add SSRF protection to webhook URL validation ([#90](https://github.com/misty-step/heartbeat/issues/90)) ([4c56c9d](https://github.com/misty-step/heartbeat/commit/4c56c9dd34aae265e2688cd59590191ac45feb00)), closes [#32](https://github.com/misty-step/heartbeat/issues/32)
- **status:** Handle unavailable uptime stats gracefully ([#91](https://github.com/misty-step/heartbeat/issues/91)) ([0f22ff9](https://github.com/misty-step/heartbeat/commit/0f22ff91011c76125299a3cd308124d6d4937f6a)), closes [#87](https://github.com/misty-step/heartbeat/issues/87)
- **ux:** Surface specific error messages on monitor creation ([#85](https://github.com/misty-step/heartbeat/issues/85)) ([45673c0](https://github.com/misty-step/heartbeat/commit/45673c088d84a9d037369c854ce6471f8bdd87b4)), closes [#40](https://github.com/misty-step/heartbeat/issues/40)

### Features

- Add curated status page themes (Vital tier) ([#80](https://github.com/misty-step/heartbeat/issues/80)) ([60b8cf6](https://github.com/misty-step/heartbeat/commit/60b8cf62117e9946b08509dab814e7fc7da4d1c2))
- Bento Zen landing page with authenticated user redirect ([#88](https://github.com/misty-step/heartbeat/issues/88)) ([97d0b30](https://github.com/misty-step/heartbeat/commit/97d0b30faf0ddd25878081f304619a4439162113))
- **ux:** Replace inline feedback messages with sonner toast notifications ([#95](https://github.com/misty-step/heartbeat/issues/95)) ([c237066](https://github.com/misty-step/heartbeat/commit/c237066dee6a5cc1af67d6eb46fca02499871ee9)), closes [#39](https://github.com/misty-step/heartbeat/issues/39)

### Performance Improvements

- **cleanup:** Use indexed query for getOldChecks ([#83](https://github.com/misty-step/heartbeat/issues/83)) ([04878fb](https://github.com/misty-step/heartbeat/commit/04878fb143bc8f6233e251e47c11c74d034fff9d)), closes [#13](https://github.com/misty-step/heartbeat/issues/13)
- **status:** Parallelize status page API calls ([#84](https://github.com/misty-step/heartbeat/issues/84)) ([0129f1c](https://github.com/misty-step/heartbeat/commit/0129f1c546beb05635e3f7a0640cb52df8acd9da)), closes [#14](https://github.com/misty-step/heartbeat/issues/14)

# [1.5.0](https://github.com/misty-step/heartbeat/compare/v1.4.0...v1.5.0) (2026-01-27)

### Bug Fixes

- **a11y:** Add Escape key handler to MonitorSettingsModal ([#77](https://github.com/misty-step/heartbeat/issues/77)) ([af98cdf](https://github.com/misty-step/heartbeat/commit/af98cdfa86907a5914f23253bdc1a3961a5d8123)), closes [#45](https://github.com/misty-step/heartbeat/issues/45)
- **a11y:** Add screen reader support to cinematic StatusIndicator ([#78](https://github.com/misty-step/heartbeat/issues/78)) ([80fcb0f](https://github.com/misty-step/heartbeat/commit/80fcb0fc65bf6fb3bf0f7dc631b89696fae4308f)), closes [#18](https://github.com/misty-step/heartbeat/issues/18)

### Features

- **ux:** Add error boundaries for runtime crash handling ([#79](https://github.com/misty-step/heartbeat/issues/79)) ([9f879e9](https://github.com/misty-step/heartbeat/commit/9f879e9d8b6482e6b11ff5fcdcd7ecb41f47738f)), closes [#17](https://github.com/misty-step/heartbeat/issues/17)

# [1.4.0](https://github.com/misty-step/heartbeat/compare/v1.3.0...v1.4.0) (2026-01-27)

### Features

- **observability:** Add PostHog analytics and health check endpoint ([#75](https://github.com/misty-step/heartbeat/issues/75)) ([f097637](https://github.com/misty-step/heartbeat/commit/f097637cab311348191de962c7836f8c7984aaf0))

# [1.3.0](https://github.com/misty-step/heartbeat/compare/v1.2.3...v1.3.0) (2026-01-22)

### Bug Fixes

- Add /pricing and /api/stripe/webhook to public routes ([20c395f](https://github.com/misty-step/heartbeat/commit/20c395f5a22095a9106f626112d407c7df1c81d6))

### Features

- Add Stripe subscription monetization ([#73](https://github.com/misty-step/heartbeat/issues/73)) ([f212c57](https://github.com/misty-step/heartbeat/commit/f212c5701d36759ca0a5cf25c5b6ff85a2be0ac0)), closes [#72](https://github.com/misty-step/heartbeat/issues/72)

## [1.2.3](https://github.com/misty-step/heartbeat/compare/v1.2.2...v1.2.3) (2026-01-11)

### Performance Improvements

- Use singleton ConvexHttpClient for public queries ([#63](https://github.com/misty-step/heartbeat/issues/63)) ([d507837](https://github.com/misty-step/heartbeat/commit/d50783715179535061a1e8ff033cce726f1beae5)), closes [#35](https://github.com/misty-step/heartbeat/issues/35)

## [1.2.2](https://github.com/misty-step/heartbeat/compare/v1.2.1...v1.2.2) (2026-01-11)

### Bug Fixes

- **security:** Add auth check to incidents.getForMonitor query ([#62](https://github.com/misty-step/heartbeat/issues/62)) ([1832e83](https://github.com/misty-step/heartbeat/commit/1832e83036817a2b192712732b6446fb52b9fbc3)), closes [#31](https://github.com/misty-step/heartbeat/issues/31)

## [1.2.1](https://github.com/misty-step/heartbeat/compare/v1.2.0...v1.2.1) (2026-01-11)

### Bug Fixes

- **security:** Add auth checks to checks.ts query functions ([#60](https://github.com/misty-step/heartbeat/issues/60)) ([e7070d9](https://github.com/misty-step/heartbeat/commit/e7070d97abe0e700db089b38d4f82990857dd61f)), closes [#30](https://github.com/misty-step/heartbeat/issues/30)

# [1.2.0](https://github.com/misty-step/heartbeat/compare/v1.1.5...v1.2.0) (2026-01-11)

### Features

- Add email notifications for incidents ([#28](https://github.com/misty-step/heartbeat/issues/28)) ([458c810](https://github.com/misty-step/heartbeat/commit/458c810084f25640c0a58a6caf273b601ec69955))

## [1.1.5](https://github.com/misty-step/heartbeat/compare/v1.1.4...v1.1.5) (2026-01-01)

### Bug Fixes

- Block internal network URLs to prevent SSRF attacks ([#27](https://github.com/misty-step/heartbeat/issues/27)) ([16b8f45](https://github.com/misty-step/heartbeat/commit/16b8f45b1c3c6eaa4421749401d9766b3491669f)), closes [#15](https://github.com/misty-step/heartbeat/issues/15)

## [1.1.4](https://github.com/misty-step/heartbeat/compare/v1.1.3...v1.1.4) (2025-12-17)

### Bug Fixes

- Use ConvexHttpClient for ISR-compatible public queries ([35d91f7](https://github.com/misty-step/heartbeat/commit/35d91f73c5e992766ea46c77cb3b2cb31fb7314f))

## [1.1.3](https://github.com/misty-step/heartbeat/compare/v1.1.2...v1.1.3) (2025-12-16)

### Bug Fixes

- centralize visibility checks with type guard helper ([3eed9ec](https://github.com/misty-step/heartbeat/commit/3eed9ecfeac81a3e480c7dc0902b23af3e04a0e5))

## [1.1.2](https://github.com/misty-step/heartbeat/compare/v1.1.1...v1.1.2) (2025-12-16)

### Bug Fixes

- make visibility optional to complete migration fix ([549b636](https://github.com/misty-step/heartbeat/commit/549b636b8f05017a1c0646719943a172e0acf0b0))

## [1.1.1](https://github.com/misty-step/heartbeat/compare/v1.1.0...v1.1.1) (2025-12-15)

### Bug Fixes

- make status slug optional to unblock production deployment ([83ad384](https://github.com/misty-step/heartbeat/commit/83ad3846f188323fbb01900014f65d015633f0d8))

# [1.1.0](https://github.com/misty-step/heartbeat/compare/v1.0.0...v1.1.0) (2025-12-13)

### Features

- individual monitor status pages ([#5](https://github.com/misty-step/heartbeat/issues/5)) ([444ef27](https://github.com/misty-step/heartbeat/commit/444ef2779ade238118d889eb2967a235cbcd619f))

# 1.0.0 (2025-12-05)

### Bug Fixes

- add /s routes to public middleware matcher ([874384d](https://github.com/misty-step/heartbeat/commit/874384d128afcb25be952ced8b80bdbaf13a50aa))
- harden deprecated project slug query ([1a651b8](https://github.com/misty-step/heartbeat/commit/1a651b8e0d906d81abe085e796747fc0bb108e53))
- move dark mode [@media](https://github.com/media) query outside [@theme](https://github.com/theme) directive ([ea1c8b4](https://github.com/misty-step/heartbeat/commit/ea1c8b40ae390deff577904902cc35e431407b96))

### Features

- add AddMonitorForm component with validation and auto-slug ([8e80539](https://github.com/misty-step/heartbeat/commit/8e80539fa329f18dc4b2e41b7b4e24721a36ac45))
- add deploy:check script for pre-deploy validation ([ac0060e](https://github.com/misty-step/heartbeat/commit/ac0060e8eacde08021a6b4e2dc7ea925c90a7a00))
- add EKG pulse favicon ([852916f](https://github.com/misty-step/heartbeat/commit/852916f92feb6cbffeb1801c43e58b2c90c1cf53))
- add ISR configuration to status pages ([6369c59](https://github.com/misty-step/heartbeat/commit/6369c59bae68d928a77fb01323c2be3e9f462ad1))
- add mobile responsiveness to status page ([745ca10](https://github.com/misty-step/heartbeat/commit/745ca1071c01b2b849fa655e00ee3e780da62af5))
- add monitor visibility args ([df79e51](https://github.com/misty-step/heartbeat/commit/df79e515c28fb82594bb07d36b08f231aba7076e))
- add monitor visibility schema ([48bcc4f](https://github.com/misty-step/heartbeat/commit/48bcc4fceb1638d45c599633e777a27cf6c1ab58))
- add MonitorSettingsModal with edit and delete functionality ([36ff9bb](https://github.com/misty-step/heartbeat/commit/36ff9bbddb357efc6e99369c9c145f1dc63d0d74))
- add public projection helpers ([1b48f95](https://github.com/misty-step/heartbeat/commit/1b48f957daa20cffd01272fa7a990211ae1ddf40))
- add public queries for status pages ([2496659](https://github.com/misty-step/heartbeat/commit/249665959a731e9d22cc610e5021df7a62aac553))
- add single-command dev server with concurrently ([7e91020](https://github.com/misty-step/heartbeat/commit/7e91020109999c4701389769d97a6c325cc725fd))
- add visibility backfill migration ([e601553](https://github.com/misty-step/heartbeat/commit/e601553d83eef174cb09ee796c662a9f46c527d5))
- add visibility toggle to dashboard UI (Phase 2) ([ed12a3f](https://github.com/misty-step/heartbeat/commit/ed12a3fcd82937025203aeaabb38a5166e548028))
- Automated QA Suite ([#1](https://github.com/misty-step/heartbeat/issues/1)) ([3e85195](https://github.com/misty-step/heartbeat/commit/3e851953ca5487830eb225d385325c4a0d0ed8ee))
- compose status page layout with all components ([dd84fab](https://github.com/misty-step/heartbeat/commit/dd84fab0b8dec3aaa6250aaaaf59c40e5cb3ac34))
- configure Clerk authentication with Convex integration ([403f4c4](https://github.com/misty-step/heartbeat/commit/403f4c4cb7015532372b69329b88bd67b5a4a4a7))
- configure Convex cron jobs for monitoring heartbeat and cleanup ([e1513f0](https://github.com/misty-step/heartbeat/commit/e1513f012326d2503a80943a0e58ef3f9ea735e1))
- configure Geist fonts in root layout with antialiasing ([efe22b8](https://github.com/misty-step/heartbeat/commit/efe22b86d116d31b63c24b86ea02e5ac647d6efa))
- configure Tailwind CSS 4 design system with refined minimal aesthetic ([15b1c8d](https://github.com/misty-step/heartbeat/commit/15b1c8d6c20ff634182f75f6e1f71bb91b817b92)), closes [#10b981](https://github.com/misty-step/heartbeat/issues/10b981) [#f59e0b](https://github.com/misty-step/heartbeat/issues/f59e0b) [#ef4444](https://github.com/misty-step/heartbeat/issues/ef4444)
- create Convex check queries for monitoring history ([01fbb5d](https://github.com/misty-step/heartbeat/commit/01fbb5d54ee2416ebd13980c86da9af5fc0f0e05))
- create Convex incident queries for status pages ([68c6a65](https://github.com/misty-step/heartbeat/commit/68c6a659fd770efe695a30dc293f21a82612e9e2))
- create Convex monitor queries and mutations ([37bee63](https://github.com/misty-step/heartbeat/commit/37bee6357b58b9b3163d58b1fc184cbcd865443f))
- create dashboard page with real-time monitor list ([73210e1](https://github.com/misty-step/heartbeat/commit/73210e1692193c8ecadc17b6475a1ad5d4562b5d))
- create DashboardMonitorCard with expand/collapse and actions ([86f3a78](https://github.com/misty-step/heartbeat/commit/86f3a784471a404272d3faf48c86318e128f66a0))
- create IncidentTimeline component for incident history ([32561de](https://github.com/misty-step/heartbeat/commit/32561decfad35088d223f29b89ec64d8e2057db3))
- create minimal landing page for MVP ([d2feee7](https://github.com/misty-step/heartbeat/commit/d2feee7ecdad5b8ce50f003b37e219e797d8d93c)), closes [#features](https://github.com/misty-step/heartbeat/issues/features)
- create MonitorCard component for status pages ([515792f](https://github.com/misty-step/heartbeat/commit/515792f2430da49b16f8c64b9340e18c3e53fb10))
- create status page route with dynamic slug ([6e706d2](https://github.com/misty-step/heartbeat/commit/6e706d290aef7b469c9afba4420e30cc2cab8580))
- create StatusHeader component for status pages ([7e055a1](https://github.com/misty-step/heartbeat/commit/7e055a1635d2893496c3eef6b3240d0a01c6902f))
- create StatusIndicator component with breathing pulse animation ([a5430c3](https://github.com/misty-step/heartbeat/commit/a5430c396def8b44457d29c1a9a37a033fd9721b))
- create UptimeChart component with sparkline visualization ([1d8fdde](https://github.com/misty-step/heartbeat/commit/1d8fdde495b0d076188a1c1a846983bb53b99350))
- implement complete monitoring engine with HTTP checks and incident management ([12888b8](https://github.com/misty-step/heartbeat/commit/12888b82b6a836260dafbf65bc8a0ea67281b71e))
- initial MVP release with enhanced visuals ([8984ea9](https://github.com/misty-step/heartbeat/commit/8984ea90d6a3cec843520d6eb50307db5aa68aea))
- initialize Convex project with comprehensive schema ([d6651fc](https://github.com/misty-step/heartbeat/commit/d6651fce4e89ce5902cb4ac15abd8d8a891af562))
- initialize Next.js 15 project with TypeScript ([ce97304](https://github.com/misty-step/heartbeat/commit/ce97304183d7f015271f54f139889a2c95de892f))
- install core dependencies for Heartbeat MVP ([79a92a7](https://github.com/misty-step/heartbeat/commit/79a92a718f4e77c567c5e3b252d7174370098d08))
- integrate AddMonitorForm into dashboard for monitor creation ([7348832](https://github.com/misty-step/heartbeat/commit/734883207b8ff28405b2ed9fa3479049c0f7f19c))
- switch status page to public queries ([c98ec25](https://github.com/misty-step/heartbeat/commit/c98ec25549fa4cc5fb58dc8a9058f3de3043f2ff))
- tighten schema - visibility now required (Phase 2) ([0cbda46](https://github.com/misty-step/heartbeat/commit/0cbda46fdac6743c5f61cc84b1f20ee88535023e))
