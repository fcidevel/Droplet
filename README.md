# Droplet

<div align="center">

![Droplet](public/images/lp-hero-image-480x480.png)

_Your AI assistant, your way_

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://droplet.jwd-apps.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8)](https://tailwindcss.com/)
[![Secret scan](https://github.com/fcidevel/Droplet/actions/workflows/gitleaks.yml/badge.svg?branch=main)](https://github.com/fcidevel/Droplet/actions/workflows/gitleaks.yml)

</div>

---

## Description

Droplet is an AI chat assistant with six specialised personas, each with its own
personality, expertise and conversational style. Users pick the assistant that fits
the task and hold a real, streaming conversation with it, including image and audio
generation. The live product runs at
[droplet.jwd-apps.com](https://droplet.jwd-apps.com).

### Meet the Personas

| Persona         | Category     | What They Do                                     |
| --------------- | ------------ | ------------------------------------------------ |
| **Strategist**  | Productivity | Business strategy, planning, analysis, decisions |
| **Developer**   | Productivity | Code, debugging, and technical solutions         |
| **Teacher**     | Learning     | Learning, explanations, and educational guidance |
| **Creator**     | Creative     | Creative writing, brainstorming, and content     |
| **Wellness**    | Lifestyle    | Mental health tips, mindfulness, and self-care   |
| **Interviewer** | Career       | Interview prep, practice sessions, and feedback  |

Each persona is an independent AI agent — pragmatic, direct, and grounded in reality.
Persona configuration is managed from the admin area, and access depends on the plan.

### Key Features

- **6 AI Personas** — each with a distinct personality, tone, and expertise
- **Real-time Streaming** — responses appear as they are generated
- **Image Generation** — create images through conversation
- **Audio Generation** — generate audio content through conversation
- **Conversation History** — save, resume, and manage chats
- **Media Library** — browse and download generated images, audio, and uploaded files
- **File Uploads** — share images with the assistant
- **Admin Area** — users, transactions, usage, and settings for limits, pricing,
  personas, models and site content, with an audit trail

### Plans & Pricing

|                          | Lite         | Pro        | Premium    |
| ------------------------ | ------------ | ---------- | ---------- |
| **Price (Monthly)**      | Free forever | $19/mo     | $39/mo     |
| **Price (Yearly)**       | —            | $159.60/yr | $327.60/yr |
| **Personas (full)**      | 2            | 5          | All 6      |
| **Trial access**         | All others   | Remaining  | —          |
| **Conversations/Day**    | 10           | 50         | Unlimited  |
| **Prompts/Conversation** | 10           | 100        | Unlimited  |
| **Image Generation**     | 1/month      | 50/month   | Unlimited  |
| **Audio Generation**     | 1/month      | 50/month   | Unlimited  |

Every plan includes every feature: plans differ by usage limits, not by feature
lockout. Personas outside a plan's full set run as trials with reduced limits. Yearly
billing carries a 30% discount. Limits are enforced on the server, and reaching one
ends the conversation with a recorded stop reason.

---

## Tech Stack

### Frontend

| Technology                                                   | Purpose                                          |
| ------------------------------------------------------------ | ------------------------------------------------ |
| [Next.js 16](https://nextjs.org/)                            | App Router, Server Components and Server Actions |
| [React 19](https://react.dev/)                               | UI                                               |
| [TypeScript 6](https://www.typescriptlang.org/)              | Strict typing across the codebase                |
| [Tailwind CSS 4](https://tailwindcss.com/)                   | Styling, with a modular semantic-class layer     |
| [Zustand 5](https://zustand.docs.pmnd.rs/)                   | Client state                                     |
| [react-markdown](https://github.com/remarkjs/react-markdown) | Rendering assistant responses                    |
| [Tiptap 3](https://tiptap.dev/)                              | Rich-text editing in the admin area              |

### Backend & Services

| Technology                                                                             | Purpose                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------------ |
| [Clerk](https://clerk.com/)                                                            | Authentication and user management         |
| [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose 9](https://mongoosejs.com/) | Data storage                               |
| [OpenAI](https://platform.openai.com/)                                                 | Chat streaming, image and audio generation |
| [Stripe](https://stripe.com/)                                                          | Subscriptions and billing                  |
| [AWS S3](https://aws.amazon.com/s3/)                                                   | Media storage                              |
| [Zod 4](https://zod.dev/)                                                              | Schema validation                          |
| [Vercel](https://vercel.com/)                                                          | Hosting                                    |

### Tooling

| Technology                                                                                 | Purpose                                                                                        |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [Vitest 4](https://vitest.dev/)                                                            | Unit tests (113 test files)                                                                    |
| [Playwright](https://playwright.dev/)                                                      | End-to-end and accessibility tests (axe)                                                       |
| [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Knip](https://knip.dev/) | Linting, formatting and unused-code audit                                                      |
| [gitleaks](https://github.com/gitleaks/gitleaks)                                           | Mandatory secret scanning (git hooks + CI) - see [Secret scanning](#secret-scanning-mandatory) |

---

## Project Structure

```
.
├── .githooks/
│   ├── pre-commit          # secret scan of staged changes
│   └── pre-push            # secret scan of every pushed commit
├── .github/
│   └── workflows/
│       └── gitleaks.yml    # "Secret scan" CI job
├── public/                 # static assets
├── scripts/                # maintenance and live-model test scripts
├── src/
│   ├── app/
│   │   ├── (public)/       # marketing and legal pages
│   │   ├── (auth)/         # sign-in / sign-up
│   │   ├── (chat)/         # authenticated chat app (/app)
│   │   ├── (admin)/        # admin area (/admin)
│   │   └── api/            # route handlers: OpenAI, uploads, downloads, checkout, webhooks
│   ├── components/         # UI by domain (admin, chat, layout, sections, shared)
│   ├── constants/          # plans, personas, OpenAI and AWS settings
│   ├── lib/
│   │   ├── actions/        # Server Actions (mutations)
│   │   ├── database/       # Mongoose models and connection
│   │   ├── hooks/          # client hooks
│   │   └── utils/          # policies, query helpers, validation
│   ├── styles/             # modular Tailwind architecture
│   ├── types/              # shared TypeScript types
│   └── proxy.ts            # route protection (Next.js proxy)
├── tests/
│   ├── unit/               # Vitest
│   └── e2e/                # Playwright
├── .gitattributes
├── .gitleaks.toml          # gitleaks rules for this app
├── LICENSE
└── package.json
```

---

## Secret scanning (mandatory)

Every change is checked for leaked credentials with
[gitleaks](https://github.com/gitleaks/gitleaks), at three layers:

| Layer  | What runs                                                                                                    | What it blocks                          |
| ------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Commit | `.githooks/pre-commit` - scans the staged changes                                                            | the commit                              |
| Push   | `.githooks/pre-push` - scans every commit being pushed                                                       | the push                                |
| GitHub | `Secret scan` job (`.github/workflows/gitleaks.yml`) - scans the full history on every push and pull request | updating `main` (required status check) |

- **No credentials in the repository.** Real values are never committed; the app reads
  them from its deployment environment.
- **Project-specific rules.** [`.gitleaks.toml`](.gitleaks.toml) keeps every built-in
  gitleaks rule and adds three for formats this project uses: webhook signing secrets
  (Stripe and Clerk), MongoDB connection strings with an embedded password, and
  Context7 API keys.
- **Hooks on by default.** Installing the dependencies switches the hooks on for that
  clone.
- **Supply-chain hardening.** The CI job pins `actions/checkout` to a commit SHA and
  verifies the gitleaks release binary against its published checksum.
- **Leaked-secret policy.** A secret that ever reaches GitHub is treated as
  compromised and rotated at the source immediately.

---

## Security

### Application

- **Route protection** - signed-out users are redirected away from `/app` and `/admin`,
  and non-admins away from `/admin`, in [`src/proxy.ts`](src/proxy.ts); admin Server
  Actions check the role again on the server.
- **Signed webhooks** - Clerk events are verified with `verifyWebhook()` and Stripe
  events with `stripe.webhooks.constructEvent()`; both handlers refuse to run without
  a signing secret.
- **Atomic quotas** - usage limits are checked and incremented in one
  `findOneAndUpdate` with a `$lt` guard, so concurrent requests cannot exceed a limit.
- **Upload allowlist** - uploads are limited to an allowlist of MIME types and 5 MB
  ([`upload-file-validation.ts`](src/lib/utils/upload-file-validation.ts)).
- **SSRF protection** - the download proxy only fetches from allowlisted hosts
  ([`download-url-allowlist.ts`](src/lib/utils/download-url-allowlist.ts)).
- **Admin audit trail** - every admin mutation is recorded in an `AdminAuditLog`
  collection.

### Runtime

The app is pinned to the **Node.js 24.x** LTS line through the `engines` field in
[`package.json`](package.json), matching the hosting setting. Development uses
**v24.22.3** or later, which includes the
[November 2026 Node.js security release](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases).

### Repository protection

Only the repository owner can change this repository. Two GitHub rulesets enforce it:

| Ruleset          | Applies to              | Rules                                                         | Bypass                          |
| ---------------- | ----------------------- | ------------------------------------------------------------- | ------------------------------- |
| Owner Only Rule  | all branches            | restrict creations, updates and deletions; block force pushes | repository admin (the owner)    |
| Secret Scan Rule | default branch (`main`) | `Secret scan` must pass; block deletions and force pushes     | none - applies to the owner too |

A commit can reach `main` only after `Secret scan` has passed on it, and nobody can
force-push or delete `main`.

---

## Author

Built with ❤️ by [FCI Devel](https://fcidevel.com)

---

## License

Source-available, not open source. The code is public so that prospective clients,
partners and employers can review how FCI Devel builds software: you may read it, and
clone and run it on your own devices for that review, but you may not reuse it.
Contributions are not accepted, and security issues are reported privately as the
licence describes.

See [LICENSE](LICENSE) for the full terms.
