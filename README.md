# Smart Upsell Engine

A Shopify embedded app that powers AI-driven product recommendations and upsell opportunities directly inside the Shopify Admin.

---

## Overview

**Smart Upsell Engine** is a custom Shopify app built with the modern React Router + Shopify App framework. It integrates with the Shopify Admin GraphQL API to manage products, metafields, and metaobjects, providing a foundation for intelligent product recommendation and upsell workflows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React Router v7](https://reactrouter.com/) |
| Shopify Integration | [@shopify/shopify-app-react-router](https://shopify.dev/docs/apps) |
| UI Components | [Polaris Web Components](https://shopify.dev/docs/api/app-home/using-polaris-components) |
| App Bridge | [@shopify/app-bridge-react](https://shopify.dev/docs/apps/tools/app-bridge) |
| API | [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql) |
| Database / ORM | [Prisma](https://www.prisma.io/) with SQLite |
| Language | TypeScript |
| Build Tool | [Vite](https://vitejs.dev/) |

---

## Features

- **Embedded App** — runs fully inside the Shopify Admin via App Bridge.
- **Admin Dashboard** — summary cards showing total and active upsell rules.
- **Upsell Rule CRUD** — create, view, edit, and delete rules via Polaris UI with ResourcePicker.
- **Admin GraphQL Integration** — create and update products, variants, metafields, and metaobjects.
- **Session Storage** — Prisma-backed session storage for OAuth token persistence.
- **Webhook Handling** — handles `app/uninstalled` and `app/scopes_update` lifecycle webhooks.
- **Recommendations API** — public JSON endpoint (`/apps/smartupsell/api/recommendations`) for the storefront widget.
- **Theme App Extension** — a Liquid block merchants can add to any page via the Theme Editor without touching code.
- **Custom Metafields & Metaobjects** — extensible custom data layer for recommendation metadata.

---

## Prerequisites

- [Node.js](https://nodejs.org/) `>=20.19 <22 || >=22.12`
- [npm](https://docs.npmjs.com/) (comes with Node)
- A [Shopify Partner](https://partners.shopify.com/) account and a development store
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) installed globally

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd shopify-Ai-products-recomendation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` (or create `.env`) and fill in your credentials:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-tunnel-url.trycloudflare.com
SCOPES=write_metaobject_definitions,write_metaobjects,write_products
```

> **Note:** The `.env` file is gitignored and should never be committed.

### 4. Set up the database

```bash
npm run setup
```

This runs `prisma generate` and `prisma migrate deploy` to initialize the SQLite database.

### 5. Run the development server

```bash
npm run dev
```

The Shopify CLI will:
- Start the local server
- Open a tunnel (via Cloudflare) for your app URL
- Guide you through connecting to your development store

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the app locally with the Shopify CLI |
| `npm run build` | Build the production bundle |
| `npm run start` | Serve the production build |
| `npm run setup` | Run Prisma migrations and generate the client |
| `npm run deploy` | Deploy the app to Shopify |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run graphql-codegen` | Regenerate GraphQL types |

---

## Project Structure

```
shopify-Ai-products-recomendation/
├── app/
│   ├── routes/
│   │   ├── app._index.tsx              # Dashboard with summary cards
│   │   ├── app.rules._index.tsx        # Upsell rules list page
│   │   ├── app.rules.new.tsx           # Create new rule (with ResourcePicker)
│   │   ├── app.rules.$id.tsx           # Edit / delete a rule
│   │   ├── app.tsx                     # App shell layout + Nav menu
│   │   ├── api.recommendations.tsx     # Public JSON API for storefront widget
│   │   ├── auth.$.tsx                  # OAuth callback handler
│   │   ├── webhooks.app.uninstalled.tsx
│   │   └── webhooks.app.scopes_update.tsx
│   ├── shopify.server.ts               # Shopify app configuration
│   └── db.server.ts                    # Prisma client singleton
├── extensions/
│   └── upsell-widget/                  # Theme App Extension
│       ├── shopify.extension.toml
│       └── blocks/
│           └── upsell-widget.liquid    # Storefront widget block
├── prisma/
│   ├── schema.prisma                   # Session + UpsellRule models
│   └── migrations/
├── public/                             # Static assets
├── shopify.app.toml                    # App + App Proxy configuration
├── vite.config.ts
└── package.json
```

---

## Deployment

To deploy to production:

1. Configure your production `SHOPIFY_APP_URL` in `shopify.app.toml`.
2. Run `npm run deploy` to push the app configuration to Shopify.
3. Deploy the server (e.g., Railway, Fly.io, Render, or Docker) using `npm run start`.

### Docker

A `Dockerfile` is included for containerized deployments:

```bash
docker build -t smart-upsell-engine .
docker run -p 3000:3000 --env-file .env smart-upsell-engine
```

---

## Required Shopify API Scopes

| Scope | Purpose |
|---|---|
| `write_products` | Create and update products |
| `write_metaobjects` | Manage metaobject entries |
| `write_metaobject_definitions` | Define metaobject schemas |

---

## Contributing

1. Fork this repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m "feat: add your feature"`.
4. Push to your branch: `git push origin feature/your-feature`.
5. Open a Pull Request.

---

## License

Private — all rights reserved.
