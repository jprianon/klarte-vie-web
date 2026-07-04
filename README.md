# Klarte Vie — Web

Version **web** du dashboard de pilotage de vie de Jérémy. Complète l'app mobile
[`../klarte-vie`](../klarte-vie) (PWA « timeline de bulles ») et **partage le même backend Supabase**.

Objectif : réunir en un seul tableau de bord le **carnet de recettes** (avec reformatage
d'une note libre par l'IA), le **trading** et le **sport**.

## Contexte

- Framework : **Next.js 15** (App Router) + **React 19**, **TypeScript** strict.
- UI : **Tailwind** + tokens iOS partagés avec le mobile (bleu `#0A84FF`, coins arrondis, dark mode).
- Data : **Supabase** (Postgres + Auth), client `@supabase/ssr`.
- Forms/validation : **react-hook-form** + **zod**. State : **zustand**.
- IA (à venir) : **API Claude** via route serveur `/api/recipes/format`.

## Architecture

```
src/
├─ app/
│   ├─ layout.tsx            · racine (thème, fonte, toaster)
│   ├─ page.tsx              · redirige vers /recettes
│   └─ (app)/                · pages du dashboard (rail + contenu)
│       ├─ recettes/         · carnet (écran principal, Lot 1)
│       ├─ today/ trading/ sport/ bien-etre/ habitudes/   · placeholders
├─ components/layout/        · rail (nav), app-shell, page-header, coming-soon
├─ components/ui/            · primitives shadcn (button, sonner)
├─ features/recipes/         · mock.ts + composants du carnet
├─ lib/supabase/             · clients navigateur / serveur
└─ types/                    · database.types.ts (schéma cible) + types métier
```

## Prérequis

- Node ≥ 20, **pnpm** 10.
- Un projet Supabase (le même que le mobile).

## Installation

```bash
pnpm install
cp .env.local.example .env.local   # renseigner les clés Supabase
pnpm dev                           # http://localhost:3031  → /recettes
```

## Variables à adapter (`.env.local`)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Connexion Supabase (client). |
| `SUPABASE_PROJECT_ID` | CLI `pnpm db:types` uniquement. |
| `NEXT_PUBLIC_SITE_URL` | Redirections auth. |
| `ANTHROPIC_API_KEY` | IA de reformatage (Lot 3), **serveur uniquement**. |

## État d'avancement

- [x] **Lot 1 — Socle** : projet Next.js, tokens iOS, rail de navigation, écran
      Recettes (filtres par catégorie, carte IA en aperçu, grille) sur **données mock**.
- [ ] **Lot 2 — Recettes CRUD** : tables `recipe_categories` / `recipes` (Supabase),
      catégories éditables, détail recette, création/édition manuelle.
- [ ] **Lot 3 — Flux IA** : route `/api/recipes/format` (note → JSON validé zod), écran note→aperçu.
- [ ] **Lot 4 — Today** : vue d'accueil agrégée.
- [ ] **Lot 5 — Trading & Sport**.
- [ ] **Auth** : garde de session Supabase (middleware + layout), pages login/signup.

## Dépannage

- **`pnpm lint` : « Cannot find module es-errors/range.js »** — fichiers `node_modules`
  non matérialisés par OneDrive. Corrigé par `pnpm install --force` (relancer si besoin).
  Éviter d'exécuter des installs pnpm pendant une synchro OneDrive active.
- L'authentification n'est volontairement **pas** branchée au Lot 1 : l'app tourne sans
  clés Supabase pour afficher l'écran Recettes en mock. Le garde de session viendra au lot Auth.
